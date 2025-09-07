// /src/pages/TestQuery/TestQueryView.tsx
import React, { useRef, useEffect } from 'react';
import * as S from './TestQuery.styled';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { evaluationRuns } from '../../data/mockData';
import { CHART_COLORS } from '../../globals/styles/color';
import { CheckCircle2, RefreshCw } from 'lucide-react';
import { Accordion } from '../../components/Accordion';

interface TestQueryViewProps {
  pipeline: string[];
  moduleStatuses: Record<string, 'pending' | 'loading' | 'completed'>;
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
  moduleStatuses,
  messages,
  handleSendMessage,
  metrics,
  handleReset 
}) => {

  const messageEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]); // messages

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
        <S.FlowList>
          {pipeline.map((module, index) => {
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