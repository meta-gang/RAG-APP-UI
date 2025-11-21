import React, { useState, useRef } from 'react';
import { SettingsView } from './SettingsView';
import { existingQueries } from '../../data';  // 여기 
import { useRecoilValue } from 'recoil';
import { appLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';

interface SettingsPageProps {
    setCurrentPage: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
    // --- 페이지 단계 및 폼 데이터 관련 State (공통) ---
    const [step, setStep] = useState<number>(1);
    const [files, setFiles] = useState<File[]>([]);
    const [querySource, setQuerySource] = useState<'manual' | 'llm'>("manual");
    const [llmOption, setLlmOption] = useState<'new' | 'existing'>("new");
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- 2. 로딩 상태 로직 (재준님 코드 - Recoil 연동) ---
    // 로컬 useState(isRunning, progress)를 제거하고, Recoil 전역 상태를 구독합니다.
    const globalLoadingState = useRecoilValue(appLoadingState);

    // SettingsView가 요구하는 props에 맞게 전역 상태를 매핑합니다.
    const isRunning = globalLoadingState.isLoading;
    const progress = globalLoadingState.totalQueries > 0
        ? Math.floor((globalLoadingState.completedQueries / globalLoadingState.totalQueries) * 100)
        : 0;
    const progressMessage = globalLoadingState.totalQueries > 0
        ? `${globalLoadingState.message} (${globalLoadingState.completedQueries}/${globalLoadingState.totalQueries})`
        : globalLoadingState.message;

    // --- 3. 파일 업로드 헬퍼 (문규님 코드) ---
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

    // --- 4. 핸들러 함수들 (공통) ---
    const handleNextStep = () => {
        if (step === 3) {
            handleRun();
        } else {
            setStep(prev => prev + 1);
        }
    };

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
    
    // --- 5. handleRun (핵심 병합) ---
    const handleRun = async () => {
        // [병합] 문규님의 로컬 상태(setIsRunning 등) 설정 제거
        // [병합] 문규님의 시뮬레이션(setInterval) 로직 제거
        // [병합] 문규님의 소켓 전송 로직 (async, socket.send 등)은 유지

        console.log("Running RAG evaluation with settings:", {
            querySource,
            llmOption,
            files
        });

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
                const selectedQueryData = existingQueries.find(q => q.id === selectedQueryId?.value);
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