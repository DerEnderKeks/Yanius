var express = require('express');
var router = express.Router();
var passport = require('passport');
var session = require('express-session');
var sessionHandler = require(__dirname + '/../util/session-handler.js');
var thinky = require(__dirname + '/../util/thinky.js');
var r = thinky.r;
var User = require(__dirname + '/../models/user.js');
var fileUpload = require('express-fileupload');
var uid = require("uid-safe");
var path = require('path');
var config = require('config');
var uploadPath = require(__dirname + '/../util/upload-path.js');
var databaseUtils = require(__dirname + '/../util/database-utils.js');
var encryptionHandler = require(__dirname + '/../util/encryption-handler.js');
var validator = require('validator');
var fileType = require('file-type');
var urlJoin = require('url-join');
var mime = require('mime');
var hat = require('hat');


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
  var index = req.query.index ? parseInt(req.query.index) : 0;
  var max = req.query.max ? parseInt(req.query.max) : 25;
  databaseUtils.getFilesForUser(req.searchedUser.id, index, max, (error, result) => {
    if (error) return next(error);
    return res.json(result);
  });
});

/**
 * GET API - files
 */
router.get('/files', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  var index = req.query.index ? parseInt(req.query.index) : 0;
  var max = req.query.max ? parseInt(req.query.max) : 25;
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
    return end(res, 200, 'File deleted');
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
    return end(res, 200, 'Visibility saved');
  })
});

/**
 * GET API - users
 */
router.get('/users', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  var index = req.query.index ? parseInt(req.query.index) : 0;
  var max = req.query.max ? parseInt(req.query.max) : 25;
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
    return end(res, 200, 'User deleted');
  })
});

router.get('/regenerateAPIKey', sessionHandler.ensureAuthenticated, function (req, res, next) {
  var user = {
    id: req.user.id,
    apiKey: hat(256)
  };
  databaseUtils.editUser(user, function (error, result) {
    if (error) return end(res, 500, 'API Key generation failed');
    return end(res, 200, 'API Key generated', {key: user.apiKey});
  })
});

router.post('/users/new', sessionHandler.ensureAuthenticated, ensureAdminOnly, function (req, res, next) {
  var user = {};
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
    return end(res, 200, 'User created');
  });
});

router.post('/users/:userId', sessionHandler.ensureAuthenticated, ensurePermitted, function (req, res, next) {
  var user = {};
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
    return end(res, 200, 'User saved');
  });
});


/**
 * POST API - Upload
 */
router.use(fileUpload());
router.post('/upload', sessionHandler.authenticateAPIKey, function (req, res, next) {
  var file;

  if (!req.files || !req.files.file) {
    return end(res, 400, 'No file provided');
  }

  file = req.files.file;

  let mimeInfo = fileType(file.data);
  if (!mimeInfo) mimeInfo = {ext: mime.extension(mime.lookup(file.name)), mime: mime.lookup(file.name)};
  if (mimeInfo.ext === 'bin') mimeInfo.ext = path.extname(file.name);
  if (mimeInfo.ext.charAt(0) === '.') mimeInfo.ext = mimeInfo.ext.substr(1);

  var newFile = {
    fileId: uid.sync(50),
    originalName: file.name,
    mime: mimeInfo.mime,
    ext: mimeInfo.ext,
    timestamp: new Date(),
    hidden: req.body.hidden == 'true',
    uploaderId: req.user.id,
    views: 0
  };

  file.mv(path.join(uploadPath, newFile.fileId), function (err) {
    if (err) {
      console.log(err);
      return end(res, 500, 'Upload failed');
    } else {
      let generateShortname = () => {
        let shortName = uid.sync(6);
        databaseUtils.getFile(shortName, function (error, result) {
          if (error) return end(res, 500, 'Upload failed');
          if (result) return generateShortname();
          newFile.shortName = shortName;
          databaseUtils.addFile(newFile, function (error, result) {
            if (error) return end(res, 500, 'Upload failed');
            return end(res, 201, 'File uploaded', {url: urlJoin(config.get('url'), result.ext ? result.shortName + '.' + result.ext : result.shortName)});
          });
        });
      };
      generateShortname();
    }
  });
});

function end(res, status, message, custom) {
  res.status(status);
  if (!custom) custom = {};
  return res.json(Object.assign({message: message}, custom));
}

module.exports = router;
