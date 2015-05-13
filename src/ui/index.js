'use strict';

$(document).ready(function() {

    var Myo = require('myo');
    // Elements
    var $main = $('.main');
    var $pose = $('.pose');
    var $gyroscope = $('.gyroscope');
    var $orientation = $('.orientation');
    var $accelerometer = $('.accelerometer');

    $main.html('Please connect your Myo');
    Myo.onError = function() {
        $main.html("Woah, couldn't connect to Myo Connect");
    };

    //
    var myMyo = Myo.create();

    myMyo.on('connected', function(data, timestamp) {
        $main.html('Hello Myo! ' + timestamp);
        myMyo.setLockingPolicy('none');
        myMyo.vibrate();
    });

    myMyo.on('pose', function(poseName, edge) {
        // console.log(`Pose: ${poseName}, ${edge}`);
        if (!edge) return;
        $pose.html(`Pose: ${poseName} ${edge} ${new Date()}`);
        // myMyo.vibrate();
    });

    myMyo.on('gyroscope', function(data) {
        $gyroscope.html(
            `gyroscope: ${JSON.stringify(data, undefined, 4)}`
        );
    })
    myMyo.on('orientation', function(data) {
        $orientation.html(
            `orientation: ${JSON.stringify(data, undefined, 4)}`
        );
    })
    myMyo.on('accelerometer', function(data) {
        $accelerometer.html(
            `accelerometer: ${JSON.stringify(data, undefined, 4)}`
        );
    })

});