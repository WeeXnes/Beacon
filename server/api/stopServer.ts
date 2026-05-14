import {getServerByName} from "~/types/MinecraftServer";
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name;
    const server = getServerByName(server_name);

    if (!server) {
        consola.error(`[SERVER] ❌ Stop failed: Server "${server_name}" does not exist`);
        return { message: "Server with name " + server_name + " does not exist" };
    }

    if (!server.process) {
        consola.warn(`[SERVER] ⚠️ Stop skipped: Server "${server_name}" is not running`);
        return { message: "Minecraft server is not running." };
    }

    try {
        server.status = 'stopping';
        consola.info(`[SERVER] 🛑 Stopping server "${server_name}"...`);
        server.process.stdin.write('stop\n');

        return { message: "Minecraft server is stopping." };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Error stopping "${server_name}":`, error.message);
        return { message: "Failed to stop Minecraft server.", error: error.message };
    }
});
