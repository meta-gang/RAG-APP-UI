import { CheckboxContainer, Label, StyledCheckbox } from './CheckBox.styled';

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
}

const CheckBox = ({ label, checked, onChange }: CheckboxProps) => {
  return (
    <CheckboxContainer>
      <StyledCheckbox checked={checked} onChange={onChange} />
      <Label>{label}</Label>
    </CheckboxContainer>
  );
};

export default CheckBox;
