'use strict';
const app = require('app');
const BrowserWindow = require('browser-window');
const Menu = require('menu');
const template = require(`./menu.js`);
const ipc = require('ipc');
const fs = require('fs');
const path = require('path');
const wit = require('node-wit');

// Configure
const WIT_ACCESS_TOKEN = "FRH5QS2T4EW5ANB3N44YUXGZLUQUCSO5";

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
