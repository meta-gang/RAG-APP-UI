// /src/pages/TestQuery/index.tsx
import React, { useState } from 'react';
import { TestQueryView } from './TestQueryView';
import { chatEvaluationRun } from '../../data/mockUserData'; 

type ModuleStatus = 'pending' | 'loading' | 'completed';

export const TestQueryPage: React.FC = () => {
    const pipeline = ["MyRetrievalModule", "MyPostRetrievalModule", "MyGenerationModule"];
    
    const initialStatuses = pipeline.reduce((acc, moduleName) => {
        acc[moduleName] = 'pending';
        return acc;
    }, {} as Record<string, ModuleStatus>);

    const [moduleStatuses, setModuleStatuses] = useState(initialStatuses);
    const [messages, setMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
    const [metrics, setMetrics] = useState<{ moduleName: string; metrics: {name: string, score: number}[] }[]>([]);

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.queryInput as HTMLInputElement;
        const query = input.value;
        if (!query) return;

        setMessages((prev) => [...prev, { sender: "user", text: query }]);
        setMetrics([]);
        setModuleStatuses(initialStatuses);
        input.value = "";

        let answer = "";
        let foundAnswer = false;
        const metricsData: { moduleName: string; metrics: {name: string, score: number}[] }[] = [];

        for (const run of chatEvaluationRun) {
            for (const module of run.modules) {
                const found = module.queries.find(q => q.query === query);
                if (found) {
                    answer = found.answer;
                    foundAnswer = true;
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
        const interval = setInterval(() => {
            if (i > 0) {
                setModuleStatuses(prev => ({ ...prev, [pipeline[i - 1]]: 'completed' }));
            }
            
            if (i < pipeline.length) {
                setModuleStatuses(prev => ({ ...prev, [pipeline[i]]: 'loading' }));
                i++;
            } else {
                clearInterval(interval);
                setModuleStatuses(prev => ({ ...prev, [pipeline[pipeline.length - 1]]: 'completed' }));
                
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
            moduleStatuses={moduleStatuses}
            messages={messages}
            handleSendMessage={handleSendMessage}
            metrics={metrics}
        />
    );
};