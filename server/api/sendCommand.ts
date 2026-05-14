import { getServerByName } from "~/types/MinecraftServer";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const { name, command } = body;
    const server = getServerByName(name);

    if (!server) {
        throw createError({
            statusCode: 404,
            statusMessage: "Server not found",
        });
    }

    if (!server.process) {
        throw createError({
            statusCode: 400,
            statusMessage: "Server is not running",
        });
    }

    try {
        server.process.stdin.write(`${command}\n`);
        return { success: true };
    } catch (error: any) {
        throw createError({
            statusCode: 500,
            statusMessage: `Failed to send command: ${error.message}`,
        });
    }
});
