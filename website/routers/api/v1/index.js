var express = require('express'),
    router = express.Router();
var bots = require('../../../../models/bot');
var votes = require('../../../../models/votes');
var servers = require('../../../../models/server');
const client = require('../../../index');
router.get('/', function (req, res) {
    res.json({
        message: "Welcome to the bots API, please use /v1"
    })
});
router.get('/search/:id', function (req, res) {
    bots.findOne({ id: req.params.id }, function (err, bot) {
        if (err) throw err;
        if (!bot) {
            servers.find()
            return res.json({
                message: "Bot not found"
            });
        }
        res.json({
            bot: bot,
        })
    })
})
router.use(function (req, res, next) {
    if (!req.headers.authorization) {
        return res.status(403).json({ error: 'No credentials sent!' });
    } else {
        bots.findOne({ token: req.headers.authorization }, function (err, bot) {
            if (err) {
                res.status(503).json({
                    error: "Something went wrong"
                })
            }
            if (bot) {
                if (bot.token == req.headers.authorization) {
                    next();
                }
            } else {
                res.status(403).json({
                    error: "Unauthorized"
                })
            }
        })
    }
    next();
});
router.post('/bots/servers', function (req, res) {
    if (req.headers.authorization) {
        bots.findOne({ token: req.headers.authorization }, function (err, bot) {
            if (err) {
                res.status(503).json({
                    error: "Something went wrong"
                })
            }
            if (bot) {
                if (bot.token == req.headers.authorization) {
                    bot.servers = req.headers.servercount;
                    bot.save(function (err) {
                        if (err) {
                            res.status(503).json({
                                error: "Something went wrong"
                            })
                        } else {
                            res.status(200).json({
                                message: "Success"
                            })
                        }
                    })
                } else {
                    res.status(403).json({
                        error: "Invalid token or bot"
                    })
                }
            } else {
                res.status(403).json({
                    error: "Invalid token or bot"
                })
            }
        })
    } else {
        res.status(401).json({
            message: "Please provide a bot token"
        })
    }
});

router.get('/bots/search/:id', function (req, res) {
    bots.findOne({ id: req.params.id }, function (err, bot) {
        if (err) {
            res.status(503).json({
                error: "Something went wrong"
            })
        }
        if (bot) {
            res.status(200).json({
                id: bot.id,
                name: bot.name,
                description: bot.description,
                long_description: bot.long_description,
                tags: bot.tags,
                owners: bot.owners,
                premium: bot.premium,
                servers: bot.servers,
                users: bot.users,
                votes: bot.votes
            })
        } else {
            res.status(403).json({
                error: "No bot found"
            })
        }
    });
});
router.get('/bots/check/:id', function (req, res) {
    votes.findOne({ user: req.params.id }, function (err, vote) {
        if (err) {
            res.status(503).json({
                error: "Something went wrong"
            })
        }
        if (vote) {
            res.status(200).json({
                vote: true
            })
        } else {
            res.status(403).json({
                vote: false
            })
        }
    });
})

module.exports = router;