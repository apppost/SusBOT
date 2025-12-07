const { Client, GatewayIntentBits, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { joinVoiceChannel } = require('@discordjs/voice');
require('./server');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: ['CHANNEL']
});

const TOKEN = "d18bb381a8bf4389558cffc5ba9cebcbc80f62ab276017a948b786783aa628fc";
const CLIENT_ID = "1447082879778820116";

const connections = {};

const commands = [
    { name: 'afk', description: 'Bot AFK in your voice channel and send DM' },
    { name: 're', description: 'Leave the voice channel bot is in' }
];

const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        console.log('Registering commands...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID),
            { body: commands }
        );
        console.log('Commands registered ✅');
    } catch (err) {
        console.log(err);
    }
})();

client.on('ready', () => {
    console.log(`Bot is ready: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const guildId = interaction.guildId;

    if (interaction.commandName === 'afk') {
        const member = interaction.member;
        const channel = member.voice.channel;

        if (!channel) return interaction.reply('You must be in a voice channel first 😅');

        if (connections[guildId]) return interaction.reply('Bot is already AFK in this server 💀');

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        connections[guildId] = connection;

        await interaction.reply(`Bot is AFK in channel: ${channel.name} 💤`);

        try {
            await member.send('Thanks for using "susbot" 🎉');
        } catch (err) {
            console.log('Cannot DM user:', member.user.tag);
        }
    }

    if (interaction.commandName === 're') {
        if (!connections[guildId]) return interaction.reply('Bot is not in any channel 😅');

        connections[guildId].destroy();
        delete connections[guildId];
        await interaction.reply('Bot has left the channel ✅');
    }
});

client.login(TOKEN);
