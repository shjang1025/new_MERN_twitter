
require('./models/User');
require('./models/Tweet'); 
require('./config/passport'); 
const passport = require('passport'); 

const express = require("express");
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const debug = require('debug');
const cors = require('cors');
const csurf = require('csurf');
const { isProduction } = require('./config/keys');

const usersRouter = require('./routes/api/users');
const tweetsRouter = require('./routes/api/tweets');
const csrfRouter = require('./routes/api/csrf');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(passport.initialize());
// Security Middleware
if (isProduction) {
  const path = require('path');
  // Serve the frontend's index.html file at the root route
  app.get('/', (req, res) => {
    res.cookie('CSRF-TOKEN', req.csrfToken());
    res.sendFile(
      path.resolve(__dirname, '../frontend', 'dist', 'index.html')
    );
  });

  // Serve the static assets in the frontend's dist folder
  app.use(express.static(path.resolve("../frontend/dist")));

  // Serve the frontend's index.html file at all other routes NOT starting with /api
  app.get(/^(?!\/?api).*/, (req, res) => {
    res.cookie('CSRF-TOKEN', req.csrfToken());
    res.sendFile(
      path.resolve(__dirname, '../frontend', 'dist', 'index.html')
    );
  });
}

// Set the _csrf token and create req.csrfToken method to generate a hashed
// CSRF token
app.use(
  csurf({
    cookie: {
      secure: isProduction,
      sameSite: isProduction && "Lax",
      httpOnly: true
    }
  })
);

// Attach Express routers
app.use('/api/users', usersRouter);
app.use('/api/tweets', tweetsRouter);
app.use('/api/csrf', csrfRouter);

app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.statusCode = 404;
    next(err);
  });
const serverErrorLogger = debug('backend:error')
app.use((err, req, res, next) => {
    serverErrorLogger(err);
    const statusCode = err.statusCode || 500;
    res.status(statusCode);
    res.json({
      message: err.message,
      statusCode,
      errors: err.errors
    })
  });

module.exports = app;