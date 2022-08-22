const client = require('../../index.js').client;
const servers = require('../../models/server');
const bots = require('../../models/bot');
const users = require('../../models/user');
var config = client.config
const { SlashCommandBuilder, Routes, EmbedBuilder } = require('discord.js');
const { REST } = require('@discordjs/rest');
const colors = require('colors');
const commands = [
    new SlashCommandBuilder().setName('ping').setDescription('Replies with pong!'),
    new SlashCommandBuilder().setName('topvoted').setDescription('Replies with highest server/bots!'),
    new SlashCommandBuilder().setName('profile').setDescription('Replies with user info and connected bots/servers!'),
    new SlashCommandBuilder().setName('queue').setDescription('Replies with queue'),
]
    .map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(config.bot.token);

rest.put(Routes.applicationGuildCommands(config.bot.id, config.discord.id), { body: commands })
    .then(() => console.log(colors.green("Website: "), 'Successfully registered application commands.'))
    .catch(console.error);

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'ping') {
        await interaction.reply('Pong!');
    } else if (commandName === 'topvoted') {
        const serversdata = await servers.find();
        const botsdata = await bots.find({ verified: true });
        var botsdata1 = botsdata
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 6)
            .map(
                a => `${a.name} **[ \`${a.votes}\` Votes ]**`
            )
            .join('\n');

        var serversdata1 = serversdata
            .sort((a, b) => b.votes - a.votes)
            .slice(0, 6)
            .map(
                a => `${a.name} | ${a.id} **[ \`${a.votes}\` Votes ]**`
            )
            .join('\n');

        if (!serversdata1) {
            var serversdata1 = 'no servers';
        }
        if (!botsdata1) {
            var botsdata1 = 'no bots';
        }

        const embed = new EmbedBuilder()
            .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true }) })
            .setColor("#7289da")
            .setDescription(`**Top 6 voted bots of the week!**\n${botsdata1}\n\n**Top 6 voted servers of the week!**\n${serversdata1}`)
        interaction.reply({ embeds: [embed] });
    } else if (commandName === 'user') {
        const { user } = interaction;
        bots.find({ owner: user.id }).then(bots => {
            var bots1 = bots
                .map(
                    a => `${a.name} | ${a.id} **[ \`${a.votes}\` Votes ]**`
                )
                .join('\n');
            if (!bots1) {
                var bots1 = 'no bots';
            }
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true }) })
                .setColor("#7289da")
                .setDescription(`**Bots owned by ${user.tag}**\n${bots1}`)
            interaction.reply({ embeds: [embed] });
        }).catch(console.error);
    } else if (commandName === 'profile') {
        bots.find({ owner: interaction.user.id }).then(async function(bots){
            var bots1 = bots
                .map(
                    a => `${a.name} | ${a.id} **[ \`${a.votes}\` Votes ]**`
                )
                .join('\n');
            if (!bots1) {
                var bots1 = 'no bots';
            }
            var user = await users.findOne({ id: interaction.user.id });
            const embed = new EmbedBuilder()
                .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL({ dynamic: true }) })
                .setColor("#7289da")
                .setDescription(`**Bots owned by ${user.tag}**\n${bots1}\nCoins: ${user.coins}`)
            interaction.reply({ embeds: [embed] });
        })
    } else if (commandName === 'queue') {
        if (!global.config.users.owner.includes(interaction.user.id) && !global.config.users.verificator.includes(interaction.user.id)) return interaction.reply('You are not allowed to use this command!');
        const unVerified = await bots.find({ verified: false });
        var desc = "";
        for (let i = 0; i < unVerified.length; i++) {
            desc += `${i + 1}. ${unVerified[i].name} - ${unVerified[i].id} Invite: https://discord.com/api/oauth2/authorize?client_id=${unVerified[i].id}&scope=applications.commands%20bot\n`;
        }
        const embed = new EmbedBuilder()
            .setTitle('Unverified Bots')
            .setDescription(desc)
            .setColor("#5865F2")
            .setFooter({ text: 'BotsCord', iconURL: 'https://botscord.xyz/img/logo.png' })
            .setTimestamp()
        interaction.reply({ embeds: [embed] });
    }
});
client.on("guildMemberAdd", async (member) => {
    console.log(colors.green("Website: "), `${member.user.tag} has joined ${member.guild.name}`);
    let guild = client.guilds.cache.get(global.config.discord.id);
    if (member.user.bot) {
        try {
            guild.members.cache.get(member.id).roles.add(global.config.discord.roles.bot);
            client.channels.cache.get(global.config.bot.channels.welcome).send(`${member.user.tag} has joined the server!`);

        } catch (error) {

        }
    } else {
        try {
            guild.members.cache.get(member.id).roles.add(global.config.discord.roles.user);
            client.channels.cache.get(global.config.bot.channels.welcome).send(`${member.user.tag} has joined the server!`);
        } catch (error) {
            console.log(error)
        }
    }
});
var cooldown = [];
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (message.channel.type === "dm") return;
    if (cooldown.some(code => code.id === message.author.id)) {
        var userr = cooldown.findIndex((obj => obj.id == message.author.id));
        cooldown[userr].message += 1;
        if (cooldown[userr].message >= 15) {
            cooldown[userr].message = 0;
            const coins = await users.findOne({ id: message.author.id });
            if (!coins) {
                await users.create({ id: message.author.id, coins: 0 });
            } else {
                if (coins.coins < 1) {
                    coins.coins = 1;
                    coins.save();
                } else {
                    coins.coins++;
                    coins.save();
                }
                message.reply(`You earned 1 coin! You now have ${coins.coins} coins!`);
            }
        }
        return
    };
    cooldown.push({
        id: message.author.id,
        message: 0,
    });

});