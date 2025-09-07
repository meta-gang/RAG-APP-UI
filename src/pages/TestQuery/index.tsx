// /src/pages/TestQuery/index.tsx
import React, { useState, useEffect } from 'react';
import { TestQueryView } from './TestQueryView';
// ✨ WebSocket 훅 import
import { useRagSocket, SocketMessage } from '@hooks/useRagSocket';

export const TestQueryPage: React.FC = () => {
    // --- 기존 상태값들 ---
    const [pipeline, setPipeline] = useState<string[]>([]);
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [metrics, setMetrics] = useState<{ moduleName: string; metrics: { name: string, score: number }[] }[]>([]);
    
    // ✨ WebSocket 훅 사용 ✨
    const { lastMessage, sendMessage } = useRagSocket();

    // ✨ WebSocket으로부터 메시지를 수신할 때마다 상태 업데이트 ✨
    useEffect(() => {
        if (!lastMessage) return;

        switch (lastMessage.type) {
            case 'rag-container':
                // 파이프라인 구조 설정
                if (lastMessage['rag-container']) {
                    setPipeline(lastMessage['rag-container']);
                }
                break;
            case 'module-status':
                // 모듈 상태 업데이트 (시각 효과)
                if (lastMessage.module && lastMessage.status === 'start') {
                    setActiveModule(lastMessage.module);
                } else if (lastMessage.module && lastMessage.status === 'done') {
                    // 필요 시 '완료' 상태 처리
                }
                break;
            case 'metric':
                // 메트릭 결과 업데이트
                if (lastMessage.module && lastMessage.metric) {
                    setMetrics(prev => {
                        const newMetrics = [...prev];
                        const moduleIndex = newMetrics.findIndex(m => m.moduleName === lastMessage.module);
                        const metricData = Object.entries(lastMessage.metric!).map(([name, score]) => ({ name, score }));
                        
                        if (moduleIndex > -1) {
                            newMetrics[moduleIndex].metrics.push(...metricData);
                        } else {
                            newMetrics.push({ moduleName: lastMessage.module!, metrics: metricData });
                        }
                        return newMetrics;
                    });
                }
                break;
            case 'data':
                 // 최종 답변(data) 처리
                if (lastMessage.data?.answer) {
                    setActiveModule(null); // 모든 프로세스 종료
                    setMessages((prev) => [...prev, { sender: "bot", text: lastMessage.data!.answer }]);
                }
                break;
            case 'error':
                // 에러 처리
                const errorText = `Error in ${lastMessage.module}: ${lastMessage.message}`;
                setMessages((prev) => [...prev, { sender: "bot", text: errorText }]);
                setActiveModule(null);
                break;
        }
    }, [lastMessage]);


    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.queryInput as HTMLInputElement;
        const query = input.value;
        if (!query) return;

        // 초기화
        setMessages((prev) => [...prev, { sender: "user", text: query }]);
        setMetrics([]);
        input.value = "";

        // ✨ 백엔드로 작업 시작 메시지 전송 ✨
        sendMessage({
            type: "start-job",
            query: query,
        });
    };

    return (
        <TestQueryView
            pipeline={pipeline}
            activeModule={activeModule}
            messages={messages}
            handleSendMessage={handleSendMessage}
            metrics={metrics}
        />
    );
};