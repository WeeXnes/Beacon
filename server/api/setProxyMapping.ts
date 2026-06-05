import { defineEventHandler } from 'h3';
import { getServerByName, getConfigPath } from '~/types/MinecraftServer';
import * as fs from 'fs/promises';
import * as toml from 'smol-toml';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { proxyName, mappings } = body;

    const proxy = getServerByName(proxyName);
    if (!proxy || proxy.project !== 'velocity') {
        throw createError({ statusCode: 400, statusMessage: "Invalid proxy server" });
    }

    try {
        const configPath = getConfigPath(proxy);
        let velocityConfig: any = {};
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            velocityConfig = toml.parse(content);
        } catch (e) {
            velocityConfig = {};
        }

        if (!velocityConfig.servers) velocityConfig.servers = {};

        // Update servers section
        velocityConfig.servers = {};
        for (const m of mappings) {
            if (m.isMapped) {
                velocityConfig.servers[m.name] = m.address;
            }
        }
        
        // Also ensure forced-hosts has a default if missing, or just keep as is
        if (!velocityConfig['forced-hosts']) {
            velocityConfig['forced-hosts'] = {};
        }

        await fs.writeFile(configPath, toml.stringify(velocityConfig), 'utf-8');

        return { success: true };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
