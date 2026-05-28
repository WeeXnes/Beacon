import { getServerByName, getServerDirectory } from "~/types/MinecraftServer";
import { environment } from "~/core/globals";
import { execa } from "execa";
import { consola } from 'consola';
import * as path from 'path';
import * as fs from 'fs/promises';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, backupName } = body;
    const server = getServerByName(name);

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    if (server.status !== 'offline') {
        throw createError({ statusCode: 400, statusMessage: "Server must be offline to restore a backup" });
    }

    const backupPath = path.join(environment.paths.backups, server.name, backupName);
    const serverDir = getServerDirectory(server);

    // Security check: ensure backupPath is within the server's backup directory
    const serverBackupDir = path.resolve(environment.paths.backups, server.name);
    if (!path.resolve(backupPath).startsWith(serverBackupDir)) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    try {
        consola.info(`[BACKUP] 🔄 Restoring backup for "${server.name}": ${backupName}`);
        
        // 1. Wipe current server directory
        await fs.rm(serverDir, { recursive: true, force: true });
        
        // 2. Recreate directory
        await fs.mkdir(serverDir, { recursive: true });

        // 3. Extract tar: -x (extract), -z (gzip), -f (file)
        // -C changes directory before performing the operation
        await execa('tar', ['-xzf', backupPath, '-C', serverDir]);

        consola.success(`[BACKUP] ✅ Backup restored successfully: ${serverDir}`);
        return { message: "Backup restored successfully" };
    } catch (error: any) {
        consola.error(`[BACKUP] 🔥 Restoration failed for "${server.name}":`, error.message);
        throw createError({ statusCode: 500, statusMessage: `Restoration failed: ${error.message}` });
    }
});
