import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const project = query.project as string;
    const version = query.version as string;

    if (!project || !version) {
        throw createError({ statusCode: 400, statusMessage: 'Project and version are required.' });
    }

    try {
        if (project === 'paper' || project === 'folia' || project === 'velocity') {
            const headers = { 'User-Agent': useRuntimeConfig().app.name };
            const buildsResponse = await $fetch<any>(
                `https://fill.papermc.io/v3/projects/${project}/versions/${version}/builds`,
                { headers }
            );

            const buildsList = Array.isArray(buildsResponse)
                ? buildsResponse
                : (buildsResponse.builds || []);

            const builds = buildsList.map((b: any) => ({
                id: String(b.id),
                name: `Build #${b.id}${b.channel ? ` (${b.channel})` : ''}`,
                channel: b.channel
            }));

            return { project, version, builds };
        }

        if (project === 'forge') {
            consola.info(`[API] Fetching Forge builds for MC ${version}...`);
            const html = await $fetch<string>(`https://files.minecraftforge.net/net/minecraftforge/forge/index_${version}.html`);
            
            // Extract all forge version strings matching {version}-{forgeVersion}
            const regex = new RegExp(`${version.replace(/\./g, '\\.')}-([0-9.]+)`, 'g');
            const matches = new Set<string>();
            let match;
            while ((match = regex.exec(html)) !== null) {
                matches.add(match[1]);
            }

            let forgeBuilds = Array.from(matches);
            
            // Fallback to promotions if scraper returned nothing
            if (forgeBuilds.length === 0) {
                const promos = await $fetch<any>('https://files.minecraftforge.net/net/minecraftforge/forge/promotions_slim.json');
                const rec = promos.promos[`${version}-recommended`];
                const lat = promos.promos[`${version}-latest`];
                if (rec) forgeBuilds.push(rec);
                if (lat && lat !== rec) forgeBuilds.push(lat);
            }

            const builds = forgeBuilds.map(b => ({
                id: b,
                name: b
            }));

            return { project, version, builds };
        }

        if (project === 'fabric') {
            consola.info(`[API] Fetching Fabric loader builds for MC ${version}...`);
            const loaders = await $fetch<any[]>(`https://meta.fabricmc.net/v2/versions/loader/${version}`);
            const builds = loaders.map(item => ({
                id: item.loader.version,
                name: `Loader ${item.loader.version}${item.loader.stable ? ' (Stable)' : ''}`
            }));
            return { project, version, builds };
        }

        return { project, version, builds: [] };
    } catch (error: any) {
        consola.error(`[API] Failed to fetch builds for ${project} ${version}:`, error.message);
        return { project, version, builds: [] };
    }
});
