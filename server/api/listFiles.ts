import { getServerDirectory, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import * as path from 'path';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, path: subPath } = body;
    const server = getServerByName(name);

    if (!server) throw createError({ statusCode: 404, statusMessage: "Server not found" });

    const baseDir = getServerDirectory(server);
    const targetDir = path.join(baseDir, subPath || '');

    // Security check: ensure targetDir is within baseDir
    if (!targetDir.startsWith(baseDir)) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    try {
        const entries = await fs.readdir(targetDir, { withFileTypes: true });
        return entries.map(entry => ({
            name: entry.name,
            isDirectory: entry.isDirectory(),
            size: 0, // Could add size later
            lastModified: new Date() // Could add mtime later
        }));
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
