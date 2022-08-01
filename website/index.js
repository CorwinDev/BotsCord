const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
var DiscordStrategy = require('passport-discord').Strategy;
const MemoryStore = require("memorystore")(session);
var bot = require('./routers/bot');
var admin = require('./routers/admin');
var auth = require('./routers/auth');


//import models 
const Banned = require('../models/site-ban');

// set up session
app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: "#YoourrFunnySecretShouldBeLongerThanThisOrdasfjkadsnkfanslkfjasnfdsajnfkdjn#",
    resave: false,
    saveUninitialized: false,
}));
// set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
// use passport for authentication
app.use(passport.initialize());
app.use(passport.session());
// set up static files
app.use(express.static(path.join(__dirname, 'public')));
// Import routers 
app.use('/bot', bot);
app.use('/admin', admin);
app.use('/auth', auth);

var scopes = ['identify', 'email', 'guilds', 'guilds.join'];

passport.use(new DiscordStrategy({
    clientID: '934087523649609768',
    clientSecret: 'nPKjKvOCOyyhDaQM64qcJYbd6CdhCxLh',
    callbackURL: 'http://localhost:3000/auth/callback',
    scope: scopes
},
    function (accessToken, refreshToken, profile, cb) {
        console.log(profile);
        Banned.findOne({ user: profile.id }, function (err, user) {
            if (err) {
                console.log(err);
                return cb(err);
            }
            if (user) {
                console.log('User is banned');
                return cb(err, false);
            } else {
                console.log('User is not banned');
                return cb(err, user);
            }
        });
    }));
// set up routes
app.get('/', (req, res) => {
    var message = req.session.message;
    req.session.message = null;
    if (message) {
        res.render('index', {
            message: message
        });
    } else {
        res.render('index.ejs');
    }
});

app.get("/robots.txt", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(`Sitemap: https://botscord.site/sitemap.xml`);
});
app.get("/sitemap.xml", async function (req, res) {
    let link = "<url><loc>https://botscord.site/</loc></url>";
    let botdataforxml = await botsdata.find()
    botdataforxml.forEach(bot => {
        link += "\n<url><loc>https://botscord.site/bot/" + bot.botID + "</loc></url>";
    })
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="https://www.google.com/schemas/sitemap-image/1.1">${link}</urlset>`);
});

app.listen(port, () => {

    console.log('Your app is listening on port ' + port);
});