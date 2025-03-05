import {environment} from "~/core/globals";
import { defineEventHandler, getCookie, createError } from 'h3';
import {saveJsonFile} from "~/util/jsonLoader";
import {MinecraftServer} from "~/types/MinecraftServer";
import {execa} from "execa";
import * as fs from 'fs/promises';


export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server_properties: string = body.properties

    const server = environment.settings.servers.find(server => server.name == server_name);

    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }


    const workingDir = environment.paths.servers + "/" + server.name;
    const logsPath = environment.paths.servers + "/" + server.name + "/server.properties";

    try {
        await fs.writeFile(logsPath, server_properties, 'utf8');
        return {
            message: `properties for ${server_name} set`,
        };
    } catch (error: any) {
        return { message: "Failed to get logs for " + server_name, error: error.message };
    }
});
