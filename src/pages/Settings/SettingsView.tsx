// src/pages/Settings/SettingsView.tsx
import React from 'react';
import { Upload, PlayCircle, ArrowRight, ArrowLeft, FileText } from 'lucide-react';
import * as S from './Settings.styled';
import { ProgressBar } from '../../components/ProgressBar';

interface SettingsViewProps {
  step: number;
  isRunning: boolean;
  progress: number;
  progressMessage: string;
  
  inputMode: 'upload' | 'server';
  setInputMode: (mode: 'upload' | 'server') => void;
  
  files: File[];
  fileInputRef: React.RefObject<HTMLInputElement>;
  
  serverFiles: Array<{ id: string; query: string; filePath?: string; file_path?: string }>;
  selectedServerFileId: string;
  setSelectedServerFileId: (id: string) => void;
  
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  handleDropzoneClick: () => void;
  handleRun: () => void;
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
  files,
  fileInputRef,
  serverFiles,
  selectedServerFileId,
  setSelectedServerFileId,
  handleNextStep,
  handlePrevStep,
  handleFileChange,
  handleFileDrop,
  handleDropzoneClick,
}) => {

  /**
   * 다음 버튼 활성화 여부 결정
   * @returns boolean
   */
  const isNextDisabled = () => {
    if (step === 1) {
      // 1단계: 파일이 없거나(upload 모드), 선택된 파일 ID가 없으면(server 모드) 비활성화
      if (inputMode === 'upload') {
        return files.length === 0;
      } else {
        return !selectedServerFileId || serverFiles.length === 0;
      }
    }
    return false; // 2단계는 확인 단계라 항상 활성화
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
              {/* 옵션 1: 내 컴퓨터에서 업로드 */}
              <S.OptionBox isSelected={inputMode === 'upload'}>
                <S.RadioWrapper>
                  <input
                    type="radio"
                    name="input-mode"
                    value="upload"
                    checked={inputMode === 'upload'}
                    onChange={() => setInputMode('upload')}
                  />
                  <span>Upload JSON File (My Computer)</span>
                </S.RadioWrapper>
                {inputMode === 'upload' && (
                  <S.Dropzone
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                    onClick={handleDropzoneClick}
                  >
                    <Upload size={24} />
                    <p>Drag & drop .json files here</p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept=".json" // JSON 파일만 허용
                      multiple
                      style={{ display: 'none' }}
                    />
                  </S.Dropzone>
                )}
                {inputMode === 'upload' && files.length > 0 && (
                  <S.FileList>Selected: {files.map((f) => f.name).join(', ')}</S.FileList>
                )}
              </S.OptionBox>

              {/* 옵션 2: 서버 파일 선택 */}
              <S.OptionBox isSelected={inputMode === 'server'}>
                <S.RadioWrapper>
                  <input
                    type="radio"
                    name="input-mode"
                    value="server"
                    checked={inputMode === 'server'}
                    onChange={() => setInputMode('server')}
                  />
                  <span>Select from Server (Previously Generated)</span>
                </S.RadioWrapper>
                
                {inputMode === 'server' && (
                  <S.SubOptionsContainer>
                    {serverFiles.length > 0 ? (
                      <S.Select 
                        value={selectedServerFileId} 
                        onChange={(e) => setSelectedServerFileId(e.target.value)}
                      >
                        {serverFiles.map((file) => (
                          <option key={file.id} value={file.id}>
                            {file.query || file.id}
                          </option>
                        ))}
                      </S.Select>
                    ) : (
                      <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                        No files found on server.
                      </div>
                    )}
                  </S.SubOptionsContainer>
                )}
              </S.OptionBox>
            </S.Grid>
          </div>
        );
      case 2:
        return (
          <div>
            <S.Label>Step 2: Confirm & Run</S.Label>
            <S.OptionBox isSelected={true} style={{ cursor: 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileText size={20} color="#6366f1" />
                <strong style={{ color: '#fff' }}>Target Query File</strong>
              </div>
              
              {inputMode === 'upload' ? (
                <p style={{ color: '#d1d5db' }}>
                  {files.length > 0 ? files.map(f => f.name).join(', ') : 'No file selected'}
                </p>
              ) : (
                <p style={{ color: '#d1d5db' }}>
                  {serverFiles.find(f => f.id === selectedServerFileId)?.query || 'No file selected'}
                </p>
              )}
            </S.OptionBox>
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