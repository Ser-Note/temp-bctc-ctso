/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

var express = require('express');

const authProvider = require('../auth/authProvider');
const { REDIRECT_URI, POST_LOGOUT_REDIRECT_URI } = require('../authConfig');

const router = express.Router();

router.get('/signin', (req, res, next) => {
    authProvider.login({
        scopes: [],
        redirectUri: REDIRECT_URI,
        successRedirect: '/'
    })(req, res, next);
});

router.get('/acquireToken', (req, res, next) => {
    authProvider.acquireToken({
        scopes: ['User.Read'],
        redirectUri: REDIRECT_URI,
        successRedirect: '/users/profile'
    })(req, res, next);
});

router.get('/redirect', (req, res, next) => {
    authProvider.handleRedirect()(req, res, next);
});

router.get('/signout', (req, res, next) => {
    authProvider.logout({
        postLogoutRedirectUri: POST_LOGOUT_REDIRECT_URI
    })(req, res, next);
});

module.exports = router;