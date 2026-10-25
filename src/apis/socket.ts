declare global {
  interface Window {
    __RAGANG_SESSION_TOKEN__?: string;
  }
}

/** Browser transport retains subscriptions, but never logs prompts, responses, or session tokens. */
export class SocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Record<string, ((data: any) => void)[]> = {};
  private subscriptions = new Set<string>();
  private retryCount = 0;
  private maxRetries = 10;
  private messageQueue: any[] = [];
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  constructor(url?: string) {
    this.url = url || process.env.REACT_APP_WS_URL || 'ws://127.0.0.1:8081';
  }
  connect() {
    this.stopped = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    if (this.retryCount >= this.maxRetries) {
      this.emit('connection-state', {
        status: 'disconnected',
        message: '연결을 복구하지 못했습니다. 서버 실행 상태를 확인하고 다시 연결하세요.',
      });
      return;
    }
    try {
      const token = typeof window !== 'undefined' ? window.__RAGANG_SESSION_TOKEN__ : undefined;
      const url = new URL(this.url);
      if (token) url.searchParams.set('session_token', token);
      const connection = new WebSocket(url.toString());
      this.ws = connection;
      connection.onopen = () => {
        if (connection !== this.ws) return;
        const recovered = this.retryCount > 0;
        this.retryCount = 0;
        if (this.subscriptions.size) this.send({ topic: 'subscribe', topics: Array.from(this.subscriptions) });
        const queued = this.messageQueue.splice(0);
        queued.forEach((message) => this.send(message));
        this.emit('connection-state', { status: 'connected', recovered });
        // Reload persisted history after every reconnection; consumers already subscribed above.
        if (recovered) this.send({ topic: 'start!' });
      };
      connection.onmessage = (event) => {
        if (connection !== this.ws) return;
        try {
          const message = JSON.parse(event.data);
          if (message && typeof message.topic === 'string') this.emit(message.topic, message);
        } catch {
          this.emit('connection-state', { status: 'error', message: '서버 메시지를 읽지 못했습니다.' });
        }
      };
      connection.onerror = () => this.emit('connection-state', { status: 'error', message: '서버 연결을 확인하세요.' });
      connection.onclose = () => {
        if (connection !== this.ws) return;
        this.ws = null;
        if (this.stopped) return;
        this.retryCount++;
        this.emit('connection-state', {
          status: 'reconnecting',
          message: '연결 복구 중입니다. 기존 결과는 유지됩니다.',
        });
        this.reconnectTimer = setTimeout(() => this.reconnectAfterBootstrap(), 3000);
      };
    } catch {
      this.emit('connection-state', { status: 'error', message: '서버 주소를 확인하세요.' });
    }
  }
  private emit(topic: string, data: any) {
    (this.handlers[topic] || []).slice().forEach((handler) => handler(data));
  }
  private reconnectAfterBootstrap() {
    if (this.stopped) return;
    // A restarted local server issues a new token. Reload only its same-origin
    // bootstrap, never reuse a cached token or evaluate response strings.
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      this.connect();
      return;
    }
    const script = document.createElement('script');
    script.src = '/ragang-session.js';
    script.async = true;
    const complete = () => {
      script.remove();
      if (!this.stopped) this.connect();
    };
    script.onload = complete;
    script.onerror = complete;
    document.head.appendChild(script);
  }
  on(topic: string, handler: (data: any) => void) {
    if (!this.handlers[topic]) this.handlers[topic] = [];
    if (!this.handlers[topic].includes(handler)) this.handlers[topic].push(handler);
  }
  off(topic: string, handler: (data: any) => void) {
    this.handlers[topic] = (this.handlers[topic] || []).filter((h) => h !== handler);
  }
  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(message));
    else this.messageQueue.push(message);
  }
  subscribe(topics: string[]) {
    topics.forEach((t) => this.subscriptions.add(t));
    if (this.ws?.readyState === WebSocket.OPEN) this.send({ topic: 'subscribe', topics });
  }
  unsubscribe(topics: string[]) {
    topics.forEach((t) => this.subscriptions.delete(t));
    if (this.ws?.readyState === WebSocket.OPEN) this.send({ topic: 'unsubscribe', topics });
  }
  sendTestQuery(query: string) {
    this.send({ topic: 'test-query', query });
  }
  sendFileQuery(files: string[]) {
    if (files[0]) this.send({ topic: 'run-rag-file-query', settings: { file_name: files[0] } });
  }
  sendLLMQuery(settings: { file_name: string }) {
    this.send({ topic: 'run-rag-llm-query', settings });
  }
  reconnect() {
    this.retryCount = 0;
    this.stopped = false;
    this.reconnectAfterBootstrap();
  }
  disconnect() {
    this.stopped = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const connection = this.ws;
    this.ws = null;
    connection?.close();
  }
}
export const socket = new SocketClient();
