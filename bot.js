const { Client, GatewayIntentBits } = require('discord.js');
const { Octokit } = require("@octokit/rest");
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
process.env.GITHUB_TOKEN = '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';
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const REPO_OWNER = 'termuxhexrt';
const REPO_NAME = 'Xploit-VPS-System';
const WORKFLOW_ID = 'vps.yml';

let activeSessions = 0;
const MAX_SESSIONS = 2;

client.on('ready', () => {
    console.log(`Lethal Bot logged in as ${client.user.tag}!`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (message.content === '!vps') {
        if (activeSessions >= MAX_SESSIONS) {
            return message.reply("🚫 **Slots Full!** 2 members are already using the emergency VPS. Wait for them to go AFK.");
        }

        try {
            activeSessions++;
            message.reply("🚀 **Triggering Phantom VPS...** Check your DMs in 2-3 minutes for the link.");

            await octokit.actions.createWorkflowDispatch({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                workflow_id: WORKFLOW_ID,
                ref: 'main',
                inputs: {
                    user_id: message.author.id,
                    user_name: message.author.username
                }
            });

            // Decrement session count after 6 hours (GitHub max limit) 
            // or we could use a webhook to be more precise.
            setTimeout(() => {
                if (activeSessions > 0) activeSessions--;
            }, 21600000); 

        } catch (error) {
            console.error(error);
            activeSessions--;
            message.reply("❌ **Error:** Failed to ignite the VPS. Check bot logs.");
        }
    }

    if (message.content === '!slots') {
        message.reply(`🛰️ **Xploit HUB VPS Status:** [${activeSessions}/${MAX_SESSIONS}] Slots occupied.`);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
