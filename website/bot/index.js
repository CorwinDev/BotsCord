const client = require('../../index.js').client;
const servers = require('../../models/server');
var config = client.config
const { SlashCommandBuilder, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('topserver').setDescription('Replies with highest server!'),
    new SlashCommandBuilder().setName('user').setDescription('Replies with user info and connected bots/servers!'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.bot.token);

rest.put(Routes.applicationGuildCommands(config.bot.id, config.discord.id), { body: commands })
    .then(() => console.log('Successfully registered application commands.'))
    .catch(console.error);

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'topserver') {
        const topServer = await servers.find({}, { sort: { memberCount: -1 } });
        await interaction.reply(`The top server is ${topServer.name} with ${topServer.memberCount} members!`);
    } else if (commandName === 'user') {
        const { user } = interaction;
        await interaction.reply(`${user.username}#${user.discriminator} has ${user.bot ? 'a bot' : 'no bot'} and is connected to ${user.guilds.size} servers!`);

    }
});