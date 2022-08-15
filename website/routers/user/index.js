var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
var votes = require('../../../models/votes');
var bots = require('../../../models/bot');

router.get('/', function (req,res) {
    res.redirect('/user/me')
})
router.get('/me', async function (req, res) {
    if (req.user) {
        var bot = await bots.find({ owners: req.user.id });
        res.render('user/me', {
            user: req.user,
            bots: bot
        });
        return
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
})
module.exports = router;