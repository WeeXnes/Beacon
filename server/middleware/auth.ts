import jwt from 'jsonwebtoken';
import { environment } from '~/core/globals';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
  const path = getRequestPath(event);
  
  // Define strict API protection
  const isApi = path.startsWith('/api/');
  const isLogin = path === '/api/login';
  
  // Note: /api/_nuxt_icon is used by the @nuxt/icon module and should be allowed
  const isIcon = path.startsWith('/api/_nuxt_icon');

  if (isApi && !isLogin && !isIcon) {
    const authHeader = getHeader(event, 'authorization');
    const method = event.method;

    if (!authHeader) {
      consola.warn(`[AUTH] 🔒 Unauthorized access attempt: ${method} ${path} (Missing Token)`);
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      consola.warn(`[AUTH] ⚠️ Malformed token: ${method} ${path}`);
      throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    try {
      jwt.verify(token, environment.jwt_globals.secret);
      // consola.success(`[AUTH] ✅ Authorized: ${method} ${path}`);
    } catch (error: any) {
      consola.error(`[AUTH] ❌ Token verification failed: ${method} ${path} - ${error.message}`);
      throw createError({ statusCode: 401, statusMessage: 'Session Expired' });
    }
  }
});
