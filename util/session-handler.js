const thinky = require(__dirname + '/../util/thinky.js');
const r = thinky.r;
const User = require(__dirname + '/../models/user.js');
const rememberMeToken = require(__dirname + '/../models/rememberMeToken.js');
const uid = require('uid-safe');
const encryptionHandler = require(__dirname + '/../util/encryption-handler.js');
const passport = require('passport');
const path = require('path');

exports.findById = function (id, fn) {
  User.get(id).then(function (result) {
    fn(null, result)
  }).error(function (err) {
    fn(err);
  });
};

exports.findByUsername = function (username, fn) {
  User.filter(r.row('username').match('(?i)^' + username + '$')).then(function (result) {
    return fn(null, result[0]);
  }).error(function (err) {
    return fn(err, null);
  });
};

exports.findByAPIKey = function (key, fn) {
  if (key.length === 0) return fn(new Error('API Key can\'t be empty'), null);
  User.filter({apiKey: key}).then(function (result) {
    return fn(null, result[0]);
  }).error(function (err) {
    return fn(err, null);
  });
};

exports.issueToken = function (user, done) {
  uid(189).then(function (token) {
    exports.saveRememberMeToken(token, user.id, function (err) {
      if (err) {
        return done(err);
      }
      return done(null, token);
    })
  })
};

exports.saveRememberMeToken = function (token, uid, fn) {
  let newToken = new rememberMeToken({
    token: encryptionHandler.tokenHash(token),
    userId: uid
  });
  newToken.save().then(function () {
    return fn(null);
  }).error(function (error) {
    return fn(error);
  });
};

exports.consumeRememberMeToken = function (token, fn) {
  let tokenHash = encryptionHandler.tokenHash(token);
  rememberMeToken.filter({token: tokenHash}).then(function (result) {
    if (!result[0]) return fn(new Error('Invalid token'), null);
    let uid = result[0].userId;
    result[0].delete().then(function () {
      return fn(null, uid);
    }).error(function (error) {
      return fn(error, null);
    })
  }).error(function (error) {
    return fn(error, null);
  });
};

exports.deleteRememberMeToken = function (token, fn) {
  if (!token) return fn();
  let tokenHash = encryptionHandler.tokenHash(token);
  rememberMeToken.filter({token: tokenHash}).then(function (result) {
    if (!result[0]) return fn(new Error('Invalid token (Try to delete your cookies)'));
    result[0].delete().then(function () {
      return fn();
    }).error(function (error) {
      return fn(error);
    })
  }).error(function (error) {
    return fn(error);
  });
};

exports.ensureAdminOnly = function (req, res, next) {
  if (req.user.isAdmin) {
    return next();
  }
  req.flash('errorHeader', 'Nothing to see here. Move along..');
  req.flash('error', 'You are not allowed to access the requested site');
  res.redirect(path.relative(req.path, '/dashboard/login'));
};

exports.ensureAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect(path.relative(req.path, '/dashboard/login'));
};

exports.authenticateAPIKey = function (req, res, next) {
  passport.authenticate('localapikey', {session: false}, function (error, user) {
    if (error) return next(error);
    if (!user) {
      res.status(401);
      return res.json({message: 'Unauthorized'});
    }
    req.logIn(user, function (err) {
      if (err) return next(err);
      return next();
    })
  })(req, res, next);
};

