import { environment } from "~/core/globals";
import { execa } from "execa";

export default defineEventHandler(async (event) => {
    const body = await readBody(event);
    const server_name: string = body.name;

    const server = environment.settings.servers.find(server => server.name == server_name);

    if (!server) {
        return { message: "Server with name " + server_name + " does not exist" };
    }


    if (!server.process) {
        return { message: "Minecraft server is not running." };
    }
    

    try {
        // Send "stop" command to the server process stdin
        server.process.stdin.write('stop\n');

        // Optionally, listen for the process exit or cleanup
        server.process.on('exit', (code: string) => {
            console.log(`Server exit signal from stopServer with code ${code}`);
            server.process = null;
        });


        return { message: "Minecraft server is stopping." };
    } catch (error: any) {
        return { message: "Failed to stop Minecraft server.", error: error.message };
    }
});
