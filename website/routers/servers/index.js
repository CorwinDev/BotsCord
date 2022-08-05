var express = require('express'),
    router = express.Router();
var servers = require('../../../models/server');
const client = require('../../index');
router.get('/', function () {
})
router.get('/add', function (req, res) {
    console.log(req.headers.referer)
    if (req.user) {
        res.render('server/add', {
            user: req.user,
            botscord: client,
        });
        return
    } else {
        req.session.backURL = req.url;
        res.redirect('/auth');
    }
});

router.post('/add', function (req, res) {
    if (req.user) {
        var bot = new servers({
            id: req.body.bot_id,
            name: req.body.bot_name,
            verified: false,
            long_description: req.body.bot_description,
            owner: req.user.userid,
            style: req.body.style,
            description: req.body.bot_short,
            tags: req.body.tags,
        });

        bot.save(function (err) {
            if (err) {
                console.log(err);
                req.session.error = "Something went wrong";
                res.redirect('/');
            } else {
                req.session.message = "Server added";
                res.redirect('/');
            }
        });
    } else {
        req.session.backURL = req.url;
        res.redirect('/auth');
    }
});

router.get('/:botID', function (req, res) {
    servers.findOne({ id: req.params.botID }, function (err, bot) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!bot) {
            req.session.error = "No bot found";
            return res.redirect('/');
        }
        res.render('server/index', {
            user: req.user,
        });
    })
})
module.exports = router;