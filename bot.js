import {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ActivityType,
    PermissionFlagsBits,
} from "discord.js";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import "dotenv/config";

const XPLOIT_HUB_ID = "1459402620199374872";
const REPO_OWNER = "asrarkhann116-ops";
const REPO_NAME = "Xploit-hub-vps";
const VPS_CHANNEL_ID = "1497364285645652098";
const LIVE_CHANNEL_ID = process.env.LIVE_CHANNEL_ID;
const COOLDOWN_MS = 15 * 60 * 1000;

// Admins who can run multiple VPS slots simultaneously with no cooldown
const SUPER_ADMINS = new Set(["1104652354655113268"]);

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const OS_MAP = {
    ubuntu: {
        label: "Ubuntu 22.04",
        workflow: "vps.yml",
        access: "rdp",
        icon: "🐧",
    },
    kali: {
        label: "Kali Linux",
        workflow: "kali.yml",
        access: "rdp",
        icon: "💀",
    },
    tiny10: {
        label: "Tiny10 (Debloated Win10)",
        workflow: "tiny10.yml",
        access: "rdp",
        icon: "🪶",
    },
    tiny11: {
        label: "Tiny11 (Debloated Win11)",
        workflow: "tiny11.yml",
        access: "rdp",
        icon: "🪶",
    },
    debian: {
        label: "Debian 12",
        workflow: "debian.yml",
        access: "rdp",
        icon: "🌀",
    },
    fedora: {
        label: "Fedora 40",
        workflow: "fedora.yml",
        access: "rdp",
        icon: "🎩",
    },
    windows10: {
        label: "Windows 10",
        workflow: "rdp.yml",
        access: "rdp",
        icon: "👾",
    },
    windows11: {
        label: "Windows 11",
        workflow: "win11.yml",
        access: "rdp",
        icon: "🍷",
    },
    parrot: {
        label: "Parrot OS",
        workflow: "parrot.yml",
        access: "rdp",
        icon: "🦜",
    },
    android: {
        label: "Android 9",
        workflow: "android.yml",
        access: "browser",
        icon: "🤖",
    },
    vpn: {
        label: "VPN Server",
        workflow: "vpn.yml",
        access: "vpn",
        icon: "🔒",
    },
    proxy: {
        label: "SOCKS5 Proxy",
        workflow: "proxy.yml",
        access: "proxy",
        icon: "🌐",
    },
};

const WALLPAPER_MAP = {
    wall_default:  "https://images.wallpapersden.com/image/download/red-hacker-binary-code_bWZtZ2aUmZqaraWkpJRmbmdlrWZnZWU.jpg",
    wall_skull:    "https://images.wallpapersden.com/image/download/red-hacker-binary-code_bWZtZ2aUmZqaraWkpJRmbmdlrWZnZWU.jpg",
    wall_cyber:    "https://wallpapercave.com/wp/wp4906542.jpg",
    wall_matrix:   "https://wallpaperaccess.com/full/11554.jpg",
    wall_kali1:    "https://images.wallpapersden.com/image/download/kali-linux_bGpqZGaUmZqaraWkpJRmbmdlrWZnZWU.jpg",
    wall_kali2:    "https://images.wallpapersden.com/image/download/kali-linux-hacker_bGZlZ2WUmZqaraWkpJRmbmdlrWZnZWU.jpg",
    wall_dark:     "https://images.wallpapersden.com/image/download/dark-hacker_bWZpZWWUmZqaraWkpJRmbmdlrWZnZWU.jpg",
    wall_terminal: "https://images.wallpapersden.com/image/download/hacker-terminal_bGZoaGWUmZqaraWkpJRmbmdlrWZnZWU.jpg",
};

const commands = [
    new SlashCommandBuilder()
        .setName("vps")
        .setDescription("Launch a free VPS — pick any OS")
        .addStringOption((o) =>
            o
                .setName("os")
                .setDescription("Which operating system?")
                .setRequired(true)
                .addChoices(
                    { name: "🐧  Ubuntu 22.04  (RDP)", value: "ubuntu" },
                    { name: "💀  Kali Linux    (RDP)", value: "kali" },
                    { name: "🪶  Tiny10        (RDP)", value: "tiny10" },
                    { name: "🪶  Tiny11        (RDP)", value: "tiny11" },
                    { name: "🌀  Debian 12     (RDP)", value: "debian" },
                    { name: "🎩  Fedora 40     (RDP)", value: "fedora" },
                    { name: "🦜  Parrot OS     (RDP)", value: "parrot" },
                    { name: "🪟  Windows 10    (RDP)", value: "windows10" },
                    { name: "🪟  Windows 11    (RDP)", value: "windows11" },
                    { name: "🤖  Android 9     (Browser)", value: "android" },
                ),
        )
        .addStringOption((o) =>
            o
                .setName("duration")
                .setDescription("How long?")
                .setRequired(true)
                .addChoices(
                    { name: "15 Minutes", value: "15" },
                    { name: "30 Minutes", value: "30" },
                    { name: "1 Hour", value: "60" },
                    { name: "2 Hours", value: "120" },
                    { name: "4 Hours", value: "240" },
                    { name: "6 Hours", value: "360" },
                ),
        )
        .addStringOption((o) =>
            o
                .setName("wallpaper")
                .setDescription("Desktop wallpaper (Linux only)")
                .setRequired(false)
                .addChoices(
                    { name: "💀 Kali Red Binary (Default)",   value: "wall_default"  },
                    { name: "🐉 Kali Linux Official",         value: "wall_kali1"    },
                    { name: "👾 Kali Hacker Dark",            value: "wall_kali2"    },
                    { name: "🖥️ Hacker Terminal Green",       value: "wall_terminal" },
                    { name: "🌑 Dark Hacker",                 value: "wall_dark"     },
                    { name: "⚡ Cyberpunk Red",               value: "wall_cyber"    },
                    { name: "🟩 Dark Matrix",                 value: "wall_matrix"   },
                ),
        ),

    new SlashCommandBuilder()
        .setName("vps-status")
        .setDescription("Check your current VPS session"),

    new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check bot latency and uptime"),

    new SlashCommandBuilder()
        .setName("tools")
        .setDescription("Show all available tools for an OS")
        .addStringOption((o) =>
            o
                .setName("os")
                .setDescription("Which OS tools to list?")
                .setRequired(true)
                .addChoices(
                    { name: "💀 Kali Linux (100+ tools)", value: "kali"    },
                    { name: "🐧 Ubuntu",                  value: "ubuntu"  },
                    { name: "🦜 Parrot OS",               value: "parrot"  },
                    { name: "🌀 Debian",                  value: "debian"  },
                    { name: "🎩 Fedora",                  value: "fedora"  },
                ),
        ),

    new SlashCommandBuilder()
        .setName("vpn")
        .setDescription("Launch a free VPN — 1Gbps bore.pub tunnel, up to 6 hours")
        .addStringOption((o) =>
            o
                .setName("duration")
                .setDescription("How long?")
                .setRequired(true)
                .addChoices(
                    { name: "15 Minutes", value: "15" },
                    { name: "30 Minutes", value: "30" },
                    { name: "1 Hour",     value: "60" },
                    { name: "2 Hours",    value: "120" },
                    { name: "4 Hours",    value: "240" },
                    { name: "6 Hours",    value: "360" },
                ),
        ),

    new SlashCommandBuilder()
        .setName("proxy")
        .setDescription("Launch a free SOCKS5 proxy — 1Gbps bore.pub tunnel, up to 6 hours")
        .addStringOption((o) =>
            o
                .setName("duration")
                .setDescription("How long?")
                .setRequired(true)
                .addChoices(
                    { name: "15 Minutes", value: "15" },
                    { name: "30 Minutes", value: "30" },
                    { name: "1 Hour",     value: "60" },
                    { name: "2 Hours",    value: "120" },
                    { name: "4 Hours",    value: "240" },
                    { name: "6 Hours",    value: "360" },
                ),
        ),

    new SlashCommandBuilder()
        .setName("vps-admin")
        .setDescription("Admin: manage VPS sessions")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand((s) =>
            s.setName("list").setDescription("List all active sessions"),
        )
        .addSubcommand((s) =>
            s
                .setName("kick")
                .setDescription("Remove a user session")
                .addUserOption((o) =>
                    o
                        .setName("user")
                        .setDescription("User to kick")
                        .setRequired(true),
                ),
        )
        .addSubcommand((s) =>
            s.setName("clear").setDescription("Wipe ALL sessions"),
        )
        .addSubcommand((s) =>
            s
                .setName("announce")
                .setDescription("DM all active VPS users a message")
                .addStringOption((o) =>
                    o
                        .setName("message")
                        .setDescription("Message to broadcast")
                        .setRequired(true),
                ),
        ),
].map((c) => c.toJSON());

const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORD_BOT_TOKEN,
);

// DATABASE
const DATA_FILE = "./vps_data.json";
const MAX_SESSIONS = 20;
let db = { liveMessageId: null, sessions: [], cooldowns: {} };

function loadDB() {
    if (fs.existsSync(DATA_FILE)) {
        try {
            db = {
                liveMessageId: null,
                sessions: [],
                cooldowns: {},
                ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")),
            };
        } catch (e) {
            console.error("DB read error", e);
        }
    }
}

function saveDB() {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function cleanExpiredSessions() {
    const now = Date.now();
    db.sessions.forEach((s) => {
        if (s.expiresAt <= now) db.cooldowns[s.userId] = now + COOLDOWN_MS;
    });
    db.sessions = db.sessions.filter((s) => s.expiresAt > now);
    Object.keys(db.cooldowns).forEach((uid) => {
        if (db.cooldowns[uid] <= now) delete db.cooldowns[uid];
    });
    saveDB();
}

function getUserSession(uid) {
    return db.sessions.find((s) => s.userId === uid);
}
function getCooldown(uid) {
    return Math.max(0, (db.cooldowns[uid] || 0) - Date.now());
}

// BOT STATUS
function updateBotStatus() {
    const free = MAX_SESSIONS - db.sessions.length;
    client.user.setPresence({
        activities: [
            {
                name:
                    free > 0
                        ? `${free} slot${free !== 1 ? "s" : ""} free`
                        : "All slots full",
                type: ActivityType.Watching,
            },
        ],
        status: free > 0 ? "online" : "dnd",
    });
}

// LIVE EMBED
async function updateLiveMessage() {
    if (!LIVE_CHANNEL_ID || LIVE_CHANNEL_ID === "PUT_ID_HERE") return;
    cleanExpiredSessions();
    updateBotStatus();

    try {
        const channel = await client.channels.fetch(LIVE_CHANNEL_ID);
        if (!channel) return;

        const free = MAX_SESSIONS - db.sessions.length;
        const list =
            db.sessions.length === 0
                ? "✅ All slots empty. Servers standing by."
                : db.sessions
                      .map((s, i) => {
                          const left = Math.max(
                              0,
                              Math.floor((s.expiresAt - Date.now()) / 60000),
                          );
                          const os = OS_MAP[s.os] || {};
                          return `**${i + 1}.** ${os.icon || "💻"} <@${s.userId}> — \`${os.label || s.os}\` — \`${left} min left\``;
                      })
                      .join("\n");

        const embed = new EmbedBuilder()
            .setTitle("🛰️ Xploit HUB — VPS Live Status")
            .setColor(free > 0 ? "#00FF00" : "#FF0000")
            .addFields(
                {
                    name: "📊 Capacity",
                    value: `\`${db.sessions.length} / ${MAX_SESSIONS}\``,
                    inline: true,
                },
                { name: "🟢 Free Slots", value: `\`${free}\``, inline: true },
                { name: "\u200b", value: "\u200b", inline: true },
                { name: "💻 Active Operators", value: list },
            )
            .setFooter({ text: "Auto-updates every 30s" })
            .setTimestamp();

        let msg = null;
        if (db.liveMessageId) {
            try {
                msg = await channel.messages.fetch(db.liveMessageId);
            } catch {
                db.liveMessageId = null;
            }
        }
        if (!msg) {
            try {
                const hist = await channel.messages.fetch({ limit: 10 });
                msg = hist.find((m) => m.author.id === client.user.id);
                if (msg) {
                    db.liveMessageId = msg.id;
                    saveDB();
                }
            } catch {}
        }

        if (msg) {
            await msg.edit({ embeds: [embed] });
        } else {
            const nm = await channel.send({ embeds: [embed] });
            db.liveMessageId = nm.id;
            saveDB();
        }
    } catch {}
}

// READY
client.on("ready", async () => {
    console.log(`Xploit HUB Bot online as ${client.user.tag}`);
    loadDB();
    try {
        await rest.put(
            Routes.applicationGuildCommands(client.user.id, XPLOIT_HUB_ID),
            { body: commands },
        );
        console.log("Commands registered.");
    } catch (e) {
        console.error("Command registration error:", e);
    }
    updateBotStatus();
    setInterval(updateLiveMessage, 30000);
    updateLiveMessage();
});

// INTERACTIONS
client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    const { commandName } = interaction;

    // /vps-status
    if (commandName === "vps-status") {
        cleanExpiredSessions();
        const uid = interaction.user.id;
        const isSuper = SUPER_ADMINS.has(uid);

        if (isSuper) {
            const mySessions = db.sessions.filter((s) => s.userId === uid);
            if (!mySessions.length) {
                return interaction.reply({
                    content: `👑 **[Admin]** No active sessions. You can launch multiple at once!`,
                    ephemeral: true,
                });
            }
            const lines = mySessions.map((s, i) => {
                const left = Math.max(0, Math.floor((s.expiresAt - Date.now()) / 60000));
                const os = OS_MAP[s.os] || {};
                return `**${i + 1}.** ${os.icon || "💻"} \`${os.label || s.os}\` — \`${left} min left\``;
            }).join("\n");
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("👑 Your Active Sessions (Admin)")
                        .setColor("#FFD700")
                        .setDescription(lines)
                        .setFooter({ text: `${mySessions.length} session(s) running — no limits, no cooldown.` }),
                ],
                ephemeral: true,
            });
        }

        const session = getUserSession(uid);
        const cd = getCooldown(uid);
        if (session) {
            const left = Math.max(
                0,
                Math.floor((session.expiresAt - Date.now()) / 60000),
            );
            const os = OS_MAP[session.os] || {};
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("💻 Your Active Session")
                        .setColor("#00BFFF")
                        .addFields(
                            {
                                name: "OS",
                                value: `${os.icon || ""} ${os.label || session.os}`,
                                inline: true,
                            },
                            {
                                name: "Time Remaining",
                                value: `\`${left} minutes\``,
                                inline: true,
                            },
                        )
                        .setFooter({
                            text: "Machine self-destructs when timer hits zero.",
                        }),
                ],
                ephemeral: true,
            });
        } else if (cd > 0) {
            return interaction.reply({
                content: `⏳ **Cooldown:** Wait \`${Math.ceil(cd / 60000)} minutes\` before claiming another VPS.`,
                ephemeral: true,
            });
        } else {
            return interaction.reply({
                content: `✅ No active session. Head to <#${VPS_CHANNEL_ID}> to launch one.`,
                ephemeral: true,
            });
        }
    }

    // /vps-admin
    if (commandName === "vps-admin") {
        if (
            !interaction.memberPermissions?.has(
                PermissionFlagsBits.Administrator,
            )
        )
            return interaction.reply({
                content: "❌ Admins only.",
                ephemeral: true,
            });

        cleanExpiredSessions();
        const sub = interaction.options.getSubcommand();

        if (sub === "list") {
            if (!db.sessions.length)
                return interaction.reply({
                    content: "✅ No active sessions.",
                    ephemeral: true,
                });
            const lines = db.sessions
                .map((s, i) => {
                    const left = Math.max(
                        0,
                        Math.floor((s.expiresAt - Date.now()) / 60000),
                    );
                    const os = OS_MAP[s.os] || {};
                    return `**${i + 1}.** ${os.icon || "💻"} <@${s.userId}> (\`${s.userName}\`) — \`${os.label || s.os}\` — \`${left} min left\``;
                })
                .join("\n");
            return interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("📋 Active Sessions")
                        .setDescription(lines)
                        .setColor("#FFA500"),
                ],
                ephemeral: true,
            });
        }

        if (sub === "kick") {
            const target = interaction.options.getUser("user");
            const before = db.sessions.length;
            db.sessions = db.sessions.filter((s) => s.userId !== target.id);
            saveDB();
            updateLiveMessage();
            return interaction.reply({
                content:
                    db.sessions.length < before
                        ? `✅ Kicked **${target.username}** from their session.`
                        : `⚠️ **${target.username}** had no active session.`,
                ephemeral: true,
            });
        }

        if (sub === "clear") {
            db.sessions = [];
            saveDB();
            updateLiveMessage();
            return interaction.reply({
                content: "🗑️ All sessions cleared.",
                ephemeral: true,
            });
        }

        if (sub === "announce") {
            const msg = interaction.options.getString("message");
            if (!db.sessions.length)
                return interaction.reply({ content: "⚠️ No active sessions to announce to.", ephemeral: true });

            await interaction.deferReply({ ephemeral: true });
            let sent = 0;
            for (const s of db.sessions) {
                try {
                    const u = await client.users.fetch(s.userId);
                    await u.send(
                        `📢 **Xploit HUB Announcement**\n${msg}\n\n*From: Server Admin*`
                    );
                    sent++;
                } catch {}
            }
            return interaction.editReply({ content: `✅ Announcement sent to **${sent}** active VPS users.` });
        }
    }

    // /ping
    if (commandName === "ping") {
        const ws = client.ws.ping;
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        return interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🏓 Xploit HUB — Bot Status")
                    .setColor("#00FF41")
                    .addFields(
                        { name: "📡 WebSocket Latency", value: `\`${ws}ms\``,                               inline: true },
                        { name: "⏱️ Uptime",             value: `\`${h}h ${m}m ${s}s\``,                    inline: true },
                        { name: "💻 Active Sessions",    value: `\`${db.sessions.length} / ${MAX_SESSIONS}\``, inline: true },
                        { name: "🛰️ Status",             value: `\`Online & Operational\``,                  inline: true },
                    )
                    .setFooter({ text: "Xploit HUB VPS System" })
                    .setTimestamp(),
            ],
            ephemeral: true,
        });
    }

    // /tools
    if (commandName === "tools") {
        const os = interaction.options.getString("os");
        const TOOL_LISTS = {
            kali: {
                color: "#FF0000",
                icon: "💀",
                label: "Kali Linux — Full Arsenal (100+ Tools)",
                fields: [
                    { name: "🔍 Recon",          value: "`nmap` `masscan` `amass` `subfinder` `theharvester` `recon-ng` `fierce` `dnsenum` `dnsrecon` `httprobe` `waybackurls` `assetfinder` `gau`" },
                    { name: "🌐 Web Scanning",    value: "`nuclei` `nikto` `sqlmap` `wpscan` `whatweb` `gobuster` `dirb` `wfuzz` `ffuf` `dalfox` `naabu` `httpx`" },
                    { name: "🔑 Password Attack", value: "`hydra` `medusa` `john` `hashcat` `crunch` `cewl` `wordlists/rockyou`" },
                    { name: "📡 Network",         value: "`tcpdump` `wireshark` `socat` `ettercap` `arpwatch` `macchanger` `dsniff` `proxychains4` `tor`" },
                    { name: "💥 Exploitation",    value: "`metasploit` `msfvenom` `exploitdb` `searchsploit`" },
                    { name: "📶 Wireless",        value: "`aircrack-ng` `wifite` `reaver` `mdk4`" },
                    { name: "🔬 Forensics / RE",  value: "`binwalk` `foremost` `steghide` `exiftool` `autopsy` `gdb` `radare2` `strace` `ltrace`" },
                    { name: "🐍 Python / Go",     value: "`impacket` `scapy` `pwntools` `shodan` `paramiko` `ldap3` `subfinder` `httpx` `ffuf` `gau`" },
                ],
            },
            ubuntu: {
                color: "#FF6600",
                icon: "🐧",
                label: "Ubuntu 22.04 — Tools",
                fields: [{ name: "🛠️ Installed", value: "`nmap` `sqlmap` `nuclei` `dirb` `net-tools` `ncat` `python3` `git` `curl` `wget`" }],
            },
            parrot: {
                color: "#00CED1",
                icon: "🦜",
                label: "Parrot OS — Tools",
                fields: [{ name: "🛠️ Installed", value: "`nmap` `sqlmap` `nikto` `gobuster` `john` `hashcat` `tor` `whois` `dnsutils`" }],
            },
            debian: {
                color: "#A80030",
                icon: "🌀",
                label: "Debian 12 — Tools",
                fields: [{ name: "🛠️ Installed", value: "`nmap` `net-tools` `python3` `git` `curl` `wget`" }],
            },
            fedora: {
                color: "#294172",
                icon: "🎩",
                label: "Fedora 40 — Tools",
                fields: [{ name: "🛠️ Installed", value: "`nmap` `net-tools` `python3` `git` `curl` `htop`" }],
            },
        };

        const info = TOOL_LISTS[os] || TOOL_LISTS.ubuntu;
        const embed = new EmbedBuilder()
            .setTitle(`${info.icon} ${info.label}`)
            .setColor(info.color)
            .setFooter({ text: "Type any tool name in the VPS terminal to use it." })
            .setTimestamp();
        for (const f of info.fields) embed.addFields(f);

        return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // /vps
    if (commandName === "vps") {
        if (interaction.channelId !== VPS_CHANNEL_ID)
            return interaction.reply({
                content: `⚠️ Use this command in <#${VPS_CHANNEL_ID}> only.`,
                ephemeral: true,
            });
        if (interaction.guildId !== XPLOIT_HUB_ID)
            return interaction.reply({
                content: "❌ Exclusive to **Xploit HUB**.",
                ephemeral: true,
            });

        cleanExpiredSessions();

        const isSuper = SUPER_ADMINS.has(interaction.user.id);

        if (!isSuper && getUserSession(interaction.user.id))
            return interaction.reply({
                content: `🚫 You already have an active VPS. Use \`/vps-status\` to check it.`,
                ephemeral: true,
            });

        const cd = getCooldown(interaction.user.id);
        if (!isSuper && cd > 0)
            return interaction.reply({
                content: `⏳ **Cooldown:** Wait \`${Math.ceil(cd / 60000)} minutes\` before your next VPS.`,
                ephemeral: true,
            });

        if (db.sessions.length >= MAX_SESSIONS)
            return interaction.reply({
                content: `🚫 All **${MAX_SESSIONS}** slots are full. Check <#${LIVE_CHANNEL_ID}> for availability.`,
                ephemeral: true,
            });

        const osKey = interaction.options.getString("os");
        const wallKey =
            interaction.options.getString("wallpaper") || "wall_default";
        const wallpaper = WALLPAPER_MAP[wallKey];
        const osInfo = OS_MAP[osKey];

        if (!osInfo)
            return interaction.reply({
                content: "❌ Unknown OS selected.",
                ephemeral: true,
            });

        const duration = interaction.options.getString("duration");

        const accessHint = {
            browser: "🌐 You'll get a **browser link** — open it and enter password `phantom`.",
            rdp:     "🖥️ You'll get a **bore.pub address** — open Remote Desktop Connection, User: `xploit`, Pass: `phantom`.",
            vpn:     "🔒 You'll get an **OpenVPN config file** (`.ovpn`) in your DMs — import it in the OpenVPN client and connect. All traffic routes through the 1Gbps server.",
            proxy:   "🌐 You'll get **SOCKS5 proxy credentials** in your DMs — works in any browser (FoxyProxy) or system proxy settings.",
        }[osInfo.access];

        try {
            db.sessions.push({
                userId: interaction.user.id,
                userName: interaction.user.username,
                os: osKey,
                startedAt: Date.now(),
                expiresAt: Date.now() + (parseInt(duration) + 5) * 60000,
            });
            saveDB();
            updateLiveMessage();

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${osInfo.icon} ${osInfo.label} Launching...`)
                        .setColor("#00FF41")
                        .setDescription(
                            `Your machine is spinning up.\n**Check your DMs in 2–3 minutes** for the connection details.\n\n${accessHint}`,
                        )
                        .addFields(
                            {
                                name: "⏱ Duration",
                                value: `\`${duration} minutes\``,
                                inline: true,
                            },
                            {
                                name: "🔢 Slot",
                                value: `\`${db.sessions.length} / ${MAX_SESSIONS}\``,
                                inline: true,
                            },
                        )
                        .setFooter({
                            text: "Use /vps-status to check your session anytime.",
                        }),
                ],
                ephemeral: true,
            });

            await octokit.actions.createWorkflowDispatch({
                owner: REPO_OWNER,
                repo: REPO_NAME,
                workflow_id: osInfo.workflow,
                ref: "main",
                inputs: {
                    user_id: interaction.user.id,
                    user_name: interaction.user.username,
                    duration: duration,
                    wallpaper_url: wallpaper,
                },
            });
        } catch (error) {
            console.error("Dispatch error:", error);
            db.sessions = db.sessions.filter(
                (s) => s.userId !== interaction.user.id,
            );
            saveDB();
            updateLiveMessage();
            await interaction.followUp({
                content: `❌ **Launch Failed:** GitHub Actions dispatch error. Try again shortly.`,
                ephemeral: true,
            });
        }
    }
    // /vpn and /proxy
    if (commandName === "vpn" || commandName === "proxy") {
        if (interaction.channelId !== VPS_CHANNEL_ID)
            return interaction.reply({
                content: `⚠️ Use this command in <#${VPS_CHANNEL_ID}> only.`,
                ephemeral: true,
            });
        if (interaction.guildId !== XPLOIT_HUB_ID)
            return interaction.reply({
                content: "❌ Exclusive to **Xploit HUB**.",
                ephemeral: true,
            });

        cleanExpiredSessions();

        const isSuper = SUPER_ADMINS.has(interaction.user.id);

        if (!isSuper && getUserSession(interaction.user.id))
            return interaction.reply({
                content: `🚫 You already have an active session. Use \`/vps-status\` to check it.`,
                ephemeral: true,
            });

        const cd = getCooldown(interaction.user.id);
        if (!isSuper && cd > 0)
            return interaction.reply({
                content: `⏳ **Cooldown:** Wait \`${Math.ceil(cd / 60000)} minutes\` before your next session.`,
                ephemeral: true,
            });

        if (db.sessions.length >= MAX_SESSIONS)
            return interaction.reply({
                content: `🚫 All **${MAX_SESSIONS}** slots are full.`,
                ephemeral: true,
            });

        const osKey    = commandName;
        const osInfo   = OS_MAP[osKey];
        const duration = interaction.options.getString("duration");

        const hints = {
            vpn:   "🔒 You'll get an **OpenVPN `.ovpn` file** in your DMs — import it in the OpenVPN client and connect. All traffic routes through the 1Gbps server.",
            proxy: "🌐 You'll get **SOCKS5 proxy credentials** in your DMs — configure in any browser (FoxyProxy) or system proxy settings.",
        };

        try {
            db.sessions.push({
                userId:    interaction.user.id,
                userName:  interaction.user.username,
                os:        osKey,
                startedAt: Date.now(),
                expiresAt: Date.now() + (parseInt(duration) + 5) * 60000,
            });
            saveDB();
            updateLiveMessage();

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`${osInfo.icon} ${osInfo.label} Launching...`)
                        .setColor("#00FF41")
                        .setDescription(
                            `Server is spinning up.\n**Check your DMs in 1–2 minutes** for connection details.\n\n${hints[osKey]}`,
                        )
                        .addFields(
                            { name: "⏱ Duration", value: `\`${duration} minutes\``, inline: true },
                            { name: "🔢 Slot",     value: `\`${db.sessions.length} / ${MAX_SESSIONS}\``, inline: true },
                        )
                        .setFooter({ text: "Use /vps-status to check your session anytime." }),
                ],
                ephemeral: true,
            });

            await octokit.actions.createWorkflowDispatch({
                owner:       REPO_OWNER,
                repo:        REPO_NAME,
                workflow_id: osInfo.workflow,
                ref:         "main",
                inputs: {
                    user_id:   interaction.user.id,
                    user_name: interaction.user.username,
                    duration:  duration,
                },
            });
        } catch (error) {
            console.error("Dispatch error:", error);
            db.sessions = db.sessions.filter((s) => s.userId !== interaction.user.id);
            saveDB();
            updateLiveMessage();
            await interaction.followUp({
                content: `❌ **Launch Failed:** GitHub Actions dispatch error. Try again shortly.`,
                ephemeral: true,
            });
        }
    }
});

client.login(process.env.DISCORD_BOT_TOKEN);
