import {getJarPath, getServerByName} from "~/types/MinecraftServer";
import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import * as fs from "node:fs";
import * as path from "node:path";
import { logger } from '~/server/utils/logger';
import { getAuditUser, writeAuditLog } from '../utils/audit';
import * as os from 'node:os';

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

        // Strict input validation
        if (!newServer.name || typeof newServer.name !== 'string' || !/^[a-zA-Z0-9_-]+$/.test(newServer.name)) {
            logger.error('SERVER', `Add failed: Invalid server name "${newServer?.name}"`);
            return { status: 'error', error: 'Invalid server name. Only alphanumeric characters, dashes, and underscores are allowed.' };
        }

        const systemTotalMemoryGB = Math.ceil(os.totalmem() / (1024 * 1024 * 1024));
        const parsedMemory = Number(newServer.maxMemory);
        if (isNaN(parsedMemory) || parsedMemory <= 0 || parsedMemory > systemTotalMemoryGB) {
            logger.error('SERVER', `Add failed: Invalid maxMemory value`);
            return { status: 'error', error: `Invalid memory allocation. Must be between 1 and ${systemTotalMemoryGB} GB.` };
        }
        newServer.maxMemory = parsedMemory;

        const server = getServerByName(newServer.name);
        if (server) {
            logger.warn('SERVER', `Add skipped: Server "${newServer.name}" already exists`);
            return { status: 'error', error: "Server with name " + newServer.name + " already exists" };
        }

        // Security: Basic filename validation for the JAR
        if (!newServer.jarName || typeof newServer.jarName !== 'string' || 
            newServer.jarName.includes('/') || newServer.jarName.includes('..') || 
            !newServer.jarName.endsWith('.jar') || !/^[a-zA-Z0-9_.-]+$/.test(newServer.jarName)) {
            logger.error('SERVER', `Blocked invalid JAR filename: "${newServer.jarName}"`);
            return { status: 'error', error: 'Invalid JAR filename. Must end with .jar and contain no path traversal characters.' };
        }

        const user = getAuditUser(event);
        const serverDir = path.resolve(environment.paths.servers + "/" + newServer.name);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        environment.settings.servers.push({ ...newServer, project: newServer.project || 'manual', status: 'offline' });
        saveJsonFile();

        const jarPath = path.join(serverDir, newServer.jarName);
        fs.writeFileSync(jarPath, filePart.data);

        logger.success('SERVER', `New server "${newServer.name}" added successfully`);
        writeAuditLog('ADD_SERVER', 'SUCCESS', user, `Added server "${newServer.name}" (jar: ${newServer.jarName})`, event);
        return { status: 'success' };
    } catch (error: any) {
        logger.error('SERVER', `Error adding server: ${error.message}`);
        const user = getAuditUser(event);
        writeAuditLog('ADD_SERVER', 'FAILED', user, `Failed to add server: ${error.message}`, event);
        return { status: 'error', error: error.message };
    }
});
