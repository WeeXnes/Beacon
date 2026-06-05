import { defineEventHandler } from 'h3';
import { environment } from '~/core/globals';
import { getServerByName, getConfigPath } from '~/types/MinecraftServer';
import * as fs from 'fs/promises';
import * as toml from 'smol-toml';
import { parse as parseIni } from 'ini';
import path from 'path';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const proxyName = query.name as string;

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
            velocityConfig = { servers: {} };
        }

        const proxyServers = velocityConfig.servers || {};
        
        // Find all other servers
        const allServers = environment.settings.servers.filter(s => s.name !== proxyName && s.project !== 'velocity');
        
        const mappings = await Promise.all(allServers.map(async (s) => {
            let port = 25565;
            try {
                const propsPath = path.join(environment.paths.servers, s.name, 'server.properties');
                const propsContent = await fs.readFile(propsPath, 'utf-8');
                const props = parseIni(propsContent);
                port = parseInt(props['server-port'] || '25565');
            } catch (e) {
                // Ignore if properties not found
            }

            return {
                name: s.name,
                address: `127.0.0.1:${port}`,
                isMapped: !!proxyServers[s.name]
            };
        }));

        return {
            mappings
        };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
