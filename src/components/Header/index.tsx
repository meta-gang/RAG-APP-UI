// src/components/Header/index.tsx
import React from 'react';
import { HeaderContainer, TitleWrapper, Title, Subtitle, Nav, NavItem } from './Header.styled';

/**
 * 상단 헤더 컴포넌트
 *
 * 앱의 제목과 주요 페이지 네비게이션을 제공합니다.
 * React Router의 NavLink를 사용하여 페이지 이동을 처리합니다.
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
        <NavItem to="/settings">Settings</NavItem>
      </Nav>
    </HeaderContainer>
  );
};