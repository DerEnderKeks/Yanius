'use strict';

var config = require('config').get("dbConfig");
var thinky = require('thinky')({
  'host': config.get('host'),
  'port': config.get('port'),
  'db': config.get('dbName'),
  'user': config.get('dbUser'),
  'password': config.get('dbPass')
});

module.exports = thinky;
