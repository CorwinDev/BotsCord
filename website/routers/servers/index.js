var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
var votes = require('../../../models/votes');
var bots = require('../../../models/bot');
const client = require('../../../index');
const Discord = require('discord.js');
var showdown = require('showdown'),
    converter = new showdown.Converter()
const sanitizeHtml = require('sanitize-html');
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
        var checkServer = await global.bsl.guilds.cache.get(req.body.serverid);
        if (!checkServer) {
            return res.redirect("https://discord.com/oauth2/authorize?client_id=870001234583621713&permissions=314433&redirect_uri=http%3A%2F%2Fbotscord.xyz%2Fauth%2Fcallback&response_type=code&scope=applications.commands%20bot&guild_id=" + req.body.serverid);
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
            var invite = null;
            if (req.body.create) {
                var channel = await checkServer.channels.cache.filter(channel => channel.type === Discord.ChannelType.GuildText)
                    .first();
                if (!channel) {
                    req.session.error = "Could not create invite";
                    return res.redirect('/');
                } else {
                    var invite = await channel.createInvite({
                        maxAge: 0,
                        maxUses: 0,
                    }).catch(err => {
                        console.log(err);
                        req.session.error = "Could not create invite";
                        return res.redirect('/');
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
                invite: req.body.server_invite || invite.url,
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
            const embed = new Discord.EmbedBuilder()
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

router.get('/:server', async function (req, res) {
    servers.findOne({ id: req.params.server }, async function (err, server) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!server) {
            req.session.error = "No server found";
            return res.redirect('/');
        }

        let referresURL = String(req.headers.referer).replace("undefined", "Unkown").split('.').join(',');
        await servers.updateOne({
            id: req.params.server
        }, {
            $inc: {
                analytics_visitors: 1
            }
        })
        var getIP = require('ipware')().get_ip;
        var ipInfo = getIP(req);
        var geoip = require('geoip-lite');
        var ip = ipInfo.clientIp;
        var geo = geoip.lookup(ip);

        if (geo) {
            let CountryCode = geo.country || "TR"
            await servers.updateOne({
                id: req.params.server
            }, {
                $inc: {
                    [`country.${CountryCode}`]: 1
                }
            })
        }
        await servers.updateOne({
            id: req.params.server
        }, {
            $inc: {
                [`analytics.${referresURL}`]: 1
            }
        })
        var html = converter.makeHtml(server.long_description);
        html = sanitizeHtml(html,
            { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) })
        res.render('server/index', {
            user: req.user,
            server: server,
            serverr: global.bsl.guilds.cache.get(server.id),
            description: html,
        });
    })
})

router.get('/:server/settings', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
        return;
    }
    servers.findOne({ id: req.params.server }, async function (err, server) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!server) {
            req.session.error = "No server found";
            return res.redirect('/');
        }
        var serverr = await global.bsl.guilds.cache.get(server.id)
        if (serverr.members.cache.get(req.user.id)) {
            if (serverr.members.cache.get(req.user.id).permissions.has('ADMINISTRATOR')) {
                res.render('server/edit', {
                    user: req.user,
                    server: server,
                    serverr: serverr,
                    message: req.session.message || undefined,
                    error: req.session.error || undefined,
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
    servers.findOne({ id: req.params.server }, async function (err, server) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!server) {
            req.session.error = "No server found";
            return res.redirect('/');
        }
        var serverr = await global.bsl.guilds.cache.get(server.id)
        if (serverr.members.cache.get(req.user.id)) {
            if (serverr.members.cache.get(req.user.id).permissions.has('ADMINISTRATOR')) {
                servers.findOne({ vanity: req.body.server_vanity }, async function (err, server2) {
                    if (err) {
                        console.log(err);
                        return res.redirect('/server/' + req.params.server + '/settings');
                    }
                    if (server2) {
                        if (server2.id != req.params.server) {
                            req.session.error = "Vanity already exists";
                            return res.redirect('/server/' + req.params.server + '/settings');
                        } else {
                            server.description = req.body.server_short;
                            server.long_description = req.body.server_description;
                            server.tags = req.body.tags;
                            server.webhook = req.body.server_webhook;
                            server.vanity = req.body.server_vanity.toLowerCase();
                            server.save(function (err) {
                                if (err) {
                                    console.log(err);
                                    req.session.error = "Something went wrong";
                                    res.redirect('/server/' + req.params.server + '/settings');
                                } else {
                                    req.session.message = "Server edited";
                                    res.redirect('/server/' + req.params.server + '/settings');
                                }
                            });
                        }
                    } else {
                        bots.findOne({ vanity: req.body.server_vanity }, async function (err, bot) {
                            if (err) {
                                console.log(err);
                                return res.redirect('/server/' + req.params.server + '/settings');
                            }
                            if (bot) {
                                req.session.error = "Vanity already exists";
                                return res.redirect('/server/' + req.params.server + '/settings');
                            } else {
                                server.description = req.body.server_short;
                                server.long_description = req.body.server_description;
                                server.tags = req.body.tags;
                                server.webhook = req.body.server_webhook;
                                server.vanity = req.body.server_vanity.toLowerCase();
                                server.save(function (err) {
                                    if (err) {
                                        console.log(err);
                                        req.session.error = "Something went wrong";
                                        res.redirect('/server/' + req.params.server + '/settings');
                                    } else {
                                        req.session.message = "Server edited";
                                        res.redirect('/server/' + req.params.server + '/settings');
                                    }
                                });
                            }
                        })
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
                        global.client.channels.cache.get(global.config.bot.channels.vote).send(`${req.user.username} has voted for server ${bot.name} | <https://botscord.xyz/server/${bot.id}>`);
                        req.session.message = "Vote added";
                        return res.redirect('/bot/' + bot.id);
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
                                    global.client.channels.cache.get(global.config.bot.channels.vote).send(`${req.user.username} has voted for server ${bot.name} | <https://botscord.xyz/server/${bot.id}>`);
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

router.get('/:server/join', async function (req, res) {
    servers.findOne({ id: req.params.server }, async function (err, server) {
        await servers.updateOne({
            id: req.params.guildID
        }, {
            $inc: {
                analytics_joins: 1
            }
        }
        )
        let urlInvite = server.invite;
        res.render('server/join', {
            url: urlInvite,
            server: server,
            serverr: await global.bsl.guilds.cache.get(server.id)
        });
    });
})

router.get('/:botID/analytics', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    } else {
        servers.findOne({ id: req.params.botID }, async function (err, bot) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!bot) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            var serverr = await global.bsl.guilds.cache.get(bot.id)
            if (serverr.members.cache.get(req.user.id)) {
                if (serverr.members.cache.get(req.user.id).permissions.has('ADMINISTRATOR')) {
                    res.render('server/analytics', {
                        bot: bot,
                        user: req.user
                    });

                } else {
                    req.session.error = "You don't have permission to do this";
                    return res.redirect('/');

                }
            } else {
                req.session.error = "You don't have permission to do this";
                return res.redirect('/');
            }
        })
    }
});
module.exports = router;