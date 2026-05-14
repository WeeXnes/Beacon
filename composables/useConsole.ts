export const useConsole = (serverName: string) => {
  const logs = useState<string[]>(`logs-${serverName}`, () => []);
  const isAutoScrolling = ref(true);

  const fetchLogs = async () => {
    try {
      const response = await $fetch<{ logs: string }>('/api/getLogs', {
        method: 'POST',
        body: { name: serverName },
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      });
      
      if (response.logs) {
        const newLogs = response.logs.split('\n').filter(line => line.trim() !== '');
        // Only update if there are changes to avoid flickering
        if (JSON.stringify(newLogs.slice(-50)) !== JSON.stringify(logs.value.slice(-50))) {
          logs.value = newLogs;
        }
      }
    } catch (error) {
      console.error(`Failed to fetch logs for ${serverName}:`, error);
    }
  };

  const sendCommand = async (command: string) => {
    try {
      await $fetch('/api/sendCommand', {
        method: 'POST',
        body: { name: serverName, command },
        headers: {
          Authorization: `Bearer ${useCookie('token').value}`
        }
      });
    } catch (error) {
      console.error(`Failed to send command to ${serverName}:`, error);
    }
  };

  return {
    logs,
    isAutoScrolling,
    fetchLogs,
    sendCommand
  };
};
