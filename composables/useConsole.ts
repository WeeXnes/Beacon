export const useConsole = (serverName: string) => {
  const logs = useState<string[]>(`logs-${serverName}`, () => []);
  const isAutoScrolling = ref(true);
  const isLive = ref(false);
  let ws: WebSocket | null = null;
  let pollTimer: NodeJS.Timeout | null = null;

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
        const newLines = response.logs.split('\n').map(line => line.replace('\r', ''));
        // Only update if there's actually a change to prevent cursor flickering
        if (JSON.stringify(newLines.slice(-10)) !== JSON.stringify(logs.value.slice(-10))) {
            logs.value = newLines;
        }
      }
      
      // If we are not live, ensure the poll timer is running
      if (!isLive.value && !pollTimer) {
         pollTimer = setInterval(fetchLogs, 3000);
      }
    } catch (error) {
      console.error(`[CONSOLE] Polling failed for ${serverName}:`, error);
    }
  };

  const connectWebSocket = () => {
    if (!process.client) return;
    
    if (ws) {
        ws.close();
        ws = null;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    // URL Encoding the name is important for spaces/special characters
    const wsUrl = `${protocol}//${host}/ws/logs?name=${encodeURIComponent(serverName)}`;
    
    console.log(`[WS] Connecting to ${wsUrl}`);
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        // isLive will be set by the 'status' message from server
        console.log(`[WS] WebSocket Handshake for ${serverName} established`);
    };

    ws.onmessage = (event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.type === 'log') {
                const newLines = message.data.split('\n').map((line: string) => line.replace('\r', ''));
                logs.value = [...logs.value, ...newLines].slice(-500);
            } else if (message.type === 'status' && message.data === 'connected') {
                isLive.value = true;
                console.log(`[WS] Live stream active for ${serverName}`);
                // Stop polling if we are live
                if (pollTimer) {
                    clearInterval(pollTimer);
                    pollTimer = null;
                }
            } else if (message.type === 'ping') {
                // Heartbeat from server
                if (!isLive.value) isLive.value = true;
            }
        } catch (e) {
            console.error(`[WS] Message parse error:`, e);
        }
    };

    ws.onclose = (event) => {
        isLive.value = false;
        ws = null;
        console.warn(`[WS] Connection closed for ${serverName} (Code: ${event.code}). Fallback to 3s polling.`);
        
        if (!pollTimer) {
            pollTimer = setInterval(fetchLogs, 3000);
        }
    };

    ws.onerror = (err) => {
        console.error(`[WS] Socket error for ${serverName}:`, err);
        ws?.close();
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
      // Immediate poll for feedback if not live
      if (!isLive.value) setTimeout(fetchLogs, 500);
    } catch (error) {
      console.error(`[CONSOLE] Command failed for ${serverName}:`, error);
    }
  };

  onBeforeUnmount(() => {
    if (ws) ws.close();
    if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
    }
  });

  return {
    logs,
    isAutoScrolling,
    isLive,
    fetchLogs,
    sendCommand,
    reconnect: connectWebSocket
  };
};