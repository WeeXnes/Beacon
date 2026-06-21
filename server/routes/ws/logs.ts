import { getLogsPath, getServerByName } from "~/types/MinecraftServer";
import * as fs from 'fs';
import jwt from 'jsonwebtoken';
import { environment } from '~/core/globals';

// Singleton to manage log watchers across all connections
const watchers = new Map<string, {
    peers: Set<any>,
    currentSize: number,
    timer: NodeJS.Timeout
}>();

export default defineWebSocketHandler({
    open(peer) {
        // Log the raw URL to help debug extraction issues
        console.log(`[WS] 🔌 New connection attempt. Raw URL: "${peer.url}"`);

        let serverName: string | null = null;
        let token: string | null = null;
        try {
            // Try different ways to parse the URL/Query
            const url = new URL(peer.url, 'http://localhost');
            serverName = url.searchParams.get('name');
            token = url.searchParams.get('token');
            
            // Fallback: If Nitro/CrossWS only provides the query string
            if (!serverName && peer.url.includes('name=')) {
                const match = peer.url.match(/name=([^&]+)/);
                if (match) serverName = decodeURIComponent(match[1]);
            }
            if (!token && peer.url.includes('token=')) {
                const match = peer.url.match(/token=([^&]+)/);
                if (match) token = decodeURIComponent(match[1]);
            }
        } catch (e) {
            console.error(`[WS] ❌ URL Parse error:`, e);
        }

        if (!token) {
            console.error(`[WS] ❌ Unauthorized WebSocket connection attempt (No Token)`);
            peer.send(JSON.stringify({ type: 'error', data: 'Unauthorized' }));
            peer.close();
            return;
        }

        try {
            jwt.verify(token, environment.jwt_globals.secret);
        } catch (error: any) {
            console.error(`[WS] ❌ Unauthorized WebSocket connection attempt (Invalid/Expired Token): ${error.message}`);
            peer.send(JSON.stringify({ type: 'error', data: 'Unauthorized' }));
            peer.close();
            return;
        }
        
        if (!serverName) {
            console.error(`[WS] ❌ No server name found in URL: "${peer.url}"`);
            peer.send(JSON.stringify({ type: 'error', data: 'No server name provided' }));
            peer.close();
            return;
        }

        const server = getServerByName(serverName);
        if (!server) {
            console.error(`[WS] ❌ Server not found: "${serverName}"`);
            peer.send(JSON.stringify({ type: 'error', data: `Server "${serverName}" not found` }));
            peer.close();
            return;
        }

        const logPath = getLogsPath(server);
        (peer as any)._serverName = serverName;
        (peer as any)._logPath = logPath;

        // Send confirmation and current status
        peer.send(JSON.stringify({ type: 'status', data: 'connected', server: serverName }));

        if (!watchers.has(logPath)) {
            console.log(`[WS] 👁️ Creating new watcher for ${serverName} log: ${logPath}`);
            let initialSize = 0;
            if (fs.existsSync(logPath)) {
                initialSize = fs.statSync(logPath).size;
            }

            const timer = setInterval(() => {
                const watcherData = watchers.get(logPath);
                if (!watcherData) return;

                // Heartbeat to keep connection alive and verify health
                watcherData.peers.forEach(p => {
                    try { p.send(JSON.stringify({ type: 'ping' })); } catch(e) { watcherData.peers.delete(p); }
                });

                if (watcherData.peers.size === 0) return;

                if (!fs.existsSync(logPath)) {
                    watcherData.currentSize = 0;
                    return;
                }

                try {
                    const stats = fs.statSync(logPath);
                    if (stats.size > watcherData.currentSize) {
                        const start = watcherData.currentSize;
                        const end = stats.size - 1;
                        watcherData.currentSize = stats.size;

                        const stream = fs.createReadStream(logPath, { start, end });
                        stream.on('data', (chunk) => {
                            const data = chunk.toString();
                            watcherData.peers.forEach(p => {
                                try {
                                    p.send(JSON.stringify({ type: 'log', data }));
                                } catch (e) {
                                    watcherData.peers.delete(p);
                                }
                            });
                        });
                    } else if (stats.size < watcherData.currentSize) {
                        // File truncated (e.g. log rotation)
                        watcherData.currentSize = stats.size;
                    }
                } catch (e) {}
            }, 1000);

            watchers.set(logPath, {
                peers: new Set([peer]),
                currentSize: initialSize,
                timer
            });
        } else {
            console.log(`[WS] 📎 Peer attached to existing watcher for ${serverName}`);
            watchers.get(logPath)!.peers.add(peer);
        }
    },
    close(peer) {
        const logPath = (peer as any)._logPath;
        const serverName = (peer as any)._serverName;
        
        if (logPath && watchers.has(logPath)) {
            const data = watchers.get(logPath)!;
            data.peers.delete(peer);
            
            if (data.peers.size === 0) {
                clearInterval(data.timer);
                watchers.delete(logPath);
                console.log(`[WS] 🛑 Watcher stopped for ${serverName} (No more peers)`);
            } else {
                console.log(`[WS] 🚪 Peer left watcher for ${serverName} (Remaining: ${data.peers.size})`);
            }
        }
    },
    error(peer, error) {
        console.error('[WS] 🚩 Peer Error:', error);
    },
    message(peer, message) {
        // Keep-alive or other messages from client could be handled here
    }
});