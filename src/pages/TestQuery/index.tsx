// /src/pages/TestQuery/index.tsx
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { chatEvaluationRun } from '../../data/mockUserData'; 

type ModuleStatus = 'pending' | 'loading' | 'completed';

export const TestQueryPage: React.FC = () => {
    const pipeline = ["MyRetrievalModule", "MyPostRetrievalModule", "MyGenerationModule"];
    
    // useState를 useRecoilState로 변경하여 전역 상태 사용
    const [tqState, setTqState] = useRecoilState(testQueryState);

    const initialStatuses = pipeline.reduce((acc, moduleName) => {
        acc[moduleName] = 'pending';
        return acc;
    }, {} as Record<string, ModuleStatus>);

    // 컴포넌트 마운트 시 moduleStatuses 초기화
    useEffect(() => {
        if (Object.keys(tqState.moduleStatuses).length === 0) {
            setTqState(prev => ({...prev, moduleStatuses: initialStatuses}));
        }
    }, []);

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const input = e.currentTarget.queryInput as HTMLInputElement;
        const query = input.value;
        if (!query) return;

        // 상태 업데이트 시 setTqState 사용
        setTqState(prev => ({
            ...prev,
            messages: [...prev.messages, { sender: "user", text: query }],
            metrics: [],
            moduleStatuses: initialStatuses
        }));
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
                setTqState(prev => ({ ...prev, moduleStatuses: { ...prev.moduleStatuses, [pipeline[i - 1]]: 'completed' }}));
            }
            
            if (i < pipeline.length) {
                setTqState(prev => ({ ...prev, moduleStatuses: { ...prev.moduleStatuses, [pipeline[i]]: 'loading' }}));
                i++;
            } else {
                clearInterval(interval);
                setTqState(prev => ({
                    ...prev,
                    moduleStatuses: { ...prev.moduleStatuses, [pipeline[pipeline.length - 1]]: 'completed' },
                    messages: [...prev.messages, { sender: "bot", text: answer }],
                    metrics: metricsData,
                }));
            }
        }, 700);
    };
    
    // 테스트 초기화 핸들러
    const handleReset = () => {
        setTqState({
            messages: [],
            metrics: [],
            moduleStatuses: initialStatuses,
        });
    };

    return (
        <TestQueryView
            pipeline={pipeline}
            moduleStatuses={tqState.moduleStatuses}
            messages={tqState.messages}
            handleSendMessage={handleSendMessage}
            metrics={tqState.metrics}
            handleReset={handleReset}
        />
    );
};