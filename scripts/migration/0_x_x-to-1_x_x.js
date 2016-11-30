#!/usr/bin/env node
'use strict';

process.chdir(__dirname + '/../../');

const thinky = require(__dirname + '/../../util/thinky.js');
const Config = require(__dirname + '/../../models/config.js');
const config = require('config');
const r = thinky.r;

let settings = {
  id: 1
};

const checkStatus = () => {
  Config.filter({id: 1}).then(function (result) {
    if (!result || result.length < 1) {
      getOldConfig();
    } else {
      console.log('No migration necessary.');
      process.exit(0);
    }
  }).error((error) => {
    console.log(error);
    console.log('ERROR: Failed to check migration status. Aborting.');
    process.exit(1);
  });
};

const getOldConfig = () => {
  let oldKeys = ['sessionSecret', 'encryptionSecret'];
  let count = 0;
  console.log('Loading old config values...');
  for (let key in oldKeys) {
    (function (key) {
      r.db(config.get('dbConfig.dbName')).table('config').filter({key: oldKeys[key]}).then(function (result) {
        console.log('Loaded value for key \'' + oldKeys[key] + '\'.');
        settings[oldKeys[key]] = result[0].value;
        count++;
        if (count >= oldKeys.length) saveNewConfig();
      })
    })(key)
  }
};

const saveNewConfig = () => {
  if (Object.keys(settings).length < 2) {
    console.log('ERROR: Could not load all config values! Aborting.');
    process.exit(1);
  }
  settings.maxFileSize = 1e+7;
  settings.maxQuota = 1e+8;
  settings.mimeList = [];
  settings.mimeListType = true;
  console.log('Saving new config...');
  let newConfig = new Config(settings);
  newConfig.save().then((result) => {
    console.log('Config saved.');
    console.log('Deleting old values...');
    r.db(config.get('dbConfig.dbName')).table('config').filter((arg) => {
      return r.not(arg('id').eq(1));
    }).delete().then((result) => {
      console.log('Saving new config: Done!');
      migrateUsers();
    })
  }).error((error) => {
    console.log(error);
    console.log('ERROR: Could not save config! Aborting.');
    process.exit(1);
  });
};

const migrateUsers = () => {
  console.log('Migrating users...');
  r.db(config.get('dbConfig.dbName')).table('users').update({quotaUsed: 0}).then((result) => {
    console.log('Migrating users: Done!');
    process.exit(0);
  }).error((error) =>{
    console.log(error);
    console.log('ERROR: Could not migrate users! Aborting.');
    process.exit(1);
  })
};

checkStatus();
