import type {MinecraftServer} from "~/types/MinecraftServer";

export interface JavaVersion {
    name: string;
    path: string;
}

export interface DiscordConfig {
    enabled: boolean;
    token: string;
    channelId: string;
    showPresence: boolean;
}

export interface SettingsJsonFile {
    eula: boolean;
    servers: MinecraftServer[];
    password_hash: string;
    javaVersions: JavaVersion[];
    discord?: DiscordConfig;
}
