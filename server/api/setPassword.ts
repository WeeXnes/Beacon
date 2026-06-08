import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';
import bcrypt from 'bcryptjs';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { password } = body;

    if (!password || password.length < 1) {
        return { status: 'error', message: 'Password cannot be empty' };
    }

    try {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(password, salt);
        
        environment.settings.password_hash = hash;
        saveJsonFile();
        
        consola.success(`[CONFIG] ✅ Admin password updated`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating password:`, error.message);
        return { status: 'error', error: error.message };
    }
});
