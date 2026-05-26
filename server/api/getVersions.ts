import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const project = query.project as string || 'paper';

    try {
        if (project === 'paper' || project === 'folia') {
            consola.info(`[API] Fetching versions from ${project}...`);
            const projectData = await $fetch<any>(`https://api.papermc.io/v2/projects/${project}`);
            return {
                project: project,
                versions: projectData.versions.reverse()
            };
        } 
        
        if (project === 'fabric') {
            consola.info('[API] Fetching versions from Fabric...');
            const gameVersions = await $fetch<any[]>('https://meta.fabricmc.net/v2/versions/game');
            const stableVersions = gameVersions.filter(v => v.stable).map(v => v.version);
            return {
                project: 'fabric',
                versions: stableVersions
            };
        }

        if (project === 'forge') {
            consola.info('[API] Fetching versions from Forge...');
            const promos = await $fetch<any>('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
            const versions = new Set<string>();
            Object.keys(promos.promos).forEach(key => {
                const mcVer = key.split('-')[0];
                if (mcVer && mcVer !== 'latest' && mcVer !== 'recommended') {
                    versions.add(mcVer);
                }
            });
            return {
                project: 'forge',
                versions: Array.from(versions).reverse()
            };
        }

        return { project, versions: [] };
    } catch (error: any) {
        consola.error(`[API] Failed to fetch versions for ${project}:`, error.message);
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to fetch versions for ${project}`,
        });
    }
});