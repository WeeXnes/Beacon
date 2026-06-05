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
    const chatMatch = line.match(/<([^>]+)> (.*)/);
    if (chatMatch) {
        sendDiscordEmbed(`Chat in ${serverName}`, `${chatMatch[1]}: ${chatMatch[2]}`, 0x00ff00);
        return;
    }

    if (line.includes('joined the game')) {
        sendDiscordEmbed('Player Joined', line.split('INFO]: ')[1], 0x0000ff);
    } else if (line.includes('left the game')) {
        sendDiscordEmbed('Player Left', line.split('INFO]: ')[1], 0xff0000);
    } else if (line.includes('has made the advancement')) {
        sendDiscordEmbed('Advancement', line.split('INFO]: ')[1], 0xffff00);
    }
}
