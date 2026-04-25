import { useEffect, useRef, useState } from 'react';

// WebSocket 서버 URL 설정 (Spring Boot context-path /api 포함)
const WS_BASE = import.meta.env.DEV
  ? 'ws://localhost:8090/api/ws/chat'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws/chat`;

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

/**
 * useChatSocket — 실시간 1:1 채팅을 위한 WebSocket 훅입니다.
 *
 * @param {Object} options
 * @param {Function} options.onNewMessage - 새 메시지 수신 시 호출될 콜백
 */
const useChatSocket = ({ onNewMessage }) => {
  const socketRef = useRef(null);
  const retryTimerRef = useRef(null);
  const retryCountRef = useRef(0);
  const isMountedRef = useRef(true);
  const [isConnected, setIsConnected] = useState(false);

  const onNewMessageRef = useRef(onNewMessage);
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    isMountedRef.current = true;

    const connect = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        if (socketRef.current.readyState < WebSocket.CLOSING) {
          socketRef.current.close();
        }
      }

      const url = `${WS_BASE}?token=${encodeURIComponent(token)}`;
      const ws = new WebSocket(url);
      socketRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.info('[ChatWS] Connected.');
        setIsConnected(true);
        retryCountRef.current = 0;
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_MESSAGE') {
            onNewMessageRef.current?.(data);
          }
        } catch (err) {
          console.warn('[ChatWS] Message parsing error:', err);
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        if (event.code === 1000) return;

        const delay = RETRY_DELAYS[Math.min(retryCountRef.current, RETRY_DELAYS.length - 1)];
        retryCountRef.current += 1;
        
        retryTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) connect();
        }, delay);
      };

      ws.onerror = () => {
        setIsConnected(false);
      };
    };

    connect();

    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        if (socketRef.current.readyState < WebSocket.CLOSING) {
          socketRef.current.close(1000);
        }
        socketRef.current = null;
      }
    };
  }, []);

  /**
   * 메시지를 서버로 전송합니다.
   */
  const sendMessage = (receiverId, content) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        type: 'SEND',
        receiverId,
        content
      });
      socketRef.current.send(payload);
      return true;
    }
    console.warn('[ChatWS] Socket not open. Message not sent.');
    return false;
  };

  return { isConnected, sendMessage };
};

export default useChatSocket;
