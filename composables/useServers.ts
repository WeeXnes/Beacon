import type { MinecraftServer, ServerStatus } from "~/types/MinecraftServer";

export const useServers = () => {
  const servers = useState<MinecraftServer[]>('servers', () => []);
  const loading = useState<boolean>('servers-loading', () => false);

  const fetchServers = async () => {
    const token = useCookie('token').value;
    if (!token) return;

    loading.value = true;
    try {
      const data = await $fetch<MinecraftServer[]>('/api/getServers', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Initialize status if missing or ensure it's synced
      servers.value = data.map(s => ({
        ...s,
        status: s.process ? 'online' : 'offline'
      }));
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
