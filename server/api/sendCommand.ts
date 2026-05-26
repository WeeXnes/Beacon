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
        consola.warn(`[CMD] ⚠️ Command failed: Server "${name}" process handle is missing (likely orphaned by panel restart)`);
        throw createError({
            statusCode: 400,
            statusMessage: "Server process handle missing. Please restart the server through the panel to regain console control.",
        });
    }

    if (!server.process.stdin || !server.process.stdin.writable) {
        consola.error(`[CMD] ❌ Command failed: Server "${name}" stdin is not writable`);
        throw createError({
            statusCode: 500,
            statusMessage: "Server input stream is closed.",
        });
    }

    try {
        consola.info(`[CMD] 💬 [${name}] Sending command: ${command}`);
        const result = server.process.stdin.write(`${command}\n`);
        
        if (!result) {
            consola.warn(`[CMD] ⚠️ [${name}] Command was buffered (stdin.write returned false)`);
        }
        
        return { success: true };
    } catch (error: any) {
        consola.error(`[CMD] 🔥 Error sending command to "${name}":`, error.message);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to send command: ${error.message}`,
        });
    }
});
