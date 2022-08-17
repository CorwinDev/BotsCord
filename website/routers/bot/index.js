var express = require('express'),
    router = express.Router();
var bots = require('../../../models/bot');
var votes = require('../../../models/votes');
const client = require('../../index');
var getIP = require('ipware')().get_ip;
var geoip = require('geoip-lite');

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
        res.render('bot/add', { user: req.user });
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
        owners.push(req.user.id);
        var bot = new bots({
            id: req.body.bot_id,
            name: req.body.bot_name,
            verified: false,
            long_description: req.body.bot_description,
            owners: owners,
            description: req.body.bot_short,
            tags: req.body.tags,
            token: makeid(64),
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
        res.render('bot/index', {
            bot: bot,
            user: req.user,
            owners: coowner,
            bota: bota
        });
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
            res.render('bot/edit', {
                bot: bot,
                user: req.user,
            });

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
            res.render('bot/analytics', {
                bot: bot,
                user: req.user,
                bota: await global.bsl.users.fetch(bot.id)
            });

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
            if (!bot.owners.includes(req.user.id)) {


                req.session.error = "You do not have permission to edit this bot";
                return res.redirect('/');
            }
            bot.name = req.body.bot_name;
            bot.description = req.body.bot_short;
            bot.long_description = req.body.bot_description;
            bot.save(function (err) {
                if (err) {
                    console.log(err);
                    req.session.error = "Something went wrong";
                    res.redirect('/');
                } else {
                    req.session.message = "Bot updated";
                    res.redirect('/');
                }
            });
        });
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
                                return res.redirect('/');
                            }
                        })
                        global.client.channels.cache.get(global.config.bot.channels.vote).send(`${req.user.username} has voted for bot: ${bot.name} | <https://botscord.xyz/bot/${bot.id}>`);

                        req.session.message = "Vote added";
                        return res.redirect('/');
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
                            return res.redirect('/');
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
                                    return res.redirect('/');
                                } else {
                                    global.client.channels.cache.get(global.config.bot.channels.vote).send(`${req.user.username} has voted for bot: ${bot.name} | <https://botscord.xyz/bot/${bot.id}>`);
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