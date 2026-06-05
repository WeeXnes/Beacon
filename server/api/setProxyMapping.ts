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

        // Update servers section
        velocityConfig.servers = {};
        velocityConfig['forced-hosts'] = {};
        const trySequence: string[] = [];

        for (const m of mappings) {
            if (m.isMapped) {
                velocityConfig.servers[m.mappingName] = m.address;
                
                // Handle forced hosts
                if (m.hostnames && Array.isArray(m.hostnames)) {
                    for (const host of m.hostnames) {
                        if (host.trim()) {
                            velocityConfig['forced-hosts'][host.trim()] = [m.mappingName];
                        }
                    }
                }

                // Handle try sequence
                if (m.isInTry) {
                    trySequence.push(m.mappingName);
                }
            }
        }
        
        velocityConfig.try = trySequence;

        await fs.writeFile(configPath, toml.stringify(velocityConfig), 'utf-8');

        return { success: true };
    } catch (error: any) {
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
