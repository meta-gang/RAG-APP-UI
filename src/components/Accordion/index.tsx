// src/components/Accordion/index.tsx
import React, { useState, ReactNode } from 'react';
import * as S from './Accordion.styled';
import { ChevronRight } from 'lucide-react';

interface AccordionProps {
  title: ReactNode; // 제목으로 JSX를 받을 수 있도록 ReactNode 타입 사용
  children: ReactNode;
}

export const Accordion: React.FC<AccordionProps> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false); // 아코디언 열림/닫힘 상태

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <S.AccordionWrapper>
      {/* 아코디언 헤더(제목). 클릭 시 toggleAccordion 함수 실행 */}
      <S.AccordionHeader onClick={toggleAccordion} aria-expanded={isOpen}>
        {title}
        <ChevronRight size={20} className="icon" />
      </S.AccordionHeader>
      {/* isOpen 상태가 true일 때만 콘텐츠 표시 */}
      {isOpen && <S.AccordionContent>{children}</S.AccordionContent>}
    </S.AccordionWrapper>
  );
};