import { defineEventHandler } from 'h3';
import jwt from 'jsonwebtoken';
import { environment } from "~/core/globals";

export default defineEventHandler(async (event) => {
    const authHeader = getHeader(event, 'authorization');
    if (!authHeader) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, environment.jwt_globals.secret!);
        return { success: true };
    } catch (error) {
        throw createError({ statusCode: 401, statusMessage: 'Unauthorized' });
    }
});
