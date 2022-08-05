var express = require('express');
var index = require('./../../../index');
var router = express.Router();

router.get('/', function (req, res) {
    if (req.user) {
        if (index.config.users.verificator.includes(req.user.userid) ||  index.config.users.owner.includes(req.user.userid)) {
            res.render('admin/index', {
                title: 'Admin',
                user: req.user
            });
        } else {
            res.redirect('/');
        }
    } else {
        res.redirect('/auth?r=' + req.originalUrl);
    }
})

module.exports = router;