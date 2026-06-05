import {environment} from "~/core/globals";
import { defineEventHandler, getCookie, createError } from 'h3';
import {saveJsonFile} from "~/util/jsonLoader";
import {getConfigPath, getServerByName, MinecraftServer} from "~/types/MinecraftServer";
import {execa} from "execa";
import * as fs from 'fs/promises';
import * as toml from 'smol-toml';


export default defineEventHandler(async (event) => {
    const body = await readBody(event)
    const server_name: string = body.name
    const server = getServerByName(server_name)
    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    try {
        const configPath = getConfigPath(server);
        const serverProperties = await fs.readFile(configPath, 'utf-8');

        if (server.project === 'velocity') {
            return {
                message: `properties for ${server_name}`,
                properties: JSON.stringify(toml.parse(serverProperties))
            };
        }

        return {
            message: `properties for ${server_name}`,
            properties: serverProperties
        };
    } catch (error: any) {
        return { message: "Failed to get logs for " + server_name, error: error.message };
    }
});
