// /src/pages/TestQuery/TestQueryView.tsx
import React from 'react';
import * as S from './TestQuery.styled';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { evaluationRuns } from '../../data/mockData';
import { CHART_COLORS } from '../../globals/styles/color';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Accordion } from '../../components/Accordion';
import ReactFlow, { 
  Controls, 
  Background, 
  MarkerType,
  Handle,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

const ModuleNode = ({ data }: { data: { label: string; status: string } }) => {
  return (
    <div
      style={{
        padding: '24px 32px',
        borderRadius: '12px',
        background: data.status === 'loading' 
          ? 'rgba(52, 211, 153, 0.2)' 
          : data.status === 'completed'
          ? 'rgba(52, 211, 153, 0.1)'
          : 'rgba(55, 65, 81, 0.3)',
        border: '2px solid #374151',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        color: '#E5E7EB',
        minWidth: '300px',
        width: '100%',
        whiteSpace: 'nowrap',
        overflow: 'visible',
        transition: 'all 0.3s ease',
        position: 'relative'
      }}
    >
      <Handle 
        type="target" 
        position={Position.Top}
        style={{ 
          background: '#374151',
          width: '8px',
          height: '8px',
          top: '-4px'
        }} 
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        style={{ 
          background: '#374151',
          width: '8px',
          height: '8px',
          bottom: '-4px'
        }} 
      />
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px',
        fontSize: '16px',
        fontWeight: 600
      }}>
        <div style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {data.status === 'loading' && <S.Spinner />}
          {data.status === 'completed' && <CheckCircle2 size={24} color="#34d399" />}
          {data.status === 'pending' && <div style={{ width: '24px', height: '24px' }} />}
        </div>
        <span style={{ flexGrow: 1 }}>{data.label}</span>
      </div>
    </div>
  );
};

interface TestQueryViewProps {
  pipeline: string[];
  pipelineSet: string[];
  modulePairs: [string, string][];
  moduleStatuses: Record<string, 'pending' | 'loading' | 'completed'>;
  activeConnections: [string, string][];  // 현재 활성화된 모든 연결
  modulePositions: Record<string, { x: number; y: number }>;  // BFS로 계산된 모듈 위치
  messages: { sender: "user" | "bot"; text: string }[];
  metrics: {
    moduleName: string;
    metrics: {name: string, score: number}[];
  }[];
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  handleReset: () => void; 
}

export const TestQueryView: React.FC<TestQueryViewProps> = ({
  pipeline,
  pipelineSet,
  modulePairs,
  moduleStatuses,
  activeConnections,
  modulePositions,
  messages,
  handleSendMessage,
  metrics,
  handleReset 
}) => {
  const latestData = evaluationRuns[evaluationRuns.length - 1];
  
  const moduleMetrics = latestData?.modules.map(module => {
    const metricDistribution: Record<string, number[]> = {};
    module.queries.forEach(query => {
      query.metrics.forEach(metric => {
        if (!metricDistribution[metric.name]) {
          metricDistribution[metric.name] = [];
        }
        metricDistribution[metric.name].push(metric.score);
      });
    });
    const metricData = Object.entries(metricDistribution).map(([name, scores]) => {
      const ranges = Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 10}-${(i + 1) * 10}`,
        count: 0
      }));
      scores.forEach(score => {
        const idx = Math.min(Math.floor(score * 10), 9);
        ranges[idx].count++;
      });
      return { name, distribution: ranges };
    });
    return { moduleName: module.moduleName, metrics: metricData };
  }) || [];

  return (
    <S.PageLayout>
      <S.FlowPanel>
        <S.TestQueryHeader>
          <S.Title>Processing Flow</S.Title>
          {/* 리셋 버튼 추가 */}
          <S.ResetButton onClick={handleReset} title="Reset Test">
            <RefreshCw size={14} />
          </S.ResetButton>
        </S.TestQueryHeader>
        <div style={{ width: '100%', height: '600px' }}>
          <ReactFlow
            proOptions={{ hideAttribution: true }}
            nodes={pipelineSet.map((module, index) => ({
              id: module,
              type: 'moduleNode',
              position: modulePositions[module],
              data: { 
                label: module,
                status: moduleStatuses[module] || 'pending'
              },
              draggable: false,
              style: {
                width: 300
              }
            }))}
            edges={modulePairs.map(([source, target], index) => ({
              id: `${source}-${target}-${index}`,
              source,
              target,
              type: 'default',  // smoothstep 대신 default 사용
              // 현재 실행 중인 모듈 쌍과 일치할 때만 애니메이션 적용
              animated: moduleStatuses[source] === 'loading' && 
                      activeConnections.some(([s, t]) => s === source && t === target),
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: '#ffffffff',
              },
              style: {
                stroke: '#ffffffff',
                strokeWidth: 2,
              },
              // 연결선 경로 커스터마이징
              pathOptions: {
                offset: index * 20,  // 겹치는 선들을 옆으로 이동
                borderRadius: 20,  // 모서리를 부드럽게
              }
            }))}
            nodeTypes={{ moduleNode: ModuleNode }}
            fitView
            defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          >
            <Background />
            <Controls />
          </ReactFlow>
        </div>
      </S.FlowPanel>

      <S.ChatPanel>
        <S.Title>Live Test</S.Title>
        <S.MessageArea>
          {messages.length === 0 && <div style={{textAlign: 'center', color: '#9ca3af', marginTop: 'auto', marginBottom: 'auto'}}>Send a query to start the test.</div>}
          {messages.map((msg, i) => (
            <S.MessageWrapper key={i} sender={msg.sender}>
              <S.MessageBubble sender={msg.sender}>
                {msg.text}
              </S.MessageBubble>
            </S.MessageWrapper>
          ))}
        </S.MessageArea>
        <S.InputForm onSubmit={handleSendMessage}>
          <S.StyledInput
            name="queryInput"
            type="text"
            placeholder="Type your query here..."
          />
          <S.SendButton type="submit">
            Send
          </S.SendButton>
        </S.InputForm>
      </S.ChatPanel>

      <S.ResultPanel>
        <S.Title>Evaluation Result</S.Title>
        <div>
          {metrics.length === 0 && <div style={{color: '#9ca3af'}}>Results will appear here after the test is complete.</div>}
          {metrics.map((moduleData) => {
            const avgScore = moduleData.metrics.length > 0
              ? (moduleData.metrics.reduce((sum, m) => sum + m.score, 0) / moduleData.metrics.length * 100).toFixed(1)
              : 'N/A';
            const accordionTitle = (
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <span>{moduleData.moduleName}</span>
                <span style={{ color: '#9ca3af' }}>Avg: {avgScore}%</span>
              </div>
            );
            return (
              <Accordion key={moduleData.moduleName} title={accordionTitle}>
                {moduleData.metrics.map((metric, metricIndex) => (
                  <S.TableRow key={metricIndex}>
                    <span>- {metric.name}</span>
                    <span>{(metric.score * 100).toFixed(1)}%</span>
                  </S.TableRow>
                ))}
              </Accordion>
            );
          })}
        </div>
      </S.ResultPanel>

      <S.MetricsPanel>
        <S.Title>Latest Metrics Overview</S.Title>
        <S.ScrollableContent>
          {moduleMetrics.map((moduleData) => (
            <S.ModuleSection key={moduleData.moduleName}>
              <S.ModuleTitle>{moduleData.moduleName}</S.ModuleTitle>
              <S.MetricsGrid>
                {moduleData.metrics.map((metric) => (
                  <S.MetricBox key={`${moduleData.moduleName}-${metric.name}`}>
                    <S.MetricTitle>
                      {metric.name}
                    </S.MetricTitle>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={metric.distribution}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="range" stroke="#9CA3AF" fontSize={10} interval={1} angle={-30} textAnchor="end" height={40} />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#4B5563", fontSize: 12 }} />
                        <Bar dataKey="count" fill={CHART_COLORS[2]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </S.MetricBox>
                ))}
              </S.MetricsGrid>
            </S.ModuleSection>
          ))}
        </S.ScrollableContent>
      </S.MetricsPanel>
    </S.PageLayout>
  );
};