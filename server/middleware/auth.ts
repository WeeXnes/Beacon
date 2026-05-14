
import jwt from 'jsonwebtoken';
import { environment } from '~/core/globals';

export default defineEventHandler(async (event) => {
  const path = getRequestPath(event);
  const isApi = path.startsWith('/api/');
  const isLogin = path === '/api/login';
  const isIcon = path.startsWith('/api/_nuxt_icon');

  if (isApi && !isLogin && !isIcon) {
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader) {
      console.warn(`[Auth] Missing Authorization header for ${path}`);
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      console.warn(`[Auth] Malformed Authorization header for ${path}`);
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }

    try {
      jwt.verify(token, environment.jwt_globals.secret);
    } catch (error: any) {
      console.error(`[Auth] Token verification failed for ${path}: ${error.message}`);
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }
  }
});
