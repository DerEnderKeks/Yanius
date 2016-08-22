'use strict';

var express = require('express');
var router = express.Router();
var uploadPath = require(__dirname + '/../util/upload-path.js');
var databaseUtils = require(__dirname + '/../util/database-utils.js');
var fs = require('fs');
var path = require("path");

/**
 * PARAM username
 */
router.param('shortname', function (req, res, next, param) {
  if (param.length < 8) return next();

  param = param.substr(0, 8);

  databaseUtils.getFile(param, function (error, result) {
    if (error) return next(error);
    req.requestedFile = result;
    return next();
  });
});

/**
 * GET Files
 */
router.get('/', function (req, res, next) {
  res.render('index');
});

/**
 * GET Files
 */
router.get('/:shortname', function (req, res, next) {
  if (!req.requestedFile || req.requestedFile.hidden) {
    res.status(404);
    return res.json({message: 'Not Found'});
  }

  let filePath = path.join(uploadPath, req.requestedFile.fileId);
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return next();

    let disableDownload = ['application/pdf']; // mime type whitelist for files that browsers can display

    if (req.requestedFile.mime.startsWith('application/') && disableDownload.indexOf(req.requestedFile.mime) < 0) res.attachment(req.requestedFile.originalName);
    res.append('Last-Modified', req.requestedFile.timestamp.toUTCString());
    res.sendFile(filePath, {headers: {'Content-Type': req.requestedFile.mime}});
    databaseUtils.increaseViewCount(req.requestedFile.id, () => {
    });
  });
});

module.exports = router;
