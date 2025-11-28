// src/components/Header/index.tsx
import React from 'react';
import { HeaderContainer, TitleWrapper, Title, Subtitle, Nav, NavItem } from './Header.styled';

/**
 * 상단 헤더 컴포넌트
 *
 * 앱의 제목과 주요 페이지 네비게이션을 제공합니다.
 * 'Settings' 메뉴명이 'Run Queries'로 변경되었습니다.
 */
export const Header: React.FC = () => {
  return (
    <HeaderContainer>
      <TitleWrapper>
        <Title>RAG Evaluation Platform</Title>
        <Subtitle>On-Premise Document AI Performance Analysis</Subtitle>
      </TitleWrapper>
      <Nav>
        <NavItem to="/dashboard">Dashboard</NavItem>
        <NavItem to="/test">Test Query</NavItem>
        {/* [수정] 경로를 /run-queries로 변경 */}
        <NavItem to="/run-queries">Run Queries</NavItem>
      </Nav>
    </HeaderContainer>
  );
};