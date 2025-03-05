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

        server.process.stdout.on('data', (data: string) => {});

        server.process.stderr.on('data', (data: string) => {
            const errorData = data.toString();
            console.log(errorData);
        });

        server.process.on('exit', (code: string) => {
            console.log(`Server exit signal from startServer with code ${code}`);
            server.process = null;
        })

        return { message: "Minecraft server started." };
    } catch (error: any) {
        return { message: "Failed to start Minecraft server.", error: error.message };
    }
});
