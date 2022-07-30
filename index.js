// Load Bot and website
const bot = require('./bot');
const website = require('./website');
// Import config and export
const config = require('./config');
const mongoose = require('mongoose');
// Connect to mongoDB
try {
    mongoose.connect(config.mongodb);
} catch (err) {
    console.log(err);
    console.log('Error connecting to mongoDB');
    process.exit(1);
}
//export config
module.exports.config = config;
module.exports.mongoose = mongoose;
