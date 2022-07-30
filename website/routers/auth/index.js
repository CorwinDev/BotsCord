var express = require('express'),
     router = express.Router();
   passport = require('passport');


router.get('/', passport.authenticate('discord'));
router.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), function (req, res) {
    res.redirect('/secretstuff') // Successful auth
});
module.exports = router;