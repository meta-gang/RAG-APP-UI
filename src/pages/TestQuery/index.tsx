// /src/pages/TestQuery/index.tsx
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
// mockUserData.ts 파일에서 데이터를 가져오도록 경로 수정
import { chatEvaluationRun } from '../../data/mockUserData'; 

type ModuleStatus = 'pending' | 'loading' | 'completed';

export const TestQueryPage: React.FC = () => {
    const pipeline = ["MyRetrievalModule", "MyPostRetrievalModule", "MyGenerationModule"];
    
    const [tqState, setTqState] = useRecoilState(testQueryState);

    const initialStatuses = pipeline.reduce((acc, moduleName) => {
        acc[moduleName] = 'pending';
        return acc;
    }, {} as Record<string, ModuleStatus>);

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
                    if (!foundAnswer) {
                        answer = found.answer;
                        foundAnswer = true;
                    }
                    metricsData.push({
                        moduleName: module.moduleName,
                        metrics: found.metrics
                    });
                }
            }
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

                // --- 로직 수정: 모든 모듈 평가가 끝난 후, 이 시점에서 state를 한 번에 업데이트 ---
                setTqState(prev => {
                    // 1. 차트에 표시할 데이터 가공
                    const newLiveMetricData = metricsData.reduce((acc, moduleData) => {
                        moduleData.metrics.forEach(metric => {
                            acc[metric.name] = metric.score * 100;
                        });
                        return acc;
                    }, {} as Record<string, number>);

                    // 2. 새로운 Recoil 상태 반환
                    return {
                        ...prev,
                        moduleStatuses: { ...prev.moduleStatuses, [pipeline[pipeline.length - 1]]: 'completed' },
                        messages: [...prev.messages, { sender: "bot", text: answer }],
                        metrics: metricsData,
                        liveMetricsHistory: [
                            ...prev.liveMetricsHistory,
                            {
                                query: query,
                                queryNumber: prev.liveMetricsHistory.length + 1,
                                ...newLiveMetricData
                            }
                        ]
                    };
                });
                // --- 수정 완료 ---
            }
        }, 700);
    };
    
    const handleReset = () => {
        setTqState({
            messages: [],
            metrics: [],
            moduleStatuses: initialStatuses,
            liveMetricsHistory: [],
        });
    };

    return (
        <TestQueryView
            pipeline={pipeline}
            moduleStatuses={tqState.moduleStatuses}
            messages={tqState.messages}
            handleSendMessage={handleSendMessage}
            metrics={tqState.metrics}
            liveMetricsHistory={tqState.liveMetricsHistory}
            handleReset={handleReset}
        />
    );
};