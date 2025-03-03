import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import {MinecraftServer} from "~/types/MinecraftServer";
import {execa} from "execa";


export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name

    const server = environment.settings.servers.find(server => server.name == server_name);

    if(!server) {
        return  { message: "Server with name " + server_name + " does not exist" };
    }

    if (server.process) {
        return { message: "Minecraft server is already running." };
    }


    const workingDir = environment.paths.servers + "/" + server.name;
    const jarPath = environment.paths.servers + "/" + server.name + "/server.jar";

    try {
        server.process = execa('java', ['-jar', jarPath, 'nogui'], {
            cwd: workingDir,
        });

        server.process.stdout.on('data', (data: string) => {
            const logData = data.toString();
            console.log(logData);
        });

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
