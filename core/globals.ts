import type {MinecraftServer} from "~/types/MinecraftServer";
import type {SettingsJsonFile} from "~/types/SettingsJsonFile";
import {saveJsonFile} from "~/util/jsonLoader";

export namespace environment{
    export namespace paths{
        export let data: string = "/home/weexnes/.mcservermanager";
        export let servers: string = "/home/weexnes/.mcservermanager/servers";
    }


    export namespace files{
        export let settings: string = paths.data + "/settings.json";
    }


    export let settings: SettingsJsonFile;
}



