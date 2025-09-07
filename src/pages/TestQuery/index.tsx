// /src/pages/TestQuery/index.tsx
import React, { useState } from 'react';
import { TestQueryView } from './TestQueryView';
import { chatEvaluationRun } from '../../data/mockUserData'; 

export const TestQueryPage: React.FC = () => {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [metrics, setMetrics] = useState<{ moduleName: string; metrics: {name: string, score: number}[] }[]>([]);

    /*
    현재는 pipeline = [모듈1, 모듈2 ...] 이렇게 지정해줬지만
    프레임워크와 연결 시 RAGContainer에 있는 모듈 이름을 자동으로 가져와서 리스트에 저장해야 함
    + 현재 리스트 형식은 Linear 구조에 대해서만 반짝이로 보여줄 수 있는데, 사이클이나 if문 등 Non linear 구조에서는 위반짝 아래반짝 다시 위반짝 이런 식으로 가야 될 듯
    프레임워크로부터 linker 받아와서 의존 구조에 맞춰서 반짝이게..?
    */
    const pipeline = ["MyRetrievalModule", "MyPostRetrievalModule", "MyGenerationModule"];

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.queryInput as HTMLInputElement;
        const query = input.value;
        if (!query) return;

        setMessages((prev) => [...prev, { sender: "user", text: query }]);
        input.value = "";

        // chatEvaluationRun에서 query에 맞는 answer 찾기
        let answer = "";
        let foundAnswer = false;
        const metricsData: { moduleName: string; metrics: {name: string, score: number}[] }[] = [];

        for (const run of chatEvaluationRun) {
            for (const module of run.modules) {
                const found = module.queries.find(q => q.query === query);
                if (found) {
                    answer = found.answer;
                    foundAnswer = true;
                    // 모든 모듈의 metrics를 하나의 배열로 합침
                    // 각 모듈의 metrics를 저장
                    metricsData.push({
                        moduleName: module.moduleName,
                        metrics: found.metrics
                    });
                }
            }
            if (foundAnswer) break;
        }

        if (!answer) {
        answer = `There is no answer for "${query}".`;
        }

        let i = 0;
        // 현재는 setInterval로 0.7초마다 activeModule을 순서대로 변경하고 있음
        const interval = setInterval(() => {
            if (i < pipeline.length) {
                setActiveModule(pipeline[i]);
                i++;
            } else {
                clearInterval(interval);
                setActiveModule(null);
                setMessages((prev) => [
                    ...prev,
                    { sender: "bot", text: answer },
                ]);
                setMetrics(metricsData);
            }
        }, 700);
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