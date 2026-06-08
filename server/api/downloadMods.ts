import { defineEventHandler, getQuery, createError } from 'h3';
import { getServerByName, getServerDirectory } from "~/types/MinecraftServer";
import archiver from 'archiver';
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

    if (server.project !== 'fabric' && server.project !== 'forge') {
        throw createError({ statusCode: 400, statusMessage: "Only modded servers support mod downloads" });
    }

    const serverDir = getServerDirectory(server);
    const modsDir = path.join(serverDir, 'mods');

    if (!fs.existsSync(modsDir)) {
        throw createError({ statusCode: 404, statusMessage: "Mods folder not found" });
    }

    const archive = archiver('zip', {
        zlib: { level: 9 }
    });

    archive.on('error', (err) => {
        console.error('Archiver error:', err);
        throw createError({ statusCode: 500, statusMessage: "Archive creation failed" });
    });

    // Set the headers
    event.node.res.setHeader('Content-Type', 'application/zip');
    event.node.res.setHeader('Content-Disposition', `attachment; filename="${server.name}_mods.zip"`);

    // Append files from the mods directory
    archive.directory(modsDir, false);

    // Finalize the archive
    archive.finalize();
    
    // Return the archive as a stream
    return archive;
});
