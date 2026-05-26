import { getServerByName } from "~/types/MinecraftServer";
import pidusage from 'pidusage';
import { consola } from 'consola';

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
        
        // Update local state if needed (though it's better to just return it)
        server.stats = {
            cpu: Math.round(stats.cpu),
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