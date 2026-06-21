import bcrypt from 'bcryptjs';
import { sendError, createError } from 'h3';
import jwt from 'jsonwebtoken';
import { environment } from "~/core/globals";
import { consola } from 'consola';
import { writeAuditLog } from '../utils/audit';

export default defineEventHandler(async (event) => {
    try {
        const { password } = await readBody(event);

        if (!password) {
            consola.warn(`[LOGIN] ⚠️ Login attempt failed: Missing password`);
            writeAuditLog('LOGIN', 'FAILED', 'anonymous', 'Failed login attempt: Missing password', event);
            return sendError(event, createError({ statusCode: 400, message: 'password is required' }));
        }

        const isMatch = await bcrypt.compare(password, environment.settings.password_hash);
        if (!isMatch) {
            consola.warn(`[LOGIN] ❌ Failed login attempt: Invalid credentials`);
            writeAuditLog('LOGIN', 'FAILED', 'anonymous', 'Failed login attempt: Invalid credentials', event);
            return sendError(event, createError({ statusCode: 400, message: 'Invalid credentials!' }));
        }

        const token = jwt.sign({ userId: 'admin' }, environment.jwt_globals.secret!, {
            expiresIn: '30d',
        });

        consola.info(`[LOGIN] 🔑 Admin logged in successfully`);
        writeAuditLog('LOGIN', 'SUCCESS', 'admin', 'Admin logged in successfully', event);

        return {
            message: 'Login successful!',
            token
        };
    } catch (error: any) {
        consola.error(`[LOGIN] 🔥 Internal server error during login:`, error.message);
        writeAuditLog('LOGIN', 'FAILED', 'anonymous', `Internal server error: ${error.message}`, event);
        return sendError(event, createError({ statusCode: 500, message: 'Internal server error' }));
    }
});
