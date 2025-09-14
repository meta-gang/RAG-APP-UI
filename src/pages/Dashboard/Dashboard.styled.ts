// src/pages/Dashboard/Dashboard.styled.ts
import styled from 'styled-components';

export const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

export const GridContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

export const MainChartWrapper = styled.div`
  @media (min-width: 1024px) {
    grid-column: span 2 / span 2;
  }
`;

export const SidePanelWrapper = styled.div`
  @media (min-width: 1024px) {
    grid-column: span 1 / span 1;
  }
`;

export const ChartBox = styled.div`
  background-color: #1f2937; // bg-gray-800
  padding: 1rem;
  border-radius: 0.75rem; // rounded-xl
  border: 1px solid #374151; // border-gray-700
  height: 100%;
  display: flex;
  flex-direction: column;
`;

export const BoxHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

export const BoxTitle = styled.h2`
  font-size: 1.25rem; // text-xl
  font-weight: 600;
  color: #ffffff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const BoxTitleH3 = styled.h3`
  font-size: 1rem; // text-md
  font-weight: 600;
  color: #ffffff;
`;

export const IconButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  color: #9ca3af; // text-gray-400

  &:hover {
    color: #ffffff;
    background-color: #374151; // hover:bg-gray-700
  }
`;

export const ScrollableContent = styled.div`
  height: 370px;
  overflow-y: auto;
  padding-right: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem; // space-y-2
`;

export const QueryInfoText = styled.p`
  font-size: 0.75rem; // text-xs
  color: #9ca3af; // text-gray-400
  padding-bottom: 0.5rem;
`;

export const QueryItem = styled.div`
  background-color: #374151; // bg-gray-700
  padding: 0.75rem;
  border-radius: 0.5rem; // rounded-lg
`;

export const QueryText = styled.p`
  font-size: 0.875rem; // text-sm
  font-weight: 600;
  color: #67e8f9; // text-cyan-400
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

export const ScoreWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem; // text-xs
  margin-top: 0.25rem;
`;

export const MetricName = styled.span`
  color: #d1d5db; // text-gray-300
`;

export const ScoreText = styled.span`
  font-family: monospace;
  color: #ffffff;
`;

export const NoDataText = styled.p`
  color: #9ca3af; // text-gray-400
  text-align: center;
  padding-top: 2.5rem; // pt-10
`;

export const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

export const ZoomedViewContainer = styled.div`
    display: flex;
    gap: 1.5rem;
    flex-grow: 1;
    min-height: 0;
    height: 100%;
`;

export const ZoomedChartWrapper = styled.div`
    flex: 3;
`;

export const ZoomedQueryWrapper = styled.div`
    flex: 2;
    display: flex;
    flex-direction: column;
`;