import { defineEventHandler, getQuery, createError } from 'h3';
import { getServerByName, getServerDirectory } from "~/types/MinecraftServer";
import * as fs from 'fs';
import * as path from 'path';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const serverName = query.name as string;
    const server = getServerByName(serverName);

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    if (!server.publicModDownload) {
        throw createError({ statusCode: 403, statusMessage: "Mod download is disabled for this server" });
    }

    const serverDir = getServerDirectory(server);
    const modsDir = path.join(serverDir, 'mods');

    if (!fs.existsSync(modsDir)) {
        return { 
            serverName: server.name,
            version: server.version,
            mods: [] 
        };
    }

    try {
        const files = fs.readdirSync(modsDir, { withFileTypes: true });
        const mods = files
            .filter(file => file.isFile() && file.name.endsWith('.jar'))
            .map(file => {
                const stats = fs.statSync(path.join(modsDir, file.name));
                return {
                    name: file.name,
                    size: stats.size
                };
            });

        return {
            serverName: server.name,
            version: server.version,
            mods: mods
        };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: `Failed to list mods: ${error.message}` });
    }
});
