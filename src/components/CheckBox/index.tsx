/**
 * 체크박스 컴포넌트 래퍼
 * @param label 레이블 텍스트
 * @param checked 체크 상태
 * @param onChange 상태 변경 핸들러
 */

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
