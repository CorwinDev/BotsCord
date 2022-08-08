var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
const client = require('../../../index');
const Discord = require('discord.js');
var showdown = require('showdown'),
    converter = new showdown.Converter();
router.get('/', function () {
})

router.get('/add', function (req, res) {
    if (req.user) {
        res.render('server/add', {
            user: req.user,
            serverscord: client
        });
        return
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
});

router.post('/add', async function (req, res) {
    if (req.user) {
        var checkServer = await client.bsl.guilds.cache.get(req.body.serverid);
        if (!checkServer) {
            return res.redirect(client.config.server.bsl.invite + "&guild_id=" + req.body.serverid);
        } else {
            let checkGuild = await servers.findOne({ id: checkServer.id });
            if (checkGuild) {
                req.session.error = "Server already exists";
                return res.redirect('/');
            }

            var server = new servers({
                id: req.body.serverid,
                name: checkServer.name,
                owner: req.user.userid,
                long_description: req.body.server_description,
                description: req.body.server_short,
                icon: checkServer.iconURL({ format: 'png', dynamic: true }),
                memberCount: checkServer.memberCount,
                tags: req.body.tags
            })
            var tagss = Array.from(new Set(req.body.tags));
            var tags;
            for (let i = 0; i < tagss.length; i++) {
                if (i === 3) break;
                if (tagss[i] === null) {
                    return
                } else {
                    if (tags === undefined) {
                        tags = tagss[i]
                    } else {
                        tags = tags + ", " + tagss[i];
                    }
                }

            }
            console.log(tags)
            const embed = new client.embed()
                .setTitle('New server')
                .setDescription(`${req.user.username}#${req.user.discriminator} added **${checkServer.name}** with members: **${checkServer.memberCount}**\nDescription: **${req.body.server_short}**\nWith tags: **${tags}**`)
                .setColor('#00ff00')
                .setTimestamp()
                .setThumbnail(checkServer.iconURL({ format: 'png', dynamic: true }))
                .setFooter({ text: 'New Server', iconURL: "https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png" });
            client.client.channels.cache.get(client.client.config.server.channels.info).send({ embeds: [embed] });
            server.save(function (err) {
                if (err) {
                    console.log(err);
                    req.session.error = "Something went wrong";
                    res.redirect('/');
                } else {
                    req.session.message = "Server added";
                    res.redirect('/');
                }
            });
        }
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
});

router.get('/:server', function (req, res) {
    servers.findOne({ id: req.params.server }, function (err, server) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!server) {
            req.session.error = "No server found";
            return res.redirect('/');
        }
        res.render('server/index', {
            user: req.user,
            server: server,
            serverr: global.client.guilds.cache.get(server.id)
        });
    })
})

router.get('/:server/edit', function (req, res) {
    if(!req.user){
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
    servers.findOne({ id: req.params.server }, function (err, server) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!server) {
            req.session.error = "No server found";
            return res.redirect('/');
        }
        var serverr = global.client.guilds.cache.get(server.id)
        if (serverr.members.cache.get(req.user.id)) {
            if (serverr.members.cache.get(req.user.id).permissions.has('ADMINISTRATOR')) {
                res.render('server/edit', {
                    user: req.user,
                    server: server,
                    serverr: serverr
                });
            } else {
                req.session.error = "You don't have permission to edit this server";
                return res.redirect('/');
            }
        } else {
            req.session.error = "You don't have permission to edit this server";
            return res.redirect('/');
        }
        })
})

router.post('/:server/edit', async function (req, res) {
    if(!req.user){
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
    servers.findOne({ id: req.params.server }, function (err, server) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!server) {
            req.session.error = "No server found";
            return res.redirect('/');
        }
        var serverr = global.client.guilds.cache.get(server.id)
        if (serverr.members.cache.get(req.user.id)) {
            if (serverr.members.cache.get(req.user.id).permissions.has('ADMINISTRATOR')) {
                server.description = req.body.server_short;
                server.long_description = req.body.server_description;
                server.tags = req.body.tags;
                server.save(function (err) {
                    if (err) {
                        console.log(err);
                        req.session.error = "Something went wrong";
                        res.redirect('/');
                    } else {
                        req.session.message = "Server edited";
                        res.redirect('/');
                    }
                });
            } else {
                req.session.error = "You don't have permission to edit this server";
                return res.redirect('/');
            }
        } else {
            req.session.error = "You don't have permission to edit this server";
            return res.redirect('/');
        }
        })
})
module.exports = router;