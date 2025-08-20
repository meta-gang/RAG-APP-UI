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
