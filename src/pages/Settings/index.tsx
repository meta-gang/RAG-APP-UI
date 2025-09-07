// /src/pages/Settings/index.tsx

import React, { useState, useRef } from 'react';
import { existingQueries } from '../../data/mockData';
import { SettingsView } from './SettingsView';

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
    
    const handleRun = () => {
        setIsRunning(true);
        setProgress(0);
        setProgressMessage('Initializing...');

        console.log("Running RAG evaluation with settings:", {
            querySource,
            llmOption,
            files
        });

        // 진행률 시뮬레이션
        const interval = setInterval(() => {
            setProgress(prev => {
                const nextProgress = prev + 10;
                if (nextProgress >= 100) {
                    clearInterval(interval);
                    setProgressMessage('Evaluation complete! Redirecting...');
                    setTimeout(() => {
                        setCurrentPage("dashboard");
                        setIsRunning(false); // 페이지 이동 후 상태 초기화
                    }, 1000);
                    return 100;
                }
                
                if (nextProgress > 70) setProgressMessage('Finalizing results...');
                else if (nextProgress > 30) setProgressMessage('Generating answers...');

                return nextProgress;
            });
        }, 300); // 0.3초마다 진행률 업데이트
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