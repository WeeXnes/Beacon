import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { discordConfig } = body;

    try {
        environment.settings.discordConfig = {
            ...discordConfig,
            enabled: true
        };
        saveJsonFile();
        consola.success(`[CONFIG] ✅ Discord configuration updated`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating Discord configuration:`, error.message);
        return { status: 'error', error: error.message };
    }
});
