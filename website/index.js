const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
// set up session
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false
}));
// Import routers 
var bot = require('./routers/bot');
app.use('/bot', bot);
var admin = require('./routers/admin');
app.use('/admin', admin);
var auth = require('./routers/auth');
app.use('/auth', auth);

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
    console.log('Your app is listening on port ' + listener.address().port);
});