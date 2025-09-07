// src/components/Accordion/Accordion.styled.ts
import styled from 'styled-components';

export const AccordionWrapper = styled.div`
  background-color: #374151; // bg-gray-700
  border-radius: 0.5rem; // rounded-lg
  margin-bottom: 0.5rem;
`;

export const AccordionHeader = styled.button`
  width: 100%;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: transparent;
  border: none;
  color: #ffffff;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  text-align: left;

  .icon {
    transition: transform 0.2s ease-in-out;
  }

  &[aria-expanded='true'] .icon {
    transform: rotate(90deg);
  }
`;

export const AccordionContent = styled.div`
  padding: 0 1rem 1rem 1rem;
  border-top: 1px solid #4b5563; // border-gray-600
`;