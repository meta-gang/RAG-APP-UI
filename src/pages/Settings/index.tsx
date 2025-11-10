// /src/pages/Settings/index.tsx

import React, { useState, useRef } from 'react';
import { existingQueries } from '../../data/mockData';
import { SettingsView } from './SettingsView';
import { socket } from '../../apis/socket';

interface SettingsPageProps {
    setCurrentPage: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
    // Step 1: 단계(step)를 관리하는 state 추가
    const [step, setStep] = useState<number>(1);
    
    const [files, setFiles] = useState<File[]>([]);
    const [querySource, setQuerySource] = useState<'manual' | 'llm'>("manual");
    const [llmOption, setLlmOption] = useState<'new' | 'existing'>("new");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isRunning, setIsRunning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressMessage, setProgressMessage] = useState('');
    
    const uploadFiles = async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            return result.fileNames;
        } catch (error) {
            console.error('File upload failed:', error);
            return null;
        }
    };

    // Step 2: 다음 단계로 넘어가는 핸들러 함수
    const handleNextStep = () => {
        // 마지막 단계에서는 실행 로직으로 연결
        if (step === 3) {
            handleRun();
        } else {
            // Manual 선택 시 2단계는 파일 업로드, 3단계가 확인. LLM 선택 시 2단계가 LLM 옵션, 3단계가 확인.
            // 현재 로직은 1 -> 2 -> 3 순서로만 진행되므로, 2단계에서 분기할 필요는 없음.
            // 복잡한 분기가 필요하다면 여기서 로직을 추가할 수 있음.
            setStep(prev => prev + 1);
        }
    };

    // Step 3: 이전 단계로 돌아가는 핸들러 함수
    const handlePrevStep = () => {
        setStep(prev => prev - 1);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
        setFiles(Array.from(event.target.files));
        }
    };

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files) {
        setFiles(Array.from(event.dataTransfer.files));
        }
    };
    
    const handleDropzoneClick = () => {
        if (querySource === 'manual') {
            fileInputRef.current?.click();
        }
    };
    
    const handleRun = async () => {
        setIsRunning(true);
        setProgress(0);
        setProgressMessage('Initializing...');

        if (querySource === 'manual' && files.length > 0) {
            // 파일 업로드 케이스
            const uploadedFiles = await uploadFiles(files);
            if (uploadedFiles) {
                socket.send({
                    topic: 'run-rag-file-query',
                    files: uploadedFiles
                });
            }
        } else if (querySource === 'llm') {
            // LLM 쿼리 생성 케이스
            // LLM 모델 선택값과 기존 질문 선택값 가져오기
            const selectedModel = document.getElementById('llm-select') as HTMLSelectElement;
            const selectedQueryId = document.getElementById('existing-query-select') as HTMLSelectElement;
            
            if (llmOption === 'new') {
                // 새 질문 생성의 경우
                socket.send({
                    topic: 'run-rag-llm-query',
                    settings: {
                        llm_option: 'make-query',
                        file_path: '',  // 새 질문 생성시에는 빈 문자열
                        llm_model: selectedModel?.value || ''  // 선택된 LLM 모델
                    }
                });
            } else {
                // 기존 질문 사용의 경우
                const selectedQueryData = existingQueries.find(q => q.id === selectedQueryId?.value);
                socket.send({
                    topic: 'run-rag-llm-query',
                    settings: {
                        llm_option: 'made-query',
                        file_path: selectedQueryData?.filePath || '',  // 선택된 질문의 파일 경로
                        llm_model: selectedModel?.value || ''  // 선택된 LLM 모델
                    }
                });
            }
        }

        // 프로그레스 바 시뮬레이션
        const interval = setInterval(() => {
            setProgress((prev: number) => {
                const nextProgress = prev + 10;
                if (nextProgress >= 100) {
                    clearInterval(interval);
                    setProgressMessage('Evaluation complete! Redirecting...');
                    setTimeout(() => {
                        setCurrentPage("dashboard");
                        setIsRunning(false);
                    }, 1000);
                    return 100;
                }
                
                if (nextProgress > 70) setProgressMessage('Finalizing results...');
                else if (nextProgress > 30) setProgressMessage('Generating answers...');

                return nextProgress;
            });
        }, 300);
    };

    return (
        <SettingsView
            step={step}
            isRunning={isRunning}
            progress={progress}
            progressMessage={progressMessage}
            handleNextStep={handleNextStep}
            handlePrevStep={handlePrevStep}
            files={files}
            querySource={querySource}
            llmOption={llmOption}
            fileInputRef={fileInputRef}
            existingQueries={existingQueries}
            handleFileChange={handleFileChange}
            handleFileDrop={handleFileDrop}
            setQuerySource={setQuerySource}
            setLlmOption={setLlmOption}
            handleRun={handleRun}
            handleDropzoneClick={handleDropzoneClick}
        />
    );
};