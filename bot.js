const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes } = require('discord.js');
const { Octokit } = require("@octokit/rest");
require('dotenv').config();

const XPLOIT_HUB_ID = '1459402620199374872';
const REPO_OWNER = 'termuxhexrt';
const REPO_NAME = 'Xploit-VPS-System';
const WORKFLOW_ID = 'vps.yml';

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const commands = [
    new SlashCommandBuilder()
        .setName('vps')
        .setDescription('Launch a 7GB Elite VPS')
        .addStringOption(option =>
            option.setName('duration')
                .setDescription('How long do you need the VPS?')
                .setRequired(true)
                .addChoices(
                    { name: '15 Minutes', value: '15' },
                    { name: '30 Minutes', value: '30' },
                    { name: '1 Hour', value: '60' },
                    { name: '2 Hours', value: '120' },
                    { name: '4 Hours', value: '240' },
                    { name: '6 Hours', value: '360' }
                ))
        .addStringOption(option =>
            option.setName('wallpaper')
                .setDescription('Choose your aesthetic')
                .setRequired(true)
                .addChoices(
                    { name: 'Elite Red (Default)', value: 'https://i.pinimg.com/736x/42/3a/2f/423a2f1a8f888cb9068dc68daed56967.jpg' },
                    { name: 'Digital Skull', value: 'https://images.wallpapersden.com/image/download/red-hacker-binary-code_bWZtZ2aUmZqaraWkpJRmbmdlrWZnZWU.jpg' },
                    { name: 'Cyberpunk Red', value: 'https://wallpapercave.com/wp/wp4906542.jpg' },
                    { name: 'Dark Matrix', value: 'https://wallpaperaccess.com/full/11554.jpg' }
                ))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

let activeSessions = 0;
const MAX_SESSIONS = 2;

client.on('ready', async () => {
    try {
        console.log(`Lethal Bot logged in as ${client.user.tag}!`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
        await rest.put(Routes.applicationGuildCommands(client.user.id, XPLOIT_HUB_ID), { body: commands });
        console.log('Duplicate cleaned! Slash commands active on Xploit HUB.');
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vps') {
        const VPS_CHANNEL_ID = '1497364285645652098';
        if (interaction.channelId !== VPS_CHANNEL_ID) {
            return interaction.reply({ content: `❌ This command only works in <#${VPS_CHANNEL_ID}>.`, ephemeral: true });
        }

        if (interaction.guildId !== XPLOIT_HUB_ID) {
            return interaction.reply({ content: "❌ This command is exclusive to **Xploit HUB**.", ephemeral: true });
        }

        if (activeSessions >= MAX_SESSIONS) {
            return interaction.reply({ content: "🚫 **Slots Full!** All 2 VPS units are in use. Check again later.", ephemeral: true });
        }

        const duration = interaction.options.getString('duration');
        const wallpaper = interaction.options.getString('wallpaper');
        
        try {
            activeSessions++;
            await interaction.reply({ content: `🚀 **Launching VPS...** Aesthetic: *${interaction.options.get('wallpaper').value.split('/').pop()}*\nCheck DMs in 2-3 mins.`, ephemeral: true });

            await octokit.actions.createWorkflowDispatch({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                workflow_id: WORKFLOW_ID,
                ref: 'main',
                inputs: {
                    user_id: interaction.user.id,
                    user_name: interaction.user.username,
                    duration: duration,
                    wallpaper_url: wallpaper
                }
            });

            setTimeout(() => { if (activeSessions > 0) activeSessions--; }, (parseInt(duration) + 5) * 60000);

        } catch (error) {
            console.error(error);
            activeSessions--;
            interaction.followUp({ content: "❌ **Error:** GitHub API dispatch failed.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
