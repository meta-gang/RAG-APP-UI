
import styled from 'styled-components';

export const ModalOverlay = styled.div`
  position: fixed; /* 화면 전체 고정 */
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.75); /* 반투명 검은색 배경 */
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000; /* 최상단에 표시 */
  backdrop-filter: blur(5px);
`;

export const ModalContent = styled.div`
  background-color: #1f2937; /* bg-gray-800 */
  padding: 2.5rem;
  border-radius: 0.75rem; /* rounded-xl */
  border: 1px solid #374151; /* border-gray-700 */
  width: 90%;
  max-width: 500px;
  
  /* ProgressBar 내부의 텍스트 색상을 강제로 흰색/회색으로 지정 */
  & p {
    color: #ffffff;
  }
  & span {
    color: #9ca3af;
  }
`;