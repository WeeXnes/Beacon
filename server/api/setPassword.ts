import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';
import bcrypt from 'bcryptjs';
import { getAuditUser, writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { password } = body;
    const user = getAuditUser(event);

    if (!password || password.length < 8) {
        writeAuditLog('SET_PASSWORD', 'FAILED', user, 'Attempted to set an empty or weak password', event);
        return { status: 'error', message: 'Password must be at least 8 characters long' };
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        
        environment.settings.password_hash = hash;
        saveJsonFile();
        
        consola.success(`[CONFIG] ✅ Admin password updated`);
        writeAuditLog('SET_PASSWORD', 'SUCCESS', user, 'Admin access key updated successfully', event);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating password:`, error.message);
        writeAuditLog('SET_PASSWORD', 'FAILED', user, `Error updating password: ${error.message}`, event);
        return { status: 'error', error: error.message };
    }
});
