import {environment} from "~/core/globals";

export interface MinecraftServer {
    name: string;
    version: string;
    jarName: string;
    maxMemory: number;
    process: any;
}


export function getServerDirectory (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name
}

export function getJarPath (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name + "/" + server.jarName
}

export function getPropertiesPath (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name + "/server.properties"
}

export function getLogsPath (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name + "/logs/latest.log"
}

export function getServerByName(server_name: string): MinecraftServer | undefined {
    return environment.settings.servers.find(server => server.name == server_name);
}