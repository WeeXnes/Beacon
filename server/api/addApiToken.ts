import { environment } from '~/core/globals';
import { saveJsonFile } from '~/util/jsonLoader';
import { randomBytes } from 'crypto';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name } = body;

    if (!name) {
        throw createError({ statusCode: 400, statusMessage: "Token name is required" });
    }

    const token = randomBytes(32).toString('hex');
    const newToken = {
        name,
        token,
        createdAt: new Date().toISOString()
    };

    if (!environment.settings.apiTokens) {
        environment.settings.apiTokens = [];
    }

    environment.settings.apiTokens.push(newToken);
    saveJsonFile();

    return newToken;
});
