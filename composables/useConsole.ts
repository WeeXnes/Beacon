export const useConsole = (serverName: string) => {
  const logs = useState<string[]>(`logs-${serverName}`, () => []);
  const isAutoScrolling = ref(true);
  let ws: WebSocket | null = null;

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
        logs.value = response.logs.split('\n').filter(line => line.trim() !== '');
      }
      
      connectWebSocket();
    } catch (error) {
      console.error(`Failed to fetch initial logs for ${serverName}:`, error);
    }
  };

  const connectWebSocket = () => {
    if (!process.client) return;
    
    if (ws) {
        console.log(`[WS] Closing existing connection for ${serverName}`);
        ws.close();
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws/logs?name=${encodeURIComponent(serverName)}`;
    
    console.log(`[WS] Connecting to ${wsUrl}`);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log(`[WS] Connected for ${serverName}`);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'log') {
                const newLines = message.data.split('\n').filter((line: string) => line.trim() !== '');
                logs.value = [...logs.value, ...newLines].slice(-500);
            } else if (message.error) {
                console.error(`[WS] Server error: ${message.error}`);
            }
        } catch (e) {
            console.error(`[WS] Failed to parse message:`, e);
        }
    };

    ws.onclose = (event) => {
        console.log(`[WS] Closed for ${serverName} (Code: ${event.code})`);
        // Optionally reconnect if not closed by unmount
    };

    ws.onerror = (error) => {
        console.error(`[WS] Error for ${serverName}:`, error);
    };
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

  onBeforeUnmount(() => {
    if (ws) {
        ws.close();
    }
  });

  return {
    logs,
    isAutoScrolling,
    fetchLogs,
    sendCommand
  };
};
