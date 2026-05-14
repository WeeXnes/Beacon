import {removeServerByName, saveJsonFile} from "~/util/jsonLoader";
import * as fs from 'fs/promises';
import {getServerByName, getServerDirectory} from "~/types/MinecraftServer";
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server = getServerByName(server_name);

    if(!server) {
        consola.error(`[SERVER] ❌ Delete failed: Server "${server_name}" not found`);
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    try {
        consola.info(`[SERVER] 🗑️ Deleting server "${server_name}" and all its files...`);
        
        // Ensure server is stopped if it's running (optional but good)
        if (server.process) {
            consola.warn(`[SERVER] ⚠️ Deleting a running server! Attempting to kill process...`);
            server.process.kill();
        }

        removeServerByName(server.name);
        await fs.rm(getServerDirectory(server), { recursive: true, force: true });
        saveJsonFile();

        consola.success(`[SERVER] ✅ Server "${server_name}" successfully deleted`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Error deleting server "${server_name}":`, error.message);
        return { status: 'error', error: error.message };
    }
});

