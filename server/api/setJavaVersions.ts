import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';
import * as path from 'path';
import * as fs from 'fs/promises';
import { execa } from 'execa';

const isSafeJavaPath = async (javaPath: string) => {
    if (!path.isAbsolute(javaPath)) return false;
    
    // Ensure it does not reside inside user-writable directories (data, servers, backups)
    const pathsToCheck = [environment.paths.data, environment.paths.servers, environment.paths.backups];
    for (const p of pathsToCheck) {
        const resolved = path.resolve(p);
        const rel = path.relative(resolved, javaPath);
        if (!rel.startsWith('..') && !path.isAbsolute(rel)) {
            return false; // Path is inside user-writable directory
        }
    }
    
    try {
        // Verify the file exists and is executable
        await fs.access(javaPath, fs.constants.X_OK);
        // Verify it behaves like Java
        const { stderr, stdout } = await execa(javaPath, ['-version']);
        const output = stderr + stdout;
        if (!output.toLowerCase().includes('java') && !output.toLowerCase().includes('openjdk') && !output.toLowerCase().includes('runtime')) {
            return false;
        }
        return true;
    } catch {
        return false;
    }
};

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { javaVersions } = body;

    if (!Array.isArray(javaVersions)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid data format. Expected an array." });
    }

    try {
        // Validate each Java version
        for (const java of javaVersions) {
            if (!java.name || typeof java.name !== 'string' || !/^[a-zA-Z0-9\s._-]+$/.test(java.name)) {
                throw createError({ statusCode: 400, statusMessage: `Invalid Java version name: ${java.name}` });
            }
            if (!java.path || typeof java.path !== 'string') {
                throw createError({ statusCode: 400, statusMessage: `Invalid Java path.` });
            }
            const isSafe = await isSafeJavaPath(java.path);
            if (!isSafe) {
                throw createError({ statusCode: 400, statusMessage: `Verification failed for Java binary path: ${java.path}. Must be a valid system Java executable outside the server directories.` });
            }
        }

        environment.settings.javaVersions = javaVersions;
        saveJsonFile();
        consola.success(`[CONFIG] ✅ Java versions updated`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating Java versions:`, error.message);
        throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Failed to update Java versions' });
    }
});
