// Create discord.js client
const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildMessageTyping,
        GatewayIntentBits.DirectMessages,

    ]
});
client.config = require('./config');
// Set intents 
client.on('ready', () => {
    console.log('Bot is ready!');
    // Log server count
    setTimeout(() => {
        console.log(`${client.guilds.cache.size} servers`);
    }, 1000);
});
// Login
client.login(client.config.bot.token);