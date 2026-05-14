import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { javaVersions } = body;

    try {
        environment.settings.javaVersions = javaVersions;
        saveJsonFile();
        consola.success(`[CONFIG] ✅ Java versions updated`);
        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating Java versions:`, error.message);
        return { status: 'error', error: error.message };
    }
});
