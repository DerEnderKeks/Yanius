'use strict';

var thinky = require(__dirname + '/../util/thinky.js');
var databaseUtils = require(__dirname + '/../util/database-utils.js');
var bcrypt = require('bcrypt');
var config = require('config');
var crypto = require('crypto');
var deasync = require('deasync');

var encryptionKey = null;

exports.init = function () {
  databaseUtils.getSetting('encryptionSecret', (error, result) => {
    if (error) {
      console.err(error);
      process.exit(1);
    }
    encryptionKey = result;
  });
  deasync.loopWhile(function () {
    return !encryptionKey
  });
};

var saltRounds = config.get('saltRounds');

exports.check = function (value, valueHash) {
  if (!value || !valueHash) return;
  return bcrypt.compareSync(value, valueHash);
};

exports.hash = function (value) {
  let salt = bcrypt.genSaltSync(saltRounds);
  return bcrypt.hashSync(value, salt);
};

exports.tokenHash = function (token) {
  let hash = crypto.createHash('sha256', encryptionKey);
  hash.update(token);
  return hash.digest('hex');
};
