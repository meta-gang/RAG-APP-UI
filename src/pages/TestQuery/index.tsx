// /src/pages/TestQuery/index.tsx
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { chatEvaluationRun } from '../../data/mockUserData'; 

type ModuleStatus = 'pending' | 'loading' | 'completed';

export const TestQueryPage: React.FC = () => {
    type ModulePair = [string, string];
    const modulePairs: ModulePair[] = [
        ["A", "B"],
        ["B", "C"],
        ["B", "D"],
        ["B", "E"],
        ["C", "F"],
        ["C", "G"],
        ["D", "I"],
        ["E", "I"],
        ["F", "I"],
        ["G", "I"],
        ["H", "I"],
        ["I", "J"]
    ];
    // 실행 순서 생성
    const pipeline = (() => {
        const result: string[] = [];
        const visited = new Set<string>();
        
        // 첫 번째 모듈 추가
        const firstModule = modulePairs[0][0];
        result.push(firstModule);
        visited.add(firstModule);

        // 다음 모듈들을 순서대로 추가
        modulePairs.forEach(([from, to]) => {
            result.push(to);
            visited.add(to);    
        });

        return result;
    })();
    // BFS로 모듈의 레벨을 계산하는 함수
    const calculateModuleLevels = (modulePairs: ModulePair[]) => {
        const graph: Record<string, string[]> = {};
        const levels: Record<string, number> = {};
        const allModules = new Set<string>();
        
        // 그래프 구성 및 모든 모듈 수집
        modulePairs.forEach(([from, to]) => {
            if (!graph[from]) graph[from] = [];
            if (!graph[to]) graph[to] = [];
            graph[from].push(to);
            allModules.add(from);
            allModules.add(to);
        });

        // 시작점
        const startNodes = [modulePairs[0][0]];

        // BFS
        const queue: [string, number][] = startNodes.map(node => [node, 0]);
        const visited = new Set<string>();

        while (queue.length > 0) {
            const [current, level] = queue.shift()!;
            if (visited.has(current)) continue;

            visited.add(current);
            levels[current] = level;

            const neighbors = graph[current] || [];
            for (const neighbor of neighbors) {
                if (!visited.has(neighbor)) {
                    queue.push([neighbor, level + 1]);
                }
            }
        }

        // 방문하지 않은 모듈들에 대해 레벨 할당
        allModules.forEach(module => {
            if (!levels.hasOwnProperty(module)) {
                levels[module] = 0;  // 기본적으로 최상위 레벨에 배치
            }
        });

        // 각 레벨에 있는 모듈들을 그룹화
        const modulesByLevel: Record<number, string[]> = {};
        Object.entries(levels).forEach(([module, level]) => {
            if (!modulesByLevel[level]) modulesByLevel[level] = [];
            modulesByLevel[level].push(module);
        });

        return { levels, modulesByLevel };
    };

    // 모듈의 레벨과 각 레벨 별 그룹화 계산
    const { levels, modulesByLevel } = calculateModuleLevels(modulePairs);

    // 각 모듈의 위치 계산
    const modulePositions = Object.entries(levels).reduce((acc, [module, level]) => {
        const moduleIndex = modulesByLevel[level].indexOf(module);
        const totalModulesInLevel = modulesByLevel[level].length;
        const spacing = 350;  // 모듈 간 가로 간격
        
        // 각 레벨의 모듈들을 중앙 정렬하기 위한 x 좌표 계산
        const levelWidth = totalModulesInLevel * spacing;
        const startX = (1000 - levelWidth) / 2;  // 1000은 전체 화면 너비라고 가정
        
        acc[module] = {
            x: startX + moduleIndex * spacing,
            y: level * 200  // 레벨 간 세로 간격 증가
        };
        return acc;
    }, {} as Record<string, { x: number; y: number }>);

    const pipelineSet = Array.from(new Set(pipeline))  // 단일 모듈 출력만을 위한 집합

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
                // 현재 실행 중인 모듈과 다음 모듈을 쌍으로 저장
                const currentModule = pipeline[i];
                // 현재 모듈의 모든 자식 연결 찾기
                const childConnections = modulePairs
                    .filter(([from, _]) => from === currentModule);
                
                setTqState(prev => ({ 
                    ...prev, 
                    moduleStatuses: { ...prev.moduleStatuses, [currentModule]: 'loading' },
                    activeConnections: childConnections
                }));
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
            activeConnections: []
        });
    };

    return (
        <TestQueryView
            pipeline={pipeline}
            pipelineSet={pipelineSet}
            modulePairs={modulePairs}
            moduleStatuses={tqState.moduleStatuses}
            activeConnections={tqState.activeConnections}
            messages={tqState.messages}
            handleSendMessage={handleSendMessage}
            metrics={tqState.metrics}
            handleReset={handleReset}
            modulePositions={modulePositions}
        />
    );
};