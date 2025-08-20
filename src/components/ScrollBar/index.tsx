import { ReactNode } from 'react';
import { Container } from './ScrollBar.styled';

interface IScrollBar {
  children: ReactNode;
}

export const ScrollBar = ({ children }: IScrollBar) => {
  return (
    <Container>
      {children}
    </Container>
  );
};
