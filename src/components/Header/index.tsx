// src/components/Header/index.tsx
import React from 'react';
import { HeaderContainer, TitleWrapper, Title, Subtitle, Nav, NavButton } from './Header.styled';

interface HeaderProps {
    currentPage: string;
    setCurrentPage: (page: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, setCurrentPage }) => (
    <HeaderContainer>
        <TitleWrapper>
            <Title>RAG Evaluation Platform</Title>
            <Subtitle>On-Premise Document AI Performance Analysis</Subtitle>
        </TitleWrapper>
        <Nav>
            <NavButton
                onClick={() => setCurrentPage("dashboard")}
                isActive={currentPage === "dashboard"}
            >
                Dashboard
            </NavButton>
            <NavButton
                onClick={() => setCurrentPage("test")}
                isActive={currentPage === "test"}
            >
                Test Query
            </NavButton>
            <NavButton
                onClick={() => setCurrentPage("settings")}
                isActive={currentPage === "settings"}
            >
                Settings
            </NavButton>
        </Nav>
    </HeaderContainer>
);