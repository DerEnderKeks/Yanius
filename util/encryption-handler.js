'use strict';

var thinky = require(__dirname + '/../util/thinky.js');
var ConfigModel = require(__dirname + '/../models/config.js');
var bcrypt = require('bcrypt');
var config = require('config');
var crypto = require('crypto');
var deasync = require('deasync');

var encryptionKey = null;

exports.init = function () {
  ConfigModel.filter({key: 'encryptionSecret'}).then(function (result) {
    encryptionKey = result[0].value;
  }).error(function (err) {
    console.err(err);
    process.exit(1);
  });
  deasync.loopWhile(function () {
    return !encryptionKey
  });
};

var saltRounds = config.get('saltRounds');

exports.check = function (value, valueHash) {
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
