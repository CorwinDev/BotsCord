const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
var DiscordStrategy = require('passport-discord').Strategy;
var bot = require('./routers/bot');
var admin = require('./routers/admin');
var auth = require('./routers/auth');

// set up session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
// Import routers 
app.use('/bot', bot);
app.use('/admin', admin);
app.use('/auth', auth);

var scopes = ['identify', 'email', 'guilds', 'guilds.join'];

passport.use(new DiscordStrategy({
    clientID: 'id',
    clientSecret: 'secret',
    callbackURL: 'callbackURL',
    scope: scopes
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ discordId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }));
// use passport for authentication
app.use(passport.initialize());
app.use(passport.session());
// set up static files
app.use(express.static(path.join(__dirname, 'public')));
// set up view engine
app.set('view engine', 'ejs');
// set up routes
app.get('/', (req, res) => {
    res.render('index');
});

app.listen(port, () => {
    console.log('Your app is listening on port ' + port);
});