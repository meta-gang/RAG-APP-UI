// src/pages/TestQuery/TestQueryView.tsx
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
import ReactFlow, { Controls, Background, MarkerType, Handle, Position } from 'reactflow';
import 'reactflow/dist/style.css';

/**
 * ReactFlow 그래프에서 사용되는 커스텀 모듈 노드 컴포넌트입니다.
 * 모듈의 상태(대기, 로딩, 완료)에 따라 배경색과 아이콘을 다르게 렌더링합니다.
 *
 * @param data - 노드의 라벨과 현재 상태(status) 정보를 포함하는 객체
 */
const ModuleNode = ({ data }: { data: { label: string; status: string } }) => {
  return (
    <div
      style={{
        padding: '1rem 1.5rem',
        borderRadius: '8px',
        background:
          data.status === 'loading'
            ? 'rgba(79, 70, 229, 0.3)'
            : data.status === 'completed'
              ? 'rgba(52, 211, 153, 0.2)'
              : '#374151',
        border: '1px solid #4b5563',
        color: '#E5E7EB',
        minWidth: '250px',
        textAlign: 'center',
        fontSize: '1rem',
        fontWeight: 600,
        transition: 'all 0.3s ease',
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: '#4b5563' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        {data.status === 'loading' && <S.Spinner />}
        {data.status === 'completed' && <CheckCircle2 size={18} color="#34d399" />}
        {data.status === 'pending' && <div style={{ width: '18px' }} />}
        <span>{data.label}</span>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#4b5563' }} />
    </div>
  );
};

/**
 * Recharts 그래프의 툴팁을 커스터마이징하여 렌더링하는 컴포넌트입니다.
 * 쿼리 내용과 각 메트릭의 점수를 표시합니다.
 *
 * @param active - 툴팁 활성화 여부
 * @param payload - 차트 데이터 페이로드
 * @param label - 현재 축의 라벨 (쿼리 번호 등)
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

/**
 * TestQueryView 컴포넌트의 Props 인터페이스 정의입니다.
 */
interface TestQueryViewProps {
  pipeline: string[];
  pipelineSet: string[];
  modulePairs: [string, string][];
  moduleStatuses: Record<string, 'pending' | 'loading' | 'completed'>;
  activeConnections: [string, string][];
  modulePositions: Record<string, { x: number; y: number }>;
  messages: { sender: 'user' | 'bot'; text: string }[];
  metrics: { moduleName: string; metrics: { name: string; score: number }[] }[];
  liveMetricsHistory: LiveMetric[];
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  handleReset: () => void;
  handleFileUpload: (files: string[]) => void;
  handleLLMQuery: (settings: {
    llm_option: 'make-query' | 'made-query',
    llm_model: string,
    query_id: string
  }) => void;
}

/**
 * TestQuery 페이지의 프레젠테이션 컴포넌트입니다.
 * RAG 파이프라인 시각화, 채팅 인터페이스, 실시간 메트릭 차트 및 결과 목록을 렌더링합니다.
 */
export const TestQueryView: React.FC<TestQueryViewProps> = ({
  pipeline,
  pipelineSet,
  modulePairs,
  modulePositions,
  moduleStatuses,
  activeConnections,
  messages,
  handleSendMessage,
  metrics,
  liveMetricsHistory,
  handleReset,
  handleFileUpload,
  handleLLMQuery
}) => {
  const messageAreaRef = useRef<HTMLDivElement>(null);

  /**
   * 새로운 메시지가 추가될 때마다 채팅 영역 스크롤을 하단으로 이동시킵니다.
   */
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  /**
   * 실시간으로 수신된 metrics 데이터를 모듈별 및 메트릭별로 그룹화하여
   * 분포도(Distribution) 차트에 적합한 형태로 변환합니다.
   * 점수는 10점 단위의 구간(bin)으로 나누어 빈도수를 계산합니다.
   */
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
          count: 0
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

  /**
   * 실시간 히스토리 데이터에서 표시 가능한 고유 메트릭 이름 목록을 추출합니다.
   * 쿼리 식별자 등을 제외한 실제 메트릭 키만 필터링합니다.
   */
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
          proOptions={{ hideAttribution: true }}
          nodes={pipelineSet.map((module) => ({
            id: module,
            type: 'moduleNode',
            position: modulePositions[module] || { x: 0, y: 0 },
            data: {
              label: module,
              status: moduleStatuses[module] || 'pending',
            },
            draggable: false,
          }))}
          edges={modulePairs.map(([source, target]) => ({
            id: `${source}-${target}`,
            source,
            target,
            type: 'smoothstep',
            animated: activeConnections.some(([s, t]) => s === source && t === target),
            markerEnd: { type: MarkerType.ArrowClosed, color: '#9ca3af' },
            style: { stroke: '#9ca3af', strokeWidth: 2 },
          }))}
          nodeTypes={{ moduleNode: ModuleNode }}
          fitView
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
            const avgScore =
              (moduleData.metrics || []).length > 0
                ? (
                  ((moduleData.metrics || []).reduce((sum, m) => sum + m.score, 0) /
                    (moduleData.metrics || []).length) *
                  100
                ).toFixed(1)
                : 'N/A';

            const accordionTitle = (
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{ color: '#FFFFFF' }}>{moduleData.moduleName}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Avg: {avgScore}%</span>
              </div>
            );

            return (
              <Accordion key={`${moduleData.moduleName}-${idx}`} title={accordionTitle}>
                {(moduleData.metrics || []).map((metric, metricIndex) => (
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

      <S.ChatPanel>
        <S.Title>Live Test</S.Title>
        <S.MessageArea ref={messageAreaRef}>
          {(messages || []).length === 0 && (
            <div style={{ textAlign: 'center', color: '#9ca3af', margin: 'auto' }}>Send a query to start the test.</div>
          )}
          {(messages || []).map((msg, i) => (
            <S.MessageWrapper key={i} sender={msg.sender}>
              <S.MessageBubble sender={msg.sender}>{msg.text}</S.MessageBubble>
            </S.MessageWrapper>
          ))}
        </S.MessageArea>
        <S.InputForm onSubmit={handleSendMessage}>
          <S.StyledInput name="queryInput" type="text" placeholder="Type your query here..." autoFocus />
          <S.SendButton type="submit">Send</S.SendButton>
        </S.InputForm>
      </S.ChatPanel>

      <S.LiveScorePanel>
        <S.Title>Live Test Score Trend</S.Title>
        {(liveMetricsHistory || []).length > 0 ? (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={liveMetricsHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
                          <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', fontSize: 12 }} />
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