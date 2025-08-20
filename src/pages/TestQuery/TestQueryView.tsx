// /src/pages/TestQuery/TestQueryView.tsx
import React from 'react';
import * as S from './TestQuery.styled';

interface TestQueryViewProps {
  pipeline: string[];
  activeModule: string | null;
  messages: { sender: "user" | "bot"; text: string }[];
  handleSendMessage: (e: React.FormEvent<HTMLFormElement>) => void;
}

export const TestQueryView: React.FC<TestQueryViewProps> = ({
  pipeline,
  activeModule,
  messages,
  handleSendMessage
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
    </S.PageLayout>
  );
};