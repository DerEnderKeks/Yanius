'use strict';

module.exports = function (callback) {

  const thinky = require(__dirname + '/../util/thinky.js');
  const databaseUtils = require(__dirname + '/../util/database-utils.js');
  const debug = require('debug')('yanius:setup');
  const config = require('config');
  const hat = require('hat');
  const mkdirp = require('mkdirp');
  const uploadPath = require(__dirname + '/../util/upload-path.js');
  const encryptionHandler = require(__dirname + '/../util/encryption-handler.js');
  const deasync = require('deasync');

  mkdirp(uploadPath, function (err) {
    if (err) throw err;
  });
  mkdirp(__dirname + '/../cache', function (err) {
    if (err) throw err;
  });

  let defaultConfig = {
    id: 1,
    encryptionSecret: hat(256),
    sessionSecret: hat(256),
    maxFileSize: 1e+7,
    maxQuota: 1e+8,
    mimeList: [],
    mimeListType: true,
    trackingID: '',
    events: {
      user_edited: {
        text: 'User edited',
        enabled: true
      },
      user_added: {
        text: 'User added',
        enabled: true
      },
      user_deleted: {
        text: 'User deleted',
        enabled: true
      },
      file_uploaded: {
        text: 'File uploaded',
        enabled: false
      },
      file_downloaded: {
        text: 'File downloaded',
        enabled: false
      },
      file_deleted: {
        text: 'File deleted',
        enabled: true
      },
      file_hidden: {
        text: 'File hidden',
        enabled: true
      },
      file_visible: {
        text: 'File visible',
        enabled: true
      },
      login_successful: {
        text: 'Login successful',
        enabled: true
      },
      login_failed: {
        text: 'Login failed',
        enabled: true
      },
      logout: {
        text: 'Logout',
        enabled: true
      },
      api_key_generated: {
        text: 'API key generated',
        enabled: true
      },
      settings_changed: {
        text: 'Settings changed',
        enabled: true
      },
    }
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
