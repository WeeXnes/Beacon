import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const serverList = body.servers || body.serverList;

    if (!serverList) {
        consola.error(`[CONFIG] ❌ Set servers failed: Missing server list`);
        return { status: 'error', message: 'Missing server list' };
    }

    try {
        consola.info(`[CONFIG] 📝 Updating global server list`);
        environment.settings.servers = serverList;
        saveJsonFile();
        consola.success(`[CONFIG] ✅ Global server list updated`);

        return { status: 'success' };
    } catch (error: any) {
        consola.error(`[CONFIG] 🔥 Error updating server list:`, error.message);
        return { status: 'error', error: error.message };
    }
});

