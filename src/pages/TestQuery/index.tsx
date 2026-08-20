// src/pages/TestQuery/index.tsx
import React, { useEffect, useState } from 'react';
import { useRecoilState } from 'recoil';
import { MarkerType, Node, Edge } from 'reactflow';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { socket } from '../../apis/socket';
import { normalizeMetric } from '../Dashboard/transformData';

/**
 * TestQueryPage 컴포넌트
 *
 * RAG 파이프라인의 실시간 테스트, 토폴로지 시각화, 채팅 인터페이스,
 * 그리고 실시간 평가 지표(Metric) 차트를 제공하는 페이지입니다.
 */
export const TestQueryPage: React.FC = () => {
  type ModulePair = [string, string];
  const [modulePairs, setModulePairs] = useState<ModulePair[]>([]);
  const [tqState, setTqState] = useRecoilState(testQueryState);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  /**
   * 소켓 이벤트를 구독하고 수신된 데이터를 처리하여 상태를 갱신합니다.
   *
   * - rag-container: 파이프라인 구조(토폴로지) 수신
   * - module-statu: 각 모듈의 실행 상태(pending/loading/completed) 수신
   * - rag-result-data: RAG 실행 완료 후 결과 및 평가 지표 수신
   */
  useEffect(() => {
    socket.subscribe(['rag-container', 'rag-result-data', 'module-statu', 'error']);

    const handleModulePairs = (data: any) => {
      if (data.topic === 'rag-container' && Array.isArray(data['rag-container'])) {
        console.log('[TestQuery] Topology Received:', data['rag-container']);
        setModulePairs(data['rag-container']);
      }
    };

    const handleModuleStatus = (data: any) => {
      if (data.topic === 'module-statu' && data.module && data.statu) {
        setTqState((prev) => ({
          ...prev,
          moduleStatuses: { ...prev.moduleStatuses, [data.module]: data.statu },
        }));
      }
    };

    const handleRagResult = (data: any) => {
      if (data.topic === 'rag-result-data' && data.storage?.states) {
        const states = data.storage.states;
        const keys = Object.keys(states);
        if (keys.length === 0) return;

        const lastKey = keys[keys.length - 1];
        const lastState = states[lastKey];

        let botResponse = 'Evaluation Completed.';
        if (lastState.gen) botResponse = lastState.gen;
        else if (lastState.snapshots?.output?.[0]?.data?.gen) {
          botResponse = lastState.snapshots.output[0].data.gen;
        }

        setTqState((prev) => ({
          ...prev,
          messages: [...prev.messages, { sender: 'bot', text: botResponse }],
        }));

        const newMetrics: any[] = [];

        if (lastState.snapshots) {
          Object.entries(lastState.snapshots).forEach(([moduleName, snapshots]: [string, any]) => {
            if (moduleName === 'starter') return;

            if (Array.isArray(snapshots) && snapshots.length > 0) {
              const snap = snapshots[0];
              if (snap.performances) {
                const scores = snap.performances.map((p: any) => normalizeMetric(p));
                if (scores.length > 0) newMetrics.push({ moduleName, metrics: scores });
              }
            }
          });
        }

        if (lastState.performances && Array.isArray(lastState.performances) && lastState.performances.length > 0) {
          const e2eScores = lastState.performances.map((p: any) => normalizeMetric(p, 'Unknown E2E'));

          if (e2eScores.length > 0) {
            newMetrics.push({ moduleName: 'E2E-Metrics', metrics: e2eScores });
          }
        }

        if (newMetrics.length > 0) {
          setTqState((prev) => {
            const updatedMetrics = prev.metrics.map((m) => ({ ...m, metrics: [...m.metrics] }));
            const currentQueryNumber = prev.liveMetricsHistory.length + 1;
            const newChartData: any = { queryNumber: currentQueryNumber, query: `Query ${currentQueryNumber}` };

            newMetrics.forEach((newM) => {
              const idx = updatedMetrics.findIndex((m) => m.moduleName === newM.moduleName);
              if (idx !== -1) updatedMetrics[idx].metrics = [...updatedMetrics[idx].metrics, ...newM.metrics];
              else updatedMetrics.push(newM);

              newM.metrics.forEach((m: any) => {
                if (!m.didEval || m.score === null) return;
                const scoreVal = m.score <= 1 ? m.score * 100 : m.score;
                newChartData[m.name] = scoreVal;
              });
            });

            return {
              ...prev,
              metrics: updatedMetrics,
              liveMetricsHistory: [...prev.liveMetricsHistory, newChartData],
            };
          });
        }
      }
    };

    socket.on('rag-container', handleModulePairs);
    socket.on('module-statu', handleModuleStatus);
    socket.on('rag-result-data', handleRagResult);

    const interval = setInterval(() => {
      if (modulePairs.length === 0) socket.send({ topic: 'get-module-pairs' });
    }, 2000);

    return () => {
      socket.off('rag-container', handleModulePairs);
      socket.off('module-statu', handleModuleStatus);
      socket.off('rag-result-data', handleRagResult);
      clearInterval(interval);
    };
  }, [modulePairs.length, setTqState, modulePairs]);

  /**
   * 수신된 모듈 간 연결 정보(modulePairs)를 바탕으로 그래프 노드와 엣지를 생성합니다.
   * 위상 정렬과 유사한 로직을 사용하여 노드의 Y 좌표 레벨을 결정합니다.
   */
  useEffect(() => {
    if (modulePairs.length === 0) return;

    const graph: Record<string, string[]> = {};
    const allModules = new Set<string>();
    modulePairs.forEach(([from, to]) => {
      if (!graph[from]) graph[from] = [];
      graph[from].push(to);
      allModules.add(from);
      allModules.add(to);
    });

    const levels: Record<string, number> = {};
    const queue: { id: string; level: number }[] = [];

    const targets = new Set(modulePairs.map((p) => p[1]));
    const starts = Array.from(allModules).filter((m) => !targets.has(m));
    if (starts.length === 0 && allModules.size > 0) starts.push(Array.from(allModules)[0]);
    starts.forEach((id) => queue.push({ id, level: 0 }));

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (levels[id] !== undefined) continue;
      levels[id] = level;
      (graph[id] || []).forEach((next) => queue.push({ id: next, level: level + 1 }));
    }
    allModules.forEach((m) => {
      if (levels[m] === undefined) levels[m] = 0;
    });

    const newNodes: Node[] = Array.from(allModules).map((mod) => {
      const level = levels[mod];
      const xOffset = (mod.charCodeAt(0) % 2) * 50;
      return {
        id: mod,
        type: 'moduleNode',
        position: { x: xOffset, y: level * 150 },
        data: {
          label: mod,
          status: tqState.moduleStatuses[mod] || 'pending',
        },
        draggable: false,
      };
    });

    const newEdges: Edge[] = modulePairs.map(([source, target]) => {
      const isLoop = (levels[target] || 0) <= (levels[source] || 0);
      return {
        id: `${source}-${target}`,
        source,
        target,
        type: isLoop ? 'default' : 'smoothstep',
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isLoop ? '#f87171' : '#9ca3af',
        },
        style: {
          stroke: isLoop ? '#f87171' : '#9ca3af',
          strokeWidth: 2,
          strokeDasharray: isLoop ? '5,5' : undefined,
        },
        zIndex: isLoop ? 10 : 0,
        label: isLoop ? 'Loop' : undefined,
        labelStyle: { fill: '#f87171', fontWeight: 700 },
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  }, [modulePairs, tqState.moduleStatuses]);

  /**
   * 사용자가 입력한 쿼리를 서버로 전송하여 RAG 파이프라인 테스트를 시작합니다.
   * 채팅창에 사용자 메시지를 추가하고, 이전 상태를 초기화합니다.
   *
   * @param e 폼 전송 이벤트
   */
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.queryInput as HTMLInputElement;
    const query = input.value;
    if (!query) return;

    setTqState((prev) => ({
      ...prev,
      messages: [...prev.messages, { sender: 'user', text: query }],
      moduleStatuses: {},
      activeConnections: [],
    }));
    socket.send({ topic: 'test-query', query });
    input.value = '';
  };

  /**
   * 화면의 모든 평가 데이터와 채팅 기록을 초기화합니다.
   */
  const handleReset = () => {
    setTqState({ messages: [], metrics: [], moduleStatuses: {}, liveMetricsHistory: [], activeConnections: [] });
  };

  const handleFileUpload = (files: string[]) => socket.send({ topic: 'run-rag-file-query', files });
  const handleLLMQuery = (s: any) => socket.send({ topic: 'run-rag-llm-query', settings: s });

  return (
    <TestQueryView
      nodes={nodes}
      edges={edges}
      onNodesChange={() => {}}
      onEdgesChange={() => {}}
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
