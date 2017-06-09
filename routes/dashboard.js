const express = require('express');
const router = express.Router();
const passport = require('passport');
const session = require('express-session');
const sessionHandler = require(__dirname + '/../util/session-handler.js');
const thinky = require(__dirname + '/../util/thinky.js');
const r = thinky.r;
const User = require(__dirname + '/../models/user.js');
const config = require("config");
const databaseUtils = require(__dirname + '/../util/database-utils.js');
const path = require('path');

/**
 * PARAM username
 */
router.param('username', function (req, res, next, param) {
  if (param.length < 5) return next();
  User.filter(r.row('username').match('(?i)^' + param + '$')).then(function (result) {
    if (!result[0]) return next(new Error('Invalid user'));
    req.searchedUser = result[0];
    return next();
  }).error(function (error) {
    return next(new Error('Failed to load user'));
  });
});

/**
 * GET Dashboard
 */
router.get('/', sessionHandler.ensureAuthenticated, function (req, res, next) {
  res.redirect(path.relative(req.path, '/dashboard/files'));
});

/**
 * GET Dashboard - Login
 */
router.get('/login', function (req, res, next) {
  res.render('dashboard/login', {title: 'Login'});
});

/**
 * GET Dashboard - Files
 */
router.get('/files', sessionHandler.ensureAuthenticated, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/files', {
      title: 'Your Files',
      user: req.user,
      apiUrl: '../api/files/me',
      highlight: '#files',
      settings: result
    });
  });
});

/**
 * GET Dashboard - All Files
 */
router.get('/files/all', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/files', {title: 'Files', user: req.user, apiUrl: '../../api/files', showUploader: true, highlight: '#allfiles', settings: result, url_prefix: '../'});
  });
});

/**
 * GET Dashboard - Files of single user
 */
router.get('/files/:username', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/files',
      {title: 'Files of ' + req.searchedUser.username, user: req.user, apiUrl: '../../api/files/' + req.searchedUser.username, highlight: '', settings: result, url_prefix: '../'});
  });
});

/**
 * GET Dashboard - Users
 */
router.get('/users', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/users', {title: 'Users', user: req.user, settings: result});
  });
});

/**
 * GET Dashboard - Upload
 */
router.get('/upload', sessionHandler.ensureAuthenticated, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/upload', {title: 'Upload', user: req.user, settings: result});
  });
});

/**
 * GET Dashboard - Event Log
 */
router.get('/eventlog', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/event-log', {title: 'Event Log', user: req.user, settings: result});
  });
});

/**
 * GET Dashboard - User
 */
router.get('/user/:username', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/user', {title: 'User', user: req.user, searchedUser: req.searchedUser, settings: result, url_prefix: '../'});
  });
});

/**
 * GET Dashboard - Account
 */
router.get('/account', sessionHandler.ensureAuthenticated, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/account', {title: 'Account', user: req.user, searchedUser: req.user, settings: result});
  });
});

/**
 * GET Dashboard - Settings
 */
router.get('/settings', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/settings', {title: 'Settings', user: req.user, settings: result});
  });
});

/**
 * GET Dashboard - Help
 */
router.get('/help', sessionHandler.ensureAuthenticated, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/help', {title: 'Help', user: req.user, settings: result});
  });
});

/**
 * POST Dashboard - Login
 */
router.post('/login',
  passport.authenticate('local', {failureRedirect: 'login', failureFlash: true}),
  function (req, res, next) {
    if (!req.body.remember_me) {
      return next();
    }
    sessionHandler.issueToken(req.user, function (err, token) {
      if (err) {
        return next(err);
      }
      res.cookie('remember_me', token, {
        path: '/',
        httpOnly: true,
        maxAge: 604800000,
        secure: config.get('httpsSupport')
      });
      return next();
    });
  },
  function (req, res) {
    res.redirect(path.relative(req.path, '/dashboard'));
  }
);

/**
 * GET Dashboard - Logout
 */
router.get('/logout', function (req, res, next) {
  sessionHandler.deleteRememberMeToken(req.cookies.remember_me, function () {
    databaseUtils.logEvent('logout', req.user ? req.user.id : null, req.ip, {}, () => {});
    res.clearCookie('remember_me');
    req.logout();
    res.redirect(path.relative(req.path, '/dashboard/login'));
  });
});

module.exports = router;