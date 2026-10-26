import React, { useEffect, useMemo, useState } from 'react';
import { useRecoilState } from 'recoil';
import { MarkerType } from 'reactflow';
import { testQueryState } from '../../globals/recoil/atoms';
import { TestQueryView } from './TestQueryView';
import { socket } from '../../apis/socket';
import { layoutGraph, GraphPair } from './graph';
import { TechnicalDetails } from '../../components/TechnicalDetails';
import { moduleDisplayNames, questionDisplayName } from '../../utils/display';
import { appendLiveResult, normalizedStatus, statusKey } from './liveData';

export const TestQueryPage: React.FC = () => {
  const [moduleIds, setModuleIds] = useState<string[]>([]);
  const [modulePairs, setModulePairs] = useState<GraphPair[]>([]),
    [state, setState] = useRecoilState(testQueryState);
  const [activeQuery, setActiveQuery] = useState(''),
    [queryLabels, setQueryLabels] = useState<Record<string, string>>({}),
    [error, setError] = useState('');
  useEffect(() => {
    const topology = (data: any) => {
      if (Array.isArray(data['rag-container'])) setModulePairs(data['rag-container']);
      if (Array.isArray(data.module_ids)) setModuleIds(data.module_ids.filter((id: any) => typeof id === 'string'));
    };
    const status = (data: any) => {
      if (typeof data.module !== 'string') return;
      const queryId = typeof data.query_id === 'string' ? data.query_id : '';
      if (queryId) {
        setQueryLabels((prev) => ({ ...prev, [queryId]: prev[queryId] || '' }));
        setActiveQuery((prev) => prev || queryId);
      }
      setState((prev) => ({
        ...prev,
        moduleStatuses: { ...prev.moduleStatuses, [statusKey(data.module, queryId)]: normalizedStatus(data) as any },
      }));
    };
    const result = (data: any) => {
      if (!data.storage?.states) return;
      Object.entries(data.storage.states).forEach(([id, s]: [string, any]) => {
        setQueryLabels((prev) => ({ ...prev, [id]: typeof s?.query === 'string' ? s.query : '' }));
        setActiveQuery((prev) => prev || id);
      });
      setState((prev) => appendLiveResult(prev, data.storage.states));
    };
    const failure = (data: any) => setError(data.message || '실행 오류가 발생했습니다. 저장된 진단을 확인하세요.');
    const connection = (data: any) => {
      if (data.status === 'connected') {
        socket.send({ topic: 'get-module-pairs' });
        if (data.recovered) socket.send({ topic: 'start!' });
      }
    };
    const history = (data: any) => {
      const runs = Object.values(data.history || {});
      const states = runs.at(-1);
      if (states && typeof states === 'object') result({ storage: { states } });
    };
    socket.on('rag-container', topology);
    socket.on('module-statu', status);
    socket.on('rag-result-data', result);
    socket.on('history', history);
    socket.on('error', failure);
    socket.on('connection-state', connection);
    socket.subscribe(['rag-container', 'module-statu', 'rag-result-data', 'error', 'history']);
    socket.send({ topic: 'get-module-pairs' });
    return () => {
      socket.off('rag-container', topology);
      socket.off('module-statu', status);
      socket.off('rag-result-data', result);
      socket.off('history', history);
      socket.off('error', failure);
      socket.off('connection-state', connection);
    };
  }, [setState]);
  const graph = useMemo(() => layoutGraph(modulePairs, moduleIds), [modulePairs, moduleIds]);
  const moduleLabels = moduleDisplayNames([
    ...graph.nodes.map((node) => node.id),
    ...state.metrics.map((group) => group.moduleName),
  ]);
  const nodes = graph.nodes.map((node) => ({
    ...node,
    type: 'moduleNode',
    data: {
      label: moduleLabels[node.id],
      status: state.moduleStatuses[statusKey(node.id, activeQuery)] || state.moduleStatuses[node.id] || 'pending',
    },
    draggable: false,
  }));
  const edges = graph.edges.map((edge) => ({
    id: `${edge.source}-${edge.target}`,
    source: edge.source,
    target: edge.target,
    type: edge.isCycle ? 'default' : 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed, color: edge.isCycle ? '#f87171' : '#9ca3af' },
    style: { stroke: edge.isCycle ? '#f87171' : '#9ca3af', strokeDasharray: edge.isCycle ? '5,5' : undefined },
    label: edge.isCycle ? '순환' : undefined,
  }));
  const units = Array.from(new Set(state.metrics.flatMap((group) => group.metrics.map((m) => m.unit))));
  const reset = () => {
    setState({
      messages: [],
      metrics: [],
      moduleStatuses: {},
      liveMetricsHistory: [],
      activeConnections: [],
      processedQueryIds: [],
    });
    setQueryLabels({});
    setActiveQuery('');
    setError('');
  };
  const send = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = event.currentTarget.queryInput as HTMLInputElement;
    const query = input.value.trim();
    if (!query) return;
    setActiveQuery('');
    setError('');
    setState((prev) => ({ ...prev, messages: [...prev.messages, { sender: 'user', text: query }] }));
    socket.send({ topic: 'test-query', query });
    input.value = '';
  };
  return (
    <>
      {error && (
        <p role="alert" style={{ padding: '12px 32px', color: '#fca5a5' }}>
          {error}
        </p>
      )}
      <div style={{ padding: '12px 32px', color: '#e5e7eb' }}>
        <label>
          상태를 볼 질문{' '}
          <select aria-label="상태를 볼 질문" value={activeQuery} onChange={(e) => setActiveQuery(e.target.value)}>
            {Object.entries(queryLabels).map(([id, label], index) => (
              <option value={id} key={id}>
                {questionDisplayName(label, index + 1)}
              </option>
            ))}
          </select>
        </label>
        <TechnicalDetails
          entries={[
            ['선택 질문 ID', activeQuery],
            ['모듈 ID와 표시 이름', moduleLabels],
          ]}
        />
        <p>
          각 질문의 실행 상태를 따로 표시합니다. 점수는 지표별 원래 단위({units.join(', ') || '아직 없음'})로
          표시합니다.
        </p>
      </div>
      <TestQueryView
        moduleLabels={moduleLabels}
        nodes={nodes}
        edges={edges}
        onNodesChange={() => {}}
        onEdgesChange={() => {}}
        messages={state.messages}
        metrics={state.metrics}
        liveMetricsHistory={state.liveMetricsHistory}
        handleSendMessage={send}
        handleReset={reset}
        handleFileUpload={(files) => socket.sendFileQuery(files)}
        handleLLMQuery={(settings) => socket.sendLLMQuery(settings as any)}
      />
    </>
  );
};
