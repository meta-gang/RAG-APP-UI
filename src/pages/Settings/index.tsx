// /src/pages/Settings/index.tsx

import React, { useState, useRef } from 'react';
import { existingQueries } from '../../data/mockData';
import { SettingsView } from './SettingsView';

interface SettingsPageProps {
    setCurrentPage: (page: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ setCurrentPage }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [querySource, setQuerySource] = useState<'manual' | 'llm'>("manual");
    const [llmOption, setLlmOption] = useState<'new' | 'existing'>("new");
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
    
    const handleDropzoneClick = () => {
        if (querySource === 'manual') {
            fileInputRef.current?.click();
        }
    };
    
    const handleRun = () => {
        // 여기에 실제 실행 로직을 추가할 수 있습니다.
        // 예를 들어, 파일을 업로드하거나 LLM 생성을 요청하는 API 호출 등
        console.log("Running RAG evaluation with settings:", {
            querySource,
            llmOption,
            files
        });
        setCurrentPage("dashboard");
    };

    return (
        <SettingsView
            files={files}
            querySource={querySource}
            llmOption={llmOption}
            fileInputRef={fileInputRef}
            existingQueries={existingQueries}
            handleFileChange={handleFileChange}
            handleFileDrop={handleFileDrop}
            setQuerySource={setQuerySource}
            setLlmOption={setLlmOption}
            handleRun={handleRun}
            handleDropzoneClick={handleDropzoneClick}
        />
    );
};