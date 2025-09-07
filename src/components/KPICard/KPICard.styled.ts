// src/components/KPICard/KPICard.styled.ts
import styled from 'styled-components';

// KPI 카드의 전체 컨테이너 스타일
export const CardContainer = styled.div`
  background-color: #1f2937; // bg-gray-800
  padding: 1.5rem; // p-6
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid #374151; // border-gray-700
  display: flex;
  flex-direction: column;
  gap: 0.5rem; // space-y-2
`;

// KPI 카드의 제목 (예: "Overall Score") 스타일
export const CardTitle = styled.h3`
  font-size: 0.875rem; // text-sm
  font-weight: 600;
  color: #9ca3af; // text-gray-400
  text-transform: uppercase;
`;

// KPI 카드의 주요 값 (예: "89.5%") 스타일
export const CardValue = styled.p`
  font-size: 2.25rem; // text-4xl
  font-weight: 800;
  color: #ffffff;
`;

// 성능 변화율 등 추가 정보에 대한 스타일
export const CardChange = styled.p<{ isPositive: boolean }>`
  font-size: 1rem; // text-base
  font-weight: 600;
  color: ${(props) => (props.isPositive ? '#34d399' : '#f87171')}; // green-400 or red-400
`;