import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { token } = body;

    if (!token) {
        throw createError({ statusCode: 400, statusMessage: "Token is required" });
    }

    if (!environment.settings.apiTokens) {
        return { success: true };
    }

    environment.settings.apiTokens = environment.settings.apiTokens.filter(t => t.token !== token);
    saveJsonFile();

    return { success: true };
});
