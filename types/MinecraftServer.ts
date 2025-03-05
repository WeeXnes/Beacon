import type {ResultPromise} from "execa";
import {environment} from "~/core/globals";

export interface MinecraftServer {
    name: string;
    version: string;
    jar_url: string;
    maxMemory: number;
    process: any;
}


export function getServerDirectory (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name
}

export function getJarPath (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name + "/server.jar"
}

export function getPropertiesPath (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name + "/server.properties"
}
