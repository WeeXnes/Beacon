import type {ResultPromise} from "execa";

export interface MinecraftServer {
    name: string;
    port: number;
    maxPlayers: number;
    version: string;
    jar_url: string;

    isRunning: boolean;
    currentPlayers: number;


    difficulty: "peaceful" | "easy" | "normal" | "hard";
    spawnProtection: number;
    viewDistance: number;


    minMemory: number;
    maxMemory: number;

    logs: string[];


    process: any;

}
