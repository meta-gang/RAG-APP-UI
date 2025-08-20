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
