import { environment } from '~/core/globals';

export default defineEventHandler(() => {
    if (!environment.settings) {
        return {
            enabled: false,
            token: '',
            clientId: '',
            guildId: ''
        };
    }
    return {
        ...(environment.settings.discordConfig || {
            enabled: false,
            token: '',
            clientId: '',
            guildId: ''
        }),
        panelUrl: environment.settings.panelUrl || ''
    };
});
