'use strict';

const express = require('express');
const router = express.Router();
const uploadPath = require(__dirname + '/../util/upload-path.js');
const databaseUtils = require(__dirname + '/../util/database-utils.js');
const fs = require('fs');
const path = require("path");

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
  if (req.user) return res.redirect(path.relative(req.path, '/dashboard'));
  return res.render('index');
});

/**
 * GET Files
 */
router.get('/:shortname', function (req, res, next) {
  if (!req.requestedFile || req.requestedFile.hidden) {
    let error = new Error('File not found');
    error.status = 404;
    return next(error);
  }

  let filePath = path.join(uploadPath, req.requestedFile.fileId);
  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) return next();

    let disableDownload = [                                 // mime type whitelist for files that browsers can display
      'application/pdf',                                    // pdf - PDF
      'application/x-shockwave-flash'                       // swf - Flash
    ];

    if (req.requestedFile.mime.startsWith('application/') && disableDownload.indexOf(req.requestedFile.mime) < 0)
      res.attachment(req.requestedFile.originalName); // adding the Content-Disposition header to every file that is mime type application/* and is not in the disableDownload array
    res.append('Last-Modified', req.requestedFile.timestamp.toUTCString());
    res.sendFile(filePath, {headers: {'Content-Type': req.requestedFile.mime}});
    databaseUtils.increaseViewCount(req.requestedFile.id, () => {});
    databaseUtils.logEvent('file_downloaded', req.user ? req.user.id : null, req.ip, {
      originalName: req.requestedFile.originalName,
      shortName: req.requestedFile.shortName,
      mime: req.requestedFile.mime,
      size: req.requestedFile.size
    }, () => {})
  });
});

module.exports = router;
