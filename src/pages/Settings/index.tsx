// 설정 페이지의 UI와 기능을 담당

import React, { useState, useRef } from 'react';
import { Upload, PlayCircle } from 'lucide-react';
import { existingQueries } from '../../data/mockData'; // 데이터 분리

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
            {/* ... 여기에 SettingsPage의 JSX 코드를 붙여넣습니다 ... */}
        </div>
    );
};