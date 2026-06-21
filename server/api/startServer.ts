import { startMinecraftServer } from "../utils/serverControl";
import { getAuditUser, writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name;
    const user = getAuditUser(event);
    
    try {
        const result = await startMinecraftServer(server_name);
        if (result.success) {
            writeAuditLog('START_SERVER', 'SUCCESS', user, `Server "${server_name}" started successfully`, event);
        } else {
            writeAuditLog('START_SERVER', 'FAILED', user, `Failed to start server "${server_name}": ${result.message}`, event);
        }
        return result;
    } catch (error: any) {
        writeAuditLog('START_SERVER', 'FAILED', user, `Fatal error starting server "${server_name}": ${error.message}`, event);
        throw error;
    }
});
