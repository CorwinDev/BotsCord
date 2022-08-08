const client = require('../index.js').bsl;
const servers = require('../models/server');
const bots = require('../models/bot');
var config = client.config
const colors = require('colors');
const bsl = colors.blue("BSL: ");
// Set intents 
client.on('ready',async () => {
    const bot = await bots.find();
    client.user.setPresence({ activity: { type: 'WATCHING', name: 'botscord.xyz | '+bot.length+' bots' }, status: "online" });
    console.log(bsl, 'Bot is ready!');
    // Log server count
    setTimeout(() => {
        console.log(bsl,
            `${client.guilds.cache.size} servers`);
    }, 1000);
});
const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('topserver').setDescription('Replies with highest server!'),
    new SlashCommandBuilder().setName('user').setDescription('Replies with user info and connected bots/servers!'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.bot.token);

rest.put(Routes.applicationCommands(config.bot.id), { body: commands })
    .then(() => console.log(bsl, 'Successfully registered application commands.'))
    .catch(console.error);

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    if (commandName === 'ping') {
        await interaction.reply(`🏓Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    } else if (commandName === 'topserver') {

        const topServer = await servers.find({}).sort({ votes: -1 });
        console.log(bsl, topServer);
        await interaction.reply(`The top server is ${topServer[0].name} with ${topServer[0].votes} votes!`);
    } else if (commandName === 'user') {
        const { user } = interaction;
        await interaction.reply(`${user.username}#${user.discriminator} has ${user.bot ? 'a bot' : 'no bot'} and is connected to ${user.guilds.size} servers!`);

    } else {
        await interaction.reply('Command not found!');
    }
});
