// src/App.tsx
import React, { useEffect } from 'react';
import styled from 'styled-components';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Header } from '@components/Header';
import { DashboardPage } from './pages/Dashboard';
import { TestQueryPage } from './pages/TestQuery';
import { SettingsPage } from './pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';

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
 * 전역 레이아웃(헤더, 로딩 모달)을 렌더링하고 React Router를 이용한 라우팅을 관리합니다.
 * 또한 전역 소켓 이벤트 리스너를 등록하여 앱 전반의 상태 및 페이지 이동을 제어합니다.
 */
const App: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const setAppLoading = useSetRecoilState(appLoadingState);
  const setDashboardResult = useSetRecoilState(dashboardResultState);

  const currentPath = location.pathname.replace('/', '') || 'dashboard';

  /**
   * 컴포넌트 마운트 시 소켓을 연결하고 전역 이벤트 리스너를 등록합니다.
   */
  useEffect(() => {
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
     * RAG 실행 시작 이벤트(rag-on) 핸들러
     * 로딩 모달을 활성화하고 전체 쿼리 수를 설정합니다.
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
     * 개별 쿼리 완료 이벤트(ended-query) 핸들러
     * 진행률(완료된 쿼리 수)을 업데이트합니다.
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
     * 최종 결과 수신 이벤트(rag-result-data) 핸들러
     * 수신된 데이터를 변환하여 Recoil에 저장하고 대시보드 페이지로 이동합니다.
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

      navigate('/dashboard');
    };

    /**
     * 에러 이벤트 핸들러
     * 에러 발생 시 알림을 표시하고 로딩 상태를 해제합니다.
     */
    const handleError = (data: { topic: 'error'; message: string; [key: string]: any }) => {
      console.error('Socket RECV: error', data);
      alert(`[백엔드 오류]\n${data.message}`);
      setAppLoading((prev) => ({ ...prev, isLoading: false }));
    };

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
  }, [setAppLoading, setDashboardResult, navigate]);

  return (
    <>
      <GlobalStyle />
      <LoadingModal /> 
      
      <AppContainer>
        <Header />
        
        <MainContent>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/test" element={<TestQueryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </MainContent>
      </AppContainer>
    </>
  );
};

export default App;