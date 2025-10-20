import type {MinecraftServer} from "~/types/MinecraftServer";

export interface SettingsJsonFile {
    eula: boolean;
    servers: MinecraftServer[];
    password_hash: string;
}
