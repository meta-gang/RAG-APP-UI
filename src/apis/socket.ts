/**
 * 간단한 WebSocket 클라이언트 래퍼
 *
 * - connect/on/off/send 등 기본 API 제공
 * - subscribe/unsubscribe, run-rag 관련 helper 메서드 포함
 */
class SocketClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers: Record<string, ((data: any) => void)[]> = {};

  constructor() {
    const hostname = window.location.hostname;
    this.url = `ws://${hostname}:8081/`;
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN) return;
    
    this.ws = new WebSocket(this.url);
    
    this.ws.onopen = () => {
      console.log('WebSocket Connected');
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.topic && this.handlers[message.topic]) {
          this.handlers[message.topic].forEach(handler => handler(message));
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket Disconnected');
      setTimeout(() => this.connect(), 1000);  // 1초 후 재연결 시도
    };
  }

  /**
   * 토픽에 대한 핸들러 등록
   */
  on(topic: string, handler: (data: any) => void) {
    if (!this.handlers[topic]) {
      this.handlers[topic] = [];
    }
    this.handlers[topic].push(handler);
  }

  /**
   * 토픽 핸들러 제거
   */
  off(topic: string, handler: (data: any) => void) {
    if (this.handlers[topic]) {
      this.handlers[topic] = this.handlers[topic].filter(h => h !== handler);
    }
  }

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(topics: string[]) {
    this.send({ topic: 'subscribe', topics });
  }

  unsubscribe(topics: string[]) {
    this.send({ topic: 'unsubscribe', topics });
  }

  sendTestQuery(query: string) {
    this.send({
      topic: 'test-query',
      query: query
    });
  }

  sendFileQuery(files: string[]) {
    this.send({
      topic: 'run-rag-file-query',
      files: files
    });
  }

  sendLLMQuery(settings: {file_name: string}) {
    this.send({
      topic: 'run-rag-llm-query',
      settings: settings
    });
  }

  /**
   * LLM Generated Query 파일 목록 요청
   */
  requestGeneratedQueryFiles() {
    this.send({
      topic: 'generated-query-files'
    });
  }

  /**
   * Custom Query 파일 목록 요청
   */
  requestCustomQueryFiles() {
    this.send({
      topic: 'custom-query-files'
    });
  }

  /**
   * RAG 실행 (run-rag-llm-query)
   */
  runRagLLMQuery(fileName: string) {
    this.send({
      topic: 'run-rag-llm-query',
      settings: {
        file_name: fileName
      }
    });
  }

  /**
   * RAG 실행 (run-rag-file-query)
   */
  runRagFileQuery(fileName: string) {
    this.send({
      topic: 'run-rag-file-query',
      settings: {
        file_name: fileName
      }
    });
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const socket = new SocketClient();