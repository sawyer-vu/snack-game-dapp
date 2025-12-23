interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export default defineNuxtPlugin(() => {
  let ws: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;

  const isConnected = ref(false);
  const connectionError = ref<string | null>(null);
  const lastMessage = ref<any>(null);

  const messageHandlers = new Map<string, Set<(data: any) => void>>();
  const useWallet = useWalletStore();

  let options: WebSocketOptions = {
    url: useRuntimeConfig().public.wssEndpoint || "",
    autoConnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
  };

  const connect = async (url?: string) => {
    if (ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = url || options.url;
    if (!wsUrl) throw new Error("WebSocket URL is required");

    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        isConnected.value = true;
        reconnectAttempts = 0;
        connectionError.value = null;
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          lastMessage.value = message;

          console.log("Received message:", message);
          useWallet.snapshotUtxo = message.snapshotUtxo;
          // Lọc UTxO theo địa chỉ ví hiện tại
          // if (message.snapshotUtxo && useWallet.account?.baseAddressBech32) {
          //   console.log(
          //     "Filtering UTxOs for address:",
          //     useWallet.account.baseAddressBech32
          //   );
          //   const currentAddress = useWallet.account.baseAddressBech32;
          //   console.log(Object.values(message.snapshotUtxo), currentAddress);
          //   const found = Object.values(message.snapshotUtxo).find(
          //     (u) => u.address === currentAddress
          //   );

          //   console.log("Found UTxO for current address:", found);

          //   // if (filteredUtxos.length > 0) {
          //   //   console.log("UTxOs for current wallet:", filteredUtxos);
          //   //   // Cập nhật vào store
          //   //   useWallet.utxos = filteredUtxos;
          //   // }
          // }

          if (message.type && messageHandlers.has(message.type)) {
            messageHandlers
              .get(message.type)
              ?.forEach((handler) => handler(message.data));
          }
        } catch (error) {
          console.error("Error parsing message:", error);
        }
      };

      ws.onerror = () => {
        connectionError.value = "Connection error";
        reject(new Error("Connection error"));
      };

      ws.onclose = (event) => {
        isConnected.value = false;
        if (!event.wasClean) {
          attemptReconnect();
        }
      };
    });
  };

  const disconnect = () => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws?.close();
    ws = null;
    isConnected.value = false;
    reconnectAttempts = 0;
  };

  const send = (type: string, data: any) => {
    console.log("Sending message:", ws);
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket not connected");
      return false;
    }

    try {
      ws.send(JSON.stringify({ ...data }));
      return true;
    } catch (error) {
      console.error("Error sending message:", error);
      return false;
    }
  };

  const on = (type: string, handler: (data: any) => void) => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, new Set());
    }
    messageHandlers.get(type)?.add(handler);
    return () => messageHandlers.get(type)?.delete(handler);
  };

  const attemptReconnect = () => {
    if (reconnectAttempts >= (options.maxReconnectAttempts || 5)) {
      connectionError.value = "Max reconnection attempts reached";
      return;
    }

    reconnectAttempts++;
    reconnectTimer = setTimeout(() => {
      connect().catch(console.error);
    }, options.reconnectInterval);
  };

  const init = async (opts?: WebSocketOptions) => {
    options = { ...options, ...opts };
    if (options.autoConnect) {
      try {
        await connect();
      } catch (error) {
        console.error("Auto-connect failed:", error);
      }
    }
  };

  if (process.client) {
    window.addEventListener("beforeunload", disconnect);
  }

  // init();

  return {
    provide: {
      ws: {
        connect,
        disconnect,
        send,
        on,
        isConnected: computed(() => isConnected.value),
        connectionError: computed(() => connectionError.value),
        lastMessage: computed(() => lastMessage.value),
      },
    },
  };
});
