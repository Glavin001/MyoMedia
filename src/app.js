'use strict';
// Dependencies
const app = require('app');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const template = require(`./menu.js`);
const ipc = require('ipc');
const path = require('path');
const walk = require('walk');
const dialog = require('dialog');
const _ = require('lodash');
const ptn = require('parse-torrent-name');
const db = require('./database');
const agents = require('./agents');

// report crashes to the Electron project
require('crash-reporter').start();

// Configure
require('./interfaces/speech');

// prevent window being GC'd
let mainWindow = null;

app.on('window-all-closed', function() {
    // if (process.platform !== 'darwin') {
    app.quit();
    // }
});

app.on('ready', function() {

    mainWindow = new BrowserWindow({
        width: 600,
        height: 400,
        resizable: true
    });

    var menu = Menu.buildFromTemplate(template);

    Menu.setApplicationMenu(menu); // Must be called within app.on('ready', function(){ ... });

    mainWindow.loadUrl(`file://${__dirname}/ui/index.html`);

    mainWindow.on('closed', function() {
        // deref the window
        // for multiple windows store them in an array
        mainWindow = null;
    });

});

let supportedExtensions = ['.mp4', '.avi'];

ipc.on('process-media-file', function(arg) {
    let {root, fileStats, sender, next} = arg;

    // console.log('process-media-file', root, fileStats.name);

    // Check file extension
    let ext = path.extname(
        fileStats.name);
    if (_.contains(
            supportedExtensions,
            ext)) {
        // Process this file
        let name = path.basename(
            fileStats.name,
            ext);
        let parsedName = ptn(
            name);
        // console.log(root, name);
        // Verify that the parent directory
        let parentDirs = root.split(
            path.sep)
        let parentDirName =
            parentDirs[
                parentDirs.length -
                1];
        // console.log(parentDirs,parentDirName);

        // Exclude Samples
        if (parentDirName.toLowerCase() ===
            "sample") {
            // This file should be ignored and
            // will not be processed any further
            sender.send(
                'processed-media-file',
                false);
            console.log(
                'Sample detected!',
                root, name);
            return;
        }

        let parsedDirName = ptn(
            parentDirName);
        // console.log('Both parsed', parsedName, parsedDirName);

        let parsed;
        if (!parsedName.episode &&
            parsedDirName.episode
        ) {
            parsed =
                parsedDirName;
        } else {
            parsed = parsedName;
        }
        // console.log(
        //     'Final parsed',
        //     parsed);

        // Store in database
        // Check if movie or TV show
        if (parsed.episode) {
            // Show
            ipc.emit('process-show', parsed, sender);
        } else {
            // Movie (default)
            ipc.emit('process-movie', parsed, sender);
        }

    } else {
        // This file is not supported and
        // will not be processed any further
        sender.send(
            'processed-media-file',
            false);
    }

});

ipc.on('process-show', function(parsed, sender) {
    agents.tvdb.getSeriesByName(parsed.title, function(error, response) {
        console.log('series', error, response);
        if (error) {
            sender.send('processed-media-file', error)
            return;
        }
        let series = response[0]
        let seriesId = series.id;
        agents.tvdb.getSeriesAllById(seriesId, function(error, response) {
            console.log('series all', error, response);
            if (error) {
                sender.send('processed-media-file', error)
                return;
            }

            let doc = {
                title: `${parsed.title} - Season ${parsed.season} Episode ${parsed.episode}`,
                series: parsed.title,
                season: parsed.season,
                epsiode: parsed.episode,
                parsed: parsed
            };
            db.shows.insert(doc, function(err) {
                if (err) {
                    console.error(err)
                    sender.send(
                        'processed-media-file',
                        err);
                    return;
                }
                sender.send(
                    'processed-media-file',
                    doc);
            });
        });
    });
});

ipc.on('process-movie', function(parsed, sender) {
    // Movie
    let doc = {
        title: `${parsed.title} (${parsed.year})`,
        name: parsed.title,
        year: parsed.year,
        meta: parsed
    };
    db.movies.insert(doc, function(err) {
        if (err) {
            console.error(err)
            sender.send(
                'processed-media-file',
                err);
            return;
        }
        sender.send(
            'processed-media-file',
            doc);
    });
});

ipc.on('select-media-directory', function(event, arg) {
    dialog.showOpenDialog({
        properties: ['openDirectory']
    }, function(filePaths) {

        console.log(`Path: ${filePaths}`);
        if (filePaths) {
            var filePath = filePaths[0];
            event.sender.send('selected-media-directory',
                filePath);

            var options = {};
            var walker = walk.walk(filePath, options);
            walker.on("file", function(root, fileStats, next) {
                event.sender.send('found-media-file',
                    fileStats.name);

                ipc.emit('process-media-file', {
                    root: root,
                    fileStats: fileStats,
                    sender: event.sender,
                    next: next
                });

                next();
            });
            walker.on("errors", function(root, nodeStatsArray,
                next) {
                next();
            });
            walker.on("end", function() {
                console.log("all done");
            });
        }

    });
});
