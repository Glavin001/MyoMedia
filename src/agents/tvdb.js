'use strict';
// const agent = require('./agent');
const TVDB = require("node-tvdb");
const TVDB_API_KEY = process.env.TVDB_API_KEY;
// The TV Database
let tvdb = new TVDB(TVDB_API_KEY);

module.exports = tvdb