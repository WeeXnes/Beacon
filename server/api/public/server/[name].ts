import { defineEventHandler, getRouterParam, createError } from 'h3';
import { getLogsPath, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import { existsSync } from 'fs';

export default defineEventHandler(async (event) => {
    const name = getRouterParam(event, 'name');
    if (!name) {
        throw createError({ statusCode: 400, statusMessage: "Server name is required" });
    }

    const server = getServerByName(name);
    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    let publicLogs: string[] = [];
    try {
        const logPath = getLogsPath(server);
        if (existsSync(logPath)) {
            const rawLogs = await fs.readFile(logPath, 'utf-8');
            const lines = rawLogs.split('\n');
            
            // Filter for chat, join/left, and advancements
            // Standard format: [12:34:56] [Server thread/INFO]: <Player> Message
            // Also handle variants like [12:34:56] [User Authenticator #1/INFO]: UUID of player Player is ... (Skip these)
            
            publicLogs = lines.filter(line => {
                const isInfo = line.includes('[Server thread/INFO]');
                if (!isInfo) return false;

                const isChat = line.includes('> ');
                const isJoinLeave = line.includes(' joined the game') || line.includes(' left the game');
                const isAdvancement = line.includes(' has made the advancement ');
                const isDeath = line.includes(' was slain by ') || line.includes(' drowned') || line.includes(' burned to death') || line.includes(' hit the ground too hard'); // Simple death check

                return isChat || isJoinLeave || isAdvancement || isDeath;
            }).slice(-50); // Last 50 relevant messages
        }
    } catch (error) {
        console.error(`Error reading logs for public API:`, error);
    }

    return {
        name: server.name,
        status: server.status,
        version: server.version,
        onlinePlayers: server.onlinePlayers || [],
        maxPlayers: server.maxPlayers,
        logs: publicLogs
    };
});
