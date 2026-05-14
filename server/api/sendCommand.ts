import { getServerByName } from "~/types/MinecraftServer";
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, command } = body;
    const server = getServerByName(name);

    if (!server) {
        consola.error(`[CMD] ❌ Command failed: Server "${name}" not found`);
        throw createError({
            statusCode: 404,
            statusMessage: "Server not found",
        });
    }

    if (!server.process) {
        consola.warn(`[CMD] ⚠️ Command skipped: Server "${name}" is not running`);
        throw createError({
            statusCode: 400,
            statusMessage: "Server is not running",
        });
    }

    try {
        consola.info(`[CMD] 💬 [${name}] Sending command: ${command}`);
        server.process.stdin.write(`${command}\n`);
        return { success: true };
    } catch (error: any) {
        consola.error(`[CMD] 🔥 Error sending command to "${name}":`, error.message);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to send command: ${error.message}`,
        });
    }
});
