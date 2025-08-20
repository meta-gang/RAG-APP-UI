// /src/pages/Settings/SettingsView.tsx
import React from 'react';
import { Upload, PlayCircle } from 'lucide-react';
import * as S from './Settings.styled';

interface SettingsViewProps {
  files: File[];
  querySource: 'manual' | 'llm';
  llmOption: 'new' | 'existing';
  fileInputRef: React.RefObject<HTMLInputElement>;
  existingQueries: string[];
  
  // Event Handlers
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFileDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  setQuerySource: (source: 'manual' | 'llm') => void;
  setLlmOption: (option: 'new' | 'existing') => void;
  handleRun: () => void;
  handleDropzoneClick: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
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
  return (
    <S.SettingsContainer>
      <S.Title>Evaluation Settings</S.Title>
      <S.FormContainer>
        <div>
          <S.Label>Query Source</S.Label>
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
                  className="hidden"
                  disabled={querySource !== 'manual'}
                />
              </S.Dropzone>
              {files.length > 0 && querySource === 'manual' && (
                <S.FileList>
                  {files.map((f) => f.name).join(', ')}
                </S.FileList>
              )}
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
                  <S.Select id="existing-query-select">
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
                  <S.Select id="llm-select">
                    <option>LLaMON (meta-gang)</option>
                    <option>GPT-4 (OpenAI)</option>
                    <option>Gemini-Pro (Google)</option>
                  </S.Select>
                )}
              </S.SubOptionsContainer>
            </S.OptionBox>
          </S.Grid>
        </div>
        <S.ButtonWrapper>
          <S.SubmitButton onClick={handleRun}>
            <PlayCircle size={16} /> Run RAG & View Dashboard
          </S.SubmitButton>
        </S.ButtonWrapper>
      </S.FormContainer>
    </S.SettingsContainer>
  );
};