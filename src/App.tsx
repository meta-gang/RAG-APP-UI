// src/App.tsx
import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Header } from '@components/Header';
import { DashboardPage } from '@pages/Dashboard';
import { TestQueryPage } from '@pages/TestQuery';
import { SettingsPage } from '@pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';
import { socket } from '@apis/socket';
import { useSetRecoilState } from 'recoil';
import { dashboardResultState } from './globals/recoil/atoms';
import { transformData } from './pages/Dashboard/transformData';

/**
 * 메인 앱 컴포넌트
 * 전역 소켓 연결 및 라우팅을 정의합니다.
 */
const App = () => {
  const setRuns = useSetRecoilState(dashboardResultState);
  useEffect(() => {
    const receive = (data: any) => {
      if (!data.storage?.states) return;
      const run = transformData({ ...data.storage, ts: data.run_id || data.ts, persisted: data.persisted });
      setRuns((previous) =>
        [...previous.filter((r) => r.runId !== run.runId), run].sort((a, b) => a.date.localeCompare(b.date)),
      );
    };
    socket.on('rag-result-data', receive);
    socket.subscribe(['rag-result-data']);
    socket.connect();

    return () => {
      socket.off('rag-result-data', receive);
      socket.disconnect();
    };
  }, [setRuns]);

  return (
    <>
      <GlobalStyle />
      <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
        <Header />
        <main>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/test" element={<TestQueryPage />} />
            <Route path="/run-queries" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default App;
