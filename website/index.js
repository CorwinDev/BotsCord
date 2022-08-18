const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
var DiscordStrategy = require('passport-discord').Strategy;
var MemoryStore = require('memorystore')(session);
const bodyParser = require('body-parser');
const colors = require('colors');
var showdown = require('showdown'),
    converter = new showdown.Converter();
var bot = require('./routers/bot');
var admin = require('./routers/admin');
var auth = require('./routers/auth');
var servers = require('./routers/servers');
var api = require('./routers/api');
var profile = require('./routers/user');
var client = require('../index');

const port = client.config.server.port || 3000;
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));
const rateLimit = require('express-rate-limit')
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 100,
    standardHeaders: true, 
    legacyHeaders: false,
    message:
        'Too many requests from this IP, please try again after a few minutes.',
})
app.use("/api", limiter)
app.use('/api', api);
app.set('trust proxy', 2)
if(global.config.maintenance) {
    console.log(colors.red("[MAINTENANCE]") + " Bot is in maintenance mode.");
    app.get('/', (req, res) => {
        res.render('maintenance');
    })
    app.listen(port, () => {
        
    });
    return
}
passport.serializeUser(function (user, done) {
    done(null, user);
});
passport.deserializeUser(function (obj, done) {
    done(null, obj);
});
//import models 
const Banned = require('../models/site-ban');
const bots = require('../models/bot');
const server = require('../models/server');
var scopes = ['identify', 'guilds', 'guilds.join'];
var prompt = 'consent'
passport.use(new DiscordStrategy({
    clientID: '870001234583621713',
    clientSecret: 'vnWBrTQwSPwjCz9bykN7QwxdliQSZYaC',
    callbackURL: client.config.server.host + '/auth/callback',
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
// set up static files
app.use(express.static(path.join(__dirname, 'public')));
// Import routers 
app.use('/bot', bot);
app.use('/admin', admin);
app.use('/auth', auth);
app.use('/server', servers);
app.use('/api', api);
app.use('/user', profile)

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

app.get('/bots', async (req, res) => {
    var bot = await bots.find({});
    res.render('bots', {
        bots: bot,
        user: req.user,
        botscord: client
    });
});

app.get('/servers', async (req, res) => {
    var servers = await server.find({});
    res.render('servers', {
        bots: servers,
        user: req.user,
        botscord: client
    });
});

app.get('/tag/:id', async (req, res) => {
    var id = req.params.id.toLowerCase();
    var bot = await bots.find({ tags: id });
    var servers = await server.find({ tags: id});
    res.render('tags/index', {
        bots: bot,
        user: req.user,
        tag: id,
        servers: servers,
    });
});
app.get('/i/:id', async (req, res) => {
    var id = req.params.id.toLowerCase();
    var bott = await bots.findOne({ vanity: id });
    if(!bott){
        var serverr = await server.findOne({ vanity: id });
        if(!serverr){
            res.redirect('/');
            return
        }
        res.redirect('/server/' + serverr.id + '/join');
        return
    }
    res.redirect('/bot/' + bott.id + '/invite');
    return

});
app.get('/tos' , (req, res) => {
    res.render('tos', {
        user: req.user,
    });
} );
app.get('/privacy', (req, res) => {
    res.render('privacy', {
        user: req.user,
    });
});
app.get("/robots.txt", function (req, res) {
    res.set('Content-Type', 'text/plain');
    res.send(`Sitemap: https://botscord.xyz/sitemap.xml`);
});
app.get("/sitemap.xml", async function (req, res) {
    let link = "<url><loc>https://botscord.xyz/</loc></url>";
    let botdataforxml = await bots.find({verified:true})
    let serverdataforxml = await server.find()
    botdataforxml.forEach(bot => {
        link += "\n<url><loc>https://botscord.xyz/bot/" + bot.id + "</loc></url>";
    })
    serverdataforxml.forEach(server => {
        link += "\n<url><loc>https://botscord.xyz/server/" + server.id + "</loc></url>";
    });
    res.set('Content-Type', 'text/xml');
    res.send(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="https://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="https://www.google.com/schemas/sitemap-image/1.1">${link}</urlset>`);
});
app.get('/invite', function (req, res) {
    res.redirect(client.config.bot.bsl.invite);
});
app.use((req, res, next) => {
    res.status(404).render('error', {
        errorr: "Page not found",
        user: req.user,
    })
})
app.use((err, req, res, next) => {
    console.error(err.stack)
    res.status(500).render('error',{
        errorr: 500,
        user: req.user,
    })
})
app.listen(client.config.server.port, () => {
    console.log(colors.green("Website: "), 'Your app is listening on port ' + port);
});
module.exports.client = client;