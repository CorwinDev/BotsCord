var express = require('express'),
    router = express.Router(),
    passport = require('passport');
const client = require('../../../index');
router.get('/', passport.authenticate('discord'));
router.get('/callback', passport.authenticate('discord', {
    failureRedirect: '/'
}), function (req, res) {
    const embed = new client.embed()
        .setTitle('User logged in')
        .setDescription(`${req.user.username}#${req.user.discriminator} logged in\nID: ${req.user.id}\nEmail: ${req.user.email}`)
        .setColor('#0099ff')
        .setTimestamp()
        .setThumbnail("https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png")
        .setFooter({ text: 'Logged in', iconURL: "https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png" });
    client.client.channels.cache.get(client.client.config.bot.channels.login).send({ embeds: [embed] });
    res.redirect('/');
});
router.get('/logout', function (req, res) {
    req.logout(function (err) {
        if (err) { return next(err); }
        req.session.message = 'You have been logged out';
        req.session.destroy();
        res.redirect('/');
    });
});
module.exports = router;