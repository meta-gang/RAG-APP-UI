// /src/pages/TestQuery/TestQueryView.tsx
import React from 'react';
import * as S from './TestQuery.styled';

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
  return (
    <S.PageLayout>
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