/**
 * 스크롤 가능한 컨테이너 래퍼
 * @param children 내부 노드
 */

import { ReactNode } from 'react';
import { Container } from './ScrollBar.styled';

interface ScrollBarProps {
  children: ReactNode;
}

export const ScrollBar = ({ children }: ScrollBarProps) => {
  return (
    <Container>
      {children}
    </Container>
  );
};
