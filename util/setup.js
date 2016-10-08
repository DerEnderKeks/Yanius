'use strict';

module.exports = function (callback) {

  var thinky = require(__dirname + '/../util/thinky.js');
  var databaseUtils = require(__dirname + '/../util/database-utils.js');
  var debug = require('debug')('yanius:setup');
  var config = require('config');
  var hat = require('hat');
  var mkdirp = require('mkdirp');
  var uploadPath = require(__dirname + '/../util/upload-path.js');
  var encryptionHandler = require(__dirname + '/../util/encryption-handler.js');
  var deasync = require('deasync');

  mkdirp(uploadPath, function (err) {
    if (err) throw err;
  });
  mkdirp(__dirname + '/../cache', function (err) {
    if (err) throw err;
  });

  var defaultConfig = {
    id: 1,
    encryptionSecret: hat(256),
    sessionSecret: hat(256),
    maxFileSize: 1e+7,
    maxQuota: 1e+8,
    mimeList: [],
    mimeListType: true
  };
  let configSaved = false;
  databaseUtils.getSetting('id', (error, result) => {
    if (!error || result) {
      configSaved = true;
      return;
    }
    debug('Created default config');
    databaseUtils.setSettings(defaultConfig, (error, result) => {
      if (error) throw error;
      configSaved = true;
    });
  });

  // THIS IS VERY HACKY. I KNOW. JUST DON'T LOOK AT IT.
  deasync.loopWhile(() => {
    return !configSaved;
  });

  encryptionHandler.init();

  databaseUtils.getUsers(0, 1, (error, result) => {
    if (error) return;
    if (result && result.length !== 0) return;

    let user = {
      username: 'admin',
      password: encryptionHandler.hash('12345678'),
      email: 'change@me.pls',
      isAdmin: true,
      enabled: true,
      apiKey: ''
    };
    databaseUtils.addUser(user, (error, result) => {
      if (error) return debug('Could not create default user');
      return debug('Created default user (username: admin, password: 12345678)');
    });
  });

  return true;
};
