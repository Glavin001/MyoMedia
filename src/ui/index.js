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
    const $chooseMediaBtn = $('.choose-media-btn');
    const $mediaPath = $('.media-path');
    const $mediaIndexingProgress = $('.media-indexing-progress');

    // Helpers
    var updateProgressBar = function($containerProgressBar, values) {
        for (let k in values) {
            let {percent, label} = values[k];
            let $progressBar = $containerProgressBar.find(`.progress-bar-${k}`);
            // Set Width
            $progressBar.css({
                'width': `${percent*100}%`
            })
            // Set Label
            $progressBar.text(label);
        }
    }

    // Buttons
    $listenBtn.click(function() {
        ipc.send('speech-recognition:start');
    });
    $chooseMediaBtn.click(function() {
        ipc.send('select-media-directory');
    });

    // Init
    $main.text('Please connect your Myo');
    Myo.onError = function() {
        $main.text("Woah, couldn't connect to Myo Connect");
    };

    //
    var myMyo = Myo.create();

    myMyo.on('connected', function(data, timestamp) {
        $main.text('Hello Myo! ' + timestamp);
        myMyo.setLockingPolicy('standard');
        myMyo.vibrate();
    });

    myMyo.on('pose', function(poseName, edge) {
        // console.log(`Pose: ${poseName}, ${edge}`);
        $pose.text(`Pose: ${poseName} ${edge} ${new Date()}`);

        if (poseName === "fist") {
            if (edge) {
                ipc.send('speech-recognition:start');
            } else {
                ipc.send('speech-recognition:stop');
            }
        }
    });

    myMyo.on('gyroscope', function(data) {
        $gyroscope.text(
            `gyroscope: ${JSON.stringify(data, undefined, 4)}`
        );
    });
    myMyo.on('orientation', function(data) {
        $orientation.text(
            `orientation: ${JSON.stringify(data, undefined, 4)}`
        );
    });
    myMyo.on('accelerometer', function(data) {
        $accelerometer.text(
            `accelerometer: ${JSON.stringify(data, undefined, 4)}`
        );
    });

    ipc.on('speech-recognition:start', function() {
        $intent.text('Listening...');

        myMyo.vibrate();
    });
    ipc.on('speech-recognition:stop', function() {
        // $intent.text('Processing speeching...');
        myMyo.vibrate();
    });

    ipc.on('speech-recognition:error', function(error) {
        $intent.text(`Error: ${error}`);
    });
    ipc.on('speech-recognition:result', function(res) {
        $intent.text(`Result: ${JSON.stringify(res, null, " ")}`);
    });

    var mediaIndexProgress = null;
    var refreshMediaProgress = function() {
        if (mediaIndexProgress) {
            let {success, errors, total} = mediaIndexProgress;
            updateProgressBar($mediaIndexingProgress, {
                success: {
                    percent: (success/total),
                    label: `${success} processed successfully`
                },
                warning: {
                    percent: ((total-success-errors)/total),
                    label: `${total-success-errors} pending`
                },
                danger: {
                    percent: (errors/total),
                    label: `${errors} errors`
                }
            });
        }
    }
    ipc.on('selected-media-directory', function(filePath) {
        mediaIndexProgress = {
            path: filePath,
            success: 0,
            errors: 0,
            total: 0
        }
        $mediaPath.val(filePath);
        $mediaPath.closest('.form-group').removeClass('has-error').addClass('has-success')
    });
    ipc.on('found-media-file', function(filePath) {
        mediaIndexProgress.total++;
        refreshMediaProgress();
    });
    ipc.on('processed-media-file', function(filePath) {
        if (filePath instanceof Error) {
            mediaIndexProgress.errors++;
        } else {
            mediaIndexProgress.success++;
        }
        refreshMediaProgress();
    });
});