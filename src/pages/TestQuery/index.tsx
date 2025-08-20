// 테스트 쿼리 페이지의 UI와 기능을 담당

import React, { useState } from 'react';

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        <div className="md:col-span-1 bg-gray-800 p-4 rounded-xl border border-gray-700">
            <h2 className="text-xl font-semibold text-white mb-4">
            Processing Flow
            </h2>
            <div className="space-y-3">
            {pipeline.map((module, index) => (
                <div
                key={module}
                className={`p-4 rounded-lg border-2 transition-all duration-300 ${
                    activeModule === module
                    ? "border-cyan-400 bg-cyan-900/50 shadow-lg"
                    : "border-gray-600 bg-gray-700"
                }`}
                >
                <span className="font-semibold text-white">
                    {index + 1}. {module}
                </span>
                </div>
            ))}
            </div>
        </div>
        <div className="md:col-span-2 bg-gray-800 rounded-xl border border-gray-700 flex flex-col">
            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
            {messages.map((msg, i) => (
                <div
                key={i}
                className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
                >
                <div
                    className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                    msg.sender === "user"
                        ? "bg-indigo-600 text-white"
                        : "bg-gray-700 text-gray-200"
                    }`}
                >
                    {msg.text}
                </div>
                </div>
            ))}
            </div>
            <div className="p-4 border-t border-gray-700">
            <form
                onSubmit={handleSendMessage}
                className="flex items-center space-x-2"
            >
                <input
                name="queryInput"
                type="text"
                placeholder="Type your query here..."
                className="w-full bg-gray-700 text-white rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-2 rounded-lg"
                >
                Send
                </button>
            </form>
            </div>
        </div>
        </div>
    );
};