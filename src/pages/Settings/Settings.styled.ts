// /src/pages/Settings/Settings.styled.ts
import styled from 'styled-components';

export const SettingsContainer = styled.div`
  background-color: #1f2937; // bg-gray-800
  padding: 1.5rem; // p-6
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid #374151; // border-gray-700
  max-width: 56rem; // max-w-3xl
  margin: 0 auto;
`;

export const Title = styled.h2`
  font-size: 1.5rem; // text-2xl
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 1.5rem; // mb-6
`;

export const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem; // space-y-8
`;

export const Label = styled.label`
  display: block;
  font-size: 0.875rem; // text-sm
  font-weight: 500;
  color: #d1d5db; // text-gray-300
  margin-bottom: 0.5rem; // mb-2
`;

export const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem; // gap-4

  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

interface OptionBoxProps {
  isSelected: boolean;
}

export const OptionBox = styled.label<OptionBoxProps>`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #374151; // bg-gray-700
  border-radius: 0.5rem; // rounded-lg
  cursor: pointer;
  border: 2px solid ${(props) => (props.isSelected ? '#6366f1' : 'transparent')};
  background-color: ${(props) => (props.isSelected ? 'rgba(79, 70, 229, 0.15)' : '#374151')};

  & > div {
    opacity: ${(props) => (props.isSelected ? 1 : 0.7)};
  }
`;

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

export const Dropzone = styled.div`
  margin-top: 1rem;
  height: 8rem;
  border: 2px dashed #6b7280; // border-gray-500
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca3af; // text-gray-400
  font-size: 0.875rem;

  svg {
    margin-bottom: 0.5rem;
  }
`;

export const FileList = styled.div`
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #d1d5db;
`;

export const SubOptionsContainer = styled.div`
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; // space-y-2
`;

export const Select = styled.select`
  width: 100%;
  background-color: #4b5563; // bg-gray-600
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

export const ButtonWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  padding-top: 1rem;
`;

// ✨ [수정] BaseButton에 공통 스타일을 정의합니다.
const BaseButton = styled.button`
  color: #ffffff;
  font-weight: 600; // font-weight 통일
  padding: 0.5rem 1rem;
  border-radius: 0.375rem; // border-radius 통일
  border: none; // 테두리 제거
  display: flex;
  align-items: center;
  gap: 0.5rem; // 아이콘과 텍스트 간격
  transition: background-color 0.2s;
  cursor: pointer;
`;

export const SubmitButton = styled(BaseButton)`
  background-color: #4f46e5; // Indigo
  &:hover {
    background-color: #4338ca; // Darker Indigo
  }
`;

export const BackButton = styled(BaseButton)`
  background-color: #374151; // Dark Gray
  &:hover {
    background-color: #4b5563; // Lighter Gray
  }
`;