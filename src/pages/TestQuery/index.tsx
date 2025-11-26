// /src/pages/TestQuery/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { socket } from '../../apis/socket';

type ModuleStatus = 'pending' | 'loading' | 'completed';

/**
 * TestQueryPage 컴포넌트
 *
 * RAG 파이프라인 정보를 받아 UI 상태를 관리하고 웹소켓 이벤트를 처리합니다.
 * 실시간 쿼리 테스트 및 모듈 흐름 시각화를 담당합니다.
 */
export const TestQueryPage: React.FC = () => {
  type ModulePair = [string, string];
  const [modulePairs, setModulePairs] = useState<ModulePair[]>([]);

  /**
   * 초기 렌더링 시 'rag-container' 토픽을 구독하여 모듈 연결 정보(modulePairs)를 수신합니다.
   */
  useEffect(() => {
    const handleModulePairs = (data: any) => {
      if (data.topic === 'rag-container' && Array.isArray(data['rag-container'])) {
        setModulePairs(data['rag-container']);
      }
    };
    
    socket.on('rag-container', handleModulePairs);
    // 백엔드에 모듈 구조 요청
    socket.send({ topic: 'get-module-pairs' });
    
    return () => {
      socket.off('rag-container', handleModulePairs);
    };
  }, []);

  /**
   * modulePairs를 기반으로 BFS를 수행하여 파이프라인 실행 순서를 계산합니다.
   * @returns {string[]} 모듈 실행 순서 배열
   */
  const pipeline = useMemo(() => {
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
  }, [modulePairs]);

  /**
   * 모듈 쌍으로부터 레벨 및 레벨별 모듈 목록을 계산합니다.
   * 그래프 시각화 시 노드의 Y축 위치를 결정하는 데 사용됩니다.
   * @param modulePairs - [from,to] 쌍의 배열
   * @returns 객체 { levels, modulesByLevel }
   */
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

  /**
   * 모듈 위치를 계산합니다 (x,y 좌표).
   * 레벨별 정렬 간격과 세로 간격을 사용하여 시각적으로 배치합니다.
   */
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

  /**
   * 파이프라인의 초기 상태 맵을 생성합니다.
   */
  const initialStatuses = useMemo(() => pipeline.reduce(
    (acc, moduleName) => {
      acc[moduleName] = 'pending';
      return acc;
    },
    {} as Record<string, ModuleStatus>,
  ), [pipeline]);

  /**
   * Recoil 상태가 비어있을 경우 초기 상태로 설정합니다.
   */
  useEffect(() => {
    if (Object.keys(tqState.moduleStatuses).length === 0) {
      setTqState((prev) => ({ ...prev, moduleStatuses: initialStatuses }));
    }
  }, [initialStatuses, setTqState, tqState.moduleStatuses]);

  /**
   * 웹소켓 연결과 토픽 구독 및 핸들러를 설정합니다.
   * 컴포넌트 언마운트 시 구독 해제 및 연결 종료를 수행합니다.
   */
  useEffect(() => {
    socket.connect();
    socket.subscribe(['rag-container', 'rag-result-data', 'module-statu', 'error']);
    
    /**
     * 모듈 상태 업데이트 처리기
     * @param data - { moduleName: string, status: string, activeConnections?: any[] }
     */
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

    /**
     * RAG 결과 처리기
     * @param data - { message?: string, metrics?: any[] }
     */
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

    /**
     * 에러 처리기
     * @param data - 에러 정보 객체
     */
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
        // socket.disconnect(); // 필요에 따라 주석 해제
    };
  }, [setTqState]);

  /**
   * 사용자 쿼리 폼 전송 핸들러
   * @param e - 폼 이벤트
   */
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

  /**
   * 상태 초기화 핸들러
   */
  const handleReset = () => {
    setTqState({
      messages: [],
      metrics: [],
      moduleStatuses: initialStatuses,
      liveMetricsHistory: [],
      activeConnections: [],
    });
  };

  /**
   * 파일 업로드로 쿼리 실행 핸들러
   * @param files - 업로드된 파일 경로 배열
   */
  const handleFileUpload = (files: string[]) => {
        socket.send({
            topic: 'run-rag-file-query',
            files: files
        });
    };

  /**
   * LLM 기반 쿼리 실행 트리거 핸들러
   * @param settings - { llm_option, llm_model, query_id }
   */
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