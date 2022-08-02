const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
var DiscordStrategy = require('passport-discord').Strategy;
const MemoryStore = require("memorystore")(session);
const bodyParser = require('body-parser');
var showdown = require('showdown'),
    converter = new showdown.Converter();
var bot = require('./routers/bot');
var admin = require('./routers/admin');
var auth = require('./routers/auth');
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

//import models 
const Banned = require('../models/site-ban');

// set up session
app.use(session({
    store: new MemoryStore({ checkPeriod: 86400000 }),
    secret: "#YoourrFunnySecretShouldBeLongerThanThisOrdasfjkadsnkfanslkfjasnfdsajnfkdjn#",
    resave: false,
    saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());
// set up view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
// set up static files
app.use(express.static(path.join(__dirname, 'public')));
// Import routers 
app.use('/bot', bot);
app.use('/admin', admin);
app.use('/auth', auth);

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
// set up routes
app.get('/', (req, res) => {
    var message = req.session.message;
    req.session.message = null;
    var error = req.session.error;
    req.session.error = null;
    if (message) {
        res.render('index', {
            message: message,
            user: req.user,
            markdown: converter,
        });
        return
    } 
    if(error){
        res.render('index', {
            error: error,
            user: req.user,
            markdown: converter,
        });
    }else{
        res.render('index.ejs',{
            user: req.user,
            markdown: converter,
        });
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