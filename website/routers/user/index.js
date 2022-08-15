var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
var votes = require('../../../models/votes');
var bots = require('../../../models/bot');
var users = require('../../../models/user');
const user = require('../../../models/user');
router.get('/', function (req, res) {
    res.redirect('/user/me')
})
router.get('/me', async function (req, res) {
    if(!req.user){
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    }
    var bot = await bots.find({ owners: req.user.id });
    var user = await users.find({ id: req.user.id });
    res.render('user/me', {
        user: req.user,
        bots: bot,
        users: user,
        dcuser: global.bsl.users.fetch(req.user.id)

    });
})
router.get('/:id', async function (req, res) {
    var bot = await bots.findOne({ id: req.params.id });
    res.render('user/index', {
        user: req.user,
        bot: bot,
        users: user,
        dcuser: global.bsl.users.fetch(req.user.id)
    });
})

module.exports = router;