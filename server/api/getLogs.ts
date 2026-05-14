import { defineEventHandler } from 'h3';
import {getLogsPath, getServerByName} from "~/types/MinecraftServer";
import * as fs from 'fs/promises';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server = getServerByName(server_name);
    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    try {
        await fs.access(getLogsPath(server));
        const rawLogs = await fs.readFile(getLogsPath(server), 'utf-8');
        const lines = rawLogs.split('\n');
        const lastLines = lines.slice(-100).join('\n');
        
        return {
            message: `Logs for ${server_name}`,
            logs: lastLines
        };
    } catch (error: any) {
        return {
            message: "Logs not yet available for " + server_name,
            logs: "",
            error: error.code === 'ENOENT' ? 'Log file not found' : error.message
        };
    }
});
