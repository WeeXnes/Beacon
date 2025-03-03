import type {ResultPromise} from "execa";

export interface MinecraftServer {
    name: string;
    port: number;
    version: string;
    jar_url: string;

    minMemory: number;
    maxMemory: number;

    process: any;

}
