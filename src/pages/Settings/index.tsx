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

    // const [isRunning, setIsRunning] = useState(false);
    // const [progress, setProgress] = useState(0);
    // const [progressMessage, setProgressMessage] = useState('');
    
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
    
<<<<<<< HEAD
    const handleRun = () => {
        // [제거] 로딩 상태를 'true'로 설정하는 코드를 제거합니다.
        // setIsRunning(true);
        // setProgress(0);
        // setProgressMessage('Initializing...');
        
        // [유지] 문규님이 작업한 소켓 메시지 전송 로직은 그대로 둡니다.
        // 이 메시지가 백엔드로 전송되면, 백엔드가 'rag-on' 메시지로 응답할 것입니다.
        console.log("Running RAG evaluation with settings:", {
            querySource,
            llmOption,
            files
        });

        // (문규님 코드 예시 - 실제 코드는 다를 수 있음)
        if (querySource === 'manual' && files.length > 0) {
            // 파일 업로드 케이스 (문규님 코드)
            const uploadedFiles = await uploadFiles(files);
            if (uploadedFiles) {
                // [정우님 명세서]와 형식이 다릅니다. 문규님이 만든 sendFileQuery를 사용합니다.
                socket.sendFileQuery(uploadedFiles);
            }
        } else if (querySource === 'llm') {
            // LLM 쿼리 생성 케이스 (문규님 코드)
            const selectedModel = document.getElementById('llm-select') as HTMLSelectElement;
            const selectedQueryId = document.getElementById('existing-query-select') as HTMLSelectElement;
            
            if (llmOption === 'new') {
                // 새 질문 생성의 경우
                // [정우님 명세서]에 맞게 수정 (file_path, llm_model)
                socket.sendLLMQuery({
                    llm_option: 'make-query',
                    file_path: '',  // 새 질문 생성 시 back에 보낼 파일 경로는 공란
                    llm_model: selectedModel?.value || ''  // 선택된 LLM 모델
                });
            } else {
                // 기존 질문 사용의 경우
                // [정우님 명세서]에 맞게 수정 (file_path, llm_model)
                // TODO: existingQueries 목업 데이터가 파일 경로가 아니라서 임시 경로 사용
                const selectedQueryData = existingQueries.find(q => q === selectedQueryId?.value);
                const filePath = selectedQueryData ? `./data/${selectedQueryData}.txt` : './data/default.txt';

                socket.sendLLMQuery({
                    llm_option: 'made-query',
                    file_path: filePath, // 선택된 질문이 있는 파일 경로
                    llm_model: "" // [정우님 명세서] 기존 질문 사용 시 모델 비움
                });
            }
        }

        // [병합] 문규님의 '프로그레스 바 시뮬레이션' (setInterval) 로직 전체 제거
        // 이 역할은 App.tsx의 전역 핸들러가 대신합니다.
    };

    // --- 6. View 반환 (재준님 코드 - Recoil 연동) ---
    return (
        <SettingsView
            step={step}
            isRunning={isRunning} // 전역 상태에서 가져온 값
            progress={progress} // 전역 상태에서 계산한 값
            progressMessage={progressMessage} // 전역 상태에서 계산한 값
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