import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed; /* 화면 전체 고정 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7); /* 반투명 검은색 배경 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 최상단에 표시 */
`;

export const ModalContent = styled.div`
  background-color: #1f2937; /* bg-gray-800 */
  padding: 2rem;
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid #374151; /* border-gray-700 */
  width: 90%;
  max-width: 500px;
  
  /* ProgressBar 컴포넌트의 스타일을 여기서 오버라이드하거나 
     ProgressBar 자체 스타일을 수정할 수 있습니다. */
  /* 여기서는 ProgressBar 내부의 텍스트 색상을 강제로 흰색으로 지정합니다. */
  & > div {
    color: #ffffff;
  }
`;