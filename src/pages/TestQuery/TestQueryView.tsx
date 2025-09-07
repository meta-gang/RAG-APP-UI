// /src/pages/TestQuery/TestQueryView.tsx
import React from 'react';
import * as S from './TestQuery.styled';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { evaluationRuns } from '../../data/mockData';
import { CHART_COLORS } from '../../globals/styles/color';

interface TestQueryViewProps {
  pipeline: string[];
  activeModule: string | null;
  messages: { sender: "user" | "bot"; text: string }[];
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
  metrics: {
    moduleName: string;
    metrics: {name: string, score: number}[];
  }[];
}

export const TestQueryView: React.FC<TestQueryViewProps> = ({
  pipeline,
  activeModule,
  messages,
  handleSendMessage,
  metrics
}) => {
  // 최신 데이터 가져오기
  const latestData = evaluationRuns[evaluationRuns.length - 1];
  
  // 모듈별 메트릭 데이터 준비
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

    // 각 메트릭의 점수 분포 계산
    const metricData = Object.entries(metricDistribution).map(([name, scores]) => {
      // 점수를 0.1 단위로 구간화
      const ranges = Array.from({ length: 10 }, (_, i) => ({
        range: `${i * 10}-${(i + 1) * 10}`,
        count: 0
      }));

      scores.forEach(score => {
        const idx = Math.min(Math.floor(score * 10), 9);
        ranges[idx].count++;
      });

      return {
        name,
        distribution: ranges
      };
    });

    return {
      moduleName: module.moduleName,
      metrics: metricData
    };
  }) || [];

  return (
    <S.PageLayout>
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
                        <XAxis
                          dataKey="range"
                          stroke="#9CA3AF"
                          fontSize={10}
                          interval={1}
                          angle={-30}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          allowDecimals={false}
                          fontSize={10}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#1F2937",
                            borderColor: "#4B5563",
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
          ))}
        </S.ScrollableContent>
      </S.MetricsPanel>
      <S.FlowPanel>
        <S.Title>Processing Flow</S.Title>
        <S.FlowList>
          {pipeline.map((module, index) => (
            <S.FlowItem key={module} isActive={activeModule === module}>
              <span>{index + 1}. {module}</span>
            </S.FlowItem>
          ))}
        </S.FlowList>
      </S.FlowPanel>
      <S.ChatPanel>
        <S.MessageArea>
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
        <S.EvaluationTable>
          {metrics.map((moduleData, moduleIndex) => 
            moduleData.metrics.map((metric, metricIndex) => (
              <S.TableRow key={`${moduleIndex}-${metricIndex}`}>
                <span>{moduleData.moduleName} - {metric.name}</span>
                <span>{(metric.score * 100).toFixed(1)}</span>
              </S.TableRow>
            ))
          )}
        </S.EvaluationTable>
      </S.ResultPanel>
    </S.PageLayout>
  );
};