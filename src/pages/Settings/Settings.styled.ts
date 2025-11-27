import styled from 'styled-components';

/**
 * Settings 컨테이너
 */
export const SettingsContainer = styled.div`
  background-color: #1f2937;
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #374151;
  max-width: 56rem;
  margin: 0 auto;
`;

/**
 * 타이틀
 */
export const Title = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1.5rem;
`;

/**
 * 폼 컨테이너
 */
export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

/**
 * 라벨
 */
export const Label = styled.label`
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #d1d5db;
  margin-bottom: 0.5rem;
`;

/**
 * 그리드 레이아웃
 */
export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

interface OptionBoxProps {
  isSelected: boolean;
}

/**
 * 옵션 박스
 */
export const OptionBox = styled.label<OptionBoxProps>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #374151;
  border-radius: 0.5rem;
  cursor: pointer;
  border: 2px solid ${(props) => (props.isSelected ? '#6366f1' : 'transparent')};
  background-color: ${(props) => (props.isSelected ? 'rgba(79, 70, 229, 0.15)' : '#374151')};

  & > div {
    opacity: ${(props) => (props.isSelected ? 1 : 0.7)};
  }
`;

/**
 * 라디오 버튼 래퍼
 */
export const RadioWrapper = styled.div`
  display: flex;
  align-items: center;

  input[type='radio'] {
    height: 1rem;
    width: 1rem;
    color: #4f46e5;
    background-color: #111827;
    border-color: #4b5563;
  }

  span {
    margin-left: 0.75rem;
    color: #ffffff;
  }
`;

/**
 * 드롭존
 */
export const Dropzone = styled.div`
  margin-top: 1rem;
  height: 8rem;
  border: 2px dashed #6b7280;
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca3af;
  font-size: 0.875rem;

  svg {
    margin-bottom: 0.5rem;
  }
`;

/**
 * 파일 리스트
 */
export const FileList = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #d1d5db;
`;

/**
 * 서브 옵션 컨테이너
 */
export const SubOptionsContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

/**
 * 셀렉트 박스
 */
export const Select = styled.select`
  width: 100%;
  background-color: #4b5563;
  color: #ffffff;
  border-radius: 0.5rem;
  padding: 0.5rem;
  font-size: 0.875rem;
  border: none;
  margin-top: 0.25rem;

  &:focus {
    outline: 2px solid #4f46e5;
  }
`;

/**
 * 버튼 래퍼
 */
export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
`;

/**
 * 공통 버튼 스타일 기반(BaseButton)
 * - SubmitButton / BackButton 등에서 재사용합니다.
 */
const BaseButton = styled.button`
  color: #ffffff;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background-color 0.2s;
  cursor: pointer;
`;

/**
 * 제출 버튼
 */
export const SubmitButton = styled(BaseButton)`
  background-color: #4f46e5;
  &:hover {
    background-color: #4338ca;
  }

  &:disabled {
    background-color: #4b5563;
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

/**
 * 뒤로 가기 버튼
 */
export const BackButton = styled(BaseButton)`
  background-color: #374151;
  &:hover {
    background-color: #4b5563;
  }
`;

/**
 * 파일 목록 컨테이너
 */
export const FileListContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding: 0.5rem;
`;

interface FileToggleItemProps {
  isSelected: boolean;
}

/**
 * 파일 토글 아이템
 */
export const FileToggleItem = styled.div<FileToggleItemProps>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: ${(props) => (props.isSelected ? 'rgba(79, 70, 229, 0.15)' : '#374151')};
  border: 2px solid ${(props) => (props.isSelected ? '#6366f1' : 'transparent')};
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.isSelected ? 'rgba(79, 70, 229, 0.25)' : '#4b5563')};
  }

  span {
    color: #ffffff;
    font-size: 0.875rem;
    word-break: break-all;
  }
`;

/**
 * 파일 토글 원형 인디케이터
 */
export const FileToggleCircle = styled.div<FileToggleItemProps>`
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.isSelected ? '#6366f1' : '#6b7280')};
  background-color: ${(props) => (props.isSelected ? '#6366f1' : 'transparent')};
  position: relative;
  transition: all 0.2s;

  ${(props) =>
    props.isSelected &&
    `
    &::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: white;
    }
  `}
`;