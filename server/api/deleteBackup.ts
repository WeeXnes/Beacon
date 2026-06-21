import { getServerByName } from "~/types/MinecraftServer";
import { environment } from "~/core/globals";
import * as fs from 'fs/promises';
import * as path from 'path';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, backupName } = body;
    const server = getServerByName(name);

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    const backupPath = path.join(environment.paths.backups, server.name, backupName);

    // Security check: ensure backupPath is within the server's backup directory
    const serverBackupDir = path.resolve(environment.paths.backups, server.name);
    const resolvedBackupPath = path.resolve(backupPath);
    const relativePath = path.relative(serverBackupDir, resolvedBackupPath);
    const isSafe = !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
    if (!isSafe) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    try {
        await fs.unlink(backupPath);
        consola.info(`[BACKUP] 🗑️ Backup deleted: ${backupPath}`);
        return { message: "Backup deleted successfully" };
    } catch (error: any) {
        consola.error(`[BACKUP] 🔥 Failed to delete backup:`, error.message);
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
