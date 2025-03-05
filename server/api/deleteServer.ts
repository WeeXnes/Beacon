import {environment} from "~/core/globals";
import {removeServerByName, saveJsonFile} from "~/util/jsonLoader";
import * as fs from 'fs/promises';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server_properties: string = body.properties

    const server = environment.settings.servers.find(server => server.name == server_name);

    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    try {
        console.log("Recived server list");
        removeServerByName(server.name);
        const logsPath = environment.paths.servers + "/" + server.name
        await fs.rmdir(logsPath)
        saveJsonFile()

        return { status: 'success' };
    } catch (error) {
        return { status: 'error', error: error };
    }
});

