// /src/pages/TestQuery/index.tsx
import React, { useEffect } from 'react';
import { useRecoilState } from 'recoil';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { socket } from '../../apis/socket';

type ModuleStatus = 'pending' | 'loading' | 'completed';

export const TestQueryPage: React.FC = () => {
  type ModulePair = [string, string];
  const modulePairs: ModulePair[] = [];

  // 실행 순서를 modulePairs 기반으로 동적 생성
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

  // BFS로 모듈의 레벨 계산
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

  // 각 모듈의 위치 계산
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

  // 그래프에 표시할 고유 모듈 이름 집합
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

  // websocket
  useEffect(() => {
    // WebSocket 연결
    socket.connect();
    
    // 토픽 구독
    socket.subscribe(['rag-container', 'rag-result-data', 'module-statu', 'error']);
    
    // 모듈 상태 변경 핸들러
    const handleModuleStatus = (data: any) => {
        if (data.moduleName && data.status) {
        setTqState(prev => ({
            ...prev,
            moduleStatuses: {
            ...prev.moduleStatuses,
            [data.moduleName]: data.status
            }
        }));

        if (data.activeConnections) {
            setTqState(prev => ({
            ...prev,
            activeConnections: data.activeConnections
            }));
        }
        }
    };

    // RAG 결과 데이터 핸들러
    const handleRagResult = (data: any) => {
        if (data.message) {
        setTqState(prev => ({
            ...prev,
            messages: [...prev.messages, { sender: 'bot', text: data.message }]
        }));
        }
        if (data.metrics) {
        setTqState(prev => ({
            ...prev,
            metrics: [...prev.metrics, ...data.metrics]
        }));
        }
    };

    // 에러 핸들러
    const handleError = (data: any) => {
        console.error('WebSocket error:', data);
        setTqState(prev => ({
        ...prev,
        messages: [...prev.messages, { sender: 'bot', text: `Error: ${data.message}` }]
        }));
    };

    // 핸들러 등록
    socket.on('module-statu', handleModuleStatus);
    socket.on('rag-result-data', handleRagResult);
    socket.on('error', handleError);

    // 컴포넌트 언마운트 시 정리
    return () => {
        socket.off('module-statu', handleModuleStatus);
        socket.off('rag-result-data', handleRagResult);
        socket.off('error', handleError);
        socket.unsubscribe(['rag-container', 'rag-result-data', 'module-statu', 'error']);
        socket.disconnect();
    };
    }, [setTqState]);

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
      activeConnections: [],
    }));

    // WebSocket으로 쿼리 전송
    socket.send({
        topic: 'test-query',
        query: query
    });
    input.value = '';
  };

  const handleReset = () => {
    setTqState({
      messages: [],
      metrics: [],
      moduleStatuses: initialStatuses,
      liveMetricsHistory: [],
      activeConnections: [],
    });
  };

  const handleFileUpload = (files: string[]) => {
        socket.send({
            topic: 'run-rag-file-query',
            files: files
        });
    };

    const handleLLMQuery = (settings: {
        llm_option: 'make-query' | 'made-query',
        llm_model: string,
        query_id: string
    }) => {
        socket.send({
            topic: 'run-rag-llm-query',
            settings: settings
        });
    };

  return (
    <TestQueryView
      pipeline={pipeline}
      pipelineSet={pipelineSet}
      modulePairs={modulePairs}
      modulePositions={modulePositions}
      activeConnections={tqState.activeConnections}
      moduleStatuses={tqState.moduleStatuses}
      messages={tqState.messages}
      handleSendMessage={handleSendMessage}
      handleFileUpload={handleFileUpload}
      handleLLMQuery={handleLLMQuery} 
      metrics={tqState.metrics}
      liveMetricsHistory={tqState.liveMetricsHistory}
      handleReset={handleReset}
    />
  );
};
