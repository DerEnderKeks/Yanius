const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const uid = require("uid-safe");
const flash = require('express-flash');
const config = require('config');
const passport = require('passport');
const deasync = require("deasync");
const encryptionHandler = require(__dirname + '/util/encryption-handler.js');
const thinky = require(__dirname + '/util/thinky.js');
const r = thinky.r;
const databaseUtils = require(__dirname + '/util/database-utils.js');
const RDBStore = require('session-rethinkdb')(session);
const LocalStrategy = require('passport-local').Strategy;
const LocalAPIKeyStrategy = require('passport-localapikey').Strategy;
const RememberMeStrategy = require('passport-remember-me').Strategy;
const sessionHandler = require(__dirname + '/util/session-handler.js');
const HttpStatus = require('http-status-codes');

const sessionStore = new RDBStore(r, {
  browserSessionsMaxAge: 5000,
  table: 'sessions'
});

const routes = require(__dirname + '/routes/index');
const api = require(__dirname + '/routes/api');
const dashboard = require(__dirname + '/routes/dashboard');

const app = express();

let sessionSecret = null;

// setup
let setupStatus = require(__dirname + '/util/setup.js')();
deasync.loopWhile(() => {
  return !setupStatus;
});

databaseUtils.getSetting('sessionSecret', (error, result) => {
  if (error) {
    console.err(error);
    process.exit(1);
  }
  sessionSecret = result;
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(function (req, res, next) {
  res.removeHeader("x-powered-by"); // GO AWAY USELESS HEADER! (╯°□°）╯︵ ┻━┻
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

function sessionToggle(fn) {
  return (req, res, next) => {
    if (req.path === '/api/upload' && req.method === 'POST') {
      next();
    } else {
      fn(req, res, next);
    }
  }
}

app.use(sessionToggle(session({
  secret: sessionSecret,
  name: 'yanius_sesssion',
  cookie: {
    maxAge: 3600 * 1000, // 1 Hour
    secure: config.get('httpsSupport'),
  },
  store: sessionStore,
  resave: true,
  saveUninitialized: true
})));

app.use(sessionToggle(flash()));
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
    passwordField: 'password',
    passReqToCallback: true
  },
  function (req, username, password, done) {
    process.nextTick(function () {
      sessionHandler.findByUsername(username, function (err, user) {
        if (err) return done(err);
        let errorMsg = 'Invalid username or password!';
        if (!user) return done(null, false, {message: errorMsg, type: 'error'});
        if (!user.enabled) return done(null, false, {message: 'This user account is disabled.', type: 'error'});
        if (!encryptionHandler.check(password, user.password)) {
          databaseUtils.logEvent('login_failed', user ? user.id : null, req.ip, {}, () => {});
          return done(null, false, {
            message: errorMsg,
            type: 'error'
          });
        }
        databaseUtils.logEvent('login_successful', user ? user.id : null, req.ip, {}, () => {});
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
      if (err) return done(err);
      if (!user) return done(null, false, {message: 'Invalid API Key', type: 'error'});
      return done(null, user);
    })
  }
));

/*
 * catch 404 and forward to error handler
 */
app.use(function (req, res, next) {
  let err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// Error handler


if (process.env.NODE_ENV === 'development') {
  /*
   * Development error handler (will print stacktrace)
   */
  app.use(function (err, req, res, next) {
    if (res._header) return;
    if (err.message === 'Invalid token') {
      res.clearCookie('remember_me');
      return res.redirect(path.relative(req.path, '/dashboard'));
    }
    console.error(err);
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err,
      status: err.status
    });
  });
} else {
  /*
   * Production error handler (no stacktraces leaked to user)
   */
  app.use(function (err, req, res, next) {
    if (res._header) return;
    if (err.message === 'Invalid token') {
      res.clearCookie('remember_me');
      return res.redirect(path.relative(req.path, '/dashboard'));
    }
    res.status(err.status || 500);
    res.render('error', {
      message: HttpStatus.getStatusText(res.statusCode),
      error: {},
      status: err.status,
      title: HttpStatus.getStatusText(res.statusCode)
    });
  });
}

module.exports = app;
