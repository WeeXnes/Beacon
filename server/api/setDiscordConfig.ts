import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    
    // The UI sends { discordConfig: ..., panelUrl: ... }
    const { discordConfig, panelUrl } = body;

    try {
        if (discordConfig) {
            environment.settings.discordConfig = {
                ...discordConfig,
                enabled: true
            };
        }
        
        if (panelUrl !== undefined) {
            environment.settings.panelUrl = panelUrl;
        }

        saveJsonFile();
        consola.success(`[CONFIG] ✅ Discord and Panel configuration updated`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating configuration:`, error.message);
        return { status: 'error', error: error.message };
    }
});
