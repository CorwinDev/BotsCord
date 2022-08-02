// Load Bot and website
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
// Create discord.js client
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,

    ]
});
client.config = config;
// Set intents 
client.on('ready', () => {
    console.log('Bot is ready!');
});
// Login
client.login(client.config.bot.token);
// Node Error Handler
process.on('uncaughtException', function (err) {
    console.log(err);
    console.log('Uncaught Exception');
    client.channels.cache.get(client.config.bot.channels.error).send(`Uncaught Exception: ${err}`);
});
// Node Exit Handler
process.on('exit', function (code) {
    console.log('About to exit with code:', code);
    client.channels.cache.get(client.config.bot.channels.error).send(`About to exit with code: ${code}`);
});
// Node Unhandled Rejection Handler
process.on('unhandledRejection', function (err) {
    console.log(err);
    console.log('Unhandled Rejection');
    client.channels.cache.get(client.config.bot.channels.error).send(`Unhandled Rejection: ${err}`);
});
// Node Warning Handler
process.on('warning', function (warning) {
    console.log(warning);
    console.log('Warning');
    client.channels.cache.get(client.config.bot.channels.error).send(`Warning: ${warning}`);
});
// Node Error Handler
process.on('error', function (err) {
    console.log(err);
    console.log('Error');
    client.channels.cache.get(client.config.bot.channels.error).send(`Error: ${err}`);

});
// Node Disconnect Handler
process.on('disconnect', function (err) {
    console.log(err);
    console.log('Disconnect');
    client.channels.cache.get(client.config.bot.channels.error).send(`Disconnect: ${err}`);
});
//export config
module.exports.config = config;
module.exports.mongoose = mongoose;
module.exports.client = client;
module.exports.embed = EmbedBuilder;