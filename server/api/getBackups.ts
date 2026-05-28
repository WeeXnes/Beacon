import { getServerByName } from "~/types/MinecraftServer";
import { environment } from "~/core/globals";
import * as fs from 'fs/promises';
import * as path from 'path';
import type { Backup } from "~/types/Backup";

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const name = query.name as string;
    const server = getServerByName(name);

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    const backupDir = path.join(environment.paths.backups, server.name);

    try {
        await fs.access(backupDir);
    } catch (e) {
        // Directory doesn't exist, return empty list
        return [];
    }

    try {
        const files = await fs.readdir(backupDir);
        const backups: Backup[] = await Promise.all(
            files
                .filter(file => file.endsWith('.tar.gz'))
                .map(async (file) => {
                    const stats = await fs.stat(path.join(backupDir, file));
                    return {
                        name: file,
                        size: stats.size,
                        date: stats.mtime
                    };
                })
        );

        // Sort by date descending (newest first)
        return backups.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
