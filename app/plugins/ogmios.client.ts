// plugins/websocket.client.ts
import { ref, computed } from "vue";

interface WebSocketMessage {
  type: string;
  data: any;
  timestamp?: number;
}

interface WebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  heartbeatInterval?: number;
  protocols?: string | string[];
  connectionTimeout?: number; // Thời gian timeout cho kết nối
  debug?: boolean;
}

interface MessageHandler {
  (data: any): void;
}

interface QueuedMessage {
  type: string;
  data: any;
  timestamp: number;
  retries: number;
}

export default defineNuxtPlugin(() => {
  let ws: WebSocket | null = null;
  let reconnectTimer: NodeJS.Timeout | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;
  let connectionTimer: NodeJS.Timeout | null = null;
  let reconnectAttempts = 0;

  // Reactive states
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const connectionStatus = ref<
    "disconnected" | "connecting" | "connected" | "error" | "timeout"
  >("disconnected");
  const lastMessage = ref<WebSocketMessage | null>(null);
  const messageHistory = ref<WebSocketMessage[]>([]);
  const connectionError = ref<string | null>(null);
  const connectionProgress = ref(0); // 0-100 cho UI loading

  // Message queue for offline messages
  const messageQueue = ref<QueuedMessage[]>([]);
  const maxQueueSize = 50;

  // Message handlers
  const messageHandlers = new Map<string, Set<MessageHandler>>();
  const globalHandlers = new Set<MessageHandler>();

  // Default options
  let options: WebSocketOptions = {
    url: useRuntimeConfig().public.ogmiosEndpoint || "",
    autoConnect: true,
    reconnectInterval: 3000,
    maxReconnectAttempts: 5,
    heartbeatInterval: 30000,
    connectionTimeout: 10000, // 10 giây timeout
    debug: false,
  };

  // Helper: Log debug
  const debug = (...args: any[]) => {
    if (options.debug) {
      console.log("[WebSocket]", ...args);
    }
  };

  // Connection ready promise
  let connectionReadyPromise: Promise<void> | null = null;

  // Helper: Wait for connection to be ready
  const waitForConnection = (timeout = 5000): Promise<void> => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    if (connectionReadyPromise) {
      return connectionReadyPromise;
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("Timeout waiting for connection"));
      }, timeout);

      const checkConnection = () => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          clearTimeout(timeoutId);
          resolve();
        } else if (ws && ws.readyState === WebSocket.CONNECTING) {
          setTimeout(checkConnection, 50);
        } else {
          clearTimeout(timeoutId);
          reject(new Error("Connection failed"));
        }
      };

      checkConnection();
    });
  };

  // Helper: Initialize WebSocket connection
  const connect = (url?: string, protocols?: string | string[]) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      debug("Already connected");
      return Promise.resolve();
    }

    if (isConnecting.value && connectionReadyPromise) {
      debug("Connection already in progress, returning existing promise");
      return connectionReadyPromise;
    }

    const wsUrl = url || options.url;
    if (!wsUrl) {
      connectionError.value = "WebSocket URL is required";
      return Promise.reject(new Error(connectionError.value));
    }

    connectionReadyPromise = new Promise<void>((resolve, reject) => {
      connectionStatus.value = "connecting";
      isConnecting.value = true;
      connectionError.value = null;
      connectionProgress.value = 0;

      debug("Connecting to", wsUrl);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        if (connectionProgress.value < 90) {
          connectionProgress.value += 10;
        }
      }, options.connectionTimeout! / 10);

      // Set connection timeout
      connectionTimer = setTimeout(() => {
        clearInterval(progressInterval);
        if (ws && ws.readyState !== WebSocket.OPEN) {
          connectionStatus.value = "timeout";
          connectionError.value = "Connection timeout";
          isConnecting.value = false;
          debug("Connection timeout");
          ws?.close();
          reject(new Error("Connection timeout"));
          attemptReconnect();
        }
      }, options.connectionTimeout);

      try {
        ws = new WebSocket(wsUrl, protocols || options.protocols);

        ws.onopen = () => {
          clearInterval(progressInterval);
          clearTimeout(connectionTimer!);
          connectionTimer = null;

          debug("Connected successfully");
          isConnected.value = true;
          isConnecting.value = false;
          connectionStatus.value = "connected";
          connectionProgress.value = 100;
          reconnectAttempts = 0;
          connectionError.value = null;

          startHeartbeat();
          processMessageQueue();

          connectionReadyPromise = null;
          resolve();
        };

        ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            message.timestamp = Date.now();

            lastMessage.value = message;
            messageHistory.value.push(message);

            // Limit history size
            if (messageHistory.value.length > 100) {
              messageHistory.value.shift();
            }

            // Call global handlers
            globalHandlers.forEach((handler) => handler(message.data));

            // Call specific type handlers
            if (message.type && messageHandlers.has(message.type)) {
              messageHandlers
                .get(message.type)
                ?.forEach((handler) => handler(message.data));
            }
          } catch (error) {
            debug("Error parsing message:", error);
          }
        };

        ws.onerror = (error) => {
          clearInterval(progressInterval);
          debug("WebSocket error:", error);
          connectionStatus.value = "error";
          connectionError.value = "Connection error occurred";
          isConnecting.value = false;
          connectionReadyPromise = null;
        };

        ws.onclose = (event) => {
          clearInterval(progressInterval);
          clearTimeout(connectionTimer!);
          connectionTimer = null;

          debug("Disconnected", event.code, event.reason);
          isConnected.value = false;
          isConnecting.value = false;
          connectionStatus.value = "disconnected";
          connectionProgress.value = 0;

          stopHeartbeat();

          connectionReadyPromise = null;

          if (!event.wasClean) {
            connectionError.value = `Connection closed unexpectedly (${event.code})`;
            attemptReconnect();
          }
        };
      } catch (error) {
        clearInterval(progressInterval);
        clearTimeout(connectionTimer!);
        connectionTimer = null;

        debug("Failed to create WebSocket:", error);
        connectionStatus.value = "error";
        connectionError.value =
          error instanceof Error ? error.message : "Unknown error";
        isConnecting.value = false;
        connectionReadyPromise = null;
        reject(error);
      }
    });

    return connectionReadyPromise;
  };

  // Helper: Disconnect WebSocket
  const disconnect = () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (connectionTimer) {
      clearTimeout(connectionTimer);
      connectionTimer = null;
    }
    stopHeartbeat();

    if (ws) {
      ws.close();
      ws = null;
    }

    isConnected.value = false;
    isConnecting.value = false;
    connectionStatus.value = "disconnected";
    reconnectAttempts = 0;
    connectionProgress.value = 0;
  };

  // Helper: Send message with queue support
  const send = async (
    type: string,
    data: any,
    options?: { queueIfOffline?: boolean; waitForConnection?: boolean }
  ) => {
    const { queueIfOffline = true, waitForConnection: shouldWait = true } =
      options || {};

    // If we should wait and connection is in progress, wait for it
    if (shouldWait && isConnecting.value) {
      try {
        debug("Waiting for connection before sending...");
        await waitForConnection(5000);
      } catch (error) {
        debug("Failed to wait for connection:", error);
        if (queueIfOffline) {
          queueMessage(type, data);
          debug("Message queued:", type);
          return false;
        }
        return false;
      }
    }

    if (!ws || ws.readyState !== WebSocket.OPEN) {
      if (queueIfOffline) {
        queueMessage(type, data);
        debug("Message queued:", type);
        return false;
      }
      debug("Cannot send: not connected");
      return false;
    }

    try {
      const message: WebSocketMessage = {
        type,
        data,
        timestamp: Date.now(),
      };
      ws.send(JSON.stringify(message));
      debug("Message sent:", type);
      return true;
    } catch (error) {
      debug("Error sending message:", error);
      if (queueIfOffline) {
        queueMessage(type, data);
      }
      return false;
    }
  };

  // Helper: Queue message when offline
  const queueMessage = (type: string, data: any) => {
    if (messageQueue.value.length >= maxQueueSize) {
      messageQueue.value.shift(); // Remove oldest
    }
    messageQueue.value.push({
      type,
      data,
      timestamp: Date.now(),
      retries: 0,
    });
  };

  // Helper: Process queued messages
  const processMessageQueue = () => {
    if (messageQueue.value.length === 0) return;

    debug(`Processing ${messageQueue.value.length} queued messages`);

    const queue = [...messageQueue.value];
    messageQueue.value = [];

    queue.forEach((msg) => {
      const sent = send(msg.type, msg.data, {
        queueIfOffline: false,
        waitForConnection: false,
      });
      if (!sent && msg.retries < 3) {
        msg.retries++;
        messageQueue.value.push(msg);
      }
    });
  };

  // Helper: Send raw data
  const sendRaw = (data: string | ArrayBufferLike | Blob | ArrayBufferView) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      debug("Cannot send raw: not connected");
      return false;
    }

    try {
      ws.send(data);
      return true;
    } catch (error) {
      debug("Error sending raw data:", error);
      return false;
    }
  };

  // Helper: Register message handler for specific type
  const on = (type: string, handler: MessageHandler) => {
    if (!messageHandlers.has(type)) {
      messageHandlers.set(type, new Set());
    }
    messageHandlers.get(type)?.add(handler);
    return () => off(type, handler);
  };

  // Helper: Unregister message handler
  const off = (type: string, handler: MessageHandler) => {
    messageHandlers.get(type)?.delete(handler);
  };

  // Helper: Register global message handler
  const onMessage = (handler: MessageHandler) => {
    globalHandlers.add(handler);
    return () => offMessage(handler);
  };

  // Helper: Unregister global message handler
  const offMessage = (handler: MessageHandler) => {
    globalHandlers.delete(handler);
  };

  // Helper: Clear all handlers
  const clearHandlers = () => {
    messageHandlers.clear();
    globalHandlers.clear();
  };

  // Helper: Clear message history
  const clearHistory = () => {
    messageHistory.value = [];
    lastMessage.value = null;
  };

  // Helper: Clear message queue
  const clearQueue = () => {
    messageQueue.value = [];
  };

  // Helper: Get queue size
  const getQueueSize = () => messageQueue.value.length;

  // Internal: Attempt reconnection with exponential backoff
  const attemptReconnect = () => {
    if (reconnectAttempts >= (options.maxReconnectAttempts || 5)) {
      debug("Max reconnection attempts reached");
      connectionError.value = "Failed to reconnect after maximum attempts";
      return;
    }

    reconnectAttempts++;
    const delay = Math.min(
      options.reconnectInterval! * Math.pow(1.5, reconnectAttempts - 1),
      30000 // Max 30 seconds
    );

    debug(
      `Reconnecting in ${delay}ms (attempt ${reconnectAttempts}/${options.maxReconnectAttempts})`
    );

    reconnectTimer = setTimeout(() => {
      connect().catch((err) => {
        debug("Reconnection failed:", err.message);
      });
    }, delay);
  };

  // Internal: Start heartbeat
  const startHeartbeat = () => {
    if (!options.heartbeatInterval) return;

    heartbeatTimer = setInterval(() => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        send(
          "ping",
          { timestamp: Date.now() },
          { queueIfOffline: false, waitForConnection: false }
        );
      }
    }, options.heartbeatInterval);
  };

  // Internal: Stop heartbeat
  const stopHeartbeat = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };

  // Helper: Initialize with options
  const init = async (opts?: WebSocketOptions) => {
    options = { ...options, ...opts };
    if (options.autoConnect) {
      try {
        await connect();
        console.log("WebSocket auto-connected");
      } catch (error) {
        debug("Auto-connect failed:", error);
      }
    }
  };

  // Helper: Retry connection immediately
  const retry = () => {
    reconnectAttempts = 0;
    return connect();
  };

  // Cleanup on app unmount
  if (process.client) {
    window.addEventListener("beforeunload", () => {
      disconnect();
    });
  }

  init();
  // Provide to app
  return {
    provide: {
      ws: {
        // Connection methods
        init,
        connect,
        disconnect,
        retry,
        waitForConnection,

        // Messaging methods
        send,
        sendRaw,
        on,
        off,
        onMessage,
        offMessage,
        clearHandlers,

        // History & Queue methods
        clearHistory,
        clearQueue,
        getQueueSize,

        // Reactive states
        isConnected: computed(() => isConnected.value),
        isConnecting: computed(() => isConnecting.value),
        connectionStatus: computed(() => connectionStatus.value),
        connectionError: computed(() => connectionError.value),
        connectionProgress: computed(() => connectionProgress.value),
        lastMessage: computed(() => lastMessage.value),
        messageHistory: computed(() => messageHistory.value),
        queuedMessages: computed(() => messageQueue.value.length),
      },
    },
  };
});
