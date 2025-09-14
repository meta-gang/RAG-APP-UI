// src/components/KPICard/KPICard.styled.ts
import styled from 'styled-components';

export const CardContainer = styled.div`
  background-color: #1f2937;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #374151;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  height: 100%; 
`;

export const CardTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
`;

export const CardValue = styled.p`
  font-size: 1.875rem; 
  font-weight: 800;
  color: #ffffff;
  flex-grow: 1; 
`;

export const CardChange = styled.p<{ isPositive: boolean }>`
  font-size: 0.875rem; 
  font-weight: 600;
  color: ${(props) => (props.isPositive ? '#34d399' : '#f87171')};
`;