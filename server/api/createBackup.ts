import { getServerByName, getServerDirectory } from "~/types/MinecraftServer";
import { environment } from "~/core/globals";
import { execa } from "execa";
import { consola } from 'consola';
import * as path from 'path';
import { createPathIfNotExists } from "~/util/jsonLoader";
import { getAuditUser, writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name } = body;
    const server = getServerByName(name);
    const user = getAuditUser(event);

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    const backupDir = path.join(environment.paths.backups, server.name);
    createPathIfNotExists(backupDir);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.tar.gz`;
    const backupPath = path.join(backupDir, backupFileName);
    const serverDir = getServerDirectory(server);

    try {
        consola.info(`[BACKUP] 📦 Creating backup for "${server.name}": ${backupFileName}`);
        
        // Execute tar: -c (create), -z (gzip), -f (file)
        // -C changes directory before performing the operation
        await execa('tar', ['-czf', backupPath, '-C', serverDir, '.']);

        consola.success(`[BACKUP] ✅ Backup created successfully: ${backupPath}`);
        writeAuditLog('CREATE_BACKUP', 'SUCCESS', user, `Created backup for server "${server.name}": ${backupFileName}`, event);
        return { message: "Backup created successfully", name: backupFileName };
    } catch (error: any) {
        consola.error(`[BACKUP] 🔥 Backup failed for "${server.name}":`, error.message);
        writeAuditLog('CREATE_BACKUP', 'FAILED', user, `Failed to create backup for server "${server.name}": ${error.message}`, event);
        throw createError({ statusCode: 500, statusMessage: `Backup failed` });
    }
});
