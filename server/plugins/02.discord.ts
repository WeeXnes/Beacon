import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ActivityType } from 'discord.js';
import { environment } from '~/core/globals';
import { consola } from 'consola';
import { startMinecraftServer, stopMinecraftServer } from '../utils/serverControl';

let discordClient: Client | null = null;

export function updateDiscordStatus() {
    if (!discordClient || !discordClient.user) return;

    const runningServers = environment.settings.servers.filter(s => s.status === 'online').length;
    const statusText = `${runningServers} ${runningServers === 1 ? 'Server' : 'Servers'} running`;
    
    discordClient.user.setActivity(statusText, { type: ActivityType.Watching });
}

export default defineNitroPlugin(async (nitroApp) => {
    // Small delay to ensure 01.init.ts has finished loading settings
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const config = environment.settings?.discordConfig;

    if (!config || !config.token || !config.clientId || !config.guildId) {
        consola.info('[DISCORD] Bot integration is not fully configured (token, clientId, or guildId missing).');
        return;
    }

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
