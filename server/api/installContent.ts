import { defineEventHandler, readBody } from 'h3';
import { getServerByName, getServerDirectory } from "~/types/MinecraftServer";
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { serverName, projectId, loader, version } = body;

    const server = getServerByName(serverName);
    if (!server) throw createError({ statusCode: 404, statusMessage: "Server not found" });

    try {
        // 1. Get versions for this project from Modrinth
        const versions = await $fetch<any[]>(`https://api.modrinth.com/v2/project/${projectId}/version`, {
            query: {
                loaders: JSON.stringify([loader.toLowerCase()]),
                game_versions: JSON.stringify([version])
            }
        });

        if (versions.length === 0) {
            throw new Error(`No compatible version found for ${version} with ${loader}`);
        }

        const latestVersion = versions[0];
        const file = latestVersion.files.find((f: any) => f.primary) || latestVersion.files[0];
        const downloadUrl = file.url;
        const fileName = file.filename;

        // 2. Determine destination folder
        const serverDir = getServerDirectory(server);
        let destFolder = 'plugins';
        if (loader.toLowerCase() === 'fabric' || loader.toLowerCase() === 'forge') {
            destFolder = 'mods';
        }
        
        const fullDestFolder = path.join(serverDir, destFolder);
        if (!fs.existsSync(fullDestFolder)) {
            fs.mkdirSync(fullDestFolder, { recursive: true });
        }

        const destPath = path.join(fullDestFolder, fileName);

        // 3. Download
        console.log(`[INSTALL] Downloading ${fileName} to ${destFolder}...`);
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        return { success: true, fileName };
    } catch (error: any) {
        console.error('[API] Content installation failed:', error.message);
        throw createError({ statusCode: 500, statusMessage: error.message });
    }
});
