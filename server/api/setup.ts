import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';
import bcrypt from 'bcryptjs';
import { writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    assertMethod(event, 'POST');
    
    // Only allow if onboarding is not complete
    if (environment.settings?.onboarded !== false) {
        throw createError({ statusCode: 403, statusMessage: "Forbidden: Onboarding is already complete." });
    }

    const body = await readBody(event);
    const { password } = body;

    if (!password || password.length < 8) {
        throw createError({ statusCode: 400, statusMessage: "Password must be at least 8 characters long." });
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        
        environment.settings.password_hash = hash;
        environment.settings.onboarded = true;
        saveJsonFile();
        
        consola.success(`[SETUP] ✅ Onboarding complete. Admin password set.`);
        writeAuditLog('SETUP', 'SUCCESS', 'admin', 'Onboarding completed and admin password set', event);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[SETUP] 🔥 Onboarding failed:`, error.message);
        writeAuditLog('SETUP', 'FAILED', 'anonymous', `Onboarding setup failed: ${error.message}`, event);
        throw createError({ statusCode: 500, statusMessage: "Failed to set password during onboarding." });
    }
});
