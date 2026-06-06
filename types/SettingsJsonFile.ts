import type {MinecraftServer} from "~/types/MinecraftServer";

export interface JavaVersion {
    name: string;
    path: string;
}

export interface DiscordConfig {
    enabled: boolean;
    token: string;
    clientId: string;
    guildId: string;
}

export interface SettingsJsonFile {
    eula: boolean;
    servers: MinecraftServer[];
    password_hash: string;
    javaVersions: JavaVersion[];
    discordConfig?: DiscordConfig;
}
