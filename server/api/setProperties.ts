import { defineEventHandler } from 'h3';
import {getPropertiesPath, getServerByName} from "~/types/MinecraftServer";
import * as fs from 'fs/promises';


export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server_properties: string = body.properties
    const server = getServerByName(server_name);
    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }
    try {
        await fs.writeFile(getPropertiesPath(server), server_properties, 'utf8');
        return {
            message: `properties for ${server_name} set`,
        };
    } catch (error: any) {
        return { message: "Failed to get logs for " + server_name, error: error.message };
    }
});
