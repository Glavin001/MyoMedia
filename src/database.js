'use strict';
const Datastore = require('nedb');
const path = require('path');

// Local database
function getUserHome() {
    return process.env[(process.platform == 'win32') ? 'USERPROFILE' :
        'HOME'];
}
let databasePath = path.resolve(getUserHome(), './.myomedia/database/');
let moviesCollectionPath = path.resolve(databasePath, './movies.db');
let showsCollectionPath = path.resolve(databasePath, './shows.db');
var db = {
    'movies': new Datastore({
        filename: moviesCollectionPath,
        autoload: true
    }),
    'shows': new Datastore({
        filename: showsCollectionPath,
        autoload: true
    })
};
// Database Indexing
db.movies.ensureIndex({
    fieldName: 'title',
    unique: true
}, function(err) {
    if (err) {
        console.log(err);
    }
});
db.shows.ensureIndex({
    fieldName: 'title',
    unique: true
}, function(err) {
    if (err) {
        console.log(err);
    }
});

module.exports = db;