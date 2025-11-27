import React, { useEffect } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import { Header } from '@components/Header';
import { DashboardPage } from '@pages/Dashboard';
import { TestQueryPage } from '@pages/TestQuery';
import { SettingsPage } from '@pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';
import { socket } from '@apis/socket';

const App = () => {
  /**
   * 앱 초기화 시 소켓 연결을 수행합니다.
   * 페이지 이동 시에도 연결이 끊기지 않고 유지됩니다.
   */
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
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
      </div>
    </>
  );
};

export default App;