const express = require('express');
const router = express.Router();
const passport = require('passport');
const session = require('express-session');
const sessionHandler = require(__dirname + '/../util/session-handler.js');
const thinky = require(__dirname + '/../util/thinky.js');
const r = thinky.r;
const User = require(__dirname + '/../models/user.js');
const fileUpload = require('express-fileupload');
const uid = require("uid-safe");
const path = require('path');
const config = require('config');
const uploadPath = require(__dirname + '/../util/upload-path.js');
const databaseUtils = require(__dirname + '/../util/database-utils.js');
const genericUtils = require(__dirname + '/../util/generic-utils.js');
const encryptionHandler = require(__dirname + '/../util/encryption-handler.js');
const validator = require('validator');
const fileType = require('file-type');
const urlJoin = require('url-join');
const mime = require('mime');
const hat = require('hat');
const multer = require('multer');
const debug = require('debug')('yanius:api');
const readChunk = require('read-chunk');


function ensurePermitted(req, res, next) {
  if (req.searchedUser && (req.user.id === req.searchedUser.id || req.user.isAdmin)) return next();
  if (req.requestedFile && (req.requestedFile.uploaderId === req.user.id || req.user.isAdmin)) return next();
  res.status(403);
  return res.json({message: 'Forbidden'});
}

function ensureAdminOnly(req, res, next) {
  if (req.user.isAdmin) return next();
  res.status(403);
  return res.json({message: 'Forbidden'});
}

/**
 * PARAM username
 */
router.param('username', function (req, res, next, param) {
  if (param === 'me' && req.user) param = req.user.username;
  databaseUtils.getUser(param, function (error, result) {
    if (error) return next(error);
    req.searchedUser = result;
    return next();
  });
});

/**
 * PARAM userId
 */
router.param('userId', function (req, res, next, param) {
  databaseUtils.getUserById(param, function (error, result) {
    if (error) return next(error);
    req.searchedUser = result;
    return next();
  });
});

/**
 * PARAM fileId
 */
router.param('fileId', function (req, res, next, param) {
  databaseUtils.getFileById(param, function (error, result) {
    if (error) return next(error);
    req.requestedFile = result;
    return next();
  });
});

/**
 * GET API - files of user
 */
router.get('/files/:username', sessionHandler.ensureAuthenticated, ensurePermitted, function (req, res, next) {
  let index = req.query.index ? parseInt(req.query.index) : 0;
  let max = req.query.max ? parseInt(req.query.max) : 25;
  databaseUtils.getFilesForUser(req.searchedUser.id, index, max, (error, result) => {
    if (error) return next(error);
    return res.json(result);
  });
});

/**
 * GET API - files
 */
router.get('/files', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  let index = req.query.index ? parseInt(req.query.index) : 0;
  let max = req.query.max ? parseInt(req.query.max) : 25;
  databaseUtils.getFilesWithUser(index, max, (error, result) => {
    if (error) return next(error);
    return res.json(result);
  });
});

/**
 * GET API - files
 */
router.delete('/file/:fileId', sessionHandler.ensureAuthenticated, ensurePermitted, function (req, res, next) {
  databaseUtils.deleteFile(req.requestedFile.id, (error, result) => {
    if (error) return end(res, 500, 'Could not delete file');
    databaseUtils.logEvent('file_deleted', req.user ? req.user.id : null, req.ip, {
      originalName: req.requestedFile.originalName,
      shortName: req.requestedFile.shortName,
      mime: req.requestedFile.mime,
      size: req.requestedFile.size
    }, () => {});
    return end(res, 200, 'File deleted');
  });
});

/**
 * GET API - events
 */
router.get('/events', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  let index = req.query.index ? parseInt(req.query.index) : 0;
  let max = req.query.max ? parseInt(req.query.max) : 25;
  databaseUtils.getEvents(index, max, function (error, result) {
    if (error) return next(error);
    return res.json(result);
  });
});

/**
 * POST API - change file visibility
 */
router.post('/file/:fileId/visibility', sessionHandler.ensureAuthenticated, ensurePermitted, function (req, res, next) {
  let file = req.requestedFile;
  file.hidden = req.body.hidden;
  databaseUtils.editFile(file, function (error, result) {
    if (error) return end(res, 500, 'Could not change visibility');
    databaseUtils.logEvent(file.hidden ? 'file_hidden' : 'file_visible', req.user ? req.user.id : null, req.ip, {
      originalName: req.requestedFile.originalName,
      shortName: req.requestedFile.shortName,
      mime: req.requestedFile.mime,
      size: req.requestedFile.size
    }, () => {});
    return end(res, 200, 'Visibility saved');
  })
});

/**
 * GET API - users
 */
router.get('/users', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  let index = req.query.index ? parseInt(req.query.index) : 0;
  let max = req.query.max ? parseInt(req.query.max) : 25;
  databaseUtils.getUsers(index, max, function (error, result) {
    if (error) return next(error);
    result = result.map(function (element) {
      element.apiKey = undefined;
      element.password = undefined;
      return element;
    });
    return res.json(result);
  });
});

router.delete('/users/:userId', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  databaseUtils.deleteUser(req.searchedUser.id, function (error, result) {
    if (error) return end(res, 500, 'Could not delete user');
    databaseUtils.logEvent('user_deleted', req.user ? req.user.id : null, req.ip, {
      username: req.searchedUser.username,
      email: req.searchedUser.email,
      isAdmin: req.searchedUser.isAdmin,
      enabled: req.searchedUser.enabled
    }, () => {});
    return end(res, 200, 'User deleted');
  })
});

router.get('/regenerateAPIKey', sessionHandler.ensureAuthenticated, function (req, res, next) {
  let user = {
    id: req.user.id,
    apiKey: hat(256)
  };
  databaseUtils.editUser(user, function (error, result) {
    if (error) return end(res, 500, 'API Key generation failed');
    databaseUtils.logEvent('api_key_generated', req.user ? req.user.id : null, req.ip, {}, () => {});
    return end(res, 200, 'API Key generated', {key: user.apiKey});
  })
});

router.post('/users/new', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  let user = {};
  user.id = req.body.id;
  user.username = req.body.username;
  user.email = req.body.email;
  user.password = null;
  user.password = req.body.password;
  user.enabled = req.body.enabled;
  user.isAdmin = req.body.isAdmin;

  if (typeof user.username !== 'string' || !/^[a-zA-Z0-9_]{4,24}$/.test(user.username)) return end(res, 400, 'Invalid Username');
  if (typeof user.email !== 'string' || !validator.isEmail(user.email)) return end(res, 400, 'Invalid Email Address');
  if (typeof user.password !== 'string' || !/^[\x00-\x7F]{8,50}$/.test(user.password)) return end(res, 400, 'Invalid Password');
  if (typeof user.enabled !== 'boolean') return end(res, 400, '\'enabled\' must be a boolean');
  if (typeof user.isAdmin !== 'boolean') return end(res, 400, '\'isAdmin\' must be a boolean');

  user.password = encryptionHandler.hash(user.password);

  databaseUtils.addUser(user, function (error, result) {
    if (error && error.message === '400') return end(res, 400, 'Username occupied');
    if (error) return end(res, 500, 'Internal Server Error');
    databaseUtils.logEvent('user_added', req.user ? req.user.id : null, req.ip, {
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      enabled: user.enabled
    }, () => {});
    return end(res, 200, 'User created');
  });
});

/**
 * POST API - update settings
 */
router.post('/settings', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  let settings = {};
  settings.id = 1;
  settings.maxFileSize = req.body.maxFileSize;
  settings.maxQuota = req.body.maxQuota;
  settings.mimeList = req.body.mimeList;
  settings.mimeListType = req.body.mimeListType;
  settings.events = req.body.events;

  databaseUtils.updateSettings(settings, function (error, result) {
    if (error) return end(res, 500, 'Could not save settings');
    databaseUtils.logEvent('settings_changed', req.user ? req.user.id : null, req.ip, {}, () => {});
    return end(res, 200, 'Settings saved');
  })
});

router.post('/users/:userId', sessionHandler.ensureAuthenticated, ensurePermitted, function (req, res, next) {
  const user = {};
  user.id = req.searchedUser.id;
  user.email = req.body.email;
  if (req.body.password) user.password = req.body.password;
  user.apiKey = req.body.apiKey;
  if (req.user.isAdmin) {
    if (req.body.username) user.username = req.body.username;
    if (req.body.isAdmin) user.isAdmin = req.body.isAdmin;
    if (req.body.enabled) user.enabled = req.body.enabled;
  }

  if (user.username && (typeof user.username !== 'string' || !/^[a-zA-Z0-9_]{4,24}$/.test(user.username))) return end(res, 400, 'Invalid Username');
  if (typeof user.email !== 'string' || !validator.isEmail(user.email)) return end(res, 400, 'Invalid Email Address');
  if (user.password && (typeof user.password !== 'string' || !/^[\x00-\x7F]{8,50}$/.test(user.password))) return end(res, 400, 'Invalid Password');
  if (user.enabled && (typeof user.enabled !== 'boolean')) return end(res, 400, '\'enabled\' must be a boolean');
  if (user.isAdmin && (typeof user.isAdmin !== 'boolean')) return end(res, 400, '\'isAdmin\' must be a boolean');

  if (user.password) user.password = encryptionHandler.hash(user.password);

  databaseUtils.editUser(user, function (error, result) {
    if (error) return end(res, 500, 'Internal Server Error');
    databaseUtils.logEvent('settings_changed', req.user ? req.user.id : null, req.ip, {
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      enabled: user.enabled
    }, () => {});
    return end(res, 200, 'User saved');
  });
});


/**
 * POST API - Upload
 */
let multerStorage = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, uploadPath)
  },
  filename: function (req, file, callback) {
    callback(null, uid.sync(50))
  }
});

router.post('/upload', multer({storage: multerStorage}).single('file'), sessionHandler.authenticateAPIKey, function (req, res, next) {
  let file;

  if (!req.file) {
    return end(res, 400, 'No file provided');
  }

  file = req.file;

  let fileBuffer = readChunk.sync(file.path, 0, 262);
  let mimeInfo = fileType(fileBuffer);
  if (!mimeInfo) mimeInfo = {
    mime: 'application/octet-stream',
    ext: ''
  };
  if (mimeInfo.ext === 'bin') mimeInfo.ext = path.extname(file.originalname);
  if (mimeInfo.ext.charAt(0) === '.') mimeInfo.ext = mimeInfo.ext.substr(1);


  let newFile = {
    fileId: file.filename,
    originalName: file.originalname,
    mime: mimeInfo.mime,
    ext: mimeInfo.ext,
    timestamp: new Date(),
    hidden: req.body.hidden == 'true',
    uploaderId: req.user.id,
    views: 0,
    size: file.size
  };

  genericUtils.checkUploadRestriction(newFile, req.user, (error, result, message) => {
    if (error) return end(res, 500, 'Upload failed');
    if (result !== true) return end(res, 403, message);

    let generateShortname = () => {
      let shortName = uid.sync(6);
      databaseUtils.getFile(shortName, function (error, result) {
        if (error) return end(res, 500, 'Upload failed');
        if (result) return generateShortname();
        newFile.shortName = shortName;
        databaseUtils.addFile(newFile, function (error, result) {
          if (error) return end(res, 500, 'Upload failed');
          databaseUtils.logEvent('file_upload', req.user ? req.user.id : null, req.ip, {
            originalName: req.requestedFile.originalName,
            shortName: req.requestedFile.shortName,
            mime: req.requestedFile.mime,
            size: req.requestedFile.size
          }, () => {});
          return end(res, 201, 'File uploaded', {url: urlJoin(config.get('url'), result.ext ? result.shortName + '.' + result.ext : result.shortName)});
        });
      });
    };
    generateShortname();
  });
});

function end(res, status, message, custom) {
  res.status(status);
  if (!custom) custom = {};
  return res.json(Object.assign({message: message}, custom));
}

module.exports = router;
