import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const searchTerm = query.q as string;
    const loader = query.loader as string; // 'paper', 'fabric', 'forge', 'vanilla'
    const version = query.version as string;

    if (!searchTerm) return { hits: [] };

    try {
        console.log(`[MARKETPLACE] Searching for "${searchTerm}" (Loader: ${loader}, Version: ${version})`);

        const constructFacets = (withVersion: boolean) => {
            const facets = [];
            const modrinthLoader = loader?.toLowerCase();

            // 1. Loader/Category Facet
            if (modrinthLoader && modrinthLoader !== 'vanilla') {
                facets.push([`categories:${modrinthLoader}`]);
            }

            // 2. Version Facet (Optional)
            if (withVersion && version) {
                facets.push([`versions:${version}`]);
            }

            // 3. Project Type Facet
            if (modrinthLoader === 'fabric' || modrinthLoader === 'forge' || modrinthLoader === 'quilt') {
                facets.push(['project_type:mod']);
            } else if (modrinthLoader === 'paper' || modrinthLoader === 'folia' || modrinthLoader === 'spigot') {
                facets.push(['project_type:plugin']);
            } else {
                // Vanilla or unknown: show both mods and plugins
                facets.push(['project_type:mod', 'project_type:plugin']);
            }

            return facets;
        };

        const executeSearch = async (facets: any[]) => {
            return await $fetch<any>(`https://api.modrinth.com/v2/search`, {
                query: {
                    query: searchTerm,
                    facets: JSON.stringify(facets),
                    limit: 20
                },
                headers: {
                    'User-Agent': 'Beacon/1.0.0 (https://github.com/WeeXnes/Beacon)'
                }
            });
        };

        // Try with version first
        let facets = constructFacets(true);
        console.log(`[MARKETPLACE] Attempting search with version filter:`, JSON.stringify(facets));
        let response = await executeSearch(facets);

        // Fallback: If no results, try without version filter
        if ((!response.hits || response.hits.length === 0) && version) {
            console.log(`[MARKETPLACE] No results found with version ${version}. Retrying without version filter...`);
            facets = constructFacets(false);
            response = await executeSearch(facets);
        }

        console.log(`[MARKETPLACE] Final result count: ${response.hits?.length || 0}`);
        return response;
    } catch (error: any) {        console.error('[API] Modrinth search failed:', error.message);
        if (error.response) {
            console.error('[API] Modrinth Error Detail:', error.response._data);
        }
        return { hits: [] };
    }
});
