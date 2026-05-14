
import jwt from 'jsonwebtoken';
import { environment } from '~/core/globals';
import { consola } from 'consola';

export default defineEventHandler(async (event) => {
  const path = getRequestPath(event);
  const isApi = path.startsWith('/api/');
  const isLogin = path === '/api/login';
  const isIcon = path.startsWith('/api/_nuxt_icon');

  if (isApi && !isLogin && !isIcon) {
    const authHeader = getHeader(event, 'authorization');
    const method = event.method;

    if (!authHeader) {
      consola.warn(`[AUTH] 🔒 Unauthorized access attempt: ${method} ${path} (Missing Token)`);
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      consola.warn(`[AUTH] ⚠️ Malformed token: ${method} ${path}`);
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }

    try {
      jwt.verify(token, environment.jwt_globals.secret);
      consola.success(`[AUTH] ✅ Authorized: ${method} ${path}`);
    } catch (error: any) {
      consola.error(`[AUTH] ❌ Token verification failed: ${method} ${path} - ${error.message}`);
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }
  }
});
