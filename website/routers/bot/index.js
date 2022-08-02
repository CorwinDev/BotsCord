var express = require('express'),
    router = express.Router();
var bots = require('../../../models/bot');
const client = require('../../index');
router.get('/', function () {
})
router.get('/add', function (req, res) {
    if (req.user) {
        res.render('bot/add');
        return
    } else {
        res.redirect('/auth');
    }
});

router.post('/add', function (req, res) {
    if (req.user) {
        var bot = new bots({
            id: req.body.id,
            name: req.body.name,
            avatar: req.body.avatar,
            verified: false,
            description: req.body.description,
            owner: req.user.userid,
            long_description: req.body.long_description,
            banner: req.body.banner,
        });
        bot.save(function (err) {
            if (err) {
                console.log(err);
                req.session.error = "Something went wrong";
                res.redirect('/');
            } else {
                req.session.message = "Bot added";
                res.redirect('/');
            }
        });
    }
    else {
        req.session.error = "You aren't logged in";
        res.redirect('/');
    }
});

router.get('/:botID', function (req, res) {
    bots.findOne({ id: req.params.botID }, function (err, bot) {
        if (err) {
            console.log(err);
            return res.redirect('/');
        }
        if (!bot) {
            req.session.error = "No bot found";
            return res.redirect('/');
        }
        res.render('bot/index', { bot: bot });
    })
})
module.exports = router;