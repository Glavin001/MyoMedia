// Dependencies
var $ = require('jquery');
var Myo = require('myo');

// Elements
var $main = $('.main');

//
var myMyo = Myo.create();
console.log('Waiting for Myo');
myMyo.on('fist', function(edge){
    console.log('fist', edge);
    if(!edge) return;
    $main.html('Hello Myo!');
    myMyo.vibrate();
});
