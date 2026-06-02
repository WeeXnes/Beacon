import type { MinecraftServer, ServerStatus } from "~/types/MinecraftServer";

export const useServers = () => {
  const servers = useState<MinecraftServer[]>('servers', () => []);
  const loading = useState<boolean>('servers-loading', () => false);

  const fetchServers = async () => {
    const token = useCookie('token').value;
    if (!token) return;

    if (servers.value.length === 0) loading.value = true;
    
    try {
      const data = await $fetch<MinecraftServer[]>('/api/getServers', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Map servers and fetch stats for online ones
      const updatedServers = await Promise.all(data.map(async (s) => {
        let stats = undefined;
        if (s.pid) {
            try {
                stats = await $fetch<{ cpu: number; memory: number }>('/api/getServerStats', {
                    method: 'POST',
                    body: { name: s.name },
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch (e) {}
        }
        return { ...s, stats };
      }));

      if (servers.value.length === 0) {
        servers.value = updatedServers;
      } else {
        updatedServers.forEach(newS => {
          const existing = servers.value.find(s => s.name === newS.name);
          if (existing) {
            existing.status = newS.status;
            existing.version = newS.version;
            existing.maxMemory = newS.maxMemory;
            existing.jarName = newS.jarName;
            existing.javaVersionName = newS.javaVersionName;
            existing.pid = newS.pid;
            existing.stats = newS.stats;
            existing.onlinePlayers = newS.onlinePlayers;
            existing.publicStatusEnabled = newS.publicStatusEnabled;
          } else {
            servers.value.push(newS);
          }
        });
        
        servers.value = servers.value.filter(s => updatedServers.some(ns => ns.name === s.name));
      }
    } catch (error: any) {
      console.error('Failed to fetch servers:', error);
      if (error.statusCode === 401) {
        const token = useCookie('token');
        token.value = null;
        useRouter().push('/login');
      }
    } finally {
      loading.value = false;
    }
  };

  const startServer = async (serverName: string) => {
    const server = servers.value.find(s => s.name === serverName);
    if (server) server.status = 'starting';
    
    try {
      await $fetch('/api/startServer', {
        method: 'POST',
        body: { name: serverName },
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      });
      // We'll rely on polling or status check to move to 'online'
    } catch (error) {
      if (server) server.status = 'offline';
      console.error('Failed to start server:', error);
    }
  };

  const stopServer = async (serverName: string) => {
    const server = servers.value.find(s => s.name === serverName);
    if (server) server.status = 'stopping';

    try {
      await $fetch('/api/stopServer', {
        method: 'POST',
        body: { name: serverName },
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      });
    } catch (error) {
      console.error('Failed to stop server:', error);
    }
  };

  let pollInterval: NodeJS.Timeout | null = null;

  const startPolling = (intervalMs = 3000) => {
    if (pollInterval) return;
    fetchServers(); // Initial fetch
    pollInterval = setInterval(fetchServers, intervalMs);
  };

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  return {
    servers,
    loading,
    fetchServers,
    startServer,
    stopServer,
    startPolling,
    stopPolling
  };
};
