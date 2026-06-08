import { environment } from '~/core/globals';

export default defineEventHandler(() => {
    return environment.settings.apiTokens || [];
});
