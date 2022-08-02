var express = require('express'),
    router = express.Router(),
    passport = require('passport');


router.get('/', passport.authenticate('discord'));
router.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), function (req, res) {
    res.redirect('/');
});
router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.message = 'You have been logged out';
        res.redirect('/');
    });
});
module.exports = router;