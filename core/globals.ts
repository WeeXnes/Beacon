import type {MinecraftServer} from "~/types/MinecraftServer";
import type {SettingsJsonFile} from "~/types/SettingsJsonFile";
import * as os from 'os';
import { reactive } from "vue";
import {saveJsonFile} from "~/util/jsonLoader";

export namespace environment{
    export const jwt_globals = {
        secret: "tH5kunVlY4rDIv10Y6Hy0NoLKpH1uYtW",
    };
    export namespace paths{
        export let data: string = `${os.homedir()}/.mcservermanager`;
        export let servers: string = `${os.homedir()}/.mcservermanager/servers`;
        export let backups: string = `${os.homedir()}/.mcservermanager/backups`;
    }
    export namespace files{
        export let settings: string = paths.data + "/settings.json";
    }
    export let settings: SettingsJsonFile;
}



