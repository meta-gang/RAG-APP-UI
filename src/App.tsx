// 전체 애플리케이션의 진입점이자, 페이지를 전환하는 라우터(Router) 역할

import React, { useState } from 'react';
import { Header } from 'src/components/Header'; // Header 컴포넌트 분리
import { DashboardPage } from './pages/Dashboard';
import { TestQueryPage } from './pages/TestQuery';
import { SettingsPage } from './pages/Settings';

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
    <div className="bg-gray-900 text-white min-h-screen font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-screen-2xl mx-auto">
        <Header currentPage={currentPage} setCurrentPage={setCurrentPage} />
        <main className="mt-6">{renderPage()}</main>
      </div>
    </div>
  );
};

export default App;