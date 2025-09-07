// /src/pages/TestQuery/TestQuery.styled.ts
import styled from 'styled-components';

export const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem; // gap-6
  height: calc(100vh);

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const Panel = styled.div`
  background-color: #1f2937; // bg-gray-800
  padding: 1rem;
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid #374151; // border-gray-700
`;
/*
export const FlowPanel = styled(Panel)`
  @media (min-width: 768px) {
    grid-column: span 1 / span 1;
  }
`;
*/
export const FlowPanel = styled(Panel)`
  height: 768px;
  @media (min-width: 768px) {
    grid-column: span 1 / span 1;
    grid-row: 1; // 첫 번째 행에 위치
  }
`;

export const ChatPanel = styled(Panel)`
  display: flex;
  flex-direction: column;
  height: 768px;

  @media (min-width: 768px) {
    grid-column: span 2 / span 2;
    grid-row: 1; // 첫 번째 행에 위치
  }
`;

export const MetricsPanel = styled(Panel)`
  @media (min-width: 768px) {
    grid-column: 1 / -1; // 전체 너비 사용
    grid-row: 2; // 두 번째 행에 위치
  }
`;

export const ResultPanel = styled(Panel)`
  @media (min-width: 768px) {
    grid-column: 1 / -1; // 전체 너비 사용
    grid-row: 3; // 세 번째 행에 위치
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

  &::-webkit-scrollbar {
    height: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1f2937;
  }

  &::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
`;

export const MetricBox = styled.div`
  position: relative;
  padding-bottom: 1rem;
  border-radius: 0.5rem;
  flex: 0 0 400px; // 고정 너비 200px
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

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1f2937;
  }

  &::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
`;

export const Title = styled.h2`
  font-size: 1.25rem; // text-xl
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem; // mb-4
`;

export const FlowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem; // space-y-3

  overflow-x: auto;
  max-height: calc(100% - 3rem);

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1f2937;
  }

  &::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
`;

interface FlowItemProps {
  isActive: boolean;
}

export const FlowItem = styled.div<{ isActive: boolean; isCompleted: boolean }>`
  padding: 1rem;
  border-radius: 0.5rem; // rounded-lg
  border-width: 2px;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  // 조건부 스타일링
  border-color: ${props => props.isActive ? '#22d3ee' : (props.isCompleted ? '#34d399' : '#4b5563')};
  background-color: ${props => props.isActive ? 'rgba(34, 211, 238, 0.15)' : 'transparent'};
  
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
  border: 2px solid #4b5563; /* Light grey */
  border-top: 2px solid #22d3ee; /* Blue */
  border-radius: 50%;
  width: 16px;
  height: 16px;
  animation: spin 1s linear infinite;
`;

export const EvaluationTable = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: calc(100% - 3rem); // Title 영역 제외한 높이
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1f2937;
  }

  &::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
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
  gap: 1rem; // space-y-4

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: #1f2937;
  }

  &::-webkit-scrollbar-thumb {
    background: #4b5563;
    border-radius: 3px;
  }
`;

interface MessageWrapperProps {
  sender: 'user' | 'bot';
}

export const MessageWrapper = styled.div<MessageWrapperProps>`
  display: flex;
  justify-content: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
`;

export const MessageBubble = styled.div<MessageWrapperProps>`
  max-width: 80%; // max-w-xs lg:max-w-md
  padding: 0.75rem;
  border-radius: 0.5rem; // rounded-lg
  background-color: ${props => props.sender === 'user' ? '#4f46e5' : '#374151'}; // bg-indigo-600 or bg-gray-700
  color: ${props => props.sender === 'user' ? '#ffffff' : '#e5e7eb'}; // text-white or text-gray-200
`;

export const InputForm = styled.form`
  padding: 1rem;
  border-top: 1px solid #374151; // border-t border-gray-700
  display: flex;
  align-items: center;
  gap: 0.5rem; // space-x-2
`;

export const StyledInput = styled.input`
  width: 100%;
  background-color: #374151; // bg-gray-700
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0.5rem;
  border: none;

  &:focus {
    outline: 2px solid #4f46e5;
  }
`;

export const SendButton = styled.button`
  background-color: #4f46e5; // bg-indigo-600
  color: #ffffff;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:hover {
    background-color: #4338ca; // hover:bg-indigo-500
  }
`;

/*
// 채팅, 플로우 패널 크기 고정, 채팅창 종스크롤 구현 완료
// /src/pages/TestQuery/TestQuery.styled.ts
import styled from 'styled-components';

export const PageLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem; // gap-6
  height: calc(100vh - 200px);

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const Panel = styled.div`
  background-color: #1f2937; // bg-gray-800
  padding: 1rem;
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid #374151; // border-gray-700
`;

export const FlowPanel = styled(Panel)`
  @media (min-width: 768px) {
    grid-column: span 1 / span 1;
    max-height: 768px;
  }
`;

export const ChatPanel = styled(Panel)`
  display: flex;
  flex-direction: column;

  @media (min-width: 768px) {
    grid-column: span 2 / span 2;
    max-height: 768px;
  }
`;

export const Title = styled.h2`
  font-size: 1.25rem; // text-xl
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1rem; // mb-4
`;

export const FlowList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem; // space-y-3
`;

interface FlowItemProps {
  isActive: boolean;
}

export const FlowItem = styled.div<FlowItemProps>`
  padding: 1rem;
  border-radius: 0.5rem; // rounded-lg
  border-width: 2px;
  transition: all 0.3s;
  
  border-color: ${props => props.isActive ? '#22d3ee' : '#4b5563'}; // border-cyan-400 or border-gray-600
  background-color: ${props => props.isActive ? 'rgba(34, 211, 238, 0.15)' : '#374151'}; // bg-cyan-900/50 or bg-gray-700
  box-shadow: ${props => props.isActive ? '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' : 'none'};
  
  span {
    font-weight: 600;
    color: #ffffff;
  }
`;

export const MessageArea = styled.div`
  flex-grow: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem; // space-y-4
`;

interface MessageWrapperProps {
  sender: 'user' | 'bot';
}

export const MessageWrapper = styled.div<MessageWrapperProps>`
  display: flex;
  justify-content: ${props => props.sender === 'user' ? 'flex-end' : 'flex-start'};
`;

export const MessageBubble = styled.div<MessageWrapperProps>`
  max-width: 80%; // max-w-xs lg:max-w-md
  padding: 0.75rem;
  border-radius: 0.5rem; // rounded-lg
  background-color: ${props => props.sender === 'user' ? '#4f46e5' : '#374151'}; // bg-indigo-600 or bg-gray-700
  color: ${props => props.sender === 'user' ? '#ffffff' : '#e5e7eb'}; // text-white or text-gray-200
`;

export const InputForm = styled.form`
  padding: 1rem;
  border-top: 1px solid #374151; // border-t border-gray-700
  display: flex;
  align-items: center;
  gap: 0.5rem; // space-x-2
`;

export const StyledInput = styled.input`
  width: 100%;
  background-color: #374151; // bg-gray-700
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0.5rem;
  border: none;

  &:focus {
    outline: 2px solid #4f46e5;
  }
`;

export const SendButton = styled.button`
  background-color: #4f46e5; // bg-indigo-600
  color: #ffffff;
  font-weight: 600;
  padding: 0.5rem;
  border-radius: 0.5rem;
  
  &:hover {
    background-color: #4338ca; // hover:bg-indigo-500
  }
`;
*/