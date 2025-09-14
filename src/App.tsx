// src/App.tsx
import React, { useState } from 'react';
import styled from 'styled-components';
import { Header } from '@components/Header';
import { DashboardPage } from './pages/Dashboard';
import { TestQueryPage } from './pages/TestQuery';
import { SettingsPage } from './pages/Settings';
import { GlobalStyle } from '@styles/GlobalStyle';

const AppContainer = styled.div`
  max-width: 1600px;
  margin: 0 auto;
`;

const MainContent = styled.main`
  margin-top: 1.5rem;
`;

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState("dashboard");

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
      <AppContainer>
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <MainContent>{renderPage()}</MainContent>
      </AppContainer>
    </>
  );
};

export default App;