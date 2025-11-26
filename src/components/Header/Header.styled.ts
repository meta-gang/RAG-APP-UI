// src/components/Header/Header.styled.ts
import styled from 'styled-components';
import { NavLink } from 'react-router-dom'; 

/**
 * 헤더 전체 레이아웃 컨테이너
 */
export const HeaderContainer = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #374151;

  @media (min-width: 640px) {
    flex-direction: row;
    align-items: center;
  }
`;

/**
 * 타이틀 영역 래퍼
 */
export const TitleWrapper = styled.div``;

/**
 * 메인 타이틀 스타일
 */
export const Title = styled.h1`
  font-size: 1.875rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #ffffff;
`;

/**
 * 서브 타이틀 스타일
 */
export const Subtitle = styled.p`
  margin-top: 0.25rem;
  color: #9ca3af;
`;

/**
 * 네비게이션 메뉴 컨테이너
 */
export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  border-radius: 0.5rem;
  background-color: #1f2937;
  padding: 0.25rem;
  border: 1px solid #374151;

  @media (min-width: 640px) {
    margin-top: 0;
  }
`;

/**
 * 네비게이션 링크 아이템 (NavLink 사용)
 *
 * - react-router-dom의 NavLink를 스타일링합니다.
 * - 활성화 상태일 때 자동으로 'active' 클래스가 적용되므로 &.active로 스타일을 지정합니다.
 */
export const NavItem = styled(NavLink)`
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 600;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  text-decoration: none; /* 링크 밑줄 제거 */
  
  transition: color 0.2s, background-color 0.2s;
  
  /* 기본 상태 (비활성) */
  background-color: transparent;
  color: #9ca3af;

  /* 호버 효과 */
  &:hover {
    background-color: #374151;
    color: #ffffff;
  }

  /* 활성화 상태 (현재 페이지일 때) */
  &.active {
    background-color: #4f46e5;
    color: #ffffff;
  }
`;