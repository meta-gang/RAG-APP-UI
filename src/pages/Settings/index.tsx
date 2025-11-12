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

    // const [isRunning, setIsRunning] = useState(false);
    // const [progress, setProgress] = useState(0);
    // const [progressMessage, setProgressMessage] = useState('');
    
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
            // const uploadedFiles = await uploadFiles(files); // 파일 업로드 API는 별도 필요
            // socket.sendFileQuery(uploadedFiles);
            console.log('TODO: 파일 업로드 및 socket.sendFileQuery 호출');
        } else if (querySource === 'llm') {
            // socket.sendLLMQuery(...)
            console.log('TODO: LLM 쿼리 전송 호출');
        }

        // [제거] 프로그레스 바 시뮬레이션 코드를 반드시 제거합니다.
        /*
        const interval = setInterval(() => {
            setProgress(prev => {
                // ... (이하 모든 setInterval 관련 코드 제거)
            });
        }, 300);
        */
       
        // [수정] handleRun 함수는 메시지 전송 후 즉시 종료됩니다.
        // 페이지 이동(setCurrentPage) 로직도 제거합니다.
        // 페이지 이동은 App.tsx의 'rag-result-data' 핸들러가 담당합니다.
    };


    // isRunning prop을 View에 전달하는 부분 수정
    // 전역 상태를 가져와서 전달합니다.
    const { isLoading: isRunning } = useRecoilValue(appLoadingState);
    // progress, progressMessage도 전역 상태에서 가져옵니다.
    const { message, totalQueries, completedQueries } = useRecoilValue(appLoadingState);
    const progress = totalQueries > 0 ? (completedQueries / totalQueries) * 100 : 0;
    const progressMessage = `${message} (${completedQueries}/${totalQueries})`;

    return (
        <SettingsView
            step={step}
            // isRunning={isRunning} // [제거]
            // progress={progress} // [제거]
            // progressMessage={progressMessage} // [제거]
            // [수정] 전역 상태를 props로 전달
            isRunning={isRunning}
            progress={Math.floor(progress)}
            progressMessage={progressMessage}
            handleNextStep={handleNextStep}
            // ... (이하 나머지 props)
            handleRun={handleRun} // 수정된 handleRun 함수 전달
        />
    );
};