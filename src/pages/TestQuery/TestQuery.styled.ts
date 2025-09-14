// /src/pages/TestQuery/TestQuery.styled.ts
import styled from 'styled-components';

export const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem; // gap-6

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: auto auto auto auto;
  }
`;

export const Panel = styled.div`
  background-color: #1f2937; // bg-gray-800
  padding: 1.5rem;
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid #374151; // border-gray-700
  display: flex;
  flex-direction: column;
`;

export const FlowPanel = styled(Panel)`
  @media (min-width: 1024px) {
    grid-column: 1 / 2;
    grid-row: 1 / 2;
  }
`;

export const ChatPanel = styled(Panel)`
  @media (min-width: 1024px) {
    grid-column: 2 / 4;
    grid-row: 1 / 2;
  }
`;

export const ResultPanel = styled(Panel)`
  @media (min-width: 1024px) {
    grid-column: 1 / -1;
    grid-row: 2 / 3;
  }
`;

export const LiveScorePanel = styled(Panel)`
  @media (min-width: 1024px) {
    grid-column: 1 / -1;
    grid-row: 3 / 4;
  }
`;

export const MetricsPanel = styled(Panel)`
  @media (min-width: 1024px) {
    grid-column: 1 / -1;
    grid-row: 4 / 5;
  }
`;

export const ModuleSection = styled.div`
  margin-bottom: 2rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

export const ModuleTitle = styled.h3`
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
`;

export const MetricsGrid = styled.div`
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
`;

export const MetricBox = styled.div`
  position: relative;
  padding-bottom: 1rem;
  border-radius: 0.5rem;
  flex: 0 0 400px;
`;

export const MetricTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 0.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const ScrollableContent = styled.div`
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.5rem;
`;

export const Title = styled.h2`
  font-size: 1.25rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem;
  flex-shrink: 0; 
`;

export const FlowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  overflow-y: auto;
`;

export const FlowItem = styled.div<{ isActive: boolean; isCompleted: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem;
  border-width: 2px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  border-color: ${props => props.isActive ? '#22d3ee' : (props.isCompleted ? '#34d399' : '#4b5563')};
  background-color: ${props => 
    props.isActive 
      ? 'rgba(34, 211, 238, 0.15)' 
      : (props.isCompleted ? 'rgba(52, 211, 153, 0.1)' : '#374151')};
  
  span {
    font-weight: 600;
    color: #ffffff;
  }
`;

export const Spinner = styled.div`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  border: 2px solid #4b5563;
  border-top: 2px solid #22d3ee;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
`;

export const EvaluationTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow-y: auto;
`;

export const TableRow = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  padding: 0.5rem;
  background-color: #374151;
  border-radius: 0.375rem;
  span {
    color: #e5e7eb;
    &:last-child {
      text-align: right;
      font-family: monospace;
    }
  }
`;

export const MessageArea = styled.div`
  flex-grow: 1;
  min-height: 0;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 200px;
`;

interface MessageWrapperProps {
  sender: 'user' | 'bot';
}

export const MessageWrapper = styled.div<MessageWrapperProps>`
  display: flex;
  justify-content: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
`;

export const MessageBubble = styled.div<MessageWrapperProps>`
  max-width: 80%;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background-color: ${props => props.sender === 'user' ? '#4f46e5' : '#374151'};
  color: ${props => props.sender === 'user' ? '#ffffff' : '#e5e7eb'};
`;

export const InputForm = styled.form`
  padding-top: 1rem;
  border-top: 1px solid #374151;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
`;

export const StyledInput = styled.input`
  width: 100%;
  background-color: #374151;
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0.5rem;
  border: none;
  &:focus {
    outline: 2px solid #4f46e5;
  }
`;

export const SendButton = styled.button`
  background-color: #4f46e5; // Primary Action Color (indigo)
  color: #ffffff;
  font-weight: 600;
  padding: 0.5rem 1rem; // 패딩 조정
  border-radius: 0.375rem; // 둥근 모서리
  border: none; // 테두리 제거
  cursor: pointer;
  transition: background-color 0.2s; // 부드러운 전환 효과

  &:hover {
    background-color: #4338ca; // 호버 시 약간 더 어두운 색
  }
`;

export const TestQueryHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
`;

export const ResetButton = styled.button`
  background-color: #4b5563;
  color: #ffffff;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 0.5rem;
  border: none;
  cursor: pointer;
  &:hover {
    background-color: #6b7280;
  }
`;