import { defineEventHandler } from 'h3';
import { getServerByName, getConfigPath } from '~/types/MinecraftServer';
import { saveJsonFile } from '~/util/jsonLoader';
import * as fs from 'fs/promises';
import * as toml from 'smol-toml';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { proxyName, mappings, baseDomain } = body;

    const proxy = getServerByName(proxyName);
    if (!proxy || proxy.project !== 'velocity') {
        throw createError({ statusCode: 400, statusMessage: "Invalid proxy server" });
    }

    // Validation: Ensure every enabled mapping has a subdomain
    for (const m of mappings) {
        if (m.isMapped && !m.subdomain) {
            throw createError({ statusCode: 400, statusMessage: `Server ${m.serverName} requires a subdomain.` });
        }
    }

    try {
        // Save baseDomain to proxy server settings
        proxy.baseDomain = baseDomain;
        saveJsonFile();

        const configPath = getConfigPath(proxy);
        let velocityConfig: any = {};
        try {
            const content = await fs.readFile(configPath, 'utf-8');
            velocityConfig = toml.parse(content);
        } catch (e) {
            velocityConfig = {
                "config-version": "2.7",
                "bind": "0.0.0.0:25577",
                "motd": "A Velocity Server",
                "show-max-players": 500,
                "online-mode": true,
                "force-key-authentication": true,
                "prevent-client-proxy-connections": false,
                "player-info-forwarding-mode": "NONE",
                "forwarding-secret-file": "forwarding.secret",
                "announce-forge": false,
                "kick-existing-players": false,
                "ping-passthrough": "DISABLED",
                "sample-players-in-ping": false,
                "enable-player-address-logging": true
            };
        }

        // Update servers section
        velocityConfig.servers = {};
        velocityConfig['forced-hosts'] = {};
        const trySequence: string[] = [];

        for (const m of mappings) {
            if (m.isMapped) {
                // Use serverName as the internal ID in velocity
                velocityConfig.servers[m.serverName] = m.address;
                
                // Handle forced host (subdomain.baseDomain or just baseDomain if @)
                const fullHost = m.subdomain === '@' ? baseDomain : `${m.subdomain}.${baseDomain}`;
                if (fullHost) {
                    velocityConfig['forced-hosts'][fullHost] = [m.serverName];
                }

                // Handle try sequence
                if (m.isInTry) {
                    trySequence.push(m.serverName);
                }
            }
        }
        
        // If no servers are marked as "isInTry", use the first mapped server as fallback
        if (trySequence.length === 0 && Object.keys(velocityConfig.servers).length > 0) {
            trySequence.push(Object.keys(velocityConfig.servers)[0]);
        }
        
        // CRITICAL: try MUST be inside the servers section
        velocityConfig.servers.try = trySequence;
        
        // Remove try from root level if it exists from previous buggy versions
        if (velocityConfig.try) {
            delete velocityConfig.try;
        }

        await fs.writeFile(configPath, toml.stringify(velocityConfig), 'utf-8');

        return { success: true };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
