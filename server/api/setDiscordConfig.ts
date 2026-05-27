import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';
import { initDiscord } from '~/server/utils/discord';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { discord } = body;

    try {
        environment.settings.discord = discord;
        saveJsonFile();
        
        // Re-initialize Discord bot with new settings
        await initDiscord();
        
        consola.success(`[CONFIG] ✅ Discord configuration updated`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating Discord configuration:`, error.message);
        return { status: 'error', error: error.message };
    }
});
