import { defineEventHandler } from 'h3';
import * as fs from 'fs/promises';
import * as path from 'path';
import { consola } from 'consola';
import { execa } from 'execa';

export default defineEventHandler(async (event) => {
    const discovered: { name: string, path: string }[] = [];
    
    // Potential search paths based on OS
    const searchPaths: string[] = [];
    if (process.platform === 'linux') {
        searchPaths.push('/usr/lib/jvm');
    } else if (process.platform === 'darwin') {
        searchPaths.push('/Library/Java/JavaVirtualMachines');
    } else if (process.platform === 'win32') {
        searchPaths.push('C:\\Program Files\\Java');
        searchPaths.push('C:\\Program Files (x86)\\Java');
    }

    for (const searchPath of searchPaths) {
        try {
            const entries = await fs.readdir(searchPath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory()) {
                    let javaPath = '';
                    if (process.platform === 'win32') {
                        javaPath = path.join(searchPath, entry.name, 'bin', 'java.exe');
                    } else {
                        javaPath = path.join(searchPath, entry.name, 'bin', 'java');
                        // Some distros have a slightly different structure
                        if (!(await fileExists(javaPath))) {
                            javaPath = path.join(searchPath, entry.name, 'jre', 'bin', 'java');
                        }
                    }

                    if (await fileExists(javaPath)) {
                        try {
                            // Try to get version info
                            const { stderr } = await execa(javaPath, ['-version']);
                            const versionMatch = stderr.match(/(?:java|openjdk) version "([^"]+)"/i) || stderr.match(/build (\d+\.\d+\.\d+_\d+)/i);
                            const versionName = versionMatch ? `Java ${versionMatch[1]}` : entry.name;
                            
                            discovered.push({
                                name: versionName,
                                path: javaPath
                            });
                        } catch (e) {
                            // Fallback if -version fails but binary exists
                            discovered.push({
                                name: entry.name,
                                path: javaPath
                            });
                        }
                    }
                }
            }
        } catch (e) {
            // Path doesn't exist or no permission, skip
        }
    }

    return discovered;
});

async function fileExists(filePath: string): Promise<boolean> {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}
