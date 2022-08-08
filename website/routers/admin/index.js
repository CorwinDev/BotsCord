var express = require('express');
var config = require('./../../../index').config;
var router = express.Router();
var bots = require('../../../models/bot');
var servers = require('../../../models/server');
var bans = require('../../../models/site-ban');
router.get('/', async function (req, res) {
    if (req.user) {
        if (config.users.verificator.includes(req.user.userid) ||  config.users.owner.includes(req.user.userid)) {
            const bot = await bots.find({});
            const server = await servers.find({});
            const ban = await bans.find({});
            res.render('admin/index', {
                user: req.user,
                bots: bot,
                servers: server,
                bans: ban
            });
        } else {
            res.redirect('/');
        }
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
})

module.exports = router;