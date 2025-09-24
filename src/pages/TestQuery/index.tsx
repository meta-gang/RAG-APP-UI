// /src/pages/TestQuery/index.tsx
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { chatEvaluationRun } from '../../data/mockUserData';

type ModuleStatus = 'pending' | 'loading' | 'completed';

export const TestQueryPage: React.FC = () => {
  // [추가] 모듈 연결 구조 정의 (임시 데이터)
  type ModulePair = [string, string];
  const modulePairs: ModulePair[] = [
    ['A', 'B'],
    ['B', 'C'],
    ['B', 'D'],
    ['B', 'E'],
    ['C', 'F'],
    ['C', 'G'],
    ['D', 'I'],
    ['E', 'I'],
    ['F', 'I'],
    ['G', 'I'],
    ['H', 'I'],
    ['I', 'J'],
  ];

  // [수정] 실행 순서를 modulePairs 기반으로 동적 생성
  const pipeline = (() => {
    const order: string[] = [];
    const visited = new Set<string>();
    if (modulePairs.length > 0) {
      const startNode = modulePairs[0][0];
      const queue = [startNode];
      visited.add(startNode);
      while (queue.length > 0) {
        const node = queue.shift()!;
        order.push(node);
        modulePairs.forEach(([from, to]) => {
          if (from === node && !visited.has(to)) {
            visited.add(to);
            queue.push(to);
          }
        });
      }
    }
    return order;
  })();

  // [추가] BFS로 모듈의 레벨을 계산하는 함수
  const calculateModuleLevels = (modulePairs: ModulePair[]) => {
    const graph: Record<string, string[]> = {};
    const levels: Record<string, number> = {};
    const allModules = new Set<string>();

    modulePairs.forEach(([from, to]) => {
      if (!graph[from]) graph[from] = [];
      graph[from].push(to);
      allModules.add(from);
      allModules.add(to);
    });

    const startNodes = [modulePairs.length > 0 ? modulePairs[0][0] : ''];
    const queue: [string, number][] = startNodes[0] ? startNodes.map((node) => [node, 0]) : [];
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

    allModules.forEach((module) => {
      if (!levels.hasOwnProperty(module)) {
        levels[module] = 0;
      }
    });

    const modulesByLevel: Record<number, string[]> = {};
    Object.entries(levels).forEach(([module, level]) => {
      if (!modulesByLevel[level]) modulesByLevel[level] = [];
      modulesByLevel[level].push(module);
    });
    return { levels, modulesByLevel };
  };

  const { levels, modulesByLevel } = calculateModuleLevels(modulePairs);

  // [추가] 각 모듈의 위치 계산
  const modulePositions = Object.entries(levels).reduce(
    (acc, [module, level]) => {
      const moduleIndex = modulesByLevel[level].indexOf(module);
      const totalModulesInLevel = modulesByLevel[level].length;
      const spacing = 350;

      const levelWidth = (totalModulesInLevel - 1) * spacing;
      const startX = -levelWidth / 2;

      acc[module] = {
        x: startX + moduleIndex * spacing,
        y: level * 150,
      };
      return acc;
    },
    {} as Record<string, { x: number; y: number }>,
  );

  // [추가] 그래프에 표시할 고유한 모듈 이름 집합
  const pipelineSet = Array.from(new Set(pipeline));

  const [tqState, setTqState] = useRecoilState(testQueryState);

  const initialStatuses = pipeline.reduce(
    (acc, moduleName) => {
      acc[moduleName] = 'pending';
      return acc;
    },
    {} as Record<string, ModuleStatus>,
  );

  useEffect(() => {
    if (Object.keys(tqState.moduleStatuses).length === 0) {
      setTqState((prev) => ({ ...prev, moduleStatuses: initialStatuses }));
    }
  }, []);

  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.queryInput as HTMLInputElement;
    const query = input.value;
    if (!query) return;

    setTqState((prev) => ({
      ...prev,
      messages: [...prev.messages, { sender: 'user', text: query }],
      metrics: [],
      moduleStatuses: initialStatuses,
      activeConnections: [], // [수정] activeConnections 초기화
    }));
    input.value = '';

    let answer = '';
    let foundAnswer = false;
    const metricsData: { moduleName: string; metrics: { name: string; score: number }[] }[] = [];
    for (const run of chatEvaluationRun) {
      for (const module of run.modules) {
        const found = module.queries.find((q) => q.query === query);
        if (found) {
          if (!foundAnswer) {
            answer = found.answer;
            foundAnswer = true;
          }
          metricsData.push({ moduleName: module.moduleName, metrics: found.metrics });
        }
      }
    }
    if (!answer) {
      answer = `There is no answer for "${query}".`;
    }
    let i = 0;
    const interval = setInterval(() => {
      if (i > 0) {
        setTqState((prev) => ({ ...prev, moduleStatuses: { ...prev.moduleStatuses, [pipeline[i - 1]]: 'completed' } }));
      }
      if (i < pipeline.length) {
        // [추가] 현재 실행 중인 연결을 찾아 activeConnections 상태에 저장
        const currentModule = pipeline[i];
        const childConnections = modulePairs.filter(([from, _]) => from === currentModule);

        setTqState((prev) => ({
          ...prev,
          moduleStatuses: { ...prev.moduleStatuses, [pipeline[i]]: 'loading' },
          activeConnections: childConnections,
        }));
        i++;
      } else {
        clearInterval(interval);
        setTqState((prev) => {
          const newLiveMetricData = metricsData.reduce(
            (acc, moduleData) => {
              moduleData.metrics.forEach((metric) => {
                acc[metric.name] = metric.score * 100;
              });
              return acc;
            },
            {} as Record<string, number>,
          );
          return {
            ...prev,
            moduleStatuses: { ...prev.moduleStatuses, [pipeline[pipeline.length - 1]]: 'completed' },
            messages: [...prev.messages, { sender: 'bot', text: answer }],
            metrics: metricsData,
            liveMetricsHistory: [
              ...prev.liveMetricsHistory,
              { query: query, queryNumber: prev.liveMetricsHistory.length + 1, ...newLiveMetricData },
            ],
            activeConnections: [], // [추가] 실행 완료 후 연결 비활성화
          };
        });
      }
    }, 700);
  };

  const handleReset = () => {
    setTqState({
      messages: [],
      metrics: [],
      moduleStatuses: initialStatuses,
      liveMetricsHistory: [],
      activeConnections: [], // [수정] activeConnections 초기화
    });
  };

  return (
    <TestQueryView
      // [수정] View에 새로운 props 전달
      pipeline={pipeline}
      pipelineSet={pipelineSet}
      modulePairs={modulePairs}
      modulePositions={modulePositions}
      activeConnections={tqState.activeConnections}
      moduleStatuses={tqState.moduleStatuses}
      messages={tqState.messages}
      handleSendMessage={handleSendMessage}
      metrics={tqState.metrics}
      liveMetricsHistory={tqState.liveMetricsHistory}
      handleReset={handleReset}
    />
  );
};
