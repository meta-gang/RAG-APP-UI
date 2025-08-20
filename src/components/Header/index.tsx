import React from 'react';

interface HeaderProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => (
    <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-4 border-b border-gray-700">
        <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
            RAG Evaluation Platform
        </h1>
        <p className="text-gray-400 mt-1">
            On-Premise Document AI Performance Analysis
        </p>
        </div>
        <nav className="flex items-center space-x-2 mt-4 sm:mt-0 rounded-lg bg-gray-800 p-1 border border-gray-700">
        <button
            onClick={() => setCurrentPage("dashboard")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            currentPage === "dashboard"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
        >
            Dashboard
        </button>
        <button
            onClick={() => setCurrentPage("test")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            currentPage === "test"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
        >
            Test Query
        </button>
        <button
            onClick={() => setCurrentPage("settings")}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            currentPage === "settings"
                ? "bg-indigo-600 text-white"
                : "text-gray-400 hover:bg-gray-700"
            }`}
        >
            Settings
        </button>
        </nav>
    </header>
);