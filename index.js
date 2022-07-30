// Load Bot and website
const bot = require('./bot');
const website = require('./website');
// Import config and export
const config = require('./config');
// Connect to mongoDB
try {
    mongoose.connect(config.mongoDB.url);
} catch (err) {
    console.log('Error connecting to mongoDB');
    process.exit(1);
}
//export config
module.exports.config = config;
module.exports.mongoose = mongoose;
