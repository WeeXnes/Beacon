import {getJarPath, getServerByName, getServerDirectory} from "~/types/MinecraftServer";
import {execa} from "execa";
import { consola } from 'consola';
import { environment } from '~/core/globals';
import { saveJsonFile } from "~/util/jsonLoader";

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

        const subprocess = execa(javaBinary, [xmsArg, xmxArg, '-jar', getJarPath(server), 'nogui'], {
            cwd: getServerDirectory(server),
            stdin: 'pipe',
            buffer: false,
        });

        server.process = subprocess;
        server.pid = subprocess.pid;
        server.status = 'starting';
        server.onlinePlayers = [];
        
        // Save PID to persistent storage
        saveJsonFile();

        const handleLogLine = (data: Buffer, isErrorStream: boolean) => {
            const line = data.toString();
            
            // Player Join Parsing - Support modern and legacy
            const modernJoin = line.match(/\[.*INFO\][:\s]+(.*) joined the game/i);
            const legacyJoin = line.match(/\[.*INFO\][:\s]+(.*?)[\s]*\[\/.*\] logged in/i);
            const joinMatch = modernJoin || legacyJoin;
            
            if (joinMatch) {
                const playerName = joinMatch[1].trim();
                if (!server.onlinePlayers) server.onlinePlayers = [];
                if (!server.onlinePlayers.includes(playerName)) {
                    server.onlinePlayers.push(playerName);
                    consola.info(`[SERVER] 👤 Player joined: ${playerName} on "${server.name}"`);
                }
            }
            
            // Player Leave Parsing - Support modern and legacy
            const modernLeave = line.match(/\[.*INFO\][:\s]+(.*) left the game/i);
            const legacyLeave = line.match(/\[.*INFO\][:\s]+(.*?)[\s]*lost connection/i);
            const leaveMatch = modernLeave || legacyLeave;
            
            if (leaveMatch) {
                const playerName = leaveMatch[1].trim();
                if (server.onlinePlayers) {
                    server.onlinePlayers = server.onlinePlayers.filter(p => p !== playerName);
                    consola.info(`[SERVER] 👤 Player left: ${playerName} from "${server.name}"`);
                }
            }

            // Online Detection
            if (line.includes('Done') || 
                line.includes('For help, type "help"') || 
                line.includes('? for help') ||
                line.includes('Starting remote control listener') ||
                line.includes('Listening on /') || // Velocity
                line.includes('Booting up Velocity')) { // Velocity
                if (server.status !== 'online') {
                    server.status = 'online';
                    consola.success(`[SERVER] ✅ Server "${server.name}" is now online`);
                }
            }

            // Console Logging
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            if (isErrorStream) {
                if (trimmedLine.includes('Advanced terminal features are not available')) {
                    consola.warn(`[SERVER] ⚠️ [${server.name}] Terminal: ${trimmedLine}`);
                } else if (trimmedLine.includes('[INFO]') || trimmedLine.toLowerCase().includes('info')) {
                    // Legacy versions often log INFO to stderr
                    consola.log(`[SERVER] ℹ️ [${server.name}] ${trimmedLine}`);
                } else if (trimmedLine.includes('[WARNING]') || trimmedLine.toLowerCase().includes('warning')) {
                    consola.warn(`[SERVER] ⚠️ [${server.name}] ${trimmedLine}`);
                } else {
                    consola.error(`[SERVER] 🚩 [${server.name}] STDERR: ${trimmedLine}`);
                }
            }
        };

        subprocess.stdout.on('data', (data: Buffer) => handleLogLine(data, false));
        subprocess.stderr.on('data', (data: Buffer) => handleLogLine(data, true));

        subprocess.on('exit', (code: number) => {
            consola.info(`[SERVER] ⏹️ Server "${server.name}" exited with code ${code}`);
            server.process = null;
            server.pid = undefined;
            server.status = 'offline';
            server.onlinePlayers = [];
            saveJsonFile();
        });

        return { message: "Minecraft server started." };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Fatal error starting "${server_name}":`, error.message);
        return { message: "Failed to start Minecraft server.", error: error.message };
    }
});
