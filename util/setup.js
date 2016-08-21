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

  var ConfigModel = require(__dirname + '/../models/config.js');

  mkdirp(uploadPath, function (err) {
    if (err) throw (err);
  });
  mkdirp(__dirname + '/../cache', function (err) {
    if (err) throw err;
  });

  var defaultConfig = {
    encryptionSecret: hat(256),
    sessionSecret: hat(256),
    registrationEnabled: false
  };

  for (var key in defaultConfig) {
    (function (key) {
      ConfigModel.filter({key: key}).then(function (result) {
        if (result.length === 0) {
          ConfigModel.save({key: key, value: defaultConfig[key]})
            .then(function (res) {
              defaultConfig[key] = 'done';
              debug('Inserted default config value for \'' + key + '\'');
            })
            .error(function (err) {
              console.err('Failed to insert default config value for \'' + key + '\'\n' + err)
            });
        } else {
          defaultConfig[key] = 'done';
        }
      })
    })(key)
  }

  // THIS IS VERY HACKY. I KNOW. JUST DON'T LOOK AT IT.
  deasync.loopWhile(() => {
    return defaultConfig.encryptionSecret !== 'done';
  });
  encryptionHandler.init();
  deasync.loopWhile(() => {
    return defaultConfig.sessionSecret !== 'done';
  });


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
      if (error) return debug('could not create default user');
      return debug('created default user');
    });
  });

  return true;
};
