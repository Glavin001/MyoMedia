'use strict';
/* global $:false, document:false */

$(document).ready(function() {

    // Dependencies
    const Myo = require('myo');
    const ipc = require('ipc');

    // Elements
    const $main = $('.main');
    const $intent = $('.intent');
    const $pose = $('.pose');
    const $gyroscope = $('.gyroscope');
    const $orientation = $('.orientation');
    const $accelerometer = $('.accelerometer');
    const $listenBtn = $('.listen-btn');

    $main.html('Please connect your Myo');
    Myo.onError = function() {
        $main.html("Woah, couldn't connect to Myo Connect");
    };

    //
    var myMyo = Myo.create();

    myMyo.on('connected', function(data, timestamp) {
        $main.html('Hello Myo! ' + timestamp);
        myMyo.setLockingPolicy('standard');
        myMyo.vibrate();
    });

    myMyo.on('pose', function(poseName, edge) {
        // console.log(`Pose: ${poseName}, ${edge}`);
        $pose.html(`Pose: ${poseName} ${edge} ${new Date()}`);

        if (poseName === "fist") {
            if (edge) {
                ipc.send('speech-recognition:start');
            } else {
                ipc.send('speech-recognition:stop');
            }
        }
    });

    myMyo.on('gyroscope', function(data) {
        $gyroscope.html(
            `gyroscope: ${JSON.stringify(data, undefined, 4)}`
        );
    });
    myMyo.on('orientation', function(data) {
        $orientation.html(
            `orientation: ${JSON.stringify(data, undefined, 4)}`
        );
    });
    myMyo.on('accelerometer', function(data) {
        $accelerometer.html(
            `accelerometer: ${JSON.stringify(data, undefined, 4)}`
        );
    });

    ipc.on('speech-recognition:start', function() {
        $intent.html('Listening...');

        myMyo.vibrate();
    });
    ipc.on('speech-recognition:stop', function() {
        // $intent.html('Processing speeching...');
        myMyo.vibrate();
    });

    ipc.on('speech-recognition:error', function(error) {
        $intent.html(`Error: ${error}`);
    });
    ipc.on('speech-recognition:result', function(res) {
        $intent.html(`Result: ${JSON.stringify(res, null, " ")}`);
    });

    $listenBtn.click(function() {
        ipc.send('speech-recognition:start');
    });

});