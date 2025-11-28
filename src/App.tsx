// src/App.tsx
import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Header } from '@components/Header';
import { DashboardPage } from '@pages/Dashboard';
import { TestQueryPage } from '@pages/TestQuery';
import { SettingsPage } from '@pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';
import { socket } from '@apis/socket';

/**
 * 메인 앱 컴포넌트
 * 전역 소켓 연결 및 라우팅을 정의합니다.
 */
const App = () => {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

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