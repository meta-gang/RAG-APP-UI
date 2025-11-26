// src/App.tsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { Header } from '@components/Header';
import { DashboardPage } from './pages/Dashboard';
import { TestQueryPage } from './pages/TestQuery';
import { SettingsPage } from './pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';

/**
 * 전역 상태/소켓 관련 임포트 및 유틸
 * - 전역 로딩 상태, 대시보드 결과 업데이트를 위한 Recoil setter 사용
 * - 소켓 메시지 수신으로 앱 로딩 상태 및 대시보드 결과를 갱신
 */
import { useSetRecoilState } from 'recoil';
import { appLoadingState, AppLoadingState, dashboardResultState } from '@recoil/atoms';
import { LoadingModal } from '@components/LoadingModal';
import { socket } from '@apis/socket';
import { EvaluationRun } from '@type/index';
import { transformData } from './pages/Dashboard/transformData';

const AppContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const MainContent = styled.main`
  margin-top: 1.5rem;
`;

/**
 * App 루트 컴포넌트
 *
 * 전역 소켓 연결을 설정하고 rag 관련 토픽에 대한 리스너를 등록하여
 * 전역 로딩 상태 및 대시보드 결과를 Recoil 상태로 업데이트합니다.
 */
const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // --- 🔽 [신규] Step 3 코드 ---
  // Recoil 상태 Setter
  const setAppLoading = useSetRecoilState(appLoadingState);
  const setDashboardResult = useSetRecoilState(dashboardResultState);

  /**
   * 컴포넌트 마운트 시 소켓 연결 및 이벤트 리스너 등록
   * - rag-on: 실행 시작 처리
   * - ended-query: 진행률 업데이트
   * - rag-result-data: 최종 결과 수신 및 변환
   * - error: 백엔드 에러 처리
   */
  useEffect(() => {
    // 소켓 연결 및 구독
    socket.connect();
    const topicsToSubscribe = [
      'rag-on',
      'ended-query',
      'rag-result-data',
      'error',
      'rag-container',
      'module-statu',
      'generated-query-files'
    ];
    socket.subscribe(topicsToSubscribe);

    /**
     * rag-on 이벤트 핸들러
     * @param data { topic, ts, 'query-num' }
     */
    const handleRagOn = (data: { topic: 'rag-on'; ts: number; 'query-num': number }) => {
      console.log('Socket RECV: rag-on', data);
      setAppLoading({
        isLoading: true,
        message: 'RAG 평가 실행 시작...',
        totalQueries: data['query-num'],
        completedQueries: 0,
      });
    };

    /**
     * ended-query 이벤트 핸들러
     * @param data { topic, ts, 'end-query' }
     */
    const handleEndedQuery = (data: { topic: 'ended-query'; ts: number; 'end-query': string }) => {
      console.log('Socket RECV: ended-query (완료된 쿼리 ID):', data['end-query']);
      setAppLoading((prev: AppLoadingState) => ({
        ...prev,
        completedQueries: prev.completedQueries + 1,
        message: '쿼리 처리 중...',
      }));
    };

    /**
     * rag-result-data 이벤트 핸들러
     * @param data 백엔드에서 전달된 결과 페이로드
     */
    const handleRagResult = (data: any) => {
      console.log('Socket RECV: rag-result-data', data);
      if (data.storage) {
        const newRun: EvaluationRun = transformData(data.storage);
        setDashboardResult(() => [newRun]);
      }
      setAppLoading({
        isLoading: false,
        message: '평가 완료!',
        totalQueries: 0,
        completedQueries: 0,
      });
      setCurrentPage('dashboard');
    };

    /**
     * error 이벤트 핸들러
     * @param data 오류 페이로드
     */
    const handleError = (data: { topic: 'error'; message: string; [key: string]: any }) => {
      console.error('Socket RECV: error', data);
      alert(`[백엔드 오류]\n${data.message}`);
      setAppLoading((prev) => ({ ...prev, isLoading: false }));
    };

    // 리스너 등록
    socket.on('rag-on', handleRagOn);
    socket.on('ended-query', handleEndedQuery);
    socket.on('rag-result-data', handleRagResult);
    socket.on('error', handleError);

    return () => {
      socket.off('rag-on', handleRagOn);
      socket.off('ended-query', handleEndedQuery);
      socket.off('rag-result-data', handleRagResult);
      socket.off('error', handleError);
    };
  }, [setAppLoading, setDashboardResult, setCurrentPage]);
  // --- 🔼 [신규] Step 3 코드 ---

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage />;
      case "test":
        return <TestQueryPage />;
      case "settings":
        return <SettingsPage setCurrentPage={setCurrentPage} />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <>
      <GlobalStyle />
      {/* 로딩 모달: 전역 isLoading 상태에 따라 표시됩니다. */}
      <LoadingModal /> 
      
      <AppContainer>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <MainContent>{renderPage()}</MainContent>
      </AppContainer>
    </>
  );
};

export default App;