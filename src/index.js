'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const template = require(`./menu.js`);
const ipc = require('ipc');
const fs = require('fs');
const path = require('path');
const wit = require('node-wit');
const walk = require('walk');
const dialog = require('dialog');
const _ = require('lodash');
const ptn = require('parse-torrent-name');

// Configure
const WIT_ACCESS_TOKEN = "FRH5QS2T4EW5ANB3N44YUXGZLUQUCSO5";

// report crashes to the Electron project
require('crash-reporter').start();

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



// Speech Recognition

// Declare recording in this scope
var recording;
var recordingTimeout;

ipc.on('speech-recognition:start', function(event, arg) {
    // console.log('speech-recognition:start');
    if (recording) {
        console.warn(
            "Recording in progress. Stop previous recording first before starting another."
        );
        return;
    }

    var callback = function(err, res) {
        console.log('captureSpeechIntentFromMic', err, res);

        // console.log(
        //     "Response from Wit for microphone audio stream: "
        // );
        if (err) {
            event.sender.send('speech-recognition:error', err);
        }
        event.sender.send('speech-recognition:result', res);
    };


    // Wit.ai Speech Recognition & Intent
    // The `captureSpeechIntent` function returns the `node-record-lpcm16` object
    // See https://github.com/gillesdemey/node-record-lpcm16 for more details
    recording = wit.captureSpeechIntentFromMic(
        WIT_ACCESS_TOKEN, callback);

    // wit.captureTextIntent(WIT_ACCESS_TOKEN,
    //     "this is an awesome test", callback)

    // var stream = fs.createReadStream(path.resolve(__dirname,
    //     '../node_modules/node-wit/test/resources/sample.wav'
    // ));
    // wit.captureSpeechIntent(WIT_ACCESS_TOKEN, stream, "audio/wav",
    //     callback);

    // Wit.ai has 10 seconds max speech recording duration
    clearTimeout(recordingTimeout);
    recordingTimeout = setTimeout(function() {
        event.sender.send('speech-recognition:stop');
    }, 10000);

    event.sender.send('speech-recognition:start');

});

ipc.on('speech-recognition:stop', function(event, arg) {
    // console.log('speech-recognition:stop');
    if (recording && typeof recording.stop === "function") {
        // Stop recording
        recording.stop();
        clearTimeout(recordingTimeout);
        recordingTimeout = null;
    }
    recording = null;

    event.sender.send('speech-recognition:stop');

});

let supportedExtensions = ['.mp4'];

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
                process.nextTick(function() {
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
                            event.sender.send(
                                'process-media-file',
                                false);
                            console.log('Sample detected!', root, name);
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
                        console.log('Final parsed', parsed);
                        event.sender.send(
                            'process-media-file',
                            parsed);

                    } else {
                        // This file is not supported and
                        // will not be processed any further
                        event.sender.send(
                            'process-media-file',
                            false);
                    }
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