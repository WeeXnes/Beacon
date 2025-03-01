import { defineEventHandler, getCookie, createError } from 'h3';
import {environment} from "~/core/globals";

export default defineEventHandler(async (event) => {
    try {
        return environment.settings.servers;
    } catch (error) {
        console.error('Error fetching CPU info:', error);
    }
});
