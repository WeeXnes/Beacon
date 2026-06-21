import * as fs from 'fs';
import * as path from 'path';
import { environment } from '~/core/globals';
import jwt from 'jsonwebtoken';

export function getAuditUser(event: any): string {
  try {
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader) return 'anonymous';

    const token = authHeader.split(' ')[1];
    if (!token) return 'anonymous';

    // Check if it matches an external api-token
    const apiTokens = environment.settings?.apiTokens || [];
    const matchedToken = apiTokens.find(t => t.token === token);
    if (matchedToken) {
      return `api-token:${matchedToken.name}`;
    }

    // Decode JWT (without verify since verify happened in middleware)
    const decoded = jwt.decode(token) as any;
    return (decoded && decoded.userId) || 'admin';
  } catch {
    return 'unknown';
  }
}

export function writeAuditLog(action: string, status: 'SUCCESS' | 'FAILED', user: string, message: string, event: any) {
  try {
    const logDir = environment.paths.data;
    const logPath = path.join(logDir, 'audit.log');
    
    // Extract IP from event if available
    let ip = 'unknown';
    if (event) {
      const forwarded = getHeader(event, 'x-forwarded-for');
      if (forwarded) {
        ip = forwarded.split(',')[0].trim();
      } else if (event.node && event.node.req && event.node.req.socket) {
        ip = event.node.req.socket.remoteAddress || 'unknown';
      }
    }

    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] [IP: ${ip}] [USER: ${user}] [ACTION: ${action}] [STATUS: ${status}] ${message}\n`;
    
    fs.appendFileSync(logPath, logLine);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}
