import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const searchTerm = query.q as string;
    const loader = query.loader as string; // 'paper', 'fabric', 'forge', 'vanilla'
    const version = query.version as string;

    if (!searchTerm) return { hits: [] };

    try {
        const facets = [];
        // Map loaders to Modrinth categories
        if (loader) {
            const modrinthLoader = loader.toLowerCase();
            if (modrinthLoader !== 'vanilla') {
                facets.push([`categories:${modrinthLoader}`]);
            }
        }
        
        if (version) {
            facets.push([`versions:${version}`]);
        }
        
        facets.push(['project_type:project']);

        const response = await $fetch<any>(`https://api.modrinth.com/v2/search`, {
            query: {
                query: searchTerm,
                facets: JSON.stringify(facets),
                limit: 20
            }
        });

        return response;
    } catch (error: any) {
        console.error('[API] Modrinth search failed:', error.message);
        return { hits: [] };
    }
});
