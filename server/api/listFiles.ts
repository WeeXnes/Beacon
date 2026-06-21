import { getServerDirectory, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import * as path from 'path';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, path: subPath } = body;
    const server = getServerByName(name);

    if (!server) {
        consola.error(`[FILES] ❌ List failed: Server "${name}" not found`);
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    const baseDir = path.resolve(getServerDirectory(server));
    const targetDir = path.resolve(baseDir, subPath || '');

    // Security check: ensure targetDir is within baseDir
    const relativePath = path.relative(baseDir, targetDir);
    const isSafe = relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
    if (!isSafe) {
        consola.warn(`[FILES] 🛡️ Blocked path traversal attempt: Server "${name}", Path: "${subPath}"`);
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    try {
        consola.info(`[FILES] 📂 [${name}] Listing directory: ${subPath || '/'}`);
        const entries = await fs.readdir(targetDir, { withFileTypes: true });
        
        const files = await Promise.all(entries.map(async (entry) => {
            const entryPath = path.join(targetDir, entry.name);
            try {
                const stats = await fs.stat(entryPath);
                return {
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    size: stats.size,
                    lastModified: stats.mtime
                };
            } catch (e) {
                return {
                    name: entry.name,
                    isDirectory: entry.isDirectory(),
                    size: 0,
                    lastModified: new Date(0)
                };
            }
        }));

        return files;
    } catch (error: any) {
        consola.error(`[FILES] 🔥 Error listing "${targetDir}":`, error.message);
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
