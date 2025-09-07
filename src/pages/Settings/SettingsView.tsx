// /src/pages/Settings/SettingsView.tsx
import React from 'react';
import { Upload, PlayCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import * as S from './Settings.styled';
import { ProgressBar } from '../../components/ProgressBar';

interface SettingsViewProps {
  step: number;
  isRunning: boolean;
  progress: number;
  progressMessage: string;
  files: File[];
  querySource: 'manual' | 'llm';
  llmOption: 'new' | 'existing';
  fileInputRef: React.RefObject<HTMLInputElement>;
  existingQueries: string[];
  
  // Event Handlers
  handleNextStep: () => void;
  handlePrevStep: () => void;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  setQuerySource: (source: 'manual' | 'llm') => void;
  setLlmOption: (option: 'new' | 'existing') => void;
  handleRun: () => void;
  handleDropzoneClick: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  step,
  isRunning,
  progress,
  progressMessage,
  handleNextStep,
  handlePrevStep,
  files,
  querySource,
  llmOption,
  fileInputRef,
  existingQueries,
  handleFileChange,
  handleFileDrop,
  setQuerySource,
  setLlmOption,
  handleRun,
  handleDropzoneClick,
}) => {
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <S.Label>Step 1: Query Source</S.Label>
            <S.Grid>
              <S.OptionBox isSelected={querySource === 'manual'}>
                <S.RadioWrapper>
                  <input
                    type="radio"
                    name="query-source"
                    value="manual"
                    checked={querySource === 'manual'}
                    onChange={() => setQuerySource('manual')}
                  />
                  <span>Manual Query Input</span>
                </S.RadioWrapper>
              </S.OptionBox>
              <S.OptionBox isSelected={querySource === 'llm'}>
                <S.RadioWrapper>
                  <input
                    type="radio"
                    name="query-source"
                    value="llm"
                    checked={querySource === 'llm'}
                    onChange={() => setQuerySource('llm')}
                  />
                  <span>Generate with LLM</span>
                </S.RadioWrapper>
              </S.OptionBox>
            </S.Grid>
          </div>
        );
      case 2:
        return (
          <>
            {querySource === 'manual' && (
              <div>
                <S.Label>Step 2: Upload Manual Queries</S.Label>
                <S.Dropzone
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={handleDropzoneClick}
                >
                  <Upload size={24} />
                  <p>Drag & drop files or click to browse</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    multiple
                    style={{ display: 'none' }}
                  />
                </S.Dropzone>
                {files.length > 0 && (
                  <S.FileList>
                    {files.map((f) => f.name).join(', ')}
                  </S.FileList>
                )}
              </div>
            )}
            {querySource === 'llm' && (
              <div>
                <S.Label>Step 2: LLM Generation Options</S.Label>
                  <S.SubOptionsContainer>
                    <S.RadioWrapper as="label">
                      <input
                        type="radio"
                        name="llm-query-option"
                        value="existing"
                        checked={llmOption === 'existing'}
                        onChange={() => setLlmOption('existing')}
                        disabled={querySource !== 'llm'}
                      />
                      <span>Use existing queries</span>
                    </S.RadioWrapper>
                    {llmOption === 'existing' && (
                      <S.Select id="existing-query-select" disabled={querySource !== 'llm'}>
                        {existingQueries.map((q) => (
                          <option key={q}>{q}</option>
                        ))}
                      </S.Select>
                    )}
                    <S.RadioWrapper as="label">
                      <input
                        type="radio"
                        name="llm-query-option"
                        value="new"
                        checked={llmOption === 'new'}
                        onChange={() => setLlmOption('new')}
                        disabled={querySource !== 'llm'}
                      />
                      <span>Generate new queries</span>
                    </S.RadioWrapper>
                    {llmOption === 'new' && (
                      <S.Select id="llm-select" disabled={querySource !== 'llm'}>
                        <option>LLaMON (meta-gang)</option>
                        <option>GPT-4 (OpenAI)</option>
                        <option>Gemini-Pro (Google)</option>
                      </S.Select>
                    )}
                  </S.SubOptionsContainer>
              </div>
            )}
          </>
        );
      case 3:
        return (
          <div>
            <S.Label>Step 3: Confirm & Run</S.Label>
            <S.OptionBox isSelected={true} style={{ cursor: 'default' }}>
              <p><strong>Query Source:</strong> {querySource}</p>
              {querySource === 'manual' && files.length > 0 && (
                <p><strong>Files:</strong> {files.map(f => f.name).join(', ')}</p>
              )}
              {querySource === 'llm' && (
                <p><strong>LLM Option:</strong> {llmOption}</p>
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
              <S.SubmitButton onClick={handleNextStep}>
                {step === 3 ? <PlayCircle size={16} /> : <ArrowRight size={16} />}
                {step === 3 ? 'Run RAG Test' : 'Next'}
              </S.SubmitButton>
            </S.ButtonWrapper>
          </S.FormContainer>
        </>
      )}
    </S.SettingsContainer>
  );
};