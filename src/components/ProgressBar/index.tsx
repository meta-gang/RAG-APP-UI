/**
 * 진행률 바 컴포넌트
 * @param progress 0-100 숫자
 * @param message 진행 메시지
 */

import React from 'react';
import * as S from './ProgressBar.styled';

interface ProgressBarProps {
  progress: number;
  message: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ progress, message }) => {
  return (
    <S.ProgressBarContainer>
      <S.ProgressText>Running RAG Evaluation...</S.ProgressText>
      <S.ProgressWrapper>
        <S.ProgressIndicator progress={progress} />
      </S.ProgressWrapper>
      <S.ProgressMessage>{message} ({progress}%)</S.ProgressMessage>
    </S.ProgressBarContainer>
  );
};