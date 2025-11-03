
import jwt from 'jsonwebtoken';
import { environment } from '~/core/globals';

export default defineEventHandler(async (event) => {
  const protectedRoutes = [
    '/api/addServer',
    '/api/deleteServer',
    '/api/getLogs',
    '/api/getProperties',
    '/api/getServers',
    '/api/setProperties',
    '/api/setServers',
    '/api/startServer',
    '/api/stopServer'
  ];

  if (event.node.req.url && protectedRoutes.includes(event.node.req.url)) {
    const authHeader = event.node.req.headers.authorization;
    if (!authHeader) {
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }

    try {
      jwt.verify(token, environment.jwt_globals.secret!);
    } catch (error) {
      return sendError(event, createError({ statusCode: 401, message: 'Unauthorized' }));
    }
  }
});
