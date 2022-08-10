var express = require('express'),
    router = express.Router();
var bots = require('../../../models/bot');
var votes = require('../../../models/votes');
const client = require('../../index');
var v1 = require('./v1');
router.use('/v1', v1);
router.get('/', function (req, res) {
    res.redirect('/v1');
});


module.exports = router;