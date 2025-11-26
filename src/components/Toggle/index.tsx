/**
 * 단순한 토글 컴포넌트
 * @param checked 토글 상태
 * @param onClick 클릭 핸들러
 * @param disabled 비활성화 여부
 */

import { DisabledToggleBox, DisabledToggleIcon, ToggleBox, ToggleIcon } from './Toggle.styled';

interface ToggleProps {
  checked: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export const Toggle = ({ checked, onClick, disabled }: ToggleProps) => {
  if (disabled) {
    return (
      <DisabledToggleBox>
        <DisabledToggleIcon />
      </DisabledToggleBox>
    );
  }
  return (
    <ToggleBox checked={checked} onClick={onClick}>
      <ToggleIcon checked={checked} />
    </ToggleBox>
  );
};
