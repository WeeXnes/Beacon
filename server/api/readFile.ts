import { getServerDirectory, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import * as path from 'path';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, path: filePath } = body;
    const server = getServerByName(name);

    if (!server) {
        consola.error(`[FILES] ❌ Read failed: Server "${name}" not found`);
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    const baseDir = path.resolve(getServerDirectory(server));
    const targetPath = path.resolve(baseDir, filePath);

    // Security check: ensure targetPath is within baseDir
    const relativePath = path.relative(baseDir, targetPath);
    const isSafe = !relativePath.startsWith('..') && !path.isAbsolute(relativePath);
    if (!isSafe) {
        consola.warn(`[FILES] 🛡️ Blocked path traversal attempt on read: Server "${name}", Path: "${filePath}"`);
        throw createError({ statusCode: 403, statusMessage: "Forbidden" });
    }

    try {
        consola.info(`[FILES] 📄 [${name}] Reading file: ${filePath}`);
        const content = await fs.readFile(targetPath, 'utf-8');
        return { content };
    } catch (error: any) {
        consola.error(`[FILES] 🔥 Error reading "${targetPath}":`, error.message);
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});