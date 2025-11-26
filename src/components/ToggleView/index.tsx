/**
 * 레이블과 토글을 감싸는 뷰 컴포넌트
 * @param label 표시할 텍스트
 * @param children 토글 요소
 * @param disabled 비활성화 여부
 * @param onClick disabled 상태에서 클릭 콜백(선택적)
 */

import { ReactNode } from 'react';
import {
  OnClickLabel,
  StyledDisabledLabel,
  StyledDisabledToggleView,
  StyledLabel,
  StyledToggleView,
} from './ToggleView.styled';

interface ToggleViewProps {
  label?: string;
  children?: ReactNode;
  disabled: boolean;
  onClick?: () => void;
}

export const ToggleView = ({ label, children, disabled, onClick }: ToggleViewProps) => {
  return disabled ? (
    <StyledDisabledToggleView onClick={onClick}>
      {onClick ? <OnClickLabel>{label}</OnClickLabel> : <StyledDisabledLabel>{label}</StyledDisabledLabel>}
    </StyledDisabledToggleView>
  ) : (
    <StyledToggleView>
      <StyledLabel>{label}</StyledLabel>
      {children}
    </StyledToggleView>
  );
};
