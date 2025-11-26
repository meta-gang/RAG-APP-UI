/**
 * Toggle 컴포넌트의 스타일 정의
 * - checked/disabled 상태에 따른 스타일을 제공합니다.
 */
import { EColor } from "@styles/color";
import styled from "styled-components";

interface StyledToggleProps {
  checked: boolean;
}

export const ToggleBox = styled.div<StyledToggleProps>`
  background-color: ${({ checked }) => (checked ? EColor.COLOR_INTERACTION : EColor.TEXT_300)};
  border: 2px solid ${EColor.TEXT_900};
  border-radius: 24px;
  width: 42px;
  height: 20px;
  position: relative;
  transition: 0.3s;
  padding: 1px;
`;

export const ToggleIcon = styled.div<StyledToggleProps>`
  background-color: ${EColor.TEXT_500};
  border: 2px solid ${EColor.TEXT_900};
  width: 14px;
  height: 14px;
  border-radius: 24px;
  position: absolute;
  left: ${({ checked }) => (checked ? '23px' : '1px')};
  transition: 0.3s;
`;

export const DisabledToggleBox = styled.div`
  border: 2px solid ${EColor.TEXT_500};
  border-radius: 24px;
  width: 42px;
  height: 20px;
  position: relative;
  transition: 0.3s;
  padding: 1px;
`;

export const DisabledToggleIcon = styled.div`
  background-color: ${EColor.TEXT_400};
  border: 2px solid ${EColor.TEXT_500};
  width: 14px;
  height: 14px;
  border-radius: 24px;
  position: absolute;
  transition: 0.3s;
`;
