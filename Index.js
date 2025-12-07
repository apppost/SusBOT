const { Client, GatewayIntentBits, Routes } = require('discord.js');
const { REST } = require('@discordjs/rest');
const { joinVoiceChannel } = require('@discordjs/voice');
require('./server'); // render

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.MessageContent
    ],
    partials: ['CHANNEL'] // cần để nhắn DM
});

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

let currentVoiceConnection = null;

// Slash commands
const commands = [
    { name: 'afk', description: 'Bot AFK in your voice channel and send DM' },
    { name: 're', description: 'Leave the voice channel bot is in' }
];

// Register commands
const rest = new REST({ version: '10' }).setToken(TOKEN);
(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
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

    if (interaction.commandName === 'afk') {
        const member = interaction.member;
        const channel = member.voice.channel;

        if (!channel) return interaction.reply('You must be in a voice channel first 😅');

        if (currentVoiceConnection) return interaction.reply('Bot is already AFK in another channel 💀');

        const connection = joinVoiceChannel({
            channelId: channel.id,
            guildId: interaction.guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: true,
            selfMute: true
        });

        currentVoiceConnection = connection;
        await interaction.reply(`Bot is AFK in channel: ${channel.name} 💤`);

        // Send DM to user
        try {
            await member.send('Thanks for using "susbot" 🎉');
        } catch (err) {
            console.log('Cannot DM user:', member.user.tag);
        }
    }

    if (interaction.commandName === 're') {
        if (!currentVoiceConnection) return interaction.reply('Bot is not in any channel 😅');

        currentVoiceConnection.destroy();
        currentVoiceConnection = null;
        await interaction.reply('Bot has left the channel ✅');
    }
});

client.login(TOKEN);
