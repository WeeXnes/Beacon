import { getServerByName } from "~/types/MinecraftServer";
import { environment } from "~/core/globals";
import { saveJsonFile } from "~/util/jsonLoader";
import * as fs from "node:fs";
import * as path from "node:path";
import { consola } from 'consola';
import axios from 'axios';

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, version, project, maxMemory } = body;

    if (!name || !version || !project) {
        throw createError({ statusCode: 400, statusMessage: "Missing required fields" });
    }

    const existingServer = getServerByName(name);
    if (existingServer) {
        throw createError({ statusCode: 400, statusMessage: "Server name already exists" });
    }

    try {
        consola.info(`[INSTALL] 🛠️ Starting installation for "${name}" (${project} ${version})`);

        // 1. Get latest build info
        const buildInfo = await $fetch<any>(`https://api.papermc.io/v2/projects/${project}/versions/${version}`);
        const latestBuild = buildInfo.builds[buildInfo.builds.length - 1];
        
        const buildDetail = await $fetch<any>(`https://api.papermc.io/v2/projects/${project}/versions/${version}/builds/${latestBuild}`);
        const downloadName = buildDetail.downloads.application.name;
        const downloadUrl = `https://api.papermc.io/v2/projects/${project}/versions/${version}/builds/${latestBuild}/downloads/${downloadName}`;

        // 2. Setup directory
        const serverDir = path.resolve(environment.paths.servers, name);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        // 3. Download JAR
        consola.info(`[INSTALL] 📥 Downloading ${downloadName}...`);
        const jarPath = path.join(serverDir, downloadName);
        
        const response = await axios({
            method: 'get',
            url: downloadUrl,
            responseType: 'stream'
        });

        const writer = fs.createWriteStream(jarPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // 4. Register server in settings
        environment.settings.servers.push({
            name,
            version: `${project} ${version}`,
            jarName: downloadName,
            maxMemory: maxMemory || 2,
            status: 'offline',
            process: null
        });
        saveJsonFile();

        // 5. Auto-accept EULA
        const eulaPath = path.join(serverDir, 'eula.txt');
        fs.writeFileSync(eulaPath, 'eula=true');

        consola.success(`[INSTALL] ✅ Server "${name}" installed successfully`);
        return { success: true, message: `Server ${name} installed successfully.` };
    } catch (error: any) {
        consola.error(`[INSTALL] 🔥 Installation failed:`, error.message);
        throw createError({
            statusCode: 500,
            statusMessage: `Installation failed: ${error.message}`,
        });
    }
});