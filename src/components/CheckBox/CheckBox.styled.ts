import { EColor } from '@styles/color';
import { body3 } from '@styles/font';
import styled from 'styled-components';

export const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  margin: 4px;
`;

export const StyledCheckbox = styled.input.attrs({ type: 'checkbox' })`
  appearance: none;
  width: 18px;
  height: 18px;
  border: 2px solid ${EColor.TEXT_500};
  border-radius: 32px;
  margin-right: 4px;

  &:checked {
    background-color: ${EColor.COLOR_INTERACTION};
  }
`;

export const Label = styled.label`
  ${body3}
`;
