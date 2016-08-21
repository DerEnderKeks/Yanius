var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var uid = require("uid-safe");
var flash = require('express-flash');
var config = require('config');
var passport = require('passport');
var deasync = require("deasync");
var encryptionHandler = require(__dirname + '/util/encryption-handler.js');
var thinky = require(__dirname + '/util/thinky.js');
var r = thinky.r;
var ConfigModel = require(__dirname + '/models/config.js');
var RDBStore = require('session-rethinkdb')(session);
var LocalStrategy = require('passport-local').Strategy;
var LocalAPIKeyStrategy = require('passport-localapikey').Strategy;
var RememberMeStrategy = require('passport-remember-me').Strategy;
var sessionHandler = require(__dirname + '/util/session-handler.js');

var sessionStore = new RDBStore(r, {
  browserSessionsMaxAge: 5000,
  table: 'sessions'
});

var routes = require('./routes/index');
var api = require('./routes/api');
var dashboard = require('./routes/dashboard');

var app = express();

var sessionSecret = null;

// setup
let setupStatus = require(__dirname + '/util/setup.js')();
deasync.loopWhile(() => {
  return !setupStatus;
});

ConfigModel.filter({key: 'sessionSecret'}).then(function (result) {
  sessionSecret = result[0].value;
}).error(function (err) {
  console.err(err);
  process.exit(1);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(function (req, res, next) {
  res.removeHeader("x-powered-by"); // GO AWAY USELESS HEADER!
  next();
});

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  debug: false,
  indentedSyntax: false,
  outputStyle: 'compressed',
  sourceMap: true
}));
app.use(require('express-minify')({
  js_match: /javascript/,
  css_match: /stylesheets/,
  uglifyJS: undefined,
  cssmin: undefined,
  cache: __dirname + '/cache/',
  onerror: undefined
}));
app.use(express.static(path.join(__dirname, 'public')));
deasync.loopWhile(function () {
  // Wait until sessionSecret is set
  return !sessionSecret
});
app.use(session({
  secret: sessionSecret,
  name: 'yanius_sesssion',
  cookie: {
    maxAge: 3600 * 1000, // 1 Hour
    secure: config.get('httpsSupport'),
  },
  store: sessionStore,
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(passport.authenticate('remember-me'));

app.use('/api', api);
app.use('/dashboard', dashboard);
app.use('/', routes);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});
passport.deserializeUser(function (id, done) {
  sessionHandler.findById(id, function (err, user) {
    done(err, user);
  });
});
passport.use(new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password'
  },
  function (username, password, done) {
    process.nextTick(function () {
      sessionHandler.findByUsername(username, function (err, user) {
        if (err) return done(err);
        let errorMsg = 'Invalid username or password!';
        if (!user) return done(null, false, {message: errorMsg, type: 'error'});
        if (!user.enabled) return done(null, false, {message: 'This user account is disabled.', type: 'error'});
        if (!encryptionHandler.check(password, user.password)) return done(null, false, {
          message: errorMsg,
          type: 'error'
        });
        return done(null, user);
      })
    });
  }
));
passport.use(new RememberMeStrategy(
  function (token, done) {
    sessionHandler.consumeRememberMeToken(token, function (err, uid) {
      if (err) return done(err);
      if (!uid) return done(null, false);
      sessionHandler.findById(uid, function (err, user) {
        if (err) return done(err);
        if (!user) return done(null, false);
        if (!user.enabled) return done(null, false, {message: 'This user account is disabled.', type: 'error'});
        return done(null, user);
      });
    });
  },
  sessionHandler.issueToken
));

passport.use(new LocalAPIKeyStrategy(
  function (apikey, done) {
    sessionHandler.findByAPIKey(apikey, function (err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {message: 'Invalid API Key', type: 'error'});
      }
      return done(null, user);
    })
  }
));

/*
 * catch 404 and forward to error handler
 */
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler

/*
 * development error handler (will print stacktrace)
 */
if (process.env.NODE_ENV === 'development') {
  app.use(function (err, req, res, next) {
    if (res._header) return;
    if (err.message === 'Invalid token') {
      res.clearCookie('remember_me');
      return res.redirect('/dashboard');
    }
    console.error(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
} else {
  /*
   * production error handler (no stacktraces leaked to user)
   */
  app.use(function (err, req, res, next) {
    if (res._header) return;
    if (err.message === 'Invalid token') {
      res.clearCookie('remember_me');
      return res.redirect('/dashboard');
    }
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: {}
    });
  });
}

module.exports = app;
