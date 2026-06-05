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
        const forcedHosts = velocityConfig['forced-hosts'] || {};
        const trySequence = velocityConfig.try || [];
        const baseDomain = proxy.baseDomain || '';
        
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

            // CRITICAL FIX: Match mapping by server name (ID), not just port
            // Check if THIS specific server name exists in proxyServers
            const isMapped = !!proxyServers[s.name];
            
            // Extract subdomain from forced-hosts
            let subdomain = '';
            if (baseDomain) {
                const fullHost = Object.keys(forcedHosts).find(host => {
                    const targets = forcedHosts[host];
                    return Array.isArray(targets) && targets.includes(s.name);
                });
                if (fullHost && fullHost.endsWith('.' + baseDomain)) {
                    subdomain = fullHost.replace('.' + baseDomain, '');
                } else if (fullHost === baseDomain) {
                    subdomain = '@'; // Root domain
                }
            }

            return {
                serverName: s.name,
                mappingName: s.name, // We use internal ID as mapping name for predictability
                address: `127.0.0.1:${port}`,
                isMapped,
                subdomain: subdomain || s.name.toLowerCase(),
                isInTry: trySequence.includes(s.name)
            };
        }));

        return {
            mappings,
            trySequence,
            baseDomain
        };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
