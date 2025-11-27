// src/pages/Settings/SettingsView.tsx
import React from 'react';
import { PlayCircle, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import * as S from './Settings.styled';
import { ProgressBar } from '../../components/ProgressBar';

interface SettingsViewProps {
  step: number;
  isRunning: boolean;
  progress: number;
  progressMessage: string;
  
  inputMode: 'llm-generated' | 'custom';
  setInputMode: (mode: 'llm-generated' | 'custom') => void;
  
  serverFiles: string[];
  selectedFileName: string;
  setSelectedFileName: (fileName: string) => void;
  
  handleNextStep: () => void;
  handlePrevStep: () => void;
}

/**
 * SettingsView 컴포넌트
 *
 * - step 기반 UI (1: 선택, 2: 확인)
 * - 업로드 / 서버 파일 선택 모드 지원
 * - 파일 선택, 드래그/드롭, 서버 파일 선택 UI 제공
 */
export const SettingsView: React.FC<SettingsViewProps> = ({
  step,
  isRunning,
  progress,
  progressMessage,
  inputMode,
  setInputMode,
  serverFiles,
  selectedFileName,
  setSelectedFileName,
  handleNextStep,
  handlePrevStep,
}) => {

  /**
   * 다음 버튼 활성화 여부 결정
   * @returns boolean
   */
  const isNextDisabled = () => {
    if (step === 1) {
      // 1단계: 선택만 하면 되므로 항상 활성화
      return false;
    }
    if (step === 2) {
      // 2단계: 선택된 파일이 없으면 비활성화
      return !selectedFileName || serverFiles.length === 0;
    }
    return false;
  };

  /**
   * 현재 step에 맞는 콘텐츠를 렌더링합니다.
   */
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <S.Label>Step 1: Select Query Source</S.Label>
            <S.Grid>
              {/* 옵션 1: LLM Generated Query */}
              <S.OptionBox isSelected={inputMode === 'llm-generated'}>
                <S.RadioWrapper>
                  <input
                    type="radio"
                    name="input-mode"
                    value="llm-generated"
                    checked={inputMode === 'llm-generated'}
                    onChange={() => setInputMode('llm-generated')}
                  />
                  <span>Select from Server (LLM Generated Query)</span>
                </S.RadioWrapper>
              </S.OptionBox>

              {/* 옵션 2: Custom Query */}
              <S.OptionBox isSelected={inputMode === 'custom'}>
                <S.RadioWrapper>
                  <input
                    type="radio"
                    name="input-mode"
                    value="custom"
                    checked={inputMode === 'custom'}
                    onChange={() => setInputMode('custom')}
                  />
                  <span>Select from Server (Custom Query)</span>
                </S.RadioWrapper>
              </S.OptionBox>
            </S.Grid>
          </div>
        );
      case 2:
        return (
          <div>
            <S.Label>Step 2: Select File & Run</S.Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <FileText size={20} color="#6366f1" />
              <strong style={{ color: '#fff' }}>
                {inputMode === 'llm-generated' ? 'LLM Generated Query Files' : 'Custom Query Files'}
              </strong>
            </div>
            
            {serverFiles.length > 0 ? (
              <S.FileListContainer>
                {serverFiles.map((file) => (
                  <S.FileToggleItem
                    key={file}
                    isSelected={selectedFileName === file}
                    onClick={() => setSelectedFileName(file)}
                  >
                    <S.FileToggleCircle isSelected={selectedFileName === file} />
                    <span>{file}</span>
                  </S.FileToggleItem>
                ))}
              </S.FileListContainer>
            ) : (
              <S.OptionBox isSelected={true} style={{ cursor: 'default' }}>
                <p style={{ color: '#9ca3af', fontSize: '0.875rem', textAlign: 'center' }}>
                  Loading files from server...
                </p>
              </S.OptionBox>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <S.SettingsContainer>
      {isRunning ? (
        <ProgressBar progress={progress} message={progressMessage} />
      ) : (
        <>
          <S.Title>Evaluation Settings</S.Title>
          <S.FormContainer>
            {renderStepContent()}
            <S.ButtonWrapper>
              {step > 1 ? (
                <S.BackButton onClick={handlePrevStep}>
                  <ArrowLeft size={16} /> Back
                </S.BackButton>
              ) : (
                <div />
              )}
              <S.SubmitButton onClick={handleNextStep} disabled={isNextDisabled()}>
                {step === 2 ? <PlayCircle size={16} /> : <ArrowRight size={16} />}
                {step === 2 ? 'Run Evaluation' : 'Next'}
              </S.SubmitButton>
            </S.ButtonWrapper>
          </S.FormContainer>
        </>
      )}
    </S.SettingsContainer>
  );
};