import type {MinecraftServer} from "~/types/MinecraftServer";

export interface JavaVersion {
    name: string;
    path: string;
}

export interface SettingsJsonFile {
    eula: boolean;
    servers: MinecraftServer[];
    password_hash: string;
    javaVersions: JavaVersion[];
}
