import { getLogsPath, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs';

export default defineWebSocketHandler({
    open(peer) {
        const url = new URL(peer.url, 'http://localhost');
        const serverName = url.searchParams.get('name');
        
        if (!serverName) {
            peer.send(JSON.stringify({ error: 'No server name provided' }));
            peer.close();
            return;
        }

        const server = getServerByName(serverName);
        if (!server) {
            peer.send(JSON.stringify({ error: 'Server not found' }));
            peer.close();
            return;
        }

        const logPath = getLogsPath(server);
        
        let watcher: fs.FSWatcher | null = null;
        let currentSize = 0;

        const setupWatcher = () => {
            if (!fs.existsSync(logPath)) {
                setTimeout(setupWatcher, 2000);
                return;
            }

            try {
                currentSize = fs.statSync(logPath).size;
                
                // use watchFile for better cross-platform reliability with logs
                fs.watchFile(logPath, { interval: 500 }, (curr, prev) => {
                    if (curr.mtime !== prev.mtime) {
                        try {
                            const stats = fs.statSync(logPath);
                            if (stats.size > currentSize) {
                                const stream = fs.createReadStream(logPath, {
                                    start: currentSize,
                                    end: stats.size
                                });
                                stream.on('data', (chunk) => {
                                    peer.send(JSON.stringify({ type: 'log', data: chunk.toString() }));
                                });
                                currentSize = stats.size;
                            } else if (stats.size < currentSize) {
                                currentSize = 0;
                            }
                        } catch (e) {}
                    }
                });
                (peer as any)._watching = true;
            } catch (e) {
                console.error(`[WS] Failed to watch ${logPath}:`, e);
            }
        };

        setupWatcher();
        
        console.log(`[WS] Log stream opened for ${serverName}`);
    },
    close(peer) {
        const url = new URL(peer.url, 'http://localhost');
        const serverName = url.searchParams.get('name');
        if (serverName) {
            const server = getServerByName(serverName);
            if (server) {
                fs.unwatchFile(getLogsPath(server));
                console.log(`[WS] Log stream closed for ${serverName}`);
            }
        }
    },
    error(peer, error) {
        console.error('[WS] Error:', error);
        if ((peer as any)._watcher) {
            (peer as any)._watcher.close();
        }
    },
    message(peer, message) {
        // We don't expect messages from client here for now
    }
});