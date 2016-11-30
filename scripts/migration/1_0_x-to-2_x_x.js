#!/usr/bin/env node
'use strict';

process.chdir(__dirname + '/../../');

const thinky = require(__dirname + '/../../util/thinky.js');
const Errors = thinky.Errors;
const Config = require(__dirname + '/../../models/config.js');
const config = require('config');
const r = thinky.r;

const getSetting = function (setting, callback) {
  Config.get(1).then((result) => {
    return callback(null, result[setting]);
  }).catch(Errors.DocumentNotFound, (error) => {
    return callback(error, null);
  }).error((error) => {
    return callback(error, null);
  });
};

const updateSettings = function (settings, callback) {
  Config.get(1).update(settings).then((result) => {
    return callback(null, result);
  }).error((error) => {
    return callback(error, null);
  })
};

const quitWithError = (message) => {
  console.log(message);
  process.exit(1);
};

let events = {
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
};

getSetting('events', (err, result) => {
  if (result && result.length > 0) return console.log('Done!');
  if (err) return quitWithError('ERROR: Failed to load settings! Aborting.');
  updateSettings({events: events}, (err, result) => {
    if (err) return quitWithError('ERROR: Failed to save new settings! Aborting.');
    console.log('Done!');
    process.exit(0);
  })
});
