// /src/pages/TestQuery/index.tsx
import React, { useState } from 'react';
import { TestQueryView } from './TestQueryView';

export const TestQueryPage: React.FC = () => {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);

    /*
    현재는 pipeline = [모듈1, 모듈2 ...] 이렇게 지정해줬지만
    프레임워크와 연결 시 RAGContainer에 있는 모듈 이름을 자동으로 가져와서 리스트에 저장해야 함
    */
    const pipeline = ["MyRetrievalModule", "MyPostRetrievalModule", "MyGenerationModule"];

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.queryInput as HTMLInputElement;
        const query = input.value;
        if (!query) return;

        setMessages((prev) => [...prev, { sender: "user", text: query }]);
        input.value = "";

        let i = 0;
        const interval = setInterval(() => {
        if (i < pipeline.length) {
            setActiveModule(pipeline[i]);
            i++;
        } else {
            clearInterval(interval);
            setActiveModule(null);
            setMessages((prev) => [
            ...prev,
            { sender: "bot", text: `This is the answer for "${query}".` },
            ]);
        }
        }, 700);
    };

    return (
        <TestQueryView
            pipeline={pipeline}
            activeModule={activeModule}
            messages={messages}
            handleSendMessage={handleSendMessage}
        />
    );
};