import bcrypt from 'bcryptjs';
import { sendError, createError } from 'h3';
import jwt from 'jsonwebtoken';
import { settings } from '~/panel.config'
import { environment } from "~/core/globals";

export default defineEventHandler(async (event) => {
    try {
        const { password } = await readBody(event);

        if (!password) {
            return sendError(event, createError({ statusCode: 400, message: 'password is required' }));
        }

        const isMatch = await bcrypt.compare(password, settings.password_hash);
        if (!isMatch) {
            return sendError(event, createError({ statusCode: 400, message: 'Invalid credentials!' }));
        }

        const token = jwt.sign({ userId: password }, environment.jwt_globals.secret!, {
            expiresIn: '1h',
        });

        return {
            message: 'Login successful!',
            token
        };
    } catch (error) {
        console.error("Login error: ", error);
        return sendError(event, createError({ statusCode: 500, message: 'Internal server error' }));
    }
});
