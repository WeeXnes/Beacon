import { getServerByName } from "~/types/MinecraftServer";
import { consola } from 'consola';
import { saveJsonFile } from "~/util/jsonLoader";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server = getServerByName(server_name);

    if (!server) {
        consola.error(`[SERVER] ❌ Stop failed: Server "${server_name}" not found`);
        return { message: "Server with name " + server_name + " does not exist" };
    }

    if (!server.process && !server.pid) {
        consola.warn(`[SERVER] ⚠️ Stop skipped: Server "${server_name}" is already offline`);
        return { message: "Minecraft server is not running." };
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
        }

        return { message: "Stop command sent to Minecraft server." };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Error stopping "${server_name}":`, error.message);
        return { message: "Failed to stop Minecraft server.", error: error.message };
    }
});