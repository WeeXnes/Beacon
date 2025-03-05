import {environment} from "~/core/globals";
import * as fs from 'fs';
import * as path from 'path';
import type {SettingsJsonFile} from "~/types/SettingsJsonFile";
import * as https from "node:https";

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
        createPathIfNotExists(environment.paths.servers + "/" + server.name)
    })

    environment.settings.servers.forEach(server => {
        const destinationPathJar = environment.paths.servers + "/" + server.name + "/server.jar"
        const destinationPathEula = environment.paths.servers + "/" + server.name + "/eula.txt"
        try {
            fs.accessSync(destinationPathJar);
            console.log('Settings already exists!');
        } catch (error) {
            downloadFile(server.jar_url, destinationPathJar);
        }

        try {
            fs.accessSync(destinationPathEula);
            console.log('eula exists');
        } catch (error) {
            console.log("setting eula to true")
            fs.writeFileSync(destinationPathEula, 'eula=true');
        }

    })
}


function downloadFile(url: string, dest: string) {
    if(url == "")
        return;


    console.log(dest + ' doesnt exist, downloading now from ' + url);
    const file = fs.createWriteStream(dest);

    https.get(url, (response) => {
        if (response.statusCode === 200) {
            response.pipe(file);
        } else {
            console.error(`Failed to download file. Status Code: ${response.statusCode}`);
        }

        file.on('finish', () => {
            file.close();
            console.log('Download complete!');
        });
    }).on('error', (err) => {
        // Handle any errors during the download
        console.error('Error during download:', err.message);
        fs.unlink(dest, () => {});
    });
}

