import { defineEventHandler } from 'h3';
import { getServerByName } from "~/types/MinecraftServer";
import { saveJsonFile } from "~/util/jsonLoader";
import { environment } from "~/core/globals";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const updatedServers = body.servers;

    if (!Array.isArray(updatedServers)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid data format" });
    }

    // Apply basic validation and normalization
    environment.settings.servers = updatedServers.map(s => {
        return {
            name: s.name,
            version: s.version,
            jarName: s.jarName,
            project: s.project,
            maxMemory: s.maxMemory,
            status: s.status || 'offline',
            process: null,
            javaVersionName: s.javaVersionName,
            pid: s.pid,
            onlinePlayers: s.onlinePlayers || [],
            maxPlayers: s.maxPlayers || 20,
            baseDomain: s.baseDomain,
            stats: s.stats,
            discordEnabled: s.discordEnabled,
            publicModDownload: s.publicModDownload
        };
    });

    saveJsonFile();
    return { success: true };
});
