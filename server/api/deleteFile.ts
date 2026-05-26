import { getServerDirectory, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import * as path from 'path';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, path: filePath } = body;
    const server = getServerByName(name);

    if (!server) {
        consola.error(`[FILES] ❌ Delete failed: Server "${name}" not found`);
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    const baseDir = path.resolve(getServerDirectory(server));
    const targetPath = path.resolve(baseDir, filePath);

    // Security check: ensure targetPath is within baseDir
    if (!targetPath.startsWith(baseDir)) {
        consola.warn(`[FILES] 🛡️ Blocked path traversal attempt on delete: Server "${name}", Path: "${filePath}"`);
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    try {
        consola.info(`[FILES] 🗑️ [${name}] Deleting file: ${filePath}`);
        const stats = await fs.stat(targetPath);
        if (stats.isDirectory()) {
            await fs.rm(targetPath, { recursive: true, force: true });
        } else {
            await fs.unlink(targetPath);
        }
        return { success: true };
    } catch (error: any) {
        consola.error(`[FILES] 🔥 Error deleting "${targetPath}":`, error.message);
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});