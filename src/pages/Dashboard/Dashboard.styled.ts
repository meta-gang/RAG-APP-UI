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

// ✨ [추가] KPI 카드 캐러셀을 위한 스타일
export const KpiCardWrapper = styled.div`
  position: relative; // 화살표 버튼의 기준점이 되도록 설정
  
  // Swiper 컨테이너의 기본 스타일
  // sm- 640px 이상일 때만 좌우 화살표 공간 확보
  @media (min-width: 640px) {
    .swiper-container {
      padding: 0 2.5rem;
    }
  }

  // Swiper 슬라이드 아이템 스타일
  .swiper-slide {
    width: auto; // 콘텐츠 크기에 맞게 너비 조절
  }
`;

// ✨ [추가] 캐러셀 좌우 화살표 버튼 스타일
export const CarouselArrow = styled.button`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: none; // 모바일에서는 기본적으로 숨김
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background-color 0.2s;

  // sm- 640px 이상일 때만 버튼을 보여줌
  @media (min-width: 640px) {
    display: flex;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
  }

  // disabled 상태일 때 (더 이상 넘길 수 없을 때)
  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  // 왼쪽, 오른쪽 버튼 위치 지정
  &.arrow-left {
    left: 0;
  }

  &.arrow-right {
    right: 0;
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