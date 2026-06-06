import {environment} from "~/core/globals";
import {loadJsonFile, saveJsonFile, createPathIfNotExists} from "~/util/jsonLoader";
import { updateDiscordStatus } from "./02.discord";

export default defineNitroPlugin((nitroApp) => {
    console.log("Loading config...")
    for (const key of Object.keys(environment.paths)) {
        createPathIfNotExists(environment.paths[key as keyof typeof environment.paths]);
    }
    loadJsonFile();

    // Verification of running processes
    console.log("Verifying running servers...");
    environment.settings.servers.forEach(server => {
        if (server.pid) {
            try {
                // Check if process exists by sending signal 0
                process.kill(server.pid, 0);
                server.status = 'online';
                console.log(`[INIT] Server "${server.name}" (PID ${server.pid}) is still running.`);
            } catch (e) {
                console.warn(`[INIT] Server "${server.name}" (PID ${server.pid}) is no longer running. Cleaning up.`);
                server.pid = undefined;
                server.status = 'offline';
            }
        } else {
            server.status = 'offline';
        }
    });
    saveJsonFile();
    updateDiscordStatus();
});
