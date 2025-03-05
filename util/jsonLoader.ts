import {environment} from "~/core/globals";
import * as fs from 'fs';
import type {SettingsJsonFile} from "~/types/SettingsJsonFile";
import type {MinecraftServer} from "~/types/MinecraftServer";
import {getServerDirectory} from "~/types/MinecraftServer";

export function loadJsonFile(){
    try {
        console.log(environment.files.settings)
        createEmptySettingsIfNotExists()
        let jsonStr = fs.readFileSync(environment.files.settings, 'utf-8')
        environment.settings = JSON.parse(jsonStr);

        checkAllServerDirectories()
    } catch (error) {
        console.error('Error reading or parsing JSON file:', error);
    }
}


export function saveJsonFile() {
    const jsonSettings = JSON.stringify(environment.settings, null, 2);
    fs.writeFileSync(environment.files.settings, jsonSettings);
    console.log(`Settings saved to ` + environment.files.settings);
    checkAllServerDirectories()
}



export function removeServerByName(name: string) {
    const index = environment.settings.servers.findIndex(item => item.name === name);
    environment.settings.servers.splice(index, 1);
    console.log("Removed server \"" + name + "\" at index " + index);
}


function createEmptySettingsIfNotExists() {
    try {
        fs.accessSync(environment.files.settings);
        console.log('Settings already exists!');
    } catch (error) {
        console.log('Settings does not exist, creating an empty Settings-file...');
        let emptySettings: SettingsJsonFile = ({
            eula: false,
            servers:[]
        });
        const jsonSettings = JSON.stringify(emptySettings, null, 2);
        fs.writeFileSync(environment.files.settings, jsonSettings);
        console.log('File created successfully and is empty!');
    }
}


export function createPathIfNotExists(dirPath: string) {
    try {
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true }); // Create the directory (and parent directories if necessary)
            console.log(`Directory created at ${dirPath}`);
        }
    } catch (err) {
        console.error('Error creating directory:', err);
    }
}


export function checkAllServerDirectories(){
    environment.settings.servers.forEach(server => {
        createPathIfNotExists(getServerDirectory(server))
        checkEulaFile(server)
    })
}


export function checkEulaFile(server: MinecraftServer){
    const destinationPathEula = environment.paths.servers + "/" + server.name + "/eula.txt"
    try {
        fs.accessSync(destinationPathEula);
        console.log('eula exists');
    } catch (error) {
        console.log(`Setting eula for ${server.name} to ${environment.settings.eula}`)
        fs.writeFileSync(destinationPathEula, 'eula=' + environment.settings.eula);
    }
}



