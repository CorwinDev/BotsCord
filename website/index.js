const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
var DiscordStrategy = require('passport-discord').Strategy;
var MemoryStore = require('memorystore')(session);
const bodyParser = require('body-parser');
var showdown = require('showdown'),
    converter = new showdown.Converter();
var bot = require('./routers/bot');
var admin = require('./routers/admin');
var auth = require('./routers/auth');
var servers = require('./routers/servers');
var client = require('../index');
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
//import models 
const Banned = require('../models/site-ban');
const bots = require('../models/bot');
const server  = require('../models/server');
var scopes = ['identify', 'email', 'guilds', 'guilds.join'];
var prompt = 'consent'
passport.use(new DiscordStrategy({
    clientID: '934087523649609768',
    clientSecret: 'nPKjKvOCOyyhDaQM64qcJYbd6CdhCxLh',
    callbackURL: 'http://localhost:3000/auth/callback',
    scope: scopes,
    prompt: prompt
},
    function (accessToken, refreshToken, profile, done) {
        Banned.findOne({ user: profile.id }, function (err, user) {
            if (err) {
                console.log(err);
                return done(err);
            }
            if (user) {
                console.log('User is banned');
                return done(err, false);
            } else {
                return done(null, profile);
            }
        });
    }));
// set up session
app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: "#@%#&^$^$%@$^$&%#$%@#$%$^%&$%^#$%@#$%#E%#%@$FEErfgr3g#%GT%536c53cc6%5%tv%4y4hrgrggrgrgf4n",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
// set up static files
app.use(express.static(path.join(__dirname, 'public')));
// Import routers 
app.use('/bot', bot);
app.use('/admin', admin);
app.use('/auth', auth);
app.use('/server', servers);

// set up routes
app.get('/', async (req, res) => {
    var message = req.session.message;
    req.session.message = null;
    var error = req.session.error;
    req.session.error = null;
    var robots = await bots.find({});
    var servers = await server.find({})
    if (message) {
        res.render('index', {
            message: message,
            user: req.user,
            bots: robots,
            botscord: client,
            servers: servers
        });
        return
    }
    else if (error) {
        res.render('index', {
            error: error,
            user: req.user,
            bots: robots,
            botscord: client,
            servers: servers

        });
        return
    } else {
        res.render('index.ejs', {
            user: req.user,
            bots: robots,
            botscord: client,
            servers: servers
        });
        return
    }
});

app.get("/robots.txt", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(`Sitemap: https://botscord.xyz/sitemap.xml`);
});
app.get("/sitemap.xml", async function (req, res) {
    let link = "<url><loc>https://botscord.xyz/</loc></url>";
    let botdataforxml = await bots.find()
    botdataforxml.forEach(bot => {
        link += "\n<url><loc>https://botscord.xyz/bot/" + bot.id + "</loc></url>";
    })
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="https://www.google.com/schemas/sitemap-image/1.1">${link}</urlset>`);
});
app.use((req, res, next) => {
    if (res.statusCode === 404) {
        req.session.error = "Page not found";
        res.redirect('/');
    } else if (res.statusCode === 500) {
        req.session.error = "Internal server error";
        res.redirect('/');
    }else{
        req.session.error = "Page not found";
        res.redirect('/');
    }
})
app.listen(port, () => {
    console.log('Your app is listening on port ' + port);
});
module.exports.client = client;