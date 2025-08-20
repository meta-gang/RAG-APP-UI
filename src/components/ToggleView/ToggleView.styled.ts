import { EColor } from "@styles/color";
import { Title5 } from "@styles/font";
import styled from "styled-components";

export const StyledToggleView = styled.div`
  display: flex;
  justify-content: space-between;
  position: relative;
  z-index: 3;
  align-items: center;
  width: 116px;
  height: 36px;
  background-color: ${EColor.TEXT_300};
  box-shadow: 5px 5px 10px;
  border-radius: 24px;
  padding: 12px;
  margin: 12px;
`;

export const StyledLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 44px;
  ${Title5}
`;

export const StyledDisabledToggleView = styled.div`
  display: flex;
  justify-content: center;
  position: relative;
  z-index: 3;
  align-items: center;
  width: 116px;
  height: 36px;
  background-color: ${EColor.TEXT_300};
  box-shadow: 5px 5px 10px;
  border-radius: 24px;
  padding: 12px;
  margin: 12px;
`;

export const StyledDisabledLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 116px
  ${Title5}
`;

export const OnClickLabel = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  width: 116px;
  ${Title5}
  color: #3366CC;
`;