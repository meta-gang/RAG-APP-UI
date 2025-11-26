// src/pages/Settings/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { SettingsView } from './SettingsView';
import { useRecoilValue } from 'recoil';
import { appLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';

interface SettingsPageProps {
    setCurrentPage: (page: string) => void;
}

/**
 * SettingsPage 컴포넌트
 *
 * 기능:
 * - step 기반 UI 상태 관리
 * - 업로드('upload') / 서버('server') 모드 선택
 * - 파일 드래그/파일 입력 처리
 * - 서버에 저장된 쿼리 목록을 소켓으로 수신하고 선택 가능
 *
 * @param setCurrentPage 현재 페이지를 설정하는 콜백
 */
export const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
    // 1. UI 상태 관리: Step은 유지하되 로직은 단순화
    const [step, setStep] = useState<number>(1);
    
    // 2. 데이터 선택 모드: 'upload'(내 PC 파일) vs 'server'(서버에 저장된 파일)
    const [inputMode, setInputMode] = useState<'upload' | 'server'>('upload');
    
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // 서버에 저장된 쿼리 파일 목록 상태
    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [selectedServerFileId, setSelectedServerFileId] = useState<string>('');

    // 3. 소켓 리스너: 서버에 저장된 쿼리 파일 목록 수신
    useEffect(() => {
        /**
         * 서버에서 존재하는 쿼리 목록을 수신하여 state로 설정합니다.
         * @remarks 소켓 이벤트 이름: 'existing-queries'
         * @param data 소켓으로 수신한 페이로드
         */
        const handleExistingQueries = (data: any) => {
            // 백엔드에서 { topic: 'existing-queries', queries: [...] } 형태로 보낸다고 가정
            if (data.topic === 'existing-queries') {
                setServerFiles(data.queries || []);
                // 목록이 있으면 첫 번째 파일을 기본 선택
                if (data.queries && data.queries.length > 0) {
                    setSelectedServerFileId(data.queries[0].id);
                }
            }
        };
        
        socket.on('existing-queries', handleExistingQueries);
        // 페이지 진입 시 목록 요청
        socket.send({ topic: 'get-existing-queries' });
        
        return () => {
            socket.off('existing-queries', handleExistingQueries);
        };
    }, []);

    // 4. 전역 로딩 상태 구독 (App.tsx에서 관리)
    const globalLoadingState = useRecoilValue(appLoadingState);
    const isRunning = globalLoadingState.isLoading;
    const progress = globalLoadingState.totalQueries > 0
        ? Math.floor((globalLoadingState.completedQueries / globalLoadingState.totalQueries) * 100)
        : 0;
    const progressMessage = globalLoadingState.totalQueries > 0
        ? `${globalLoadingState.message} (${globalLoadingState.completedQueries}/${globalLoadingState.totalQueries})`
        : globalLoadingState.message;

    /**
     * 주어진 파일들을 서버로 업로드합니다.
     * @param files 업로드할 File 배열
     * @returns 서버에서 반환한 파일명 배열 또는 null(실패 시)
     */
    const uploadFiles = async (files: File[]) => {
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));
        
        try {
            // 백엔드 API 엔드포인트 확인 필요 (임시 유지)
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            return result.fileNames; // 서버에 저장된 파일명 반환
        } catch (error) {
            console.error('File upload failed:', error);
            return null;
        }
    };

    // --- 핸들러 함수 ---
    /**
     * 다음 단계로 이동하거나 마지막 단계일 경우 실행 핸들러를 호출합니다.
     */
    const handleNextStep = () => {
        if (step === 2) { // 2단계가 마지막 (선택 -> 확인/실행)
            handleRun();
        } else {
            setStep(prev => prev + 1);
        }
    };

    /**
     * 이전 단계로 이동합니다.
     */
    const handlePrevStep = () => {
        setStep(prev => prev - 1);
    };

    /**
     * 파일 입력 변경 이벤트 처리기
     * @param event 파일 입력 change 이벤트
     */
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFiles(Array.from(event.target.files));
        }
    };

    /**
     * 드래그 앤 드롭으로 파일을 받는 핸들러
     * @param event 드롭 이벤트
     */
    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files) {
            setFiles(Array.from(event.dataTransfer.files));
        }
    };
    
    /**
     * 업로드 모드에서 드롭존 클릭 시 파일 선택창을 엽니다.
     */
    const handleDropzoneClick = () => {
        if (inputMode === 'upload') {
            fileInputRef.current?.click();
        }
    };
    
    /**
     * 실행 핸들러: 업로드 모드에서는 파일 업로드 후 소켓에 전송,
     * 서버 모드에서는 선택된 서버 파일 정보를 소켓으로 전송합니다.
     */
    const handleRun = async () => {
        console.log("Running RAG evaluation:", { inputMode, files, selectedServerFileId });

        if (inputMode === 'upload' && files.length > 0) {
            // Case A: 직접 파일 업로드
            const uploadedFiles = await uploadFiles(files);
            if (uploadedFiles) {
                socket.sendFileQuery(uploadedFiles);
            }
        } else if (inputMode === 'server') {
            // Case B: 서버 파일 선택
            const selectedFile = serverFiles.find(f => f.id === selectedServerFileId);
            if (selectedFile) {
                // 기존 LLMQuery 메시지 포맷 재활용 (설정값은 단순화)
                // 백엔드 명세에 따라 'made-query' 옵션 사용
                socket.sendLLMQuery({
                    llm_option: 'made-query', // "기존 파일 사용" 의미
                    file_path: selectedFile.filePath || selectedFile.file_path || './data/default.json', // 경로
                    llm_model: "" // 모델 설정 불필요
                });
            }
        }
        // * 참고: 실제 로딩 UI 처리는 App.tsx의 소켓 리스너가 담당함
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
            inputMode={inputMode}
            setInputMode={setInputMode}
            fileInputRef={fileInputRef}
            serverFiles={serverFiles}
            selectedServerFileId={selectedServerFileId}
            setSelectedServerFileId={setSelectedServerFileId}
            handleFileChange={handleFileChange}
            handleFileDrop={handleFileDrop}
            handleDropzoneClick={handleDropzoneClick}
            handleRun={handleRun}
        />
    );
};