// /src/pages/TestQuery/index.tsx
import React, { useState } from 'react';
import { TestQueryView } from './TestQueryView';

export const TestQueryPage: React.FC = () => {
    const [activeModule, setActiveModule] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
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