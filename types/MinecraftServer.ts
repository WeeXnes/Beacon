import {environment} from "~/core/globals";
import * as fs from 'fs';
import * as path from 'path';

export type ServerStatus = 'online' | 'offline' | 'starting' | 'stopping';

export interface DiscordStatusConfig {
    enabled: boolean;
    channelId: string;
    embedColor: string;
    showVersion?: boolean;
    showDownloadLink?: boolean;
    showMotd?: boolean;
    showConnectionAddress?: boolean;
    connectionAddress?: string;
    customCaption?: string;
    lastStatusMessageId?: string;
}

export interface MinecraftServer {
    name: string;
    version: string;
    jarName: string;
    project?: string; // e.g. 'paper', 'velocity', 'vanilla'
    maxMemory: number;
    status: ServerStatus;
    process: any;
    javaVersionName?: string;
    pid?: number;
    onlinePlayers?: string[];
    maxPlayers?: number;
    stats?: {
        cpu: number;
        memory: number;
    };
    discordEnabled?: boolean;
    discordStatusConfig?: DiscordStatusConfig;
    publicModDownload?: boolean;
}


export function getServerDirectory (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name
}

export function getJarPath (server: MinecraftServer): string {
    return environment.paths.servers + "/" + server.name + "/" + server.jarName
}

export function getConfigPath (server: MinecraftServer): string {
    if (server.project === 'velocity') {
        return environment.paths.servers + "/" + server.name + "/velocity.toml"
    }
    return environment.paths.servers + "/" + server.name + "/server.properties"
}

export function getPropertiesPath (server: MinecraftServer): string {
    return getConfigPath(server);
}

export function getLogsPath (server: MinecraftServer): string {
    const modernPath = path.join(environment.paths.servers, server.name, "logs/latest.log");
    const legacyPath = path.join(environment.paths.servers, server.name, "server.log");
    
    if (fs.existsSync(modernPath)) {
        return modernPath;
    }
    return legacyPath;
}

export function getServerByName(server_name: string): MinecraftServer | undefined {
    return environment.settings.servers.find(server => server.name == server_name);
}
