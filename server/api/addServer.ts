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

    try {
        const newServer = JSON.parse(newServerPart.data.toString());
        const server = getServerByName(newServer.name);

        if (server) {
            return { message: "Server with name " + newServer.name + " does already exist" };
        }

        const serverDir = environment.paths.servers + "/" + newServer.name;
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        environment.settings.servers.push({ ...newServer, status: 'offline' });
        saveJsonFile();

        const jarPath = serverDir + "/" + newServer.jarName;
        fs.writeFileSync(jarPath, filePart.data);

        return { status: 'success' };
    } catch (error: any) {
        console.error('Error adding server:', error);
        return { status: 'error', error: error.message };
    }
});


