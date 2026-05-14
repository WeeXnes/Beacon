import {getJarPath, getServerByName, getServerDirectory} from "~/types/MinecraftServer";
import {execa} from "execa";
import { consola } from 'consola';
import { environment } from '~/core/globals';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server = getServerByName(server_name);
    if(!server) {
        consola.error(`[SERVER] ❌ Start failed: Server "${server_name}" does not exist`);
        return  { message: "Server with name " + server_name + " does not exist" };
    }
    if (server.process) {
        consola.warn(`[SERVER] ⚠️ Start skipped: Server "${server_name}" is already running`);
        return { message: "Minecraft server is already running." };
    }

    try {
        const xmsArg = `-Xms${server.maxMemory}G`
        const xmxArg = `-Xmx${server.maxMemory}G`

        // Determine Java binary
        let javaBinary = 'java';
        if (server.javaVersionName) {
            const javaVersion = environment.settings.javaVersions.find(v => v.name === server.javaVersionName);
            if (javaVersion) {
                javaBinary = javaVersion.path;
            } else {
                consola.warn(`[SERVER] ⚠️ Configured Java version "${server.javaVersionName}" not found, falling back to system "java"`);
            }
        }

        consola.start(`[SERVER] 🚀 Starting server "${server.name}" using ${javaBinary} (${xmsArg}, ${xmxArg})`);

        server.process = execa(javaBinary, [xmsArg, xmxArg, '-jar', getJarPath(server), 'nogui'], {
            cwd: getServerDirectory(server),
        });

        server.status = 'starting';

        server.process.stdout.on('data', (data: Buffer) => {
            const line = data.toString();
            if (line.includes('Done') || 
                line.includes('For help, type "help"') || 
                line.includes('? for help') ||
                line.includes('Starting remote control listener')) {
                server.status = 'online';
                consola.success(`[SERVER] ✅ Server "${server.name}" is now online`);
            }
        });

        server.process.stderr.on('data', (data: Buffer) => {
            const line = data.toString().trim();
            if (line.includes('Advanced terminal features are not available')) {
                consola.warn(`[SERVER] ⚠️ [${server.name}] Terminal: ${line}`);
            } else {
                consola.error(`[SERVER] 🚩 [${server.name}] STDERR: ${line}`);
            }
        });

        server.process.on('exit', (code: number) => {
            consola.info(`[SERVER] ⏹️ Server "${server.name}" exited with code ${code}`);
            server.process = null;
            server.status = 'offline';
        });

        return { message: "Minecraft server started." };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Fatal error starting "${server_name}":`, error.message);
        return { message: "Failed to start Minecraft server.", error: error.message };
    }
});
