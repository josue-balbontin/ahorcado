import { useState, useEffect, useRef, useCallback } from 'react';

export interface WSMessage {
  type: string;
  [key: string]: any;
}

interface UseWebSocketReturn {
  connected: boolean;
  sendMessage: (msg: WSMessage) => void;
  lastMessage: WSMessage | null;
  messages: WSMessage[];
  disconnect: () => void;
}

export function useWebSocket(url: string | null): UseWebSocketReturn {
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WSMessage | null>(null);
  const [messages, setMessages] = useState<WSMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const connect = useCallback(() => {
    if (!url) return;

    // Limpiar conexión anterior
    if (wsRef.current) {
      wsRef.current.close();
    }

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('[WS] Conectado a', url);
      setConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data: WSMessage = JSON.parse(event.data);
        setLastMessage(data);
        setMessages(prev => [...prev, data]);
      } catch (e) {
        console.error('[WS] Error al parsear mensaje:', e);
      }
    };

    ws.onerror = (error) => {
      console.error('[WS] Error:', error);
    };

    ws.onclose = (event) => {
      console.log('[WS] Desconectado:', event.code, event.reason);
      setConnected(false);

      // Reconectar tras 2 segundos si no fue intencional
      if (event.code !== 1000) {
        reconnectTimeoutRef.current = setTimeout(() => {
          console.log('[WS] Intentando reconectar...');
          connect();
        }, 2000);
      }
    };
  }, [url]);

  useEffect(() => {
    connect();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close(1000, 'Componente desmontado');
      }
    };
  }, [connect]);

  const sendMessage = useCallback((msg: WSMessage) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    } else {
      console.warn('[WS] No conectado, no se puede enviar:', msg);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close(1000, 'Desconexión manual');
    }
  }, []);

  return { connected, sendMessage, lastMessage, messages, disconnect };
}
