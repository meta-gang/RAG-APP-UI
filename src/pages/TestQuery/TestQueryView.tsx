import React, { useRef, useEffect, useMemo } from 'react';
import * as S from './TestQuery.styled';
import {
  LineChart,
  Line,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { CHART_COLORS } from '../../globals/styles/color';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Accordion } from '../../components/Accordion';
import { LiveMetric } from '../../globals/recoil/atoms';
import ReactFlow, {
  Controls,
  Background,
  Handle,
  Position,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
} from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * 점수를 퍼센트 형식(소수점 1자리) 문자열로 포맷팅합니다.
 * 점수가 1.0 이하인 경우 100을 곱하여 백분율로 변환합니다.
 *
 * @param score 원본 점수
 * @returns 포맷된 문자열
 */
const formatScore = (score: number): string => {
  const finalScore = score <= 1 ? score * 100 : score;
  return finalScore.toFixed(1);
};

/**
 * ReactFlow 그래프 내에서 사용되는 커스텀 모듈 노드입니다.
 * 상태(pending, loading, completed)에 따라 스타일이 변경됩니다.
 *
 * @param data 노드 데이터 (label, status)
 */
const ModuleNode = ({ data }: { data: { label: string; status: string } }) => {
  let style: React.CSSProperties = {
    padding: '1rem 1.5rem',
    borderRadius: '12px',
    border: '2px solid #4b5563',
    color: '#E5E7EB',
    minWidth: '250px',
    textAlign: 'center',
    fontSize: '1rem',
    fontWeight: 600,
    transition: 'all 0.3s ease',
    background: '#374151',
    boxShadow: 'none',
  };

  if (data.status === 'loading' || data.status === 'start') {
    style = {
      ...style,
      background: 'rgba(99, 102, 241, 0.2)',
      border: '2px solid #6366f1',
      boxShadow: '0 0 15px rgba(99, 102, 241, 0.6)',
      transform: 'scale(1.05)',
    };
  } else if (data.status === 'completed' || data.status === 'end') {
    style = {
      ...style,
      background: 'rgba(16, 185, 129, 0.2)',
      border: '2px solid #10b981',
    };
  }

  return (
    <div style={style}>
      <Handle type="target" position={Position.Top} style={{ background: '#4b5563' }} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem' }}>
        {(data.status === 'loading' || data.status === 'start') && <S.Spinner />}
        {(data.status === 'completed' || data.status === 'end') && <CheckCircle2 size={20} color="#10b981" />}
        {data.status === 'pending' && <div style={{ width: '20px' }} />}
        <span>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#4b5563' }} />
    </div>
  );
};

const nodeTypes = { moduleNode: ModuleNode };

/**
 * 차트 툴팁 컴포넌트입니다.
 * 마우스 오버 시 해당 쿼리의 메트릭 점수들을 표시합니다.
 */
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const queryData = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#1f2937', border: '1px solid #374151', padding: '10px', borderRadius: '5px' }}>
        <p style={{ color: '#9ca3af' }}>{`Query ${label}: "${queryData.query}"`}</p>
        {payload.map((pld: any) => (
          <p key={pld.dataKey} style={{ color: pld.color }}>
            {`${pld.dataKey}: ${pld.value.toFixed(1)}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface TestQueryViewProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  messages: { sender: 'user' | 'bot'; text: string }[];
  metrics: { moduleName: string; metrics: { name: string; score: number }[] }[];
  liveMetricsHistory: LiveMetric[];
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  handleReset: () => void;
  handleFileUpload: (files: string[]) => void;
  handleLLMQuery: (settings: {
    llm_option: 'make-query' | 'made-query';
    llm_model: string;
    query_id: string;
  }) => void;
}

/**
 * TestQueryView 컴포넌트
 *
 * ReactFlow를 이용한 파이프라인 그래프, 실시간 채팅 영역,
 * 평가 결과 아코디언 목록, 그리고 실시간 점수 트렌드 차트를 렌더링합니다.
 */
export const TestQueryView: React.FC<TestQueryViewProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  messages,
  handleSendMessage,
  metrics,
  liveMetricsHistory,
  handleReset,
  handleFileUpload,
  handleLLMQuery,
}) => {
  const messageAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  const moduleMetrics = useMemo(() => {
    const groupedData: Record<string, Record<string, number[]>> = {};

    metrics.forEach((item) => {
      if (!groupedData[item.moduleName]) {
        groupedData[item.moduleName] = {};
      }
      item.metrics.forEach((m) => {
        if (!groupedData[item.moduleName][m.name]) {
          groupedData[item.moduleName][m.name] = [];
        }
        groupedData[item.moduleName][m.name].push(m.score);
      });
    });

    return Object.entries(groupedData).map(([moduleName, metricMap]) => {
      const processedMetrics = Object.entries(metricMap).map(([metricName, scores]) => {
        const ranges = Array.from({ length: 10 }, (_, i) => ({
          range: `${i * 10}-${(i + 1) * 10}`,
          count: 0,
        }));

        scores.forEach((score) => {
          const normalizedScore = score <= 1 ? score * 100 : score;
          const idx = Math.min(Math.floor(normalizedScore / 10), 9);
          ranges[idx].count++;
        });

        return { name: metricName, distribution: ranges };
      });

      return { moduleName, metrics: processedMetrics };
    });
  }, [metrics]);

  const availableMetrics = (liveMetricsHistory || []).reduce((acc, curr) => {
    Object.keys(curr).forEach((key) => {
      if (key !== 'query' && key !== 'queryNumber' && !acc.includes(key)) {
        acc.push(key);
      }
    });
    return acc;
  }, [] as string[]);

  return (
    <S.PageLayout>
      <S.FlowPanel>
        <S.TestQueryHeader>
          <S.Title>Processing Flow</S.Title>
          <S.ResetButton onClick={handleReset} title="Reset Test">
            <RefreshCw size={14} />
          </S.ResetButton>
        </S.TestQueryHeader>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls showInteractive={false} />
        </ReactFlow>
      </S.FlowPanel>

      <S.ResultPanel>
        <S.Title>Evaluation Result</S.Title>
        <div style={{ overflowY: 'auto' }}>
          {(metrics || []).length === 0 && (
            <div style={{ color: '#9ca3af', textAlign: 'center', marginTop: '20%' }}>
              Live test results will appear here.
            </div>
          )}
          {(metrics || []).map((moduleData, idx) => {
            const count = (moduleData.metrics || []).length;
            const avgScore =
              count > 0 ? (moduleData.metrics || []).reduce((sum, m) => sum + m.score, 0) / count : 0;

            const displayAvg = formatScore(avgScore);

            const accordionTitle = (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{ color: '#FFFFFF' }}>{moduleData.moduleName}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                  Avg: {displayAvg}% <small>({count} runs)</small>
                </span>
              </div>
            );

            return (
              <Accordion key={`${moduleData.moduleName}-${idx}`} title={accordionTitle}>
                {(moduleData.metrics || []).map((metric, metricIndex) => (
                  <S.TableRow key={metricIndex}>
                    <span>- {metric.name}</span>
                    <span>{formatScore(metric.score)}%</span>
                  </S.TableRow>
                ))}
              </Accordion>
            );
          })}
        </div>
      </S.ResultPanel>

      <S.ChatPanel>
        <S.Title>Live Test</S.Title>
        <S.MessageArea ref={messageAreaRef}>
          {(messages || []).length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', margin: 'auto' }}>
              Send a query to start the test.
            </div>
          )}
          {(messages || []).map((msg, i) => (
            <S.MessageWrapper key={i} sender={msg.sender}>
              <S.MessageBubble sender={msg.sender}>{msg.text}</S.MessageBubble>
            </S.MessageWrapper>
          ))}
        </S.MessageArea>
        <S.InputForm onSubmit={handleSendMessage}>
          <S.StyledInput
            name="queryInput"
            type="text"
            placeholder="Type your query here..."
            autoFocus
          />
          <S.SendButton type="submit">Send</S.SendButton>
        </S.InputForm>
      </S.ChatPanel>

      <S.LiveScorePanel>
        <S.Title>Live Test Score Trend</S.Title>
        {(liveMetricsHistory || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={liveMetricsHistory}
              margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="queryNumber" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3af" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {availableMetrics.map((metricName, index) => (
                <Line
                  key={metricName}
                  type="monotone"
                  dataKey={metricName}
                  stroke={CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ color: '#9ca3af', textAlign: 'center', margin: 'auto' }}>
            Live test score trends will be charted here.
          </div>
        )}
      </S.LiveScorePanel>

      <S.MetricsPanel>
        <S.Title>Latest Metrics Overview</S.Title>
        <S.ScrollableContent>
          {moduleMetrics.length === 0 ? (
            <div style={{ color: '#9ca3af', padding: '1rem' }}>No metrics collected yet.</div>
          ) : (
            moduleMetrics.map((moduleData) => (
              <S.ModuleSection key={moduleData.moduleName}>
                <S.ModuleTitle>{moduleData.moduleName}</S.ModuleTitle>
                <S.MetricsGrid>
                  {moduleData.metrics.map((metric) => (
                    <S.MetricBox key={`${moduleData.moduleName}-${metric.name}`}>
                      <S.MetricTitle>{metric.name}</S.MetricTitle>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={metric.distribution}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                          <XAxis
                            dataKey="range"
                            stroke="#9CA3AF"
                            fontSize={10}
                            interval={1}
                            angle={-30}
                            textAnchor="end"
                            height={40}
                          />
                          <YAxis stroke="#9CA3AF" allowDecimals={false} fontSize={10} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              borderColor: '#4B5563',
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="count" fill={CHART_COLORS[2]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </S.MetricBox>
                  ))}
                </S.MetricsGrid>
              </S.ModuleSection>
            ))
          )}
        </S.ScrollableContent>
      </S.MetricsPanel>
    </S.PageLayout>
  );
};