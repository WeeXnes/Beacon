import { defineEventHandler } from 'h3';
import {getPropertiesPath, getServerByName} from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server_properties: string = body.properties
    const server = getServerByName(server_name);
    
    if(!server) {
        consola.error(`[CONFIG] ❌ Set properties failed: Server "${server_name}" not found`);
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    try {
        consola.info(`[CONFIG] 📝 [${server_name}] Updating server.properties`);
        await fs.writeFile(getPropertiesPath(server), server_properties, 'utf8');
        consola.success(`[CONFIG] ✅ [${server_name}] server.properties updated`);
        return {
            message: `properties for ${server_name} set`,
        };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error saving properties for "${server_name}":`, error.message);
        return { message: "Failed to save properties for " + server_name, error: error.message };
    }
});
