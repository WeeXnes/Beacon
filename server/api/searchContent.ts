import { defineEventHandler, getQuery } from 'h3';

export default defineEventHandler(async (event) => {
    const query = getQuery(event);
    const searchTerm = query.q as string;
    const projectType = query.type as string; // 'plugin' or 'mod'
    const loader = query.loader as string; // 'paper', 'fabric', 'forge'
    const version = query.version as string;

    if (!searchTerm) return { hits: [] };

    try {
        // Construct facets for Modrinth
        const facets = [];
        if (loader) facets.push([`categories:${loader.toLowerCase()}`]);
        if (version) facets.push([`versions:${version}`]);
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
