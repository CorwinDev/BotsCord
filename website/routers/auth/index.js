var express = require('express'),
    router = express.Router(),
    passport = require('passport');
const request = require('request');
var url = require('url');
var users = require('../../../models/user.js');
const client = require('../../../index');
router.get("/", (req, res, next) => {
    if (req.session.backURL) {
        req.session.backURL = req.session.backURL;
    } else if (req.headers.referer) {
        const parsed = url.parse(req.headers.referer);
        if (parsed.hostname === global.config.server.host) {
            req.session.backURL = parsed.path;
        }
    } else {
        req.session.backURL = "/";
    }
    next();
}, passport.authenticate('discord'))
router.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/',
    keepSessionInfo: true
}), function (req, res) {
    try {
        request({
            url: `https://discord.com/api/v10/guilds/${global.config.discord.id}/members/${req.user.id}`,
            method: "PUT",
            json: {
                access_token: req.user.accessToken
            },
            headers: {
                "Authorization": `Bot ${global.bsl.token}`,
                'Content-Type': 'application/json',
            }
        })
    } catch(e) {
    };
    const embed = new client.embed()
        .setTitle('User logged in')
        .setDescription(`${req.user.username}#${req.user.discriminator} logged in\nID: ${req.user.id}`)
        .setColor('#0099ff')
        .setTimestamp()
        .setThumbnail("https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png")
        .setFooter({ text: 'Logged in', iconURL: "https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png" });
    client.client.channels.cache.get(client.client.config.bot.channels.login).send({ embeds: [embed] });
    res.redirect(req.session.backURL || '/')
    users.findOne({ id: req.user.id }, (err, user) => {
        if (err) return console.log(err);
        if (!user) {
            var newUser = new users({
                id: req.user.id,
                username: req.user.username,
                discriminator: req.user.discriminator,
                avatar: req.user.avatar,
                coins: 0
            });
            newUser.save();
        }
    });
});
router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.destroy();
        res.redirect('/');
    });
});
module.exports = router;
