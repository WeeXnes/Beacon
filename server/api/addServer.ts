import {getJarPath, getServerByName} from "~/types/MinecraftServer";
import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from '~/server/utils/logger';

export default defineEventHandler(async (event) => {
    const formData = await readMultipartFormData(event);

    const newServerPart = formData?.find((part) => part.name === 'newServer');
    const filePart = formData?.find((part) => part.name === 'file');

    if (!newServerPart || !filePart) {
        logger.error('SERVER', 'Add failed: Missing multipart data');
        return {status: 'error', error: 'Missing newServer or file part'};
    }

    try {
        const newServer = JSON.parse(newServerPart.data.toString());
        const server = getServerByName(newServer.name);

        if (server) {
            logger.warn('SERVER', `Add skipped: Server "${newServer.name}" already exists`);
            return { message: "Server with name " + newServer.name + " does already exist" };
        }

        // Security: Basic filename validation for the JAR
        if (newServer.jarName.includes('/') || newServer.jarName.includes('..')) {
            logger.error('SERVER', `Blocked invalid JAR filename: "${newServer.jarName}"`);
            return { status: 'error', error: 'Invalid JAR filename' };
        }

        const serverDir = path.resolve(environment.paths.servers + "/" + newServer.name);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        environment.settings.servers.push({ ...newServer, project: newServer.project || 'manual', status: 'offline' });
        saveJsonFile();

        const jarPath = path.join(serverDir, newServer.jarName);
        fs.writeFileSync(jarPath, filePart.data);

        logger.success('SERVER', `New server "${newServer.name}" added successfully`);
        return { status: 'success' };
    } catch (error: any) {
        logger.error('SERVER', `Error adding server: ${error.message}`);
        return { status: 'error', error: error.message };
    }
});
