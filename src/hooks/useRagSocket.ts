import { useState, useEffect, useCallback } from 'react';

// 명세서 기반 메시지 타입 정의 (추후 types/index.ts로 이동 가능)
export interface SocketMessage {
  topic: string;
  ts: number;
  type: 'module-status' | 'data' | 'metric' | 'error' | 'rag-container';
  module?: string;
  status?: 'start' | 'done';
  data?: Record<string, any>;
  metric?: Record<string, number>;
  message?: string;
  traceback?: string;
  "rag-container"?: string[];
}

const WEBSOCKET_URL = process.env.REACT_APP_SOCKET_URI || 'ws://localhost:8081'; // .env 파일 등에서 관리

export const useRagSocket = () => {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [lastMessage, setLastMessage] = useState<SocketMessage | null>(null);

  useEffect(() => {
    const ws = new WebSocket(WEBSOCKET_URL);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      try {
        const message: SocketMessage = JSON.parse(event.data);
        setLastMessage(message);
      } catch (error) {
        console.error('Failed to parse socket message:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setSocket(null);
    };

    // 컴포넌트 언마운트 시 소켓 연결 정리
    return () => {
      ws.close();
    };
  }, []);

  const sendMessage = useCallback((message: object) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }, [socket]);

  return { lastMessage, sendMessage };
};