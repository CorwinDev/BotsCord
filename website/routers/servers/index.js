var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
var votes = require('../../../models/votes');
const client = require('../../../index');
const Discord = require('discord.js');
var showdown = require('showdown'),
    converter = new showdown.Converter();
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    return result;
}
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
            if (!checkServer.members.cache.get(req.user.id).permissions.has("ADMINISTRATOR")) {
                req.session.error = "You do not have admin permissions";
                return res.redirect('/');
            }
            if (req.body.create) {
                var channel = await checkServer.channels.cache.filter(channel => channel.type === Discord.ChannelType.GuildText)
                    .first();
                if (!channel) {
                    req.session.error = "Could not create invite";
                    return res.redirect('/');
                } else {
                    channel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                    }).catch(err => {
                        console.log(err);
                        req.session.error = "Could not create invite";
                        return res.redirect('/');
                    }).then(invite => {
                        req.body.server_invite = invite.url
                    })
                }
            }
            var server = new servers({
                id: req.body.serverid,
                name: checkServer.name,
                owner: req.user.userid,
                long_description: req.body.server_description,
                description: req.body.server_short,
                icon: checkServer.iconURL({ format: 'png', dynamic: true }),
                memberCount: checkServer.memberCount,
                tags: req.body.tags,
                invite: req.body.server_invite,
                token: makeid(64),
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
            const embed = new client.embed()
                .setTitle('New server')
                .setDescription(`${req.user.username}#${req.user.discriminator} added **${checkServer.name}** with members: **${checkServer.memberCount}**\nDescription: **${req.body.server_short}**\nWith tags: **${tags}**`)
                .setColor('#00ff00')
                .setTimestamp()
                .setThumbnail(checkServer.iconURL({ format: 'png', dynamic: true }))
                .setFooter({ text: 'New Server', iconURL: "https://cdn.discordapp.com/avatars/" + req.user.id + "/" + req.user.avatar + ".png" });
            client.client.channels.cache.get(client.client.config.bot.channels.info).send({ embeds: [embed] });
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

router.get('/:server/settings', function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
        return;
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

router.post('/:server/settings', async function (req, res) {
    if (!req.user) {
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
                server.webhook = req.body.server_webhook;
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

router.get('/:server/vote', function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    } else {
        servers.findOne({ id: req.params.server }, async function (err, bot) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!bot) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            // check if users has already voted for this bot
            votes.findOne({ user: req.user.id, server: bot.id }, function (err, vote) {
                if (err) {
                    console.log(err);
                    return res.redirect('/');
                }
                if (vote) {
                    if (vote.date > Date.now() - (1000 * 60 * 60 * 24)) {
                        req.session.error = "You can only vote once per day";
                        return res.redirect('/');
                    }
                    vote.date = Date.now();
                    vote.save(function (err) {
                        if (err) {
                            console.log(err);
                            return res.redirect('/');
                        }
                        if (bot.votes) {
                            bot.votes++;
                        } else {
                            bot.votes = 1;
                        }
                        bot.save(function (err) {
                            if (err) {
                                console.log(err);
                                req.session.error = "Something went wrong";
                                return res.redirect('/');
                            }
                        })
                        if (bot.webhook) {
                            try {
                                var webhook = new Discord.WebhookClient({ url: bot.webhook });
                                webhook.send({
                                    content: `${req.user.username} has voted for ${bot.name}`,
                                    username: "BotsCord",
                                    avatarURL: "https://botscord.xyz/img/logo.png"
                                });
                            } catch (e) {
                                console.log(e);
                            }
                        }
                        const embed = new Discord.EmbedBuilder()
                            .setColor('#0099ff')
                            .setTitle(`${req.user.username} has voted for ${bot.name}`)
                            .setDescription(`[${bot.name}](${bot.url})`)
                            .setThumbnail(global.bsl.guilds.cache.get(bot.id).iconURL({ format: 'png' }))
                            .setFooter({ text: "BotsCord", iconURL: "https://botscord.xyz/img/logo.png" })
                            .setTimestamp();
                        global.client.channels.cache.get(global.config.bot.channels.vote).send({ embeds: [embed] });
                        req.session.message = "Vote added";
                        return res.redirect('/');
                    })
                } else {
                    // add vote to database
                    var vote = new votes({
                        user: req.user.id,
                        date: new Date(),
                        server: bot.id,
                    });
                    vote.save(function (err) {
                        if (err) {
                            console.log(err);
                            req.session.error = "Something went wrong";
                            return res.redirect('/');
                        } else {
                            if (bot.votes) {
                                bot.votes++;
                            } else {
                                bot.votes = 1;
                            }
                            bot.save(function (err) {
                                if (err) {
                                    console.log(err);
                                    req.session.error = "Something went wrong";
                                    return res.redirect('/');
                                } else {
                                    if (bot.webhook) {
                                        try {
                                            var webhook = new Discord.WebhookClient({ url: bot.webhook });
                                            webhook.send({
                                                content: `${req.user.username} has voted for ${bot.name}`,
                                                username: "BotsCord",
                                                avatarURL: "https://botscord.xyz/img/logo.png"
                                            });
                                        } catch (e) {
                                            console.log(e);
                                        }
                                    }
                                    const embed = new Discord.EmbedBuilder()
                                        .setColor('#0099ff')
                                        .setTitle(`${req.user.username} has voted for ${bot.name}`)
                                        .setDescription(`[${bot.name}](${bot.url})`)
                                        .setThumbnail(global.bsl.guilds.cache.get(bot.id).iconURL({ format: 'png' }))
                                        .setFooter({ text: "BotsCord", iconURL: "https://botscord.xyz/img/logo.png" })
                                        .setTimestamp();
                                    global.client.channels.cache.get(global.config.bot.channels.vote).send({ embeds: [embed] });
                                    req.session.message = "Vote added";
                                    return res.redirect('/');
                                }
                            })
                        }
                    });
                }
            })
        })
    }
})

module.exports = router;