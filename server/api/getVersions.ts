import { consola } from 'consola';

export default defineEventHandler(async (event) => {
    try {
        consola.info('[API] Fetching Minecraft versions from PaperMC...');
        
        // Fetch project info (we focus on 'paper' for now)
        const projectData = await $fetch<any>('https://api.papermc.io/v2/projects/paper');
        
        // Versions come in descending order or mixed, usually we want the latest first
        const versions = projectData.versions.reverse();

        return {
            project: 'paper',
            versions: versions
        };
    } catch (error: any) {
        consola.error('[API] Failed to fetch versions:', error.message);
        throw createError({
            statusCode: 500,
            statusMessage: 'Failed to fetch versions from PaperMC',
        });
    }
});