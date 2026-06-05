import { Client, GatewayIntentBits, ActivityType, TextChannel, EmbedBuilder } from 'discord.js';
import { environment } from '~/core/globals';

let client: Client | null = null;

export const initDiscord = async () => {
    const config = environment.settings.discord;
    
    if (!config || !config.enabled || !config.token) {
        if (client) {
            console.log('[DISCORD] Disconnecting bot...');
            await client.destroy();
            client = null;
        }
        return;
    }

    // If already logged in with same token, just update presence
    if (client && client.token === config.token) {
        updateDiscordPresence();
        return;
    }

    if (client) {
        await client.destroy();
    }

    console.log('[DISCORD] Initializing bot...');
    client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.on('clientReady', () => {
        console.log(`[DISCORD] Logged in as ${client?.user?.tag}!`);
        updateDiscordPresence();
    });

    try {
        await client.login(config.token);
    } catch (error) {
        console.error('[DISCORD] Failed to login:', error);
        client = null;
    }
};

export const sendDiscordMessage = async (content: string | any) => {
    const config = environment.settings.discord;
    if (!client || !config || !config.enabled || !config.channelId) return;

    try {
        const channel = await client.channels.fetch(config.channelId);
        if (channel && channel.isTextBased()) {
            await (channel as TextChannel).send(content);
        }
    } catch (error) {
        console.error('[DISCORD] Failed to send message:', error);
    }
};

export const sendDiscordEmbed = async (title: string, description: string, color: number = 0x0099ff) => {
    const config = environment.settings.discord;
    if (!client || !config || !config.enabled || !config.channelId) return;

    try {
        const channel = await client.channels.fetch(config.channelId);
        if (channel && channel.isTextBased()) {
            const embed = new EmbedBuilder()
                .setTitle(title)
                .setDescription(description)
                .setColor(color)
                .setTimestamp();
            await (channel as TextChannel).send({ embeds: [embed] });
        }
    } catch (error) {
        console.error('[DISCORD] Failed to send embed:', error);
    }
};

export const updateDiscordPresence = () => {
    const config = environment.settings.discord;
    if (!client || !client.user || !config || !config.enabled || !config.showPresence) {
        if (client && client.user && (!config || !config.showPresence)) {
            client.user.setActivity();
        }
        return;
    }

    const onlineServers = environment.settings.servers.filter(s => s.status === 'online');
    const statusText = onlineServers.length > 0 
        ? `${onlineServers.length} server(s) online` 
        : 'idle';

    client.user.setActivity(statusText, { type: ActivityType.Watching });
};
