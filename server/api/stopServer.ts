import { stopMinecraftServer } from "../utils/serverControl";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name;
    const result = await stopMinecraftServer(server_name);
    return result;
});
