import { environment } from '~/core/globals';
import { getLogsPath } from '~/types/MinecraftServer';
import { sendDiscordEmbed } from '~/server/utils/discord';
import * as fs from 'fs';

const lastProcessedLine = new Map<string, number>();

export default defineNitroPlugin((nitroApp) => {
    setInterval(async () => {
        for (const server of environment.settings.servers) {
            if (server.status !== 'online') continue;

            const logPath = getLogsPath(server);
            if (!fs.existsSync(logPath)) continue;

            try {
                const stats = fs.statSync(logPath);
                const fileSize = stats.size;
                const lastLine = lastProcessedLine.get(server.name) || 0;

                if (fileSize > lastLine) {
                    const stream = fs.createReadStream(logPath, { start: lastLine, end: fileSize });
                    const logs = await new Promise<string>((resolve) => {
                        let data = '';
                        stream.on('data', (chunk) => data += chunk);
                        stream.on('end', () => resolve(data));
                    });

                    lastProcessedLine.set(server.name, fileSize);

                    const lines = logs.split('\n');
                    for (const line of lines) {
                        if (line.includes('[Server thread/INFO]')) {
                            processLogLine(server.name, line);
                        }
                    }
                } else if (fileSize < lastLine) {
                    // Log rotated
                    lastProcessedLine.set(server.name, fileSize);
                }
            } catch (error) {
                console.error(`Error monitoring logs for ${server.name}:`, error);
            }
        }
    }, 5000);
});

function processLogLine(serverName: string, line: string) {
    const infoPart = line.split('INFO]: ')[1];
    if (!infoPart) return;

    // Chat
    const chatMatch = infoPart.match(/<([^>]+)> (.*)/);
    if (chatMatch) {
        sendDiscordEmbed(`💬 Chat in ${serverName}`, `${chatMatch[1]}: ${chatMatch[2]}`, 0x00ff00);
        return;
    }

    // Join
    if (infoPart.includes('joined the game')) {
        sendDiscordEmbed('🎮 Player Joined', `**${infoPart.replace(' joined the game', '')}** joined **${serverName}**`, 0x0000ff);
        return;
    }

    // Leave
    if (infoPart.includes('left the game')) {
        sendDiscordEmbed('👋 Player Left', `**${infoPart.replace(' left the game', '')}** left **${serverName}**`, 0xff0000);
        return;
    }

    // Advancement
    if (infoPart.includes('has made the advancement')) {
        sendDiscordEmbed('🏆 Advancement', infoPart, 0xffff00);
        return;
    }
    
    // Death
    if (infoPart.includes(' was slain by ') || infoPart.includes(' drowned') || infoPart.includes(' burned to death') || infoPart.includes(' hit the ground too hard')) {
        sendDiscordEmbed('💀 Death', infoPart, 0x800080);
        return;
    }
}
