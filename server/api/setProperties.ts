import { defineEventHandler } from 'h3';
import {getConfigPath, getServerByName} from "~/types/MinecraftServer";
import * as fs from 'fs/promises';
import { consola } from 'consola';
import * as toml from 'smol-toml';

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
        consola.info(`[CONFIG] 📝 [${server_name}] Updating configuration`);
        const configPath = getConfigPath(server);
        
        let contentToSave = server_properties;
        if (server.project === 'velocity') {
            // Assume server_properties is a JSON string of the object if it's velocity
            try {
                const configObj = JSON.parse(server_properties);
                
                // Helper to sanitize numeric values in the config object
                const sanitizeNumeric = (obj: any) => {
                    for (const key in obj) {
                        if (typeof obj[key] === 'string' && !isNaN(Number(obj[key])) && obj[key].trim() !== '') {
                            obj[key] = Number(obj[key]);
                        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
                            sanitizeNumeric(obj[key]);
                        }
                    }
                };
                sanitizeNumeric(configObj);
                
                contentToSave = toml.stringify(configObj);
            } catch (e) {
                // Fallback to raw if not JSON
                contentToSave = server_properties;
            }
        }

        await fs.writeFile(configPath, contentToSave, 'utf8');
        consola.success(`[CONFIG] ✅ [${server_name}] configuration updated`);
        return {
            message: `properties for ${server_name} set`,
        };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error saving properties for "${server_name}":`, error.message);
        return { message: "Failed to save properties for " + server_name, error: error.message };
    }
});
