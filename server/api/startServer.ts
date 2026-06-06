import { startMinecraftServer } from "../utils/serverControl";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name;
    const result = await startMinecraftServer(server_name);
    return result;
});
