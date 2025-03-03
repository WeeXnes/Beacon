import type {MinecraftServer} from "~/types/MinecraftServer";
import type {SettingsJsonFile} from "~/types/SettingsJsonFile";
import * as os from 'os';
import {saveJsonFile} from "~/util/jsonLoader";

export namespace environment{
    export namespace paths{
        export let data: string = `${os.homedir()}/.mcservermanager`;
        export let servers: string = `${os.homedir()}/.mcservermanager/servers`;
    }


    export namespace files{
        export let settings: string = paths.data + "/settings.json";
    }


    export let settings: SettingsJsonFile;
}



