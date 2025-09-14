// /src/pages/TestQuery/TestQueryView.tsx
import React, { useRef, useEffect } from 'react';
import * as S from './TestQuery.styled';
import { LineChart, Line, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { evaluationRuns } from '../../data/mockData';
import { CHART_COLORS } from '../../globals/styles/color';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Accordion } from '../../components/Accordion';
import { LiveMetric } from '../../globals/recoil/atoms';

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
  pipeline: string[];
  moduleStatuses: Record<string, 'pending' | 'loading' | 'completed'>;
  messages: { sender: "user" | "bot"; text: string }[];
  metrics: {
    moduleName: string;
    metrics: {name: string, score: number}[];
  }[];
  liveMetricsHistory: LiveMetric[];
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  handleReset: () => void; 
}

export const TestQueryView: React.FC<TestQueryViewProps> = ({
  pipeline,
  moduleStatuses,
  messages,
  handleSendMessage,
  metrics,
  liveMetricsHistory,
  handleReset 
}) => {
  const messageAreaRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);
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
  const availableMetrics = (liveMetricsHistory || []).reduce((acc, curr) => {
      Object.keys(curr).forEach(key => {
          if (key !== 'query' && key !== 'queryNumber' && !acc.includes(key)) {
              acc.push(key);
          }
      });
      return acc;
  }, [] as string[]);


  return (
    <S.PageLayout>
        {/* ... (FlowPanel, ChatPanel UI는 기존과 동일) ... */}
        <S.FlowPanel>
          <S.TestQueryHeader>
            <S.Title>Processing Flow</S.Title>
            <S.ResetButton onClick={handleReset} title="Reset Test">
              <RefreshCw size={14} />
            </S.ResetButton>
          </S.TestQueryHeader>
          <S.FlowList>
            {(pipeline || []).map((module, index) => {
              const status = moduleStatuses[module] || 'pending';
              return (
                <S.FlowItem 
                  key={module} 
                  isActive={status === 'loading'}
                  isCompleted={status === 'completed'}
                >
                  {status === 'loading' && <S.Spinner />}
                  {status === 'completed' && <CheckCircle2 size={18} color="#34d399" />}
                  {status === 'pending' && <div style={{ width: '18px', height: '18px' }} />}
                  <span>{index + 1}. {module}</span>
                </S.FlowItem>
              );
            })}
          </S.FlowList>
        </S.FlowPanel>
        <S.ChatPanel>
          <S.Title>Live Test</S.Title>
          <S.MessageArea ref={messageAreaRef}>
            {(messages || []).length === 0 && <div style={{textAlign: 'center', color: '#9ca3af', marginTop: 'auto', marginBottom: 'auto'}}>Send a query to start the test.</div>}
            {(messages || []).map((msg, i) => (
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
          {(metrics || []).length === 0 && <div style={{color: '#9ca3af'}}>Results will appear here after the test is complete.</div>}
          {(metrics || []).map((moduleData) => {
            const avgScore = (moduleData.metrics || []).length > 0
              ? ((moduleData.metrics || []).reduce((sum, m) => sum + m.score, 0) / (moduleData.metrics || []).length * 100).toFixed(1)
              : 'N/A';
            
            // ✨ [수정] 아코디언 제목을 감싸는 div의 스타일을 변경하여 내부 요소들의 간격을 조절합니다.
            const accordionTitle = (
              // 부모(AccordionHeader)의 space-between을 위해 이 div는 하나의 그룹으로 작동합니다.
              // 이 div 내부에 flex와 gap을 주어 '모듈이름'과 'Avg 점수'를 가깝게 배치합니다.
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '1rem' }}>
                <span style={{color: '#FFFFFF' }}>{moduleData.moduleName}</span>
                <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Avg: {avgScore}%</span>
              </div>
            );

            return (
              <Accordion key={moduleData.moduleName} title={accordionTitle}>
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
      
        {/* ... (LiveScorePanel, MetricsPanel UI는 기존과 동일) ... */}
        <S.LiveScorePanel>
            <S.Title>Live Test Score Trend</S.Title>
            {(liveMetricsHistory || []).length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
                <LineChart
                data={liveMetricsHistory}
                margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="queryNumber" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" domain={[0, 100]} />
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
            <div style={{color: '#9ca3af', textAlign: 'center', margin: 'auto'}}>
                Live test results will be charted here.
            </div>
            )}
        </S.LiveScorePanel>
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