import { environment } from '~/core/globals';

export default defineEventHandler(() => {
  return { onboarded: environment.settings?.onboarded !== false };
});
