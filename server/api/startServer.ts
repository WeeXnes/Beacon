import {getJarPath, getServerByName, getServerDirectory} from "~/types/MinecraftServer";
import {execa} from "execa";


export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name
    const server = getServerByName(server_name);
    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }
    if (server.process) {
        return { message: "Minecraft server is already running." };
    }

    try {

        const xmsArg = `-Xms${server.maxMemory}G`
        const xmxArg = `-Xmx${server.maxMemory}G`

        console.log(`Starting server ${server.name} with ${xmsArg} and ${xmxArg}`);

        server.process = execa('java', [xmsArg, xmxArg, '-jar', getJarPath(server), 'nogui'], {
            cwd: getServerDirectory(server),
        });

        server.status = 'starting';

        server.process.stdout.on('data', (data: Buffer) => {
            const line = data.toString();
            if (line.includes('Done') || line.includes('For help, type "help"')) {
                server.status = 'online';
            }
        });

        server.process.stderr.on('data', (data: Buffer) => {
            console.error(`[${server.name}] ${data.toString()}`);
        });

        server.process.on('exit', (code: number) => {
            console.log(`Server ${server.name} exited with code ${code}`);
            server.process = null;
            server.status = 'offline';
        });

        return { message: "Minecraft server started." };
    } catch (error: any) {
        return { message: "Failed to start Minecraft server.", error: error.message };
    }
});
