// src/pages/Settings/index.tsx
import React, { useState, useEffect } from 'react';
import { SettingsView } from './SettingsView';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { appLoadingState, AppLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';

/**
 * SettingsPage 컴포넌트
 *
 * RAG 평가를 위한 설정을 관리하는 페이지입니다.
 * 파일 업로드 또는 서버 파일 선택을 통해 평가를 시작할 수 있습니다.
 */
export const SettingsPage: React.FC = () => {
    const [step, setStep] = useState<number>(1);
    
    const [inputMode, setInputMode] = useState<'llm-generated' | 'custom'>('llm-generated');

    const [serverFiles, setServerFiles] = useState<string[]>([]);
    const [selectedFileName, setSelectedFileName] = useState<string>('');

    const setAppLoading = useSetRecoilState(appLoadingState);
    /**
     * 페이지 진입 시 소켓 연결 및 파일 목록 수신 핸들러 등록
     */
    useEffect(() => {
        socket.connect();
        
        const handleGeneratedQueryFiles = (data: any) => {
            if (data.topic === 'generated-query-files' && data.files) {
                setServerFiles(data.files);
                if (data.files.length > 0) {
                    setSelectedFileName(data.files[0]);
                }
            }
        };
        
        const handleCustomQueryFiles = (data: any) => {
            if (data.topic === 'custom-query-files' && data.files) {
                setServerFiles(data.files);
                if (data.files.length > 0) {
                    setSelectedFileName(data.files[0]);
                }
            }
        };

        const handleRagOn = (data: any) => {
            if (data.topic === 'rag-on') {
                setAppLoading(prev => ({
                    ...prev,
                    isLoading: true,
                    message: 'RAG Evaluation Running...',
                    totalQueries: data['query-num'] || 0,
                    completedQueries: 0
                }));
            }
        };

        const handleEndedQuery = (data: any) => {
            if (data.topic === 'ended-query') {
                setAppLoading((prev: AppLoadingState) => ({
                    ...prev,
                    completedQueries: prev.completedQueries + 1
                }));
            }
        };

        const handleRagResultData = (data: any) => {
             if (data.topic === 'rag-result-data') {
                setTimeout(() => {
                    setAppLoading((prev: AppLoadingState) => ({
                        ...prev,
                        isLoading: false,
                        message: 'Completed',
                        completedQueries: prev.totalQueries 
                    }));
                }, 1000);
             }
        };
        socket.subscribe(['generated-query-files', 'custom-query-files', 'rag-on', 'ended-query', 'rag-result-data']);
        
        socket.on('generated-query-files', handleGeneratedQueryFiles);
        socket.on('custom-query-files', handleCustomQueryFiles);
        socket.on('rag-on', handleRagOn);
        socket.on('ended-query', handleEndedQuery);
        socket.on('rag-result-data', handleRagResultData);
        
        return () => {
            socket.off('generated-query-files', handleGeneratedQueryFiles);
            socket.off('custom-query-files', handleCustomQueryFiles);
            socket.off('rag-on', handleRagOn);
            socket.off('ended-query', handleEndedQuery);
            socket.off('rag-result-data', handleRagResultData);
        };
    }, [setAppLoading]);

    const globalLoadingState = useRecoilValue(appLoadingState);
    const isRunning = globalLoadingState.isLoading;
    const progress = globalLoadingState.totalQueries > 0
        ? Math.floor((globalLoadingState.completedQueries / globalLoadingState.totalQueries) * 100)
        : 0;
    const progressMessage = globalLoadingState.totalQueries > 0
        ? `${globalLoadingState.message} (${globalLoadingState.completedQueries}/${globalLoadingState.totalQueries})`
        : globalLoadingState.message;

    /**
     * 다음 단계로 이동하거나 실행을 트리거합니다.
     * Step 1에서는 선택된 옵션에 따라 백엔드에 메시지를 전송합니다.
     */
    const handleNextStep = () => {
        if (step === 1) {
            // Step 1: 선택된 옵션에 따라 백엔드에 메시지 전송
            setServerFiles([]);
            setSelectedFileName('');
            setStep(prev => prev + 1);
        } else if (step === 2) {
            handleRun();
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handlePrevStep = () => {
        setStep(prev => prev - 1);
    };
    
    /**
     * RAG 평가 실행 요청을 소켓으로 전송합니다.
     * LLM Generated: run-rag-llm-query
     * Custom: run-rag-file-query
     */
    const handleRun = () => {
        console.log("Running RAG evaluation:", { inputMode, selectedFileName });

        if (!selectedFileName) {
            console.error('No file selected');
            return;
        }

        if (inputMode === 'llm-generated') {
            socket.send({
                topic: 'run-rag-llm-query',
                settings: {
                    file_name: selectedFileName
                }
            });
        } else if (inputMode === 'custom') {
            socket.send({
                topic: 'run-rag-file-query',
                settings: {
                    file_name: selectedFileName
                }
            });
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
            inputMode={inputMode}
            setInputMode={setInputMode}
            serverFiles={serverFiles}
            selectedFileName={selectedFileName}
            setSelectedFileName={setSelectedFileName}
        />
    );
};