import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { serverList } = body;

    try {
        console.log("Recived server list");
        environment.settings.servers = serverList;
        saveJsonFile()

        return { status: 'success' };
    } catch (error) {
        return { status: 'error', error: error };
    }
});

