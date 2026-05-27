import { environment } from '~/core/globals';

export default defineEventHandler(() => {
    return environment.settings.discord || {
        enabled: false,
        token: '',
        channelId: '',
        showPresence: true
    };
});
