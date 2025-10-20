import {getJarPath, getServerByName} from "~/types/MinecraftServer";
import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import * as fs from "node:fs";

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);

    const newServerPart = formData?.find((part) => part.name === 'newServer');
    const filePart = formData?.find((part) => part.name === 'file');

    if (!newServerPart || !filePart) {
        return {status: 'error', error: 'Missing newServer or file part'};
    }

    const newServer = JSON.parse(newServerPart.data.toString());
    const server = getServerByName(newServer.name);

    if (server) {
        return {message: "Server with name " + newServer.name + " does already exist"};
    }

    try {
        environment.settings.servers.push({...newServer});
        saveJsonFile();

        fs.writeFileSync(getJarPath(newServer), filePart.data);

        return {status: 'success'};
    } catch (error) {
        return {status: 'error', error: error};
    }
});


