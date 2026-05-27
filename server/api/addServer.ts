import {getJarPath, getServerByName} from "~/types/MinecraftServer";
import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import * as fs from "node:fs";
import * as path from "node:path";
import { consola } from 'consola';
import { sendDiscordMessage } from "~/server/utils/discord";

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);

    const newServerPart = formData?.find((part) => part.name === 'newServer');
    const filePart = formData?.find((part) => part.name === 'file');

    if (!newServerPart || !filePart) {
        consola.error(`[SERVER] ❌ Add failed: Missing multipart data`);
        return {status: 'error', error: 'Missing newServer or file part'};
    }

    try {
        const newServer = JSON.parse(newServerPart.data.toString());
        const server = getServerByName(newServer.name);

        if (server) {
            consola.warn(`[SERVER] ⚠️ Add skipped: Server "${newServer.name}" already exists`);
            return { message: "Server with name " + newServer.name + " does already exist" };
        }

        // Security: Basic filename validation for the JAR
        if (newServer.jarName.includes('/') || newServer.jarName.includes('..')) {
            consola.error(`[SERVER] 🛡️ Blocked invalid JAR filename: "${newServer.jarName}"`);
            return { status: 'error', error: 'Invalid JAR filename' };
        }

        const serverDir = path.resolve(environment.paths.servers + "/" + newServer.name);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        environment.settings.servers.push({ ...newServer, status: 'offline' });
        saveJsonFile();

        const jarPath = path.join(serverDir, newServer.jarName);
        fs.writeFileSync(jarPath, filePart.data);

        consola.success(`[SERVER] ✅ New server "${newServer.name}" added successfully`);
        sendDiscordMessage(`✨ New server **${newServer.name}** (${newServer.version}) has been created!`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[SERVER] 🔥 Error adding server:`, error.message);
        return { status: 'error', error: error.message };
    }
});


