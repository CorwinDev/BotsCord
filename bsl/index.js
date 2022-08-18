const { SlashCommandBuilder, Routes, EmbedBuilder, ActivityType } = require('discord.js');

const client = require('../index.js').bsl;
const servers = require('../models/server');
const bots = require('../models/bot');
var config = client.config
const colors = require('colors');
const bsl = colors.blue("BSL: ");
const ms = require("parse-ms-2");
// Set intents 
client.on('ready', async () => {
    const bot = await bots.find({ verified: true });
    const server = await servers.find({});
    var loop = ['botscord.xyz | ' + bot.length + ' bots', 'botscord.xyz | ' + server.length + ' servers' ]
    var i = 0;
    setInterval(function () {
        client.user.setActivity(loop[i], { type: ActivityType.Watching });
        i++;
        if (i > loop.length - 1) {
            i = 0;
        }
    } , 5000);

    console.log(bsl, 'Bot is ready!');
    // Log server count
        console.log(bsl,
            `${client.guilds.cache.size} servers`);
});
const { REST } = require('@discordjs/rest');
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('topserver').setDescription('Replies with highest server!'),
    new SlashCommandBuilder().setName('user').setDescription('Replies with user info and connected bots/servers!'),
    new SlashCommandBuilder().setName('help').setDescription('Replies with the help embed!'),
    new SlashCommandBuilder().setName('bump').setDescription('Bump you server'),
    new SlashCommandBuilder().setName('info').setDescription('Get info about your server and the bot'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.bot.bsl.token);

rest.put(Routes.applicationCommands(config.bot.bsl.id), { body: commands })
    .then(() => console.log(bsl, 'Successfully registered application commands.'))
    .catch(console.error);

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;
    if (commandName === 'ping') {
        await interaction.reply(`🏓Latency is ${Date.now() - interaction.createdTimestamp}ms. API Latency is ${Math.round(client.ws.ping)}ms`);
    } else if (commandName === 'topserver') {

        const topServer = await servers.find({}).sort({ votes: -1 });
        await interaction.reply(`The top server is ${topServer[0].name} with ${topServer[0].votes} votes!`);
    } else if (commandName === 'user') {
        const { user } = interaction;
        await interaction.reply(`${user.username}#${user.discriminator} has ${user.bot ? 'a bot' : 'no bot'} and is connected to ${user.guilds.size} servers!`);
    } else if (commandName === 'help') {
        await interaction.reply(`
        **Commands**
        \`ping\` - Replies with pong!
        \`topserver\` - Replies with highest server!
        \`user\` - Replies with user info and connected bots/servers!
        `);
    } else if (commandName === 'bump') {
        let findServer = await servers.findOne({ id: interaction.guild.id });
        if (!findServer) return interaction.reply(
            "This server was not found in our list.\nAdd your server: https://botscord.xyz/server/add"
        );
        let cooldown = 3600000;
        let lastDaily = findServer.bump;
        if (cooldown - (Date.now() - lastDaily) > 0) {
            let time = ms(cooldown - (Date.now() - lastDaily));
            return interaction.reply(`You can bump again in ${time.minutes}m ${time.seconds}s`);
        }
        findServer.bump = Date.now();
        if (findServer.bumps == undefined) {
            findServer.bumps = 1;
        } else {

            findServer.bumps++;
        }
        await findServer.save();
        const embed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Bump')
            .setDescription('You have successfully bumped your server!')
            .setFooter({ iconURL: interaction.user.avatarURL(), text: 'BotsCord' })
            .setTimestamp();
        await interaction.reply({ embeds: [embed] });
    } else if (commandName === 'info') {

    } else {
        await interaction.reply('Command not found!');
    }
});
