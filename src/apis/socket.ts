// src/apis/socket.ts

class SocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Record<string, ((data: any) => void)[]> = {};
  private retryCount: number = 0;
  private maxRetries: number = 10;
  private messageQueue: any[] = [];

  constructor() {
    this.url = process.env.REACT_APP_WS_URL || 'ws://127.0.0.1:8081';
  }

  private getTime() {
    return new Date().toLocaleTimeString();
  }

  /**
   * 소켓 연결을 시도합니다.
   * 연결 성공 시 대기열에 있는 메시지를 일괄 전송합니다.
   */
  connect() {
    if (this.ws) {
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        console.log(`[${this.getTime()}] Socket is already connected or connecting.`);
        return;
      }
    }

    if (this.retryCount >= this.maxRetries) {
      console.error(`[${this.getTime()}] Max retry attempts reached.`);
      return;
    }

    console.log(`[${this.getTime()}] Attempting to connect...`);

    try {
      this.ws = new WebSocket(this.url);
    } catch (e) {
      console.error('WebSocket creation error:', e);
      return;
    }

    this.ws.onopen = () => {
      console.log(`%c[${this.getTime()}] Connected to Server`, 'color: green; font-weight: bold;');
      this.retryCount = 0;
      this.flushMessageQueue();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[${this.getTime()}] 📩 Received [${message.topic}]:`, message);

        if (message.topic && this.handlers[message.topic]) {
          this.handlers[message.topic].forEach((handler) => handler(message));
        }
      } catch (error) {
        console.error(`[${this.getTime()}] Message parsing error:`, error);
      }
    };

    this.ws.onerror = (error) => {
      console.error(`[${this.getTime()}] Socket Error:`, error);
    };

    this.ws.onclose = (event) => {
      console.log(`[${this.getTime()}] Connection Closed (Code: ${event.code}). Reconnecting in 3s...`);
      this.ws = null;
      this.retryCount++;
      setTimeout(() => this.connect(), 3000);
    };
  }

  private flushMessageQueue() {
    if (this.messageQueue.length > 0) {
      console.log(`[${this.getTime()}] Flushing ${this.messageQueue.length} queued messages.`);
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.send(message);
      }
    }
  }

  /**
   * 특정 토픽에 대한 이벤트 핸들러를 등록합니다.
   * @param topic 구독할 토픽 이름
   * @param handler 데이터 처리 함수
   */
  on(topic: string, handler: (data: any) => void) {
    if (!this.handlers[topic]) this.handlers[topic] = [];
    this.handlers[topic].push(handler);
  }

  /**
   * 등록된 이벤트 핸들러를 제거합니다.
   * @param topic 토픽 이름
   * @param handler 제거할 함수
   */
  off(topic: string, handler: (data: any) => void) {
    if (this.handlers[topic]) {
      this.handlers[topic] = this.handlers[topic].filter((h) => h !== handler);
    }
  }

  /**
   * 서버로 메시지를 전송합니다.
   * 연결되지 않은 경우 대기열(Queue)에 저장합니다.
   * @param message 전송할 JSON 객체
   */
  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
      console.log(`[${this.getTime()}] 📤 Sent:`, message);
    } else {
      console.log(`[${this.getTime()}] Queueing message:`, message.topic || message);
      this.messageQueue.push(message);
    }
  }

  /**
   * 서버에 토픽 구독을 요청합니다.
   * @param topics 구독할 토픽 배열
   */
  subscribe(topics: string[]) {
    const msg = { topic: 'subscribe', topics };
    console.log(`[${this.getTime()}] Subscribing to:`, topics);
    this.send(msg);
  }

  unsubscribe(topics: string[]) {
    this.send({ topic: 'unsubscribe', topics });
  }

  sendTestQuery(query: string) {
    this.send({ topic: 'test-query', query });
  }

  sendFileQuery(files: string[]) {
    this.send({ topic: 'run-rag-file-query', files });
  }

  sendLLMQuery(settings: { file_name: string }) {
    this.send({ topic: 'run-rag-llm-query', settings });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socket = new SocketClient();
