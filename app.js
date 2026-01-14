require('dotenv').config();
const express = require('express');
const path = require('path');
const axios = require('axios');
const session = require('express-session');
const createError = require('http-errors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const ensureAuthenticated = require('./middleware/authMiddleware');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const getJotFormData = require('./routes/getJotFormData');

const app = express();

// -------------------
// Session
// -------------------

app.set('trust proxy', 1);

app.use(session({
  secret: process.env.EXPRESS_SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  }
}));

// -------------------
// Pass auth info to views
// -------------------

app.use((req, res, next) => {
    res.locals.isAuthenticated = !!req.session.account;
    res.locals.username = req.session.account ? req.session.account.name : null;
    next();
});

// -------------------
// View engine
// -------------------
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// -------------------
// Middleware
// -------------------
app.use(logger('dev'));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// -------------------
// Protected static pages (require authentication)
// Must come BEFORE static middleware to intercept requests
// -------------------
const protectedPages = ['calendar', 'home', 'nths', 'hosa', 'ffa', 'pba', 'skills', 'vei', 'event-details'];

protectedPages.forEach(page => {
    app.get(`/${page}.html`, ensureAuthenticated, (req, res) => {
        res.sendFile(path.join(__dirname, 'public', `${page}.html`));
    });
});

// Now serve static files for everything else (css, js, images, etc.)
app.use(express.static(path.join(__dirname, "public")));

// -------------------
// Routes
// -------------------
app.use('/auth', authRouter);
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/getJotFormData', ensureAuthenticated, getJotFormData);

// -------------------
// Proxy for files (avoid CORS)
// -------------------
app.get('/proxy-file', async (req, res) => {
    try {
        const imageUrl = req.query.url;
        if (!imageUrl) return res.status(400).send('Image URL required');
        
        const response = await axios.get(imageUrl, { responseType: 'stream', timeout: 10000 });
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Cache-Control', 'public, max-age=3600'); 
        response.data.pipe(res);
    } catch (error) {
        console.error('Error proxying file:', error.message);
        res.status(500).send('Failed to load file');
    }
});

// -------------------
// Catch 404
// -------------------
app.use((req, res, next) => {
    next(createError(404));
});

// -------------------
// Error handler
// -------------------
app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('index');
});

module.exports = app;
