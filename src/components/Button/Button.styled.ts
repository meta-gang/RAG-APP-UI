import styled from 'styled-components';
import {Title5} from '@styles/font';
import {EColor} from '@styles/color';

interface StyledIconButtonProps {
  width?: string;
  height?: string;
  color?: string;
  $backgroundcolor?: string;
  tintcolor?: string;
  $borderwidth?: string;
  borderradius?: string;
  fontsize?: string;
  padding?: string;
}

export const StyledIconButton = styled.button<StyledIconButtonProps>`
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: ${({$backgroundcolor}) => $backgroundcolor ?? 'white'};
  color: ${({color}) => color ?? EColor.COLOR_PRIMARY};
  border-radius: ${({borderradius}) => borderradius ?? '12px'};
  border-width: ${({$borderwidth}) => $borderwidth ?? '2px'};
  border-style: solid;
  border-color: ${({tintcolor}) => tintcolor ?? EColor.COLOR_PRIMARY};
  padding: ${({padding}) => padding ?? '12px'};
  width: ${({width}) => width ?? 'fit-content'};
  height: ${({height}) => height ?? '50px'};
  ${Title5}
`;

export const Content = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  width: 100%;
`;

export const SvgItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0px 0px 0px 8px;
`;

export const LabelItem = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  padding: 0px 8px;
`;
