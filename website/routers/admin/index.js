var express = require('express');
var config = require('./../../../index').config;
var router = express.Router();
var bots = require('../../../models/bot');
var servers = require('../../../models/server');
var bans = require('../../../models/site-ban');
router.get('/', async function (req, res) {
    if (req.user) {
        if (global.config.users.verificator.includes(req.user.id) || global.config.users.owner.includes(req.user.id)) {
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

router.get('/bot/:d/:f', async function (req, res) {
    if (req.user) {
        if (global.config.users.verificator.includes(req.user.id) || global.config.users.owner.includes(req.user.id)) {
            const bot = await bots.find({ id: req.params.d });
            if (req.params.f == 'reject') {
                res.render('admin/bot', {
                    user: req.user,
                    bots: bot,
                    reject: true
                });
            } else if (req.params.f == 'accept') {
                res.render('admin/bot', {
                    user: req.user,
                    bots: bot,
                    accept: true
                });
            }
        } else {
            res.redirect('/');
        }
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
})

router.get('/bot/:d/:f', async function (req, res) {
    if (req.user) {
        if (global.config.users.verificator.includes(req.user.id) || global.config.users.owner.includes(req.user.id)) {
            var bot = await bots.findOne({ id: req.params.d });
            if (!bot) {
                return res.redirect('/');
            }
            if (req.params.f == 'reject') {
                res.render('admin/bot', {
                    user: req.user,
                    bots: bot,
                    accept: true
                });
            } else if (req.params.f == 'verify') {
                res.render('admin/bot', {
                    user: req.user,
                    bots: bot,
                    verify: true
                });
            } else {
                res.redirect('/admin');
            }
        } else {
            res.redirect('/');
        }
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
})

router.post('/bot/:d/:f', async function (req, res) {
    if (req.user) {
        if (global.config.users.verificator.includes(req.user.id) || global.config.users.owner.includes(req.user.id)) {
            var bot = await bots.findOne({ id: req.params.d });
            if (!bot) {
                res.redirect('/admin');
            }
            if (req.params.f == 'reject') {
                bot.owners.forEach(async function (owner) {
                    global.client.users.fetch(owner).then(async function (user) {
                        try {
                            user.send(`Your bot ${bot.name} has been rejected by the admin. With the reason: ${req.body.reason}`);
                            global.client.channels.cache.get(global.config.bot.channels.new).send(`${bot.name} has been rejected by the admin. With the reason: ${req.body.reason}`);
                        }
                        catch (e) {
                        }
                    })
                })
                var rem = await bots.findOneAndDelete({ id: req.params.d })
                if (rem) {
                    res.redirect('/admin');
                } else {
                    res.redirect('/admin');
                }

            } else if (req.params.f == 'verify') {
                bot.verified = true;
                bot.save();
                bot.owners.forEach(async function (owner) {
                    global.client.users.fetch(owner).then(async function (user) {
                        try {
                            user.send(`Your bot ${bot.name} has been accepted by the admin.`);
                            global.client.channels.cache.get(global.config.bot.channels.new).send(`${bot.name} has been accepted by the admin. View it at: https://botscord.xyz/bot/${bot.id}`);
                        }
                        catch (e) {
                        }
                    })
                })
                res.redirect('/admin');
            }
        } else {
            res.redirect('/');
        }
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
})
module.exports = router;