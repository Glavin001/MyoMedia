'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const template = require(`./menu.js`);

// report crashes to the Electron project
require('crash-reporter').start();

// prevent window being GC'd
let mainWindow = null;

app.on('window-all-closed', function() {
    if (process.platform !== 'darwin') {
        app.quit();
    }
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