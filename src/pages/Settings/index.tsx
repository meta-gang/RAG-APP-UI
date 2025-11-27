// src/pages/Settings/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { SettingsView } from './SettingsView';
import { useRecoilValue } from 'recoil';
import { appLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';

/**
 * SettingsPage 컴포넌트
 *
 * RAG 평가를 위한 설정을 관리하는 페이지입니다.
 * 파일 업로드 또는 서버 파일 선택을 통해 평가를 시작할 수 있습니다.
 */
export const SettingsPage: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    
    const [inputMode, setInputMode] = useState<'upload' | 'server'>('upload');
    
    const [files, setFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [serverFiles, setServerFiles] = useState<any[]>([]);
    const [selectedServerFileId, setSelectedServerFileId] = useState<string>('');

    /**
     * 페이지 진입 시 서버에 저장된 쿼리 파일 목록을 요청하고 수신합니다.
     */
    useEffect(() => {
        const handleExistingQueries = (data: any) => {
            if (data.topic === 'existing-queries') {
                setServerFiles(data.queries || []);
                if (data.queries && data.queries.length > 0) {
                    setSelectedServerFileId(data.queries[0].id);
                }
            }
        };
        
        socket.on('existing-queries', handleExistingQueries);
        socket.send({ topic: 'get-existing-queries' });
        
        return () => {
            socket.off('existing-queries', handleExistingQueries);
        };
    }, []);

    const globalLoadingState = useRecoilValue(appLoadingState);
    const isRunning = globalLoadingState.isLoading;
    const progress = globalLoadingState.totalQueries > 0
        ? Math.floor((globalLoadingState.completedQueries / globalLoadingState.totalQueries) * 100)
        : 0;
    const progressMessage = globalLoadingState.totalQueries > 0
        ? `${globalLoadingState.message} (${globalLoadingState.completedQueries}/${globalLoadingState.totalQueries})`
        : globalLoadingState.message;

    /**
     * 선택된 파일들을 백엔드로 업로드합니다.
     * @param files 업로드할 파일 배열
     * @returns 서버에 저장된 파일명 배열 또는 null
     */
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

    /**
     * 다음 단계로 이동하거나 실행을 트리거합니다.
     */
    const handleNextStep = () => {
        if (step === 2) {
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
        if (inputMode === 'upload') {
            fileInputRef.current?.click();
        }
    };
    
    /**
     * RAG 평가 실행 요청을 소켓으로 전송합니다.
     * 업로드 모드인 경우 파일을 먼저 업로드한 후 실행 요청을 보냅니다.
     */
    const handleRun = async () => {
        console.log("Running RAG evaluation:", { inputMode, files, selectedServerFileId });

        if (inputMode === 'upload' && files.length > 0) {
            const uploadedFiles = await uploadFiles(files);
            if (uploadedFiles) {
                socket.sendFileQuery(uploadedFiles);
            }
        } else if (inputMode === 'server') {
            const selectedFile = serverFiles.find(f => f.id === selectedServerFileId);
            if (selectedFile) {
                const targetFileName = selectedFile.fileName || selectedFile.id || 'default.txt';
                
                socket.sendLLMQuery({
                    file_name: targetFileName
                });
            }
        }
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