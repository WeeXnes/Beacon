import {getServerByName, getServerDirectory} from "~/types/MinecraftServer";
import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";

export default defineEventHandler(async (event) => {

    const body = await readBody(event);
    const { newServer } = body;

    const server = getServerByName(newServer.name);

    if(server) {
        return  { message: "Server with name " + newServer.name + " does already exist" };
    }

    try {
        environment.settings.servers.push({...newServer})
        saveJsonFile()
        return { status: 'success' };
    } catch (error) {
        return { status: 'error', error: error };
    }
});

