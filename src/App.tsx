// src/App.tsx
import React, { useState, useEffect } from 'react'; // ⭐️ useEffect 임포트
import styled from 'styled-components';
import { Header } from '@components/Header';
import { DashboardPage } from './pages/Dashboard';
import { TestQueryPage } from './pages/TestQuery';
import { SettingsPage } from './pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';

// --- 🔽 [신규] Step 3 코드 ---
import { useSetRecoilState } from 'recoil';
import { appLoadingState, AppLoadingState, dashboardResultState } from '@recoil/atoms';
import { LoadingModal } from '@components/LoadingModal'; // ⭐️ 방금 만든 모달 임포트
import { socket } from '@apis/socket'; // ⭐️ 문규님 브랜치에서 병합한 소켓
import { EvaluationRun } from '@type/index'; // ⭐️ 타입 임포트
// ⭐️ Dashboard/index.tsx에 만들 transformData 함수를 임포트 (경로 주의)
import { transformData } from './pages/Dashboard/transformData'; 
// --- 🔼 [신규] Step 3 코드 ---

const AppContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const MainContent = styled.main`
  margin-top: 1.5rem;
`;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

  // --- 🔽 [신규] Step 3 코드 ---
  // Recoil 상태 Setter
  const setAppLoading = useSetRecoilState(appLoadingState);
  const setDashboardResult = useSetRecoilState(dashboardResultState);

  // App 컴포넌트가 마운트될 때 소켓 연결 및 글로벌 리스너 등록
  useEffect(() => {
    // 1. 소켓 연결
    socket.connect();
    
    // 2. 구독할 토픽 리스트 (정우님 명세서 기반)
    const topicsToSubscribe = [
      'rag-on',                   // ⭐️ 평가 실행 시작
      'ended-query',              // ⭐️ 평가 진행률
      'rag-result-data',          // ⭐️ 평가 최종 결과
      'error',                    // ⭐️ 공통 에러
      'rag-container',            // TestQuery용
      'module-statu',             // TestQuery용
      'generated-query-files'     // LLM 질문 생성용 (Settings)
    ];
    socket.subscribe(topicsToSubscribe);

    // --- 3. (핵심) 신규 비동기 플로우 핸들러 등록 ---

    // 3-1. "실행 시작" 메시지 핸들러
    const handleRagOn = (data: { topic: 'rag-on', ts: number, 'query-num': number }) => {
      console.log('Socket RECV: rag-on', data);
      setAppLoading({
        isLoading: true,
        message: 'RAG 평가 실행 시작...',
        totalQueries: data['query-num'], // ⭐️ 백엔드에서 받은 총 쿼리 수
        completedQueries: 0,
      });
    };

    // 3-2. "진행률" 메시지 핸들러
    const handleEndedQuery = (data: { topic: 'ended-query', ts: number, 'end-query': string }) => {
      console.log('Socket RECV: ended-query (완료된 쿼리 ID):', data['end-query']);
      setAppLoading((prev: AppLoadingState) => ({
        ...prev,
        completedQueries: prev.completedQueries + 1, // ⭐️ 완료된 쿼리 수 +1
        message: '쿼리 처리 중...',
      }));
    };

    // 3-3. "최종 결과" 메시지 핸들러
    const handleRagResult = (data: any) => {
      console.log('Socket RECV: rag-result-data', data);
      
      if (data.storage) {
        // ⭐️ 백엔드 JSON을 프론트엔드 타입(EvaluationRun)으로 변환
        const newRun: EvaluationRun = transformData(data.storage);
        
        // ⭐️ Recoil 상태 업데이트 (기존 데이터에 새 데이터 추가 또는 교체)
        setDashboardResult((prevRuns) => {
          // 예시: 날짜가 같으면 교체, 아니면 추가 (혹은 그냥 덮어쓰기)
          // 여기서는 단순하게 새 데이터 배열로 덮어씁니다.
          // (목업 데이터 + 새 데이터)
          // return [...prevRuns, newRun]; 
          
          // 여기서는 '새로 받은 1개의 결과'만 배열에 담아 표시하도록 합니다.
          return [newRun];
        });
      }
      
      // 로딩 모달 닫기
      setAppLoading({
        isLoading: false,
        message: '평가 완료!',
        totalQueries: 0,
        completedQueries: 0,
      });

      // Dashboard 페이지로 강제 이동
      setCurrentPage("dashboard");
    };

    // 3-4. 에러 핸들러
    const handleError = (data: { topic: 'error', message: string, [key: string]: any }) => {
      console.error('Socket RECV: error', data);
      alert(`[백엔드 오류]\n${data.message}`);
      // 에러 발생 시 로딩 모달 닫기
      setAppLoading((prev) => ({ ...prev, isLoading: false }));
    };

    // 4. 리스너 등록
    socket.on('rag-on', handleRagOn);
    socket.on('ended-query', handleEndedQuery);
    socket.on('rag-result-data', handleRagResult);
    socket.on('error', handleError);

    // 5. 컴포넌트 언마운트 시 리스너 해제 (메모리 누수 방지)
    return () => {
      socket.off('rag-on', handleRagOn);
      socket.off('ended-query', handleEndedQuery);
      socket.off('rag-result-data', handleRagResult);
      socket.off('error', handleError);
      // socket.disconnect(); // 앱을 끌 때까지 연결을 유지하는 것이 좋습니다.
    };
  }, [setAppLoading, setDashboardResult, setCurrentPage]); // ⭐️ 의존성 배열에 setter 추가
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
      {/* ⭐️ 6. 로딩 모달 렌더링 (isLoading 값에 따라 자동 표시/숨김) */}
      <LoadingModal /> 
      
      <AppContainer>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <MainContent>{renderPage()}</MainContent>
      </AppContainer>
    </>
  );
};

export default App;