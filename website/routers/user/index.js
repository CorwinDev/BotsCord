var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
var votes = require('../../../models/votes');
var bots = require('../../../models/bot');
var users = require('../../../models/user');
router.get('/', function (req, res) {
    res.redirect('/user/me')
})
router.get('/me', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    }
    var bot = await bots.find().or([{ owners: req.user.id }, { owner: req.user.id }]);
    var user = await users.findOne({ id: req.user.id });
    res.render('user/index', {
        user: req.user,
        bots: bot,
        users: user,
        dcuser: await global.bsl.users.fetch(req.user.id)

    });
})

router.get('/me/edit', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    }
    var user = await users.findOne({ id: req.user.id });
    res.render('user/edit', {
        user: req.user,
        users: user,
        dcuser: await global.bsl.users.fetch(req.user.id)
    });
})
router.post('/me/edit', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    }
    var user = await users.findOne({ id: req.user.id });
    user.github = req.body.github;
    user.facebook = req.body.facebook;
    user.instagram = req.body.instagram;
    user.website = req.body.website;
    user.biography = req.body.biography;

    user.save();
    res.redirect('/user/me');
})
router.get('/:id', async function (req, res) {
    var bot = await bots.find().or([{ owners: req.params.id }, { owner: req.params.id }]);
    var user = await users.findOne({ id: req.params.id });
    if (!user) {
        req.session.error = 'No user found';
        return res.redirect('/');
    }
    res.render('user/index', {
        user: req.user,
        bots: bot,
        users: user,
        dcuser: await global.bsl.users.fetch(req.params.id)
    });
})

module.exports = router;