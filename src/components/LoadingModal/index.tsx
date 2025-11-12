// src/components/LoadingModal/index.tsx
import React from 'react';
import { useRecoilValue } from 'recoil';
import { appLoadingState } from '../../globals/recoil/atoms';
import { ProgressBar } from '../ProgressBar'; // ⭐️ 기존 ProgressBar 컴포넌트 임포트
import * as S from './LoadingModal.styled';

export const LoadingModal: React.FC = () => {
  // 전역 로딩 상태를 구독합니다.
  const { isLoading, message, totalQueries, completedQueries } = useRecoilValue(appLoadingState);

  // 로딩 중이 아니면 아무것도 렌더링하지 않습니다.
  if (!isLoading) {
    return null;
  }

  // 진행률 계산
  const progress = totalQueries > 0 ? (completedQueries / totalQueries) * 100 : 0;
  
  // ProgressBar에 전달할 메시지 (진행률 포함)
  const progressMessage = totalQueries > 0
    ? `${message} (${completedQueries}/${totalQueries})`
    : message; // 쿼리 수가 0이면 메시지만 표시

  return (
    <S.ModalOverlay>
      <S.ModalContent>
        {/* 기존 ProgressBar 컴포넌트 재사용 */}
        <ProgressBar progress={Math.floor(progress)} message={progressMessage} />
      </S.ModalContent>
    </S.ModalOverlay>
  );
};