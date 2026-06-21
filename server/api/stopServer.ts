import { stopMinecraftServer } from "../utils/serverControl";
import { getAuditUser, writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name;
    const user = getAuditUser(event);
    
    try {
        const result = await stopMinecraftServer(server_name);
        if (result.success) {
            writeAuditLog('STOP_SERVER', 'SUCCESS', user, `Server "${server_name}" stopped successfully`, event);
        } else {
            writeAuditLog('STOP_SERVER', 'FAILED', user, `Failed to stop server "${server_name}": ${result.message}`, event);
        }
        return result;
    } catch (error: any) {
        writeAuditLog('STOP_SERVER', 'FAILED', user, `Fatal error stopping server "${server_name}": ${error.message}`, event);
        throw error;
    }
});
