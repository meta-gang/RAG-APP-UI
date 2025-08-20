// src/pages/Settings/index.tsx

// 설정 페이지의 UI와 기능을 담당

import React, { useState, useRef } from 'react';
import { Upload, PlayCircle } from 'lucide-react';
import { existingQueries } from '../../data/mockData'; // 분리된 데이터 파일에서 가져오기

interface SettingsPageProps {
    setCurrentPage: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [querySource, setQuerySource] = useState<"manual" | "llm">("manual");
    const [llmOption, setLlmOption] = useState<"new" | "existing">("new");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
        setFiles(Array.from(event.target.files));
        }
    };

    const handleFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (event.dataTransfer.files) {
        setFiles(Array.from(event.dataTransfer.files));
        }
    };

    return (
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold text-white mb-6">
                Evaluation Settings
            </h2>
            <div className="space-y-8">
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                        Query Source
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <label className="flex flex-col p-4 bg-gray-700 rounded-lg cursor-pointer has-[:checked]:bg-indigo-900/50 has-[:checked]:border-indigo-500 border-2 border-transparent">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    name="query-source"
                                    value="manual"
                                    checked={querySource === "manual"}
                                    onChange={() => setQuerySource("manual")}
                                    className="form-radio h-4 w-4 text-indigo-600 bg-gray-900 border-gray-600 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-white">Manual Query Input</span>
                            </div>
                            <div
                                className={`mt-4 h-32 border-2 border-dashed border-gray-500 rounded-lg flex flex-col justify-center items-center text-gray-400 ${
                                    querySource !== "manual" && "opacity-50"
                                }`}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={handleFileDrop}
                                onClick={() =>
                                    querySource === "manual" && fileInputRef.current?.click()
                                }
                            >
                                <Upload size={24} className="mb-2" />
                                <p className="text-sm">Drag & drop files or click to browse</p>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    multiple
                                    className="hidden"
                                    disabled={querySource !== "manual"}
                                />
                            </div>
                            {files.length > 0 && querySource === "manual" && (
                                <div className="mt-2 text-xs text-gray-300">
                                    {files.map((f) => f.name).join(", ")}
                                </div>
                            )}
                        </label>
                        <label className="flex flex-col p-4 bg-gray-700 rounded-lg cursor-pointer has-[:checked]:bg-indigo-900/50 has-[:checked]:border-indigo-500 border-2 border-transparent">
                            <div className="flex items-center">
                                <input
                                    type="radio"
                                    name="query-source"
                                    value="llm"
                                    checked={querySource === "llm"}
                                    onChange={() => setQuerySource("llm")}
                                    className="form-radio h-4 w-4 text-indigo-600 bg-gray-900 border-gray-600 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-white">Generate with LLM</span>
                            </div>
                            <div
                                className={`mt-4 space-y-2 ${
                                    querySource !== "llm" && "opacity-50"
                                }`}
                            >
                                <label className="flex items-center text-sm text-gray-300">
                                    <input
                                        type="radio"
                                        name="llm-query-option"
                                        value="existing"
                                        checked={llmOption === "existing"}
                                        onChange={() => setLlmOption("existing")}
                                        className="form-radio h-3 w-3 text-indigo-600 bg-gray-800 border-gray-600"
                                        disabled={querySource !== "llm"}
                                    />
                                    <span className="ml-2">Use existing queries</span>
                                </label>
                                {llmOption === "existing" && (
                                    <select
                                        id="existing-query-select"
                                        className="w-full bg-gray-600 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                                    >
                                        {existingQueries.map((q) => (
                                            <option key={q}>{q}</option>
                                        ))}
                                    </select>
                                )}
                                <label className="flex items-center text-sm text-gray-300">
                                    <input
                                        type="radio"
                                        name="llm-query-option"
                                        value="new"
                                        checked={llmOption === "new"}
                                        onChange={() => setLlmOption("new")}
                                        className="form-radio h-3 w-3 text-indigo-600 bg-gray-800 border-gray-600"
                                        disabled={querySource !== "llm"}
                                    />
                                    <span className="ml-2">Generate new queries</span>
                                </label>
                                {llmOption === "new" && (
                                    <select
                                        id="llm-select"
                                        className="w-full bg-gray-600 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                                    >
                                        <option>LLaMON (meta-gang)</option>
                                        <option>GPT-4 (OpenAI)</option>
                                        <option>Gemini-Pro (Google)</option>
                                    </select>
                                )}
                            </div>
                        </label>
                    </div>
                </div>
                <div className="flex justify-end pt-4">
                    <button
                        onClick={() => setCurrentPage("dashboard")}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center transition-colors shadow-lg"
                    >
                        <PlayCircle size={16} className="mr-2" /> Run RAG & View Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
};