// Create discord.js client
const { Client, GatewayIntentBits } = require('discord.js');
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
client.config = require('../config');
// Set intents 
client.on('ready', () => {
    console.log('Bot is ready!');
});
// Login
client.login(client.config.bot.token);