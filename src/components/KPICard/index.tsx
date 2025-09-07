// src/components/KPICard/index.tsx
import React from 'react';
import * as S from './KPICard.styled';

// KPICard 컴포넌트가 받을 props 타입 정의
interface KPICardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    isPositive: boolean;
  };
}

export const KPICard: React.FC<KPICardProps> = ({ title, value, change }) => {
  return (
    <S.CardContainer>
      {/* 카드 제목 */}
      <S.CardTitle>{title}</S.CardTitle>
      {/* 카드 값 */}
      <S.CardValue>{value}</S.CardValue>
      {/* 성능 변화율 (선택적) */}
      {change && (
        <S.CardChange isPositive={change.isPositive}>
          {change.value}
        </S.CardChange>
      )}
    </S.CardContainer>
  );
};