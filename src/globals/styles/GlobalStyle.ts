// /src/globals/styles/GlobalStyle.ts

import { createGlobalStyle, styled } from "styled-components";
import NotoSansBlack from "@assets/fonts/NotoSans-Black.woff2";
import NotoSansBold from "@assets/fonts/NotoSans-Bold.woff2";
import NotoSansLight from "@assets/fonts/NotoSans-Light.woff2";
import NotoSansMedium from "@assets/fonts/NotoSans-Medium.woff2";
import NotoSansRegular from "@assets/fonts/NotoSans-Regular.woff2";
import NotoSansThin from "@assets/fonts/NotoSans-Thin.woff2";
import { body6 } from "./font";

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    background-color: #111827; 
    color: #F9FAFB;
    font-family: sans-serif;
    padding: 2rem;
    
    @media (max-width: 1024px) {
      padding: 1.5rem;
    }
    @media (max-width: 640px) {
      padding: 1rem;
    }
  }

  /* 스크롤바 디자인 개선 코드 추가 */
  /* Chrome, Safari, Edge 등 Webkit 기반 브라우저 타겟 */
  ::-webkit-scrollbar {
    width: 8px; /* 스크롤바의 너비 */
    height: 8px; /* 횡 스크롤바의 높이 */
  }

  ::-webkit-scrollbar-track {
    background: #1f2937; /* 스크롤바 트랙 색상 */
  }

  ::-webkit-scrollbar-thumb {
    background: #4b5563; /* 스크롤바 핸들 색상 */
    border-radius: 4px; /* 스크롤바 핸들 모서리 둥글게 */
  }

  ::-webkit-scrollbar-thumb:hover {
    background: #6b7280; /* 마우스 호버 시 핸들 색상 */
  }


  @font-face {
    font-family: 'NotoSansBlack';
    src: local('NotoSansBlack'), local('NotoSansBlack');
    font-style: normal;
    src: url(${NotoSansBlack}) format('truetype');
  }
  @font-face {
    font-family: 'NotoSansBold';
    src: local('NotoSansBold'), local('NotoSansBold');
    font-style: normal;
    src: url(${NotoSansBold}) format('truetype');
  }
  @font-face {
    font-family: 'NotoSansLight';
    src: local('NotoSansLight'), local('NotoSansLight');
    font-style: normal;
    src: url(${NotoSansLight}) format('truetype');
  }
  @font-face {
    font-family: 'NotoSansMedium';
    src: local('NotoSansMedium'), local('NotoSansMedium');
    font-style: normal;
    src: url(${NotoSansMedium}) format('truetype');
  }
  @font-face {
    font-family: 'NotoSansRegular';
    src: local('NotoSansRegular'), local('NotoSansRegular');
    font-style: normal;
    src: url(${NotoSansRegular}) format('truetype');
  }
  @font-face {
    font-family: 'NotoSansThin';
    src: local('NotoSansThin'), local('NotoSansThin');
    font-style: normal;
    src: url(${NotoSansThin}) format('truetype');
  }
`;

export const Version = styled.div`
  position: absolute;
  z-index: 998;
  bottom: 0;
  left: 0;
  ${body6}
`;