import {environment} from "~/core/globals";
import {removeServerByName, saveJsonFile} from "~/util/jsonLoader";
import * as fs from 'fs/promises';
import {getServerByName, getServerDirectory} from "~/types/MinecraftServer";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server = getServerByName(server_name);

    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    try {
        removeServerByName(server.name);
        await fs.rm(getServerDirectory(server), { recursive: true, force: true })
        saveJsonFile()

        return { status: 'success' };
    } catch (error) {
        return { status: 'error', error: error };
    }
});

