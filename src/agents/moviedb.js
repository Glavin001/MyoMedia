'use strict';
const MovieDB = require('moviedb');
const MOVIEDB_API_KEY = process.env.MOVIEDB_API_KEY;
// The Movie Database
let mdb = MovieDB(MOVIEDB_API_KEY);

module.exports = mdb;