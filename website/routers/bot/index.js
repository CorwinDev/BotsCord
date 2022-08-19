var express = require('express'),
    router = express.Router();
var bots = require('../../../models/bot');
var votes = require('../../../models/votes');
const client = require('../../index');
var getIP = require('ipware')().get_ip;
var geoip = require('geoip-lite');
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
    return res.redirect('/bots');
})
router.get('/add', function (req, res) {
    if (req.user) {
        res.render('bot/add', {
            user: req.user,
            message: req.session.message || undefined,
            error: req.session.error || undefined,
        });
        return
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
});

router.post('/add', async function (req, res) {
    if (req.user) {
        var checkbot = await bots.findOne({ id: req.body.id });
        if (checkbot) {
            req.session.error = "Bot already exists";
            res.redirect('/bot/add');
            return
        }
        var owners = new Array();
        req.body.bot_owners.split(',').forEach(function (owner) {
            owners.push(owner.trim());
        })
        var bot = new bots({
            id: req.body.bot_id,
            name: req.body.bot_name,
            verified: false,
            long_description: req.body.bot_description,
            owner: req.user.id,
            coowners: owners,
            description: req.body.bot_short,
            tags: req.body.tags,
            token: makeid(64),
            invite: req.body.bot_invite,
            prefix: req.body.bot_prefix
        });

        bot.save(function (err) {
            if (err) {
                console.log(err);
                req.session.error = "Something went wrong";
                res.redirect('/bot/add');
            } else {
                req.session.message = "Bot added";
                res.redirect('/bot/' + bot.id);
            }
        });
        client.client.client.channels.cache.get(client.client.config.bot.channels.admin).send(`<@${req.user.id}> has added a new bot: ${bot.name}, invite: https://discordapp.com/oauth2/authorize?client_id=${bot.id}&scope=bot&permissions=0 `);
    } else {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    }
});

router.get('/:botID', async function (req, res) {
    bots.findOne({ id: req.params.botID }, async function (err, bot) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!bot) {
            req.session.error = "No bot found";
            return res.redirect('/');
        }
        if (bot.verified == false) {
            if (!req.user) {
                req.backURL = req.originalUrl;
                return res.redirect('/auth');
            }
            if (bot.owners.includes(req.user.id) || global.config.users.verificator.includes(req.user.id) || global.config.users.owner.includes(req.user.id)) {
                let coowner = new Array()
                await bot.owners.forEach(async function (a) {
                    try {
                        var b = await global.bsl.users.fetch(a)
                    } catch (e) {
                    }
                    if (!b) return;
                    coowner.push(b)
                })
                var html = converter.makeHtml(bot.long_description);
                html = sanitizeHtml(html,
                    { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']) })
                res.render('bot/index', {
                    bot: bot,
                    user: req.user,
                    owners: coowner,
                    bota: await global.bsl.users.fetch(bot.id),
                    description: html,
                    message: req.session.message || undefined,
                    error: req.session.error || undefined,
                });
            } else {
                req.session.error = "Bot not verified";
                return res.redirect('/');
            }
        } else {
            let referresURL = String(req.headers.referer).replace("undefined", "Unkown").split('.').join(',');
            await bots.updateOne({
                id: req.params.botID
            }, {
                $inc: {
                    analytics_visitors: 1
                }
            })

            var ipInfo = getIP(req);
            var ip = ipInfo.clientIp;
            var geo = geoip.lookup(ip);

            if (geo) {
                let CountryCode = geo.country || "TR"
                await bots.updateOne({
                    id: req.params.botID
                }, {
                    $inc: {
                        [`country.${CountryCode}`]: 1
                    }
                })
            }
            await bots.updateOne({
                id: req.params.botID
            }, {
                $inc: {
                    [`analytics.${referresURL}`]: 1
                }
            })
            let coowner = new Array()
            await bot.owners.forEach(async function (a) {
                try {
                    var b = await global.bsl.users.fetch(a)
                } catch (e) {
                }
                if (!b) return;
                coowner.push(b)
            })
            try {
                var bota = await global.bsl.users.fetch(bot.id)
            } catch (e) {
                if (!bota) {
                    req.session.error = "No bot found";
                    return res.redirect('/');
                }
            }
            if (!bota) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            var html = converter.makeHtml(bot.long_description);
            html = sanitizeHtml(html)
            res.render('bot/index', {
                bot: bot,
                user: req.user,
                owners: coowner,
                bota: await global.bsl.users.fetch(bot.id),
                description: html,
                message: req.session.message || undefined,
                error: req.session.error || undefined,
            });
        }
    })
})

router.get('/:botID/settings', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    } else {
        bots.findOne({ id: req.params.botID }, async function (err, bot) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!bot) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            if (bot.owners.includes(req.user.id) || bot.owner == req.user.id) {
                res.render('bot/edit', {
                    bot: bot,
                    user: req.user,
                    message: req.session.message || undefined,
                    error: req.session.error || undefined,
                });
            } else {
                req.session.error = "You are not the owner of this bot";
                res.redirect('/');
            }
        });
    }
});

router.get('/:botID/analytics', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    } else {
        bots.findOne({ id: req.params.botID }, async function (err, bot) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!bot) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            if (bot.owners.includes(req.user.id) || bot.owner == req.user.id) {
                res.render('bot/analytics', {
                    bot: bot,
                    user: req.user,
                    bota: await global.bsl.users.fetch(bot.id),
                    message: req.session.message || undefined,
                    error: req.session.error || undefined,
                });
            } else {
                req.session.error = "You are not the owner of this bot";
                res.redirect('/');
            }
        });
    }
});

router.post('/:botID/settings', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        return res.redirect('/auth');
    } else {
        bots.findOne({ id: req.params.botID }, async function (err, bot) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!bot) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            if (bot.owners.includes(req.user.id) || bot.owner == req.user.id) {
                req.session.error = "You do not have permission to edit this bot";
                return res.redirect('/');
            }
            bots.findOne({ vanity: req.body.bot_vanity }, async function (err, bot2) {
                if (err) {
                    console.log(err);
                    return res.redirect('/');
                }
                if (bot2) {
                    if (bot2.id != bot.id) {
                        req.session.error = "This vanity is already in use";
                        return res.redirect('/');
                    } else {
                        var owners = new Array();
                        req.body.bot_owners.split(',').forEach(function (owner) {
                            owners.push(owner.trim());
                        })
                        bot.name = req.body.bot_name;
                        bot.description = req.body.bot_short;
                        bot.long_description = req.body.bot_description;
                        bot.vanity = req.body.bot_vanity.toLowerCase();
                        bot.owners = owners;
                        bot.prefix = req.body.bot_prefix;

                        bot.save(function (err) {
                            if (err) {
                                console.log(err);
                                req.session.error = "Something went wrong";
                                res.redirect('/');
                            } else {
                                req.session.message = "Bot updated";
                                res.redirect('/bot/' + req.params.botID + '/settings');
                            }
                        });
                    }
                } else {
                    servers.findOne({ vanity: req.body.bot_vanity }, async function (err, server) {
                        if (err) {
                            console.log(err);
                            return res.redirect('/');
                        }
                        if (server) {
                            req.session.error = "This vanity is already in use";
                            return res.redirect('/');
                        } else {
                            var owners = new Array();
                            req.body.bot_owners.split(',').forEach(function (owner) {
                                owners.push(owner.trim());
                            })
                            bot.name = req.body.bot_name;
                            bot.description = req.body.bot_short;
                            bot.long_description = req.body.bot_description;
                            bot.vanity = req.body.bot_vanity.toLowerCase();
                            bot.owners = owners;
                            bot.prefix = req.body.bot_prefix;
                            bot.save(function (err) {
                                if (err) {
                                    console.log(err);
                                    req.session.error = "Something went wrong";
                                    res.redirect('/');
                                } else {
                                    req.session.message = "Bot updated";
                                    res.redirect('/bot/' + req.params.botID + '/settings');
                                }
                            });
                        }
                    });
                }
            });
        })
    }
});
router.get('/:botID/vote', async function (req, res) {
    if (!req.user) {
        req.session.backURL = req.originalUrl;
        res.redirect('/auth');
    } else {
        bots.findOne({ id: req.params.botID }, async function (err, bot) {
            if (err) {
                console.log(err);
                return res.redirect('/');
            }
            if (!bot) {
                req.session.error = "No bot found";
                return res.redirect('/');
            }
            // check if users has already voted for this bot
            votes.findOne({ user: req.user.id, bot: bot.id }, function (err, vote) {
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
                            bot.votes = 1;
                        } else {
                            bot.votes++;
                        }
                        bot.save(function (err) {
                            if (err) {
                                console.log(err);
                                req.session.error = "Something went wrong";
                                return res.redirect('/bot/' + req.params.botID);
                            }
                        })
                        global.client.channels.cache.get(global.config.bot.channels.vote).send(`${req.user.username} has voted for bot: ${bot.name} | <https://botscord.xyz/bot/${bot.id}>`);

                        req.session.message = "Vote added";
                        return res.redirect('/bot/' + req.params.botID);
                    })
                } else {
                    // add vote to database
                    var vote = new votes({
                        user: req.user.id,
                        date: new Date(),
                        bot: bot.id,
                    });
                    vote.save(function (err) {
                        if (err) {
                            console.log(err);
                            req.session.error = "Something went wrong";
                            return res.redirect('/bot/' + req.params.botID);
                        } else {
                            if (bot.votes) {
                                bot.votes = 1;
                            } else {
                                bot.votes++;
                            }
                            bot.save(function (err) {
                                if (err) {
                                    console.log(err);
                                    req.session.error = "Something went wrong";
                                    return res.redirect('/bot/' + req.params.botID);
                                } else {
                                    global.client.channels.cache.get(global.config.bot.channels.vote).send(`${req.user.username} has voted for bot: ${bot.name} | <https://botscord.xyz/bot/${bot.id}>`);
                                    req.session.message = "Vote added";
                                    return res.redirect('/bot/' + req.params.botID);
                                }
                            })
                        }
                    });
                }
            })
        })
    }
})

router.get('/:botID/invite', async function (req, res) {
    bots.findOne({ id: req.params.botID }, async function (err, bot) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!bot) {
            req.session.error = "No bot found";
            return res.redirect('/');
        }
        if (bot.invite) {
            return res.render('bot/join', {
                bot: bot,
                invite: bot.invite,
            })
        } else {
            var invite = "https://discord.com/oauth2/authorize?client_id=" + bot.id + "&scope=bot&permissions=8";
            return res.render('bot/join', {
                bot: bot,
                invite: invite,
            })
        }
    })
})


module.exports = router;