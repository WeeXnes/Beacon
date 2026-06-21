import * as discord from 'discord.js';
import type { TextChannel, Message } from 'discord.js';
import { environment } from '~/core/globals';
import { consola } from 'consola';
import { startMinecraftServer, stopMinecraftServer } from '../utils/serverControl';
import { getServerByName, getPropertiesPath } from '~/types/MinecraftServer';
import { saveJsonFile } from '~/util/jsonLoader';
import * as fs from 'fs/promises';
import { parse } from 'ini';

const { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActivityType, EmbedBuilder } = discord;

export let discordClient: discord.Client | null = null;

export function updateDiscordStatus() {
    if (!discordClient || !discordClient.user) return;

    const runningServers = environment.settings.servers.filter(s => s.status === 'online').length;
    const statusText = `${runningServers} ${runningServers === 1 ? 'Server' : 'Servers'} running`;
    
    discordClient.user.setActivity(statusText, { type: ActivityType.Watching });
}

export async function sendServerStatusNotification(serverName: string, type: 'starting' | 'online' | 'stop') {
    if (!discordClient) return;

    const server = getServerByName(serverName);
    if (!server || !server.discordStatusConfig || !server.discordStatusConfig.enabled) return;

    const config = server.discordStatusConfig;
    if (!config.channelId) return;

    try {
        const channel = await discordClient.channels.fetch(config.channelId);
        if (!channel || !channel.isTextBased()) {
            consola.warn(`[DISCORD] Channel ${config.channelId} not found or not text-based.`);
            return;
        }

        let title = '';
        let color = config.embedColor || '#2ecc71';

        if (type === 'starting') {
            title = `⏳ ${server.name} is starting...`;
            color = '#f1c40f'; // Yellow
        } else if (type === 'online') {
            title = `✅ ${server.name} is online`;
            color = config.embedColor || '#2ecc71'; // Green
        } else {
            title = `🛑 ${server.name} has stopped`;
            color = '#e74c3c'; // Red
        }

        const embed = new EmbedBuilder()
            .setTitle(title)
            .setColor(color as any)
            .setTimestamp();

        const fields = [];

        if (config.showVersion) {
            fields.push({ name: 'Version', value: `\`${server.version}\``, inline: true });
        }

        if (config.showConnectionAddress && config.connectionAddress) {
            fields.push({ name: 'Connection', value: `\`${config.connectionAddress}\``, inline: true });
        }

        if (config.showMotd && (type === 'starting' || type === 'online')) {
            try {
                const propsPath = getPropertiesPath(server);
                const propsData = await fs.readFile(propsPath, 'utf-8');
                const props = parse(propsData);
                const motd = props.motd || 'No MOTD set';
                const cleanMotd = motd.replace(/§[0-9a-fk-or]/gi, '');
                embed.addFields({ name: 'MOTD', value: cleanMotd });
            } catch (e) { /* ignore */ }
        }

        if (config.showDownloadLink && server.publicModDownload) {
             const baseUrl = environment.settings.panelUrl;
             if (baseUrl && baseUrl.trim() !== '') {
                 // Ensure no spaces in URL for markdown
                 const downloadUrl = `${baseUrl.replace(/\/$/, '')}/download/${encodeURIComponent(server.name)}`;
                 fields.push({ name: 'Mods', value: `[Click to Download](${downloadUrl})`, inline: true });
             } else {
                 fields.push({ name: 'Mods', value: '*Panel URL not configured*', inline: true });
             }
        }

        if (fields.length > 0) {
            embed.addFields(fields);
        }

        if (config.customCaption) {
            embed.setDescription(config.customCaption);
        }

        if (type === 'online' && config.lastStatusMessageId) {
            try {
                const message = await (channel as TextChannel).messages.fetch(config.lastStatusMessageId);
                if (message) {
                    await message.edit({ embeds: [embed] });
                    consola.success(`[DISCORD] Updated starting message to online for ${serverName}`);
                    return;
                }
            } catch (e) {
                consola.warn(`[DISCORD] Could not find previous message ${config.lastStatusMessageId} to edit, sending new one.`);
            }
        }

        const sentMessage = await (channel as TextChannel).send({ embeds: [embed] });
        
        if (type === 'starting') {
            config.lastStatusMessageId = sentMessage.id;
            saveJsonFile();
        } else {
            config.lastStatusMessageId = undefined;
            saveJsonFile();
        }

        consola.success(`[DISCORD] Sent ${type} notification for ${serverName}`);
    } catch (error) {
        consola.error(`[DISCORD] Failed to send status notification for ${serverName}:`, error);
    }
}

export default defineNitroPlugin(async (nitroApp) => {
    // Small delay to ensure 01.init.ts has finished loading settings
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const config = environment.settings?.discordConfig;

    if (!config || !config.token || !config.clientId || !config.guildId) {
        consola.info('[DISCORD] Bot integration is not fully configured (token, clientId, or guildId missing).');
        return;
    }

    if (!environment.settings?.servers) return;

    const discordEnabledServers = environment.settings.servers
        .filter(s => s.discordEnabled)
        .map(s => s.name);

    if (discordEnabledServers.length > 0) {
        consola.info(`[DISCORD] Enabling bot control for: ${discordEnabledServers.join(', ')}`);
    } else {
        consola.warn('[DISCORD] Bot is configured, but no servers have "Discord Control" enabled.');
    }

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    discordClient = client;

    const commands = [
        new SlashCommandBuilder()
            .setName('start')
            .setDescription('Start a Minecraft server')
            .addStringOption(option =>
                option.setName('server')
                    .setDescription('The name of the server to start')
                    .setRequired(true)
                    .setAutocomplete(true)),
        new SlashCommandBuilder()
            .setName('stop')
            .setDescription('Stop a Minecraft server')
            .addStringOption(option =>
                option.setName('server')
                    .setDescription('The name of the server to stop')
                    .setRequired(true)
                    .setAutocomplete(true)),
    ].map(command => command.toJSON());

    const rest = new REST({ version: '10' }).setToken(config.token);

    try {
        consola.info('[DISCORD] Started refreshing application (/) commands.');
        await rest.put(
            Routes.applicationGuildCommands(config.clientId, config.guildId),
            { body: commands },
        );
        consola.success('[DISCORD] Successfully reloaded application (/) commands.');
    } catch (error) {
        consola.error('[DISCORD] Error reloading commands:', error);
    }

    client.on('interactionCreate', async interaction => {
        if (interaction.isAutocomplete()) {
            const focusedValue = interaction.options.getFocused();
            const choices = environment.settings.servers
                .filter(s => s.discordEnabled)
                .map(s => s.name);
            
            const filtered = choices.filter(choice => choice.toLowerCase().includes(focusedValue.toLowerCase()));
            await interaction.respond(
                filtered.map(choice => ({ name: choice, value: choice })),
            );
            return;
        }

        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const serverName = interaction.options.getString('server');

        if (!serverName) return;

        const server = environment.settings.servers.find(s => s.name === serverName);
        if (!server || !server.discordEnabled) {
            await interaction.reply({ content: `Server "${serverName}" is not available via Discord.`, ephemeral: true });
            return;
        }

        if (commandName === 'start') {
            await interaction.deferReply();
            const result = await startMinecraftServer(serverName);
            await interaction.editReply({ content: result.message });
        } else if (commandName === 'stop') {
            await interaction.deferReply();
            const result = await stopMinecraftServer(serverName);
            await interaction.editReply({ content: result.message });
        }
    });

    client.login(config.token).then(() => {
        consola.success('[DISCORD] Bot logged in successfully.');
        updateDiscordStatus();
    }).catch(err => {
        consola.error('[DISCORD] Bot login failed:', err);
    });

    nitroApp.hooks.hook('close', () => {
        consola.info('[DISCORD] Closing bot client...');
        client.destroy();
        discordClient = null;
    });
});
