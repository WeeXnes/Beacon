import {getJarPath, getServerByName, getServerDirectory, type MinecraftServer} from "~/types/MinecraftServer";
import {execa} from "execa";
import { consola } from 'consola';
import { environment } from '~/core/globals';
import { saveJsonFile } from "~/util/jsonLoader";
import { updateDiscordStatus, sendServerStatusNotification } from '../plugins/02.discord';
import * as fs from 'fs';
import * as path from 'path';

export async function startMinecraftServer(server_name: string): Promise<{ success: boolean; message: string }> {
    const server = getServerByName(server_name);
    if(!server) {
        consola.error(`[SERVER] ❌ Start failed: Server "${server_name}" does not exist`);
        return  { success: false, message: "Server with name " + server_name + " does not exist" };
    }
    if (server.process) {
        consola.warn(`[SERVER] ⚠️ Start skipped: Server "${server_name}" is already running`);
        return { success: false, message: "Minecraft server is already running." };
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

        let subprocess;
        const serverDir = getServerDirectory(server);

        // Modern Forge Support (1.17+)
        let isModernForge = false;
        if (server.project === 'forge') {
            const forgeLibDir = path.join(serverDir, 'libraries/net/minecraftforge/forge');
            if (fs.existsSync(forgeLibDir)) {
                const versions = fs.readdirSync(forgeLibDir);
                if (versions.length > 0) {
                    const argsFile = process.platform === 'win32' ? 'win_args.txt' : 'unix_args.txt';
                    const argsFilePath = path.join(forgeLibDir, versions[0], argsFile);
                    
                    if (fs.existsSync(argsFilePath)) {
                        isModernForge = true;
                        const launchArgs = [xmsArg, xmxArg];
                        
                        if (fs.existsSync(path.join(serverDir, 'user_jvm_args.txt'))) {
                            launchArgs.push('@user_jvm_args.txt');
                        }
                        
                        launchArgs.push(`@${path.relative(serverDir, argsFilePath)}`);
                        launchArgs.push('nogui');

                        subprocess = execa(javaBinary, launchArgs, {
                            cwd: serverDir,
                            stdin: 'pipe',
                            buffer: false,
                        });
                    }
                }
            }
        }

        if (!isModernForge) {
            subprocess = execa(javaBinary, [xmsArg, xmxArg, '-jar', getJarPath(server), 'nogui'], {
                cwd: serverDir,
                stdin: 'pipe',
                buffer: false,
            });
        }

        if (!subprocess) throw new Error("Failed to initialize subprocess");

        server.process = subprocess;
        server.pid = subprocess.pid;
        server.status = 'starting';
        server.onlinePlayers = [];
        
        // Save PID to persistent storage
        saveJsonFile();

        const handleLogLine = (data: Buffer, isErrorStream: boolean) => {
            const rawLine = data.toString();
            // Strip ANSI color codes
            const line = rawLine.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
            
            // Player Join Parsing - Support modern and legacy
            const modernJoin = line.match(/\[.*INFO\][:\s]+(.*) joined the game/i);
            const legacyJoin = line.match(/\[.*INFO\][:\s]+(.*?)[\s]*\[\/.*\] logged in/i);
            const joinMatch = modernJoin || legacyJoin;
            
            if (joinMatch) {
                const playerName = joinMatch[1].trim();
                if (!server.onlinePlayers) server.onlinePlayers = [];
                
                // Ensure player name is clean and unique
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
                    updateDiscordStatus();
                    sendServerStatusNotification(server.name, 'start');
                }
            }

            // Console Logging
            const trimmedLine = line.trim();
            if (!trimmedLine) return;

            if (isErrorStream) {
                if (trimmedLine.includes('Advanced terminal features are not available')) {
                    consola.warn(`[SERVER] ⚠️ [${server.name}] Terminal: ${trimmedLine}`);
                } else if (trimmedLine.includes('[INFO]') || trimmedLine.toLowerCase().includes('info')) {
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
            updateDiscordStatus();
            sendServerStatusNotification(server.name, 'stop');
        });

        return { success: true, message: "Minecraft server started." };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Fatal error starting "${server_name}":`, error.message);
        return { success: false, message: "Failed to start Minecraft server.", error: error.message } as any;
    }
}

export async function stopMinecraftServer(server_name: string): Promise<{ success: boolean; message: string }> {
    const server = getServerByName(server_name);

    if (!server) {
        consola.error(`[SERVER] ❌ Stop failed: Server "${server_name}" not found`);
        return { success: false, message: "Server with name " + server_name + " does not exist" };
    }

    if (!server.process && !server.pid) {
        consola.warn(`[SERVER] ⚠️ Stop skipped: Server "${server_name}" is already offline`);
        return { success: false, message: "Minecraft server is not running." };
    }

    try {
        server.status = 'stopping';
        consola.info(`[SERVER] 🛑 Stopping server "${server.name}"...`);

        if (server.process) {
            server.process.stdin.write('stop\n');
        } else if (server.pid) {
            consola.warn(`[SERVER] ⚠️ No process handle for "${server.name}", sending SIGTERM to PID ${server.pid}`);
            process.kill(server.pid, 'SIGTERM');

            // Clean up manually since there's no process 'exit' listener
            server.pid = undefined;
            server.status = 'offline';
            saveJsonFile();
            updateDiscordStatus();
            sendServerStatusNotification(server.name, 'stop');
        }

        return { success: true, message: "Stop command sent to Minecraft server." };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Error stopping "${server_name}":`, error.message);
        return { success: false, message: "Failed to stop Minecraft server.", error: error.message } as any;
    }
}
