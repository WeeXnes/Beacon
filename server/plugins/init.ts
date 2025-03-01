import * as fs from 'fs';
import * as path from 'path';
import {environment} from "~/core/globals";
import {loadJsonFile, removeServerByName, saveJsonFile, createPathIfNotExists} from "~/util/jsonLoader";

export default defineNitroPlugin((nitroApp) => {
    console.log("Loading config...")
    for (const key of Object.keys(environment.paths)) {
        createPathIfNotExists(environment.paths[key as keyof typeof environment.paths]);
    }
    loadJsonFile()
});




