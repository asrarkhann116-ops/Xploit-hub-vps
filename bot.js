const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require('discord.js');
const { Octokit } = require("@octokit/rest");
const fs = require('fs');
require('dotenv').config();

const XPLOIT_HUB_ID = '1459402620199374872';
const REPO_OWNER = 'termuxhexrt';
const REPO_NAME = 'Xploit-VPS-System';
const WORKFLOW_VPS = 'vps.yml';
const WORKFLOW_RDP = 'rdp.yml';

const VPS_CHANNEL_ID = '1497364285645652098';
// LIVE Tracking Channel
const LIVE_CHANNEL_ID = process.env.LIVE_CHANNEL_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const WALLPAPER_MAP = {
    'wall_default': 'https://i.pinimg.com/736x/42/3a/2f/423a2f1a8f888cb9068dc68daed56967.jpg',
    'wall_skull': 'https://images.wallpapersden.com/image/download/red-hacker-binary-code_bWZtZ2aUmZqaraWkpJRmbmdlrWZnZWU.jpg',
    'wall_cyber': 'https://wallpapercave.com/wp/wp4906542.jpg',
    'wall_matrix': 'https://wallpaperaccess.com/full/11554.jpg'
};

const commands = [
    new SlashCommandBuilder()
        .setName('vps')
        .setDescription('Launch a 7GB Elite VPS (Browser Version)')
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
                    { name: 'Elite Red (Default)', value: 'wall_default' },
                    { name: 'Digital Skull', value: 'wall_skull' },
                    { name: 'Cyberpunk Red', value: 'wall_cyber' },
                    { name: 'Dark Matrix', value: 'wall_matrix' }
                )),
    new SlashCommandBuilder()
        .setName('remote-desktop-vps')
        .setDescription('Launch a Lag-Free RDP VPS (Windows Remote Desktop)')
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
                    { name: 'Elite Red (Default)', value: 'wall_default' },
                    { name: 'Digital Skull', value: 'wall_skull' },
                    { name: 'Cyberpunk Red', value: 'wall_cyber' },
                    { name: 'Dark Matrix', value: 'wall_matrix' }
                ))
].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_BOT_TOKEN);

// --- PERSISTENT DATABASE LOGIC ---
const DATA_FILE = './vps_data.json';
const MAX_SESSIONS = 5; // Increased Limit

let db = { liveMessageId: null, sessions: [] };

function loadDB() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        } catch (e) {
            console.error("Error reading DB", e);
        }
    }
}

function saveDB() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function cleanExpiredSessions() {
    const now = Date.now();
    const initialCount = db.sessions.length;
    db.sessions = db.sessions.filter(s => s.expiresAt > now);
    if (db.sessions.length !== initialCount) saveDB();
}
// ---------------------------------

// --- LIVE TRACKER LOGIC ---
async function updateLiveMessage() {
    if (!LIVE_CHANNEL_ID || LIVE_CHANNEL_ID === 'PUT_ID_HERE') return;
    cleanExpiredSessions();
    
    try {
        const channel = await client.channels.fetch(LIVE_CHANNEL_ID);
        if (!channel) return;

        const available = MAX_SESSIONS - db.sessions.length;
        
        let sessionList = '';
        if (db.sessions.length === 0) {
            sessionList = "✅ All slots are empty. Servers are standing by.";
        } else {
            db.sessions.forEach((s, index) => {
                const timeLeft = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 60000));
                sessionList += `**${index + 1}.** <@${s.userId}> - Ends in \`${timeLeft} mins\`\n`;
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛰️ Xploit HUB - VPS Live Status')
            .setColor(available > 0 ? '#00FF00' : '#FF0000')
            .addFields(
                { name: '📊 Server Capacity', value: `\`${db.sessions.length} / ${MAX_SESSIONS}\` Active` },
                { name: '🟢 Available Slots', value: `\`${available}\` Slots` },
                { name: '💻 Current Operators', value: sessionList }
            )
            .setFooter({ text: 'Auto-updates every 30 seconds' })
            .setTimestamp();

        if (db.liveMessageId) {
            try {
                const msg = await channel.messages.fetch(db.liveMessageId);
                await msg.edit({ embeds: [embed] });
                return;
            } catch (err) {
                // Message not found, send a new one
                db.liveMessageId = null;
            }
        }

        if (!db.liveMessageId) {
            const newMsg = await channel.send({ embeds: [embed] });
            db.liveMessageId = newMsg.id;
            saveDB();
        }

    } catch (e) {
        // Suppress errors if channel not configured properly yet
    }
}
// --------------------------

client.on('ready', async () => {
    try {
        console.log(`Lethal Bot logged in as ${client.user.tag}!`);
        await rest.put(Routes.applicationCommands(client.user.id), { body: [] });
        await rest.put(Routes.applicationGuildCommands(client.user.id, XPLOIT_HUB_ID), { body: commands });
        console.log('Slash commands active on Xploit HUB.');
        
        loadDB();
        
        // Start Live Updates every 30 seconds
        setInterval(updateLiveMessage, 30000);
        updateLiveMessage();
        
    } catch (error) {
        console.error(error);
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'vps' || interaction.commandName === 'remote-desktop-vps') {
        
        if (interaction.channelId !== VPS_CHANNEL_ID) {
            return interaction.reply({ content: `❌ This command only works in <#${VPS_CHANNEL_ID}>.`, ephemeral: true });
        }

        if (interaction.guildId !== XPLOIT_HUB_ID) {
            return interaction.reply({ content: "❌ This command is exclusive to **Xploit HUB**.", ephemeral: true });
        }

        cleanExpiredSessions();

        if (db.sessions.length >= MAX_SESSIONS) {
            return interaction.reply({ content: `🚫 **Slots Full!** All ${MAX_SESSIONS} VPS units are in use. Check live status for availability.`, ephemeral: true });
        }

        const duration = interaction.options.getString('duration');
        const wallKey = interaction.options.getString('wallpaper');
        const wallpaperUrl = WALLPAPER_MAP[wallKey];
        
        const targetWorkflow = interaction.commandName === 'vps' ? WORKFLOW_VPS : WORKFLOW_RDP;
        const typeMsg = interaction.commandName === 'vps' ? 'Browser VPS' : 'Lag-Free RDP VPS';

        try {
            // Add session to DB
            const expiresAt = Date.now() + ((parseInt(duration) + 5) * 60000); // 5 mins buffer
            db.sessions.push({
                userId: interaction.user.id,
                userName: interaction.user.username,
                expiresAt: expiresAt
            });
            saveDB();
            updateLiveMessage();

            await interaction.reply({ content: `🚀 **Launching ${typeMsg}...**\nCheck DMs in 2-3 mins.`, ephemeral: true });

            await octokit.actions.createWorkflowDispatch({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                workflow_id: targetWorkflow,
                ref: 'main',
                inputs: {
                    user_id: interaction.user.id,
                    user_name: interaction.user.username,
                    duration: duration,
                    wallpaper_url: wallpaperUrl
                }
            });

        } catch (error) {
            console.error(error);
            // Revert session if API fails
            db.sessions = db.sessions.filter(s => s.userId !== interaction.user.id);
            saveDB();
            updateLiveMessage();
            interaction.followUp({ content: "❌ **Error:** GitHub API dispatch failed.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
