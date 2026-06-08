import { startMinecraftServer, stopMinecraftServer } from '~/server/utils/serverControl';
import { getServerByName } from '~/types/MinecraftServer';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { serverName, action } = body;

    if (!serverName || !action) {
        throw createError({ statusCode: 400, statusMessage: "serverName and action are required" });
    }

    const server = getServerByName(serverName);
    if (!server) {
        throw createError({ statusCode: 404, statusMessage: `Server "${serverName}" not found` });
    }

    if (action === 'start') {
        const result = await startMinecraftServer(serverName);
        return result;
    } else if (action === 'stop') {
        const result = await stopMinecraftServer(serverName);
        return result;
    } else {
        throw createError({ statusCode: 400, statusMessage: 'Invalid action. Use "start" or "stop".' });
    }
});
