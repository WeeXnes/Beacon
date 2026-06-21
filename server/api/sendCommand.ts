import { getServerByName } from "~/types/MinecraftServer";
import { consola } from 'consola';
import { getAuditUser, writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, command } = body;
    const user = getAuditUser(event);

    const server = getServerByName(name);

    if (!server) {
        consola.error(`[CMD] ❌ Command failed: Server "${name}" not found`);
        writeAuditLog('SEND_COMMAND', 'FAILED', user, `Attempted command to non-existent server "${name}": ${command}`, event);
        throw createError({
            statusCode: 404,
            statusMessage: "Server not found",
        });
    }

    if (!server.process) {
        consola.warn(`[CMD] ⚠️ Command failed: Server "${name}" process handle is missing (likely orphaned by panel restart)`);
        writeAuditLog('SEND_COMMAND', 'FAILED', user, `Failed command to server "${name}" (Process missing): ${command}`, event);
        throw createError({
            statusCode: 400,
            statusMessage: "Server process handle missing. Please restart the server through the panel to regain console control.",
        });
    }

    if (!server.process.stdin || !server.process.stdin.writable) {
        consola.error(`[CMD] ❌ Command failed: Server "${name}" stdin is not writable`);
        writeAuditLog('SEND_COMMAND', 'FAILED', user, `Failed command to server "${name}" (Stdin closed): ${command}`, event);
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
        
        writeAuditLog('SEND_COMMAND', 'SUCCESS', user, `Sent command to server "${name}": ${command}`, event);
        return { success: true };
    } catch (error: any) {
        consola.error(`[CMD] 🔥 Error sending command to "${name}":`, error.message);
        writeAuditLog('SEND_COMMAND', 'FAILED', user, `Failed to send command to server "${name}": ${command}. Error: ${error.message}`, event);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to send command`,
        });
    }
});
