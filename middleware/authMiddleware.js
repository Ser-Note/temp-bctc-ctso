// authMiddleware.js
function ensureAuthenticated(req, res, next) {
    if (req.session && req.session.account) {
        // User is logged in, allow access
        next();
    } else {
         console.log('User not authenticated. req.session:', req.session);
        // User not logged in, redirect to sign-in
        res.redirect("/auth/signin");
    }
}

module.exports = ensureAuthenticated;