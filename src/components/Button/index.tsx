/**
 * 아이콘 버튼 컴포넌트
 * @param label 버튼 텍스트
 * @param svg 아이콘(선택)
 * @param onClick 클릭 핸들러
 * 기타 스타일 관련 props는 선택적
 */
import React from 'react';
import { Content, LabelItem, StyledIconButton, SvgItem } from './Button.styled';

interface IconButtonProps {
  label: string;
  svg?: React.ReactElement<SVGAElement>;
  width?: string;
  height?: string;
  color?: string;
  backgroundColor?: string;
  tintColor?: string;
  borderWidth?: string;
  borderRadius?: string;
  padding?: string;
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void;
}

export const IconButton = ({
  label,
  width,
  height,
  color,
  backgroundColor,
  tintColor,
  borderWidth,
  borderRadius,
  padding,
  svg,
  onClick,
}: IconButtonProps) => {
  return (
    <StyledIconButton
      width={width}
      height={height}
      color={color}
      $backgroundcolor={backgroundColor}
      tintcolor={tintColor}
      $borderwidth={borderWidth}
      borderradius={borderRadius}
      padding={padding}
      onClick={(e) => onClick(e)}
    >
      <Content>
        {svg ? <SvgItem>{svg}</SvgItem> : <></>}
        <LabelItem>{label.toUpperCase()}</LabelItem>
      </Content>
    </StyledIconButton>
  );
};
