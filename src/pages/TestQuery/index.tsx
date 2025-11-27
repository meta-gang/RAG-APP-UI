// src/pages/TestQuery/index.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { MarkerType, Node, Edge } from 'reactflow';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { socket } from '../../apis/socket';

type ModuleStatus = 'pending' | 'loading' | 'completed';

/**
 * TestQueryPage 컴포넌트
 * RAG 파이프라인 실시간 테스트 및 시각화
 */
export const TestQueryPage: React.FC = () => {
  type ModulePair = [string, string];
  const [modulePairs, setModulePairs] = useState<ModulePair[]>([]);
  const [tqState, setTqState] = useRecoilState(testQueryState);

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  /**
   * 소켓 이벤트를 등록하고 정리합니다.
   * 수신된 토픽에 따라 Recoil 상태와 로컬 상태를 갱신합니다.
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

        if (lastState.snapshots) {
            const newMetrics: any[] = [];
            Object.entries(lastState.snapshots).forEach(([moduleName, snapshots]: [string, any]) => {
                if (Array.isArray(snapshots) && snapshots.length > 0) {
                    const snap = snapshots[0];
                    if (snap.performances) {
                        const scores = snap.performances.map((p: any) => ({
                            name: p.metric || p._Performance__metric || 'Unknown',
                            score: p.score || p._Performance__score || 0
                        }));
                        if(scores.length > 0) newMetrics.push({ moduleName, metrics: scores });
                    }
                }
            });

            if (newMetrics.length > 0) {
                setTqState(prev => {
                    const updatedMetrics = prev.metrics.map(m => ({ ...m, metrics: [...m.metrics] }));
                    const currentQueryNumber = prev.liveMetricsHistory.length + 1;
                    const newChartData: any = { queryNumber: currentQueryNumber, query: `Query ${currentQueryNumber}` };
                    
                    newMetrics.forEach(newM => {
                        const idx = updatedMetrics.findIndex(m => m.moduleName === newM.moduleName);
                        if (idx !== -1) updatedMetrics[idx].metrics = [...updatedMetrics[idx].metrics, ...newM.metrics];
                        else updatedMetrics.push(newM);
                        
                        newM.metrics.forEach((m: any) => {
                            const scoreVal = m.score <= 1 ? m.score * 100 : m.score;
                            newChartData[m.name] = scoreVal;
                        });
                    });
                    
                    return {
                        ...prev,
                        metrics: updatedMetrics,
                        liveMetricsHistory: [...prev.liveMetricsHistory, newChartData]
                    };
                });
            }
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
  }, [modulePairs.length, setTqState]);

  /**
   * modulePairs와 moduleStatuses를 기반으로 그래프 레이아웃(노드/엣지)을 계산하여 상태로 설정합니다.
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
    
    const targets = new Set(modulePairs.map(p => p[1]));
    const starts = Array.from(allModules).filter(m => !targets.has(m));
    if (starts.length === 0 && allModules.size > 0) starts.push(Array.from(allModules)[0]);
    starts.forEach(id => queue.push({ id, level: 0 }));

    while(queue.length > 0) {
        const { id, level } = queue.shift()!;
        if (levels[id] !== undefined) continue;
        levels[id] = level;
        (graph[id] || []).forEach(next => queue.push({ id: next, level: level + 1 }));
    }
    allModules.forEach(m => { if (levels[m] === undefined) levels[m] = 0; });

    const newNodes: Node[] = Array.from(allModules).map(mod => {
        const level = levels[mod];
        const xOffset = (mod.charCodeAt(0) % 2) * 50; 
        return {
            id: mod,
            type: 'moduleNode',
            position: { x: xOffset, y: level * 150 },
            data: { 
                label: mod, 
                status: tqState.moduleStatuses[mod] || 'pending' 
            },
            draggable: false
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
                color: isLoop ? '#f87171' : '#9ca3af' 
            },
            style: { 
                stroke: isLoop ? '#f87171' : '#9ca3af', 
                strokeWidth: 2,
                strokeDasharray: isLoop ? '5,5' : undefined 
            },
            zIndex: isLoop ? 10 : 0,
            label: isLoop ? 'Loop' : undefined,
            labelStyle: { fill: '#f87171', fontWeight: 700 }
        };
    });

    setNodes(newNodes);
    setEdges(newEdges);

  }, [modulePairs, tqState.moduleStatuses]);

  /**
   * 사용자가 전송한 쿼리를 처리하고 소켓으로 전송합니다.
   */
  const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.queryInput as HTMLInputElement;
    const query = input.value;
    if (!query) return;

    setTqState(prev => ({
      ...prev,
      messages: [...prev.messages, { sender: 'user', text: query }],
      moduleStatuses: {},
      activeConnections: []
    }));
    socket.send({ topic: 'test-query', query });
    input.value = '';
  };

  /**
   * 뷰 상태를 초기화합니다.
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