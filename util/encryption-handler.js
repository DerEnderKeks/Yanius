'use strict';

const thinky = require(__dirname + '/../util/thinky.js');
const databaseUtils = require(__dirname + '/../util/database-utils.js');
const bcrypt = require('bcrypt');
const config = require('config');
const crypto = require('crypto');
const deasync = require('deasync');

let encryptionKey = null;

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

const saltRounds = config.get('saltRounds');

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
