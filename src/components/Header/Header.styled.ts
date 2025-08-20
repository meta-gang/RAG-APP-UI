// src/components/Header/Header.styled.ts
import styled from 'styled-components';

export const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #374151; // border-gray-700

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

export const TitleWrapper = styled.div``;

export const Title = styled.h1`
  font-size: 1.875rem; // text-3xl
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #ffffff;
`;

export const Subtitle = styled.p`
  margin-top: 0.25rem;
  color: #9ca3af; // text-gray-400
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem; // space-x-2
  margin-top: 1rem;
  border-radius: 0.5rem; // rounded-lg
  background-color: #1f2937; // bg-gray-800
  padding: 0.25rem;
  border: 1px solid #374151; // border-gray-700

  @media (min-width: 640px) {
    margin-top: 0;
  }
`;

interface NavButtonProps {
  isActive: boolean;
}

export const NavButton = styled.button<NavButtonProps>`
  padding: 0.5rem 1rem;
  font-size: 0.875rem; // text-sm
  font-weight: 600;
  border-radius: 0.375rem; // rounded-md
  transition: color 0.2s, background-color 0.2s;
  background-color: ${(props) => (props.isActive ? '#4f46e5' : 'transparent')}; // bg-indigo-600
  color: ${(props) => (props.isActive ? '#ffffff' : '#9ca3af')}; // text-white or text-gray-400

  &:hover {
    background-color: ${(props) => (props.isActive ? '#4f46e5' : '#374151')}; // hover:bg-gray-700
  }
`;