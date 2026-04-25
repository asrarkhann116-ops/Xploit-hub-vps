const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const GUIDE_CHANNEL_ID = '1497422572285853927';
const TOS_CHANNEL_ID = '1497422542284263474';

const WICK_NAME = 'Wick';
const WICK_AVATAR = 'https://cdn.discordapp.com/avatars/536991182035746816/c850c9bbeb25e119a4c85a9bfdb7871e.png?size=1024';

client.once('ready', async () => {
    console.log(`[Wick] Authorized as ${client.user.tag}`);
    
    try {
        // --- GUIDE CHANNEL ---
        const guideChannel = await client.channels.fetch(GUIDE_CHANNEL_ID);
        const guideWebhook = await guideChannel.createWebhook({
            name: WICK_NAME,
            avatar: WICK_AVATAR,
        });

        const guideEmbed = new EmbedBuilder()
            .setTitle('📖 Xploit HUB - VPS Official Guide')
            .setColor('#2B2D31')
            .setDescription(`Welcome to the **Xploit HUB Elite VPS Infrastructure**. Here is how you deploy and access your free 7GB Linux machines.`)
            .addFields(
                { name: '1️⃣ Basic VPS (Browser Mode)', value: 'Use the \`/vps\` command. It gives you a Cloudflare link. Open it in any browser and enter password \`phantom\`. Best for quick tasks.' },
                { name: '2️⃣ Pro VPS (Lag-Free RDP)', value: 'Use \`/remote-desktop-vps\`. It gives you a \`bore.pub\` address. Open **Remote Desktop Connection** on your Windows PC, enter the address, and login with User: \`runner\`, Pass: \`phantom\`. Zero lag.' },
                { name: '💾 MEGA SAVE Feature', value: 'Want to save your files before the VPS dies? Double-click the **MEGA_SAVE.sh** file on the VPS Desktop. It will compress your files and send the download link directly to your Discord DMs!' },
                { name: '⏳ Timers & Auto-Kill', value: 'The machine self-destructs exactly when the timer ends. No exceptions. Keep an eye on your time.' }
            )
            .setImage('https://i.pinimg.com/736x/42/3a/2f/423a2f1a8f888cb9068dc68daed56967.jpg')
            .setFooter({ text: 'Xploit HUB Security', iconURL: WICK_AVATAR });

        await guideWebhook.send({ embeds: [guideEmbed] });
        console.log('[Wick] Guide posted!');
        await guideWebhook.delete();

        // --- TOS CHANNEL ---
        const tosChannel = await client.channels.fetch(TOS_CHANNEL_ID);
        const tosWebhook = await tosChannel.createWebhook({
            name: WICK_NAME,
            avatar: WICK_AVATAR,
        });

        const tosEmbed = new EmbedBuilder()
            .setTitle('⚖️ Xploit HUB - Terms of Service (TOS)')
            .setColor('#FF0000')
            .setDescription(`By using the Xploit HUB VPS services, you automatically agree to the following rules. **Violations will result in a permanent ban.**`)
            .addFields(
                { name: '🚫 1. No Crypto Mining', value: 'Do NOT run any cryptocurrency miners (Monero, Bitcoin, etc.). It will trigger GitHub\'s security and destroy our infrastructure.' },
                { name: '🚫 2. No Abuse of Hardware', value: 'Do not overload the CPU to 100% 24/7 without reason. Maintain stealth.' },
                { name: '⚠️ 3. Auto-Kill Policy', value: 'When your requested time expires, the server burns. Save your data using the MEGA SAVE script on the desktop before time runs out.' },
                { name: '💀 4. Operator Responsibility', value: 'You are allowed to use pentesting and hacking tools. However, do not launch massive DDoS attacks that will permanently ban our provider IPs.' }
            )
            .setFooter({ text: 'Wick Security Enforcement', iconURL: WICK_AVATAR });

        await tosWebhook.send({ embeds: [tosEmbed] });
        console.log('[Wick] TOS posted!');
        await tosWebhook.delete();

        console.log("[Wick] All tasks completed. System exiting.");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
