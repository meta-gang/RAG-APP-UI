// src/App.tsx
import React, { useState, useEffect} from 'react';
import styled from 'styled-components';
import { Header } from '@components/Header';
import { DashboardPage } from './pages/Dashboard';
import { TestQueryPage } from './pages/TestQuery';
import { SettingsPage } from './pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { appLoadingState, AppLoadingState } from '@recoil/atoms';
import { LoadingModal } from '@components/LoadingModal'; // 방금 만든 모달 임포트
import { socket } from '@apis/socket'; // 문규님이 만든 소켓 인스턴스 임포트

const AppContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const MainContent = styled.main`
  margin-top: 1.5rem;
`;

const App: React.FC = () => {
const [currentPage, setCurrentPage] = useState("dashboard");
  
  // 2. Recoil 상태와 Setter 가져오기
  const isLoading = useRecoilValue(appLoadingState).isLoading;
  const setAppLoading = useSetRecoilState(appLoadingState);

  // 3. App 컴포넌트가 마운트될 때 소켓 연결 및 글로벌 리스너 등록
  useEffect(() => {
    // 소켓 연결
    socket.connect();
    
    // 구독할 토픽 리스트 (정우님 명세서 기반)
    // TestQuery 페이지와 중복 구독되어도 socket.ts가 핸들러를 배열로 관리하므로 괜찮습니다.
    const topicsToSubscribe = [
      'rag-on', 
      'ended-query', 
      'rag-result-data', 
      'error', 
      'rag-container', // TestQuery용
      'module-statu', // TestQuery용
      'generated-query-files' // LLM 질문 생성용
    ];
    socket.subscribe(topicsToSubscribe);

    // --- (핵심) 신규 비동기 플로우 핸들러 등록 ---

    // 2. "실행 시작" 메시지 핸들러
    const handleRagOn = (data: { topic: 'rag-on', ts: number, 'query-num': number }) => {
      console.log('Socket RECV: rag-on', data);
      setAppLoading({
        isLoading: true,
        message: 'RAG 평가 실행 시작...',
        totalQueries: data['query-num'],
        completedQueries: 0,
      });
    };

    // 3. "진행률" 메시지 핸들러
    const handleEndedQuery = (data: { topic: 'ended-query', ts: number, 'end-query': string }) => {
      console.log('Socket RECV: ended-query', data);
      setAppLoading((prev: AppLoadingState) => ({
        ...prev,
        completedQueries: prev.completedQueries + 1,
        message: '쿼리 처리 중...',
      }));
    };

    // 4. "최종 결과" 메시지 핸들러
    const handleRagResult = (data: any) => {
      console.log('Socket RECV: rag-result-data', data);
      
      // TODO: 수신된 data.storage를 Dashboard가 볼 수 있는 Recoil 상태에 저장해야 합니다.
      // (예: dashboardDataState atom을 새로 만들고 거기에 저장)
      
      // 로딩 모달 닫기
      setAppLoading({
        isLoading: false,
        message: '평가 완료!',
        totalQueries: 0,
        completedQueries: 0,
      });

      // Dashboard 페이지로 강제 이동
      // (TestQuery 페이지에서 온 결과일 수도 있으니,
      //  Settings 페이지에서만 이동하도록 플래그 관리가 필요할 수 있으나
      //  우선은 회의록대로 구현합니다.)
      setCurrentPage("dashboard");
    };

    // 5. 에러 핸들러
    const handleError = (data: any) => {
      console.error('Socket RECV: error', data);
      alert(`백엔드 에러 발생: ${data.message}`);
      // 에러 발생 시 로딩 모달 닫기
      setAppLoading((prev) => ({ ...prev, isLoading: false }));
    };

    // 리스너 등록
    socket.on('rag-on', handleRagOn);
    socket.on('ended-query', handleEndedQuery);
    socket.on('rag-result-data', handleRagResult);
    socket.on('error', handleError);

    // 컴포넌트 언마운트 시 리스너 해제
    return () => {
      socket.off('rag-on', handleRagOn);
      socket.off('ended-query', handleEndedQuery);
      socket.off('rag-result-data', handleRagResult);
      socket.off('error', handleError);
      // socket.disconnect(); // 앱 종료 시 연결 해제 (선택적)
    };
  }, [setAppLoading, setCurrentPage]); // 의존성 배열에 setter 추가

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
      {/* 4. 로딩 모달 렌더링 (isLoading 값에 따라 보였다/사라졌다 함) */}
      <LoadingModal /> 
      
      {/* 5. 앱 컨테이너 (로딩 중일 때도 헤더 등은 보임) */}
      <AppContainer>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <MainContent>{renderPage()}</MainContent>
      </AppContainer>
    </>
  );
};

export default App;