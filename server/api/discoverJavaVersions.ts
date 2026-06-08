import { defineEventHandler } from 'h3';
import { discoverJavaVersions } from '../utils/javaDiscovery';

export default defineEventHandler(async (event) => {
    return await discoverJavaVersions();
});
