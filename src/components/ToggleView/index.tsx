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
