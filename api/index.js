// api/index.js
const express = require('express');
const serverless = require('serverless-http');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const path = require('path');

const authRouter = require('../routes/auth');
const indexRouter = require('../routes/index');
const usersRouter = require('../routes/users');
const getJotFormData = require('../routes/getJotFormData');
const ensureAuthenticated = require('../middleware/authMiddleware');

require('dotenv').config();

const app = express();

// -------------------
// Middleware
// -------------------
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// -------------------
// Session (serverless-compatible, still works per request)
app.set('trust proxy', 1);
app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// -------------------
// Pass auth info to views
app.use((req, res, next) => {
  res.locals.isAuthenticated = !!req.session.account;
  res.locals.username = req.session.account ? req.session.account.name : null;
  next();
});

// -------------------
// Protected static pages
const protectedPages = ['calendar', 'home', 'nths', 'hosa', 'ffa', 'pba', 'skills', 'vei', 'event-details'];
protectedPages.forEach(page => {
  app.get(`/${page}.html`, ensureAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../public', `${page}.html`));
  });
});

// Static files
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use('/auth', authRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/getJotFormData', ensureAuthenticated, getJotFormData);

// Catch 404
app.use((req, res) => res.status(404).send('Not Found'));

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ 
    error: err.message,
    status: err.status || 500
  });
});

// Export handler for Vercel
module.exports = serverless(app);
