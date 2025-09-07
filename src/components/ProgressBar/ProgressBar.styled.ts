// src/components/ProgressBar/ProgressBar.styled.ts
import styled from 'styled-components';

export const ProgressBarContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  color: #d1d5db; // text-gray-300
`;

export const ProgressWrapper = styled.div`
  width: 100%;
  height: 10px;
  background-color: #374151; // bg-gray-700
  border-radius: 5px;
  overflow: hidden;
`;

export const ProgressIndicator = styled.div<{ progress: number }>`
  width: ${(props) => props.progress}%;
  height: 100%;
  background-color: #4f46e5; // bg-indigo-600
  border-radius: 5px;
  transition: width 0.3s ease-in-out;
`;

export const ProgressText = styled.p`
  font-size: 1rem;
  font-weight: 500;
`;

export const ProgressMessage = styled.p`
  font-size: 0.875rem;
  color: #9ca3af; // text-gray-400
`;