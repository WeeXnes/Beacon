import { getServerByName } from "~/types/MinecraftServer";
import pidusage from 'pidusage';
import { consola } from 'consola';
import os from 'os';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name } = body;
    const server = getServerByName(name);

    if (!server) {
        throw createError({ statusCode: 404, statusMessage: "Server not found" });
    }

    if (!server.pid) {
        return { cpu: 0, memory: 0 };
    }

    try {
        const stats = await pidusage(server.pid);
        const numCores = os.cpus().length;
        
        // Normalize CPU usage by cores
        const normalizedCpu = Math.round(stats.cpu / numCores);
        
        server.stats = {
            cpu: normalizedCpu,
            memory: stats.memory
        };

        return server.stats;
    } catch (error: any) {
        // If process is gone, clean up
        if (error.code === 'ESRCH') {
            server.pid = undefined;
            server.status = 'offline';
            server.stats = undefined;
        }
        return { cpu: 0, memory: 0 };
    }
});