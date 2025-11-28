// src/pages/Settings/index.tsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { appLoadingState, AppLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';
import { SettingsView } from './SettingsView';

/**
 * Run Queries (Settings) 페이지 컴포넌트
 *
 * LLM 생성 쿼리 및 커스텀 쿼리 파일 목록을 관리하고 실행을 요청합니다.
 * 소켓 리스너와 상태 관리를 분리하여 데이터 수신 안정성을 높였습니다.
 */
export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(1);
  const [inputMode, setInputMode] = useState<'llm-generated' | 'custom'>('llm-generated');

  // [수정] 파일 목록 상태 분리 (데이터 섞임 방지)
  const [generatedFiles, setGeneratedFiles] = useState<string[]>([]);
  const [customFiles, setCustomFiles] = useState<string[]>([]);
  
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const setAppLoading = useSetRecoilState(appLoadingState);

  /**
   * 소켓 이벤트 리스너 등록 (마운트 시 1회만 실행)
   * 의존성 배열을 비워두어 리스너가 재등록되지 않도록 함.
   */
  useEffect(() => {
    socket.subscribe(['generated-query-files', 'custom-query-files', 'rag-on', 'ended-query', 'rag-result-data']);

    const handleGeneratedQueryFiles = (data: any) => {
      if (data.topic === 'generated-query-files' && Array.isArray(data.files)) {
        console.log('✅ [Settings] Loaded Generated Files:', data.files);
        setGeneratedFiles(data.files);
      }
    };

    const handleCustomQueryFiles = (data: any) => {
      if (data.topic === 'custom-query-files' && Array.isArray(data.files)) {
        console.log('✅ [Settings] Loaded Custom Files:', data.files);
        setCustomFiles(data.files);
      }
    };

    const handleRagOn = (data: any) => {
      if (data.topic === 'rag-on') {
        setAppLoading((prev: AppLoadingState) => ({
          ...prev,
          isLoading: true,
          message: 'RAG Evaluation Running...',
          totalQueries: data['query-num'] || 0,
          completedQueries: 0,
        }));
      }
    };

    const handleEndedQuery = (data: any) => {
      if (data.topic === 'ended-query') {
        setAppLoading((prev: AppLoadingState) => ({
          ...prev,
          completedQueries: prev.completedQueries + 1,
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
            completedQueries: prev.totalQueries,
          }));
          navigate('/dashboard');
        }, 1000);
      }
    };

    socket.on('generated-query-files', handleGeneratedQueryFiles);
    socket.on('custom-query-files', handleCustomQueryFiles);
    socket.on('rag-on', handleRagOn);
    socket.on('ended-query', handleEndedQuery);
    socket.on('rag-result-data', handleRagResultData);

    // 초기 데이터 요청 (약간의 지연 후)
    const timer = setTimeout(() => {
        console.log('🚀 [Settings] Requesting file lists...');
        socket.send({ topic: 'generated-query-files' });
        socket.send({ topic: 'custom-query-files' });
    }, 300);

    return () => {
      socket.off('generated-query-files', handleGeneratedQueryFiles);
      socket.off('custom-query-files', handleCustomQueryFiles);
      socket.off('rag-on', handleRagOn);
      socket.off('ended-query', handleEndedQuery);
      socket.off('rag-result-data', handleRagResultData);
      clearTimeout(timer);
    };
  }, [setAppLoading, navigate]);

  /**
   * 탭 변경 시 선택된 파일 초기화 및 해당 목록 재요청
   */
  useEffect(() => {
    setSelectedFileName('');
    
    // 탭을 바꿀 때마다 최신 목록을 다시 달라고 요청 (데이터 싱크 맞춤)
    if (inputMode === 'llm-generated') {
        socket.send({ topic: 'generated-query-files' });
    } else {
        socket.send({ topic: 'custom-query-files' });
    }
  }, [inputMode]);

  // 현재 모드에 따라 보여줄 파일 목록 결정
  const currentFileList = useMemo(() => {
      return inputMode === 'llm-generated' ? generatedFiles : customFiles;
  }, [inputMode, generatedFiles, customFiles]);

  // 파일 목록이 변경되거나 탭이 바뀌면 첫 번째 파일 자동 선택 (편의성)
  useEffect(() => {
      if (currentFileList.length > 0 && !selectedFileName) {
          setSelectedFileName(currentFileList[0]);
      }
  }, [currentFileList, selectedFileName]);


  const globalLoadingState = useRecoilValue(appLoadingState);
  const isRunning = globalLoadingState.isLoading;
  const progress = globalLoadingState.totalQueries > 0
      ? Math.floor((globalLoadingState.completedQueries / globalLoadingState.totalQueries) * 100)
      : 0;
  const progressMessage = globalLoadingState.totalQueries > 0
      ? `${globalLoadingState.message} (${globalLoadingState.completedQueries}/${globalLoadingState.totalQueries})`
      : globalLoadingState.message;

  const handleNextStep = () => {
    if (step === 1) {
      // 스텝 이동 시 선택 파일 초기화는 하지 않음 (위 useEffect에서 처리)
      setStep((prev) => prev + 1);
    } else if (step === 2) {
      handleRun();
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleRun = () => {
    if (!selectedFileName) {
      console.error('No file selected');
      return;
    }

    const topic = inputMode === 'llm-generated' ? 'run-rag-llm-query' : 'run-rag-file-query';
    socket.send({
        topic: topic,
        settings: { file_name: selectedFileName },
    });
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
      serverFiles={currentFileList}
      selectedFileName={selectedFileName}
      setSelectedFileName={setSelectedFileName}
    />
  );
};