import { defineEventHandler } from 'h3';
import {environment} from "~/core/globals";
import * as fs from 'fs/promises';
import { parse } from 'ini';
import { getPropertiesPath } from "~/types/MinecraftServer";

export default defineEventHandler(async (event) => {
    try {
        // Enrich servers with maxPlayers from server.properties
        for (const server of environment.settings.servers) {
            try {
                const propsPath = getPropertiesPath(server);
                const propsData = await fs.readFile(propsPath, 'utf-8');
                const props = parse(propsData);
                if (props['max-players']) {
                    server.maxPlayers = parseInt(props['max-players']);
                }
            } catch (e) {
                // If file doesn't exist or error occurs, default to undefined or a placeholder
                server.maxPlayers = undefined;
            }
        }
        return environment.settings.servers;
    } catch (error) {
        console.error('Error fetching servers:', error);
    }
});
