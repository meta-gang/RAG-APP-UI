import React from 'react';
import { useRecoilValue } from 'recoil';
import { appLoadingState } from '../../globals/recoil/atoms';
import { ProgressBar } from '../ProgressBar'; // 기존 ProgressBar 컴포넌트 임포트
import * as S from './LoadingModal.styled';

export const LoadingModal: React.FC = () => {
  const { isLoading, message, totalQueries, completedQueries } = useRecoilValue(appLoadingState);

  if (!isLoading) {
    return null; // isLoading이 false면 아무것도 렌더링하지 않음
  }

  // 진행률 계산
  const progress = totalQueries > 0 ? (completedQueries / totalQueries) * 100 : 0;
  
  // ProgressBar에 전달할 메시지 (진행률 포함)
  const progressMessage = `${message} (${completedQueries}/${totalQueries})`;

  return (
    <S.ModalOverlay>
      <S.ModalContent>
        {/* 기존 ProgressBar 컴포넌트 사용 */}
        <ProgressBar progress={Math.floor(progress)} message={progressMessage} />
      </S.ModalContent>
    </S.ModalOverlay>
  );
};