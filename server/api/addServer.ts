import {getJarPath, getServerByName} from "~/types/MinecraftServer";
import {environment} from "~/core/globals";
import {saveJsonFile} from "~/util/jsonLoader";
import * as crypto from 'crypto';
import * as fs from "node:fs";

export default defineEventHandler(async (event) => {

    const body = await readBody(event);
    const { newServer, fileUpload } = body;

    const server = getServerByName(newServer.name);

    if(server) {
        return  { message: "Server with name " + newServer.name + " does already exist" };
    }

    let uploadData = fileUpload.data;

    let checksumFromClient = fileUpload.checksum;
    let checksumFromServer = calculateChecksum(uploadData);


    try {

        if(checksumFromServer != checksumFromClient) {
            return { status: 'error', error: "Checksum failed" };
        }

        environment.settings.servers.push({...newServer})
        saveJsonFile()


        const decodedData = decodeBase64Node(uploadData)
        fs.writeFileSync(getJarPath(newServer), decodedData);

        return { status: 'success' };
    } catch (error) {
        return { status: 'error', error: error };
    }
});


const calculateChecksum = (data: any) => {
    try {
        const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf-8');
        const hash = crypto.createHash('sha256');
        hash.update(buffer);
        const checksum = hash.digest('hex');
        console.log('Checksum (SHA-256):', checksum);
        return checksum;
    } catch (error) {
        console.error('Error calculating checksum:', error);
    }
};



function decodeBase64Node(base64String: string): Buffer {
    return Buffer.from(base64String, 'base64');
}



