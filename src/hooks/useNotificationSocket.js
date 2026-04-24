import { useEffect, useRef } from 'react';

// WebSocket 서버 URL을 환경에 따라 자동으로 설정합니다.
// Spring Boot context-path가 /api이므로 WS 경로도 /api/ws/notifications 입니다.
// HTTP → ws://, HTTPS → wss:// 로 변환합니다.
const WS_BASE = import.meta.env.DEV
  ? 'ws://localhost:8090/api/ws/notifications'
  : `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws/notifications`;

// 재연결 지연 시간(ms) 목록 — 지수 백오프 방식입니다.
// 1초 → 2초 → 4초 → 8초 → 16초 → 30초 (이후 30초 고정)
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

/**
 * WebSocket 기반 알림 실시간 수신 훅입니다.
 *
 * 사용법:
 *   useNotificationSocket({ onNewNotification: fetchNotifications });
 *
 * 동작 방식:
 *  1. 마운트 시: localStorage에서 JWT 토큰을 가져와 WS 연결을 시도합니다.
 *  2. 서버로부터 메시지 수신 시: onNewNotification 콜백을 호출합니다.
 *     (콜백 내부에서 REST API로 최신 알림 목록을 다시 가져옵니다.)
 *  3. 연결 끊김 시: 지수 백오프로 자동 재연결을 시도합니다.
 *  4. 로그아웃/언마운트 시: 소켓을 깨끗하게 닫고 재연결 타이머를 취소합니다.
 *
 * @param {Object} options
 * @param {Function} options.onNewNotification - 서버로부터 알림 신호를 받았을 때 호출할 콜백
 * @returns {{ isConnected: boolean }} 현재 연결 상태
 */
const useNotificationSocket = ({ onNewNotification }) => {
  // WebSocket 인스턴스를 ref로 보관해 리렌더링 시 재생성을 방지합니다.
  const socketRef = useRef(null);

  // 재연결 타이머 ID를 보관해 언마운트 시 취소할 수 있도록 합니다.
  const retryTimerRef = useRef(null);

  // 현재 재연결 시도 횟수 — RETRY_DELAYS 인덱스 계산에 사용합니다.
  const retryCountRef = useRef(0);

  // 컴포넌트가 마운트 상태인지 추적해 언마운트 후 재연결을 방지합니다.
  const isMountedRef = useRef(true);

  // 콜백을 ref로 보관해 useEffect 의존성 배열에 포함하지 않아도 되도록 합니다.
  // (콜백이 바뀔 때마다 소켓을 재연결하면 불필요한 연결이 발생합니다.)
  const onNewNotificationRef = useRef(onNewNotification);
  useEffect(() => {
    onNewNotificationRef.current = onNewNotification;
  }, [onNewNotification]);

  useEffect(() => {
    isMountedRef.current = true;

    /**
     * WebSocket 연결을 생성하고 이벤트 핸들러를 등록합니다.
     * 재연결 시에도 동일한 함수를 호출합니다.
     */
    const connect = () => {
      // 1. 현재 유효한 JWT 토큰을 가져옵니다.
      //    토큰이 없으면 (로그아웃 상태) 연결을 시도하지 않습니다.
      const token = localStorage.getItem('token');
      if (!token) {
        console.debug('[WS] 토큰이 없어 WebSocket 연결을 건너뜁니다.');
        return;
      }

      // 2. 이미 연결된 소켓이 있으면 정리합니다.
      if (socketRef.current) {
        // 이벤트 핸들러를 제거해 이전 소켓의 이벤트가 새 연결에 영향을 주지 않도록 합니다.
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        // 이미 닫히는 중이 아닐 때만 닫습니다.
        if (socketRef.current.readyState < WebSocket.CLOSING) {
          socketRef.current.close();
        }
      }

      // 3. JWT 토큰을 URL 쿼리 파라미터로 전달해 연결합니다.
      //    브라우저는 WS 핸드셰이크 시 커스텀 헤더를 설정할 수 없기 때문입니다.
      const url = `${WS_BASE}?token=${encodeURIComponent(token)}`;
      console.debug('[WS] 연결 시도:', url.replace(/token=.*/, 'token=***'));

      const ws = new WebSocket(url);
      socketRef.current = ws;

      // 4. 연결 성공 핸들러
      ws.onopen = () => {
        if (!isMountedRef.current) return;
        console.info('[WS] 알림 WebSocket 연결 성공.');
        // 연결에 성공했으므로 재연결 카운터를 초기화합니다.
        retryCountRef.current = 0;
      };

      // 5. 메시지 수신 핸들러
      //    서버는 {"type":"NEW_NOTIFICATION"} 형태의 신호만 전송합니다.
      //    실제 알림 데이터는 REST API(/notifications/recent)로 가져옵니다.
      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'NEW_NOTIFICATION') {
            console.debug('[WS] 새 알림 신호 수신. REST API 재조회 시작.');
            // REST API를 호출해 최신 알림 목록을 가져옵니다.
            onNewNotificationRef.current?.();
          }
        } catch (err) {
          console.warn('[WS] 메시지 파싱 오류:', err);
        }
      };

      // 6. 연결 종료 핸들러 — 지수 백오프로 재연결을 예약합니다.
      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        // 1000은 정상 종료(로그아웃 등) — 재연결하지 않습니다.
        if (event.code === 1000) {
          console.info('[WS] 정상 종료. 재연결하지 않습니다.');
          return;
        }

        // 비정상 종료일 경우 재연결을 예약합니다.
        const delay = RETRY_DELAYS[
          Math.min(retryCountRef.current, RETRY_DELAYS.length - 1)
        ];
        retryCountRef.current += 1;
        console.info(`[WS] 연결 종료 (코드: ${event.code}). ${delay / 1000}초 후 재연결 시도...`);

        retryTimerRef.current = setTimeout(() => {
          if (isMountedRef.current) connect();
        }, delay);
      };

      // 7. 오류 핸들러 — WebSocket 오류는 항상 onclose도 함께 발생합니다.
      //    따라서 재연결 로직은 onclose에 맡깁니다.
      ws.onerror = (err) => {
        console.warn('[WS] 연결 오류 발생. onclose에서 재연결을 처리합니다.', err);
      };
    };

    // 컴포넌트 마운트 시 WebSocket 연결을 시작합니다.
    connect();

    // 언마운트 시 정리 함수: 소켓을 닫고 재연결 타이머를 취소합니다.
    return () => {
      isMountedRef.current = false;

      // 재연결 대기 중인 타이머가 있으면 취소합니다.
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }

      // WebSocket을 코드 1000(정상 종료)으로 닫습니다.
      // 이 코드를 사용하면 onclose에서 재연결을 시도하지 않습니다.
      if (socketRef.current) {
        socketRef.current.onopen = null;
        socketRef.current.onmessage = null;
        socketRef.current.onclose = null;
        socketRef.current.onerror = null;
        if (socketRef.current.readyState < WebSocket.CLOSING) {
          socketRef.current.close(1000, '컴포넌트 언마운트');
        }
        socketRef.current = null;
      }
    };
    // 의존성 배열이 비어 있는 이유:
    // 이 훅은 마운트/언마운트 시에만 실행되어야 합니다.
    // 콜백 변경은 onNewNotificationRef를 통해 항상 최신 값이 사용됩니다.
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
};

export default useNotificationSocket;
