import { getServerByName } from "~/types/MinecraftServer";
import { environment } from "~/core/globals";
import { saveJsonFile } from "~/util/jsonLoader";
import * as fs from "node:fs";
import * as path from "node:path";
import { consola } from 'consola';
import axios from 'axios';
import { getAuditUser, writeAuditLog } from '../utils/audit';
import * as os from 'node:os';

export default defineEventHandler(async (event) => {
    // We need 'execa' from the top level
    const { execa } = await import('execa');

    const body = await readBody(event);
    const { name, version, build: buildParam, project, maxMemory, javaVersionName } = body;
    const user = getAuditUser(event);

    if (!name || !version || !project) {
        throw createError({ statusCode: 400, statusMessage: "Missing required fields" });
    }

    // Strict validation
    if (!/^[a-zA-Z0-9_-]+$/.test(name)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid server name. Only alphanumeric, dashes, and underscores allowed." });
    }

    const allowedProjects = ['paper', 'folia', 'velocity', 'vanilla', 'fabric', 'forge'];
    if (!allowedProjects.includes(project)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid project software specified." });
    }

    if (!/^[a-zA-Z0-9.-]+$/.test(version)) {
        throw createError({ statusCode: 400, statusMessage: "Invalid version syntax." });
    }

    const systemTotalMemoryGB = Math.ceil(os.totalmem() / (1024 * 1024 * 1024));
    const maxMemoryParsed = maxMemory !== undefined ? Number(maxMemory) : undefined;
    if (maxMemoryParsed !== undefined && (isNaN(maxMemoryParsed) || maxMemoryParsed <= 0 || maxMemoryParsed > systemTotalMemoryGB)) {
        throw createError({ statusCode: 400, statusMessage: `Invalid memory allocation. Must be between 1 and ${systemTotalMemoryGB} GB.` });
    }

    const existingServer = getServerByName(name);
    if (existingServer) {
        throw createError({ statusCode: 400, statusMessage: "Server name already exists" });
    }

    try {
        consola.info(`[INSTALL] 🛠️ Starting installation for "${name}" (${project} ${version}${buildParam ? ` #${buildParam}` : ''})`);

        const serverDir = path.resolve(environment.paths.servers, name);
        if (!fs.existsSync(serverDir)) {
            fs.mkdirSync(serverDir, { recursive: true });
        }

        let downloadUrl = '';
        let downloadName = '';
        let jarName = '';

        if (project === 'paper' || project === 'folia' || project === 'velocity') {
			const headers = {
				'User-Agent': useRuntimeConfig().app.name
			};

			const buildsResponse = await $fetch<any>(
				`https://fill.papermc.io/v3/projects/${project}/versions/${version}/builds`,
				{ headers }
			);

			const builds = Array.isArray(buildsResponse)
				? buildsResponse
				: (Array.isArray(buildsResponse?.builds) ? buildsResponse.builds : []);

			if (!builds || builds.length === 0) {
				throw new Error(`No builds found for ${project} ${version}`);
			}

			let targetBuildObj: any = null;
			if (buildParam) {
				targetBuildObj = builds.find((b: any) => String(b.id) === String(buildParam));
			}
			if (!targetBuildObj) {
				targetBuildObj = builds.find((b: any) => b.channel === 'STABLE') ?? builds[0];
			}

			let download = targetBuildObj.downloads?.['server:default'];

			if (!download) {
				const build = await $fetch<any>(
					`https://fill.papermc.io/v3/projects/${project}/versions/${version}/builds/${targetBuildObj.id}`,
					{ headers }
				);
				download = build.downloads?.['server:default'];
			}

			if (!download) {
				throw new Error(`No server download found for ${project} ${version} build ${targetBuildObj.id}`);
			}

			downloadUrl = download.url;
			downloadName = download.name;
			jarName = download.name;
		} else if (project === 'vanilla') {
            const manifest = await $fetch<any>('https://launchermeta.mojang.com/mc/game/version_manifest.json');
            const versionEntry = manifest.versions.find((v: any) => v.id === version);
            if (!versionEntry) throw new Error(`Vanilla version ${version} not found`);

            const versionDetail = await $fetch<any>(versionEntry.url);
            if (!versionDetail.downloads.server) throw new Error(`No server jar found for Vanilla ${version}`);

            downloadUrl = versionDetail.downloads.server.url;
            downloadName = `vanilla-server-${version}.jar`;
            jarName = downloadName;
        } else if (project === 'fabric') {
            let loaderVersion = buildParam;
            if (!loaderVersion) {
                const loaders = await $fetch<any[]>('https://meta.fabricmc.net/v2/versions/loader');
                loaderVersion = loaders[0].version; // Latest loader
            }
            const installers = await $fetch<any[]>('https://meta.fabricmc.net/v2/versions/installer');
            const installerVersion = installers[0].version; // Latest installer
            
            downloadUrl = `https://meta.fabricmc.net/v2/versions/loader/${version}/${loaderVersion}/${installerVersion}/server/jar`;
            downloadName = `fabric-server-launcher.jar`;
            jarName = downloadName;
        } else if (project === 'forge') {
            let forgeVersion = buildParam;

            if (!forgeVersion) {
                const promos = await $fetch<any>('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
                forgeVersion = promos.promos[`${version}-recommended`] || promos.promos[`${version}-latest`];
                
                if (!forgeVersion) {
                    const keys = Object.keys(promos.promos).filter(k => k.startsWith(version));
                    forgeVersion = promos.promos[keys[0]];
                }
            }

            if (!forgeVersion) throw new Error(`No Forge version found for MC ${version}`);

            const fullVersion = `${version}-${forgeVersion}`;
            downloadName = `forge-${fullVersion}-installer.jar`;
            downloadUrl = `https://maven.minecraftforge.net/net/minecraftforge/forge/${fullVersion}/forge-${fullVersion}-installer.jar`;
            jarName = ''; // Will be determined after installation
        }

        // Download the file
        consola.info(`[INSTALL] 📥 Downloading ${downloadName} from ${downloadUrl}...`);
        const downloadPath = path.join(serverDir, downloadName);
        
		const response = await axios({
			method: 'get',
			url: downloadUrl,
			responseType: 'stream',
			headers: {
				'User-Agent': useRuntimeConfig().app.name
			}
		});

        const writer = fs.createWriteStream(downloadPath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        // Determine Java binary for installer
        let javaBinary = 'java';
        if (javaVersionName) {
            const javaVersion = environment.settings.javaVersions.find(v => v.name === javaVersionName);
            if (javaVersion) {
                javaBinary = javaVersion.path;
            }
        }

        // Special handling for Forge (Run installer)
        if (project === 'forge') {
            consola.info(`[INSTALL] 🔨 Running Forge installer using ${javaBinary}...`);
            // Run: java -jar installer.jar --installServer
            try {
                await execa(javaBinary, ['-jar', downloadName, '--installServer'], { cwd: serverDir });
                consola.info(`[INSTALL] ✅ Forge files generated.`);
                
                const files = fs.readdirSync(serverDir);
                
                // Try to find the server jar
                const forgeJar = files.find(f => f.startsWith('forge-') && f.endsWith('.jar') && !f.includes('installer'));
                
                if (forgeJar) {
                    jarName = forgeJar;
                } else {
                    // Modern Forge (1.17+) might not have a jar in the root
                    // Check if libraries/net/minecraftforge/forge exists
                    const forgeLibDir = path.join(serverDir, 'libraries/net/minecraftforge/forge');
                    if (fs.existsSync(forgeLibDir)) {
                        jarName = 'MODERN_FORGE'; // Placeholder, serverControl will handle it
                    } else {
                        // Fallback
                        const serverJar = files.find(f => f.startsWith('forge-') && f.endsWith('.jar'));
                        jarName = serverJar || downloadName.replace('-installer', '');
                    }
                }
                
                // Cleanup installer
                if (fs.existsSync(downloadPath)) {
                    fs.unlinkSync(downloadPath);
                }
            } catch (err: any) {
                consola.error(`[INSTALL] ❌ Forge installation failed:`, err.message);
                throw new Error(`Forge installer failed: ${err.message}`);
            }
        }

        // Register server in settings
        environment.settings.servers.push({
            name,
            version: `${project} ${version}`,
            jarName: jarName,
            project: project,
            maxMemory: maxMemory || 2,
            status: 'offline',
            process: null,
            javaVersionName: javaVersionName
        });
        saveJsonFile();

        // Auto-accept EULA (Minecraft servers only)
        if (project !== 'velocity') {
            const eulaPath = path.join(serverDir, 'eula.txt');
            fs.writeFileSync(eulaPath, 'eula=true');
        }

        consola.success(`[INSTALL] ✅ Server "${name}" installed successfully`);
        writeAuditLog('INSTALL_VERSION', 'SUCCESS', user, `Installed server "${name}" (${project} ${version})`, event);
        return { success: true, message: `Server ${name} installed successfully.` };
    } catch (error: any) {
        consola.error(`[INSTALL] 🔥 Installation failed:`, error.message);
        writeAuditLog('INSTALL_VERSION', 'FAILED', user, `Failed to install server "${name}": ${error.message}`, event);
        throw createError({
            statusCode: 500,
            statusMessage: `Installation failed`,
        });
    }
});