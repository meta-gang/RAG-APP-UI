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
 * SettingsView 컴포넌트 (Run Queries 화면)
 *
 * 쿼리 소스 선택 및 파일 선택 UI를 렌더링합니다.
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
  const isNextDisabled = () => {
    if (step === 1) return false;
    if (step === 2) return !selectedFileName || serverFiles.length === 0;
    return false;
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <S.Label>Step 1: Select Query Source</S.Label>
            <S.Grid>
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
                  No files found or loading...
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
          {/* [수정] 제목 변경: Evaluation Settings -> Run Queries */}
          <S.Title>Run Queries</S.Title>
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