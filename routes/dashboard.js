var express = require('express');
var router = express.Router();
var passport = require('passport');
var session = require('express-session');
var sessionHandler = require(__dirname + '/../util/session-handler.js');
var thinky = require(__dirname + '/../util/thinky.js');
var r = thinky.r;
var User = require(__dirname + '/../models/user.js');
var config = require("config");
var databaseUtils = require(__dirname + '/../util/database-utils.js');

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
  res.redirect('/dashboard/files');
});

/**
 * GET Dashboard - Login
 */
router.get('/login', function (req, res, next) {
  res.render('dashboard/login', {title: 'Login'});
});

/**
 * GET Dashboard - User Files
 */
router.get('/files', sessionHandler.ensureAuthenticated, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/files', {
      title: 'Your Files',
      user: req.user,
      apiUrl: '/api/files/me',
      highlight: '#files',
      settings: result
    });
  });
});

/**
 * GET Dashboard - All Files
 */
router.get('/files/g', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/files', {title: 'Files', user: req.user, apiUrl: '/api/files', showUploader: true, highlight: '#allfiles', settings: result});
  });
});

/**
 * GET Dashboard - Files of single user
 */
router.get('/files/:username', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/files',
      {title: 'Files of ' + req.searchedUser.username, user: req.user, apiUrl: '/api/files/' + req.searchedUser.username, highlight: '', settings: result});
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
 * GET Dashboard - User
 */
router.get('/user/:username', sessionHandler.ensureAuthenticated, sessionHandler.ensureAdminOnly, function (req, res, next) {
  databaseUtils.getSettings((err, result) => {
    if (err) return next(Error(500));
    res.render('dashboard/user', {title: 'User', user: req.user, searchedUser: req.searchedUser, settings: result});
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
 * POST Dashboard - Login
 */
router.post('/login',
  passport.authenticate('local', {failureRedirect: '/dashboard/login', failureFlash: true}),
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
    res.redirect('/dashboard');
  }
);

/**
 * GET Dashboard - Logout
 */
router.get('/logout', function (req, res, next) {
  sessionHandler.deleteRememberMeToken(req.cookies.remember_me, function () {
    res.clearCookie('remember_me');
    req.logout();
    res.redirect('/dashboard/login');
  });
});

module.exports = router;