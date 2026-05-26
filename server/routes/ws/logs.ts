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
        
        // Initial check for log file
        if (!fs.existsSync(logPath)) {
            peer.send(JSON.stringify({ type: 'info', message: 'Log file not found yet.' }));
        }

        // We use a watcher to detect changes
        let currentSize = 0;
        try {
            if (fs.existsSync(logPath)) {
                currentSize = fs.statSync(logPath).size;
            }
        } catch (e) {}

        const watcher = fs.watch(logPath, (event) => {
            if (event === 'change') {
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
                        // File was truncated (e.g. server restart)
                        currentSize = 0;
                    }
                } catch (e) {
                    console.error('Error reading log file in WS:', e);
                }
            }
        });

        // Store watcher on peer context to close it later
        (peer as any)._watcher = watcher;
        
        console.log(`[WS] Log stream opened for ${serverName}`);
    },
    close(peer) {
        if ((peer as any)._watcher) {
            (peer as any)._watcher.close();
            console.log(`[WS] Log stream closed`);
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