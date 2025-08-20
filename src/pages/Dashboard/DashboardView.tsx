// /src/pages/Dashboard/DashboardView.tsx

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Maximize2, ArrowLeft } from 'lucide-react';
import * as S from './Dashboard.styled'; // Styled-components import

// index.tsx 로부터 모든 상태와 핸들러 함수를 props로 내려받습니다.
interface DashboardViewProps {
  isZoomed: boolean;
  selectedBarMetric: string | null;
  selectedDate: string;
  selectedModule: string;
  zoomedFrequencyData: any[];
  modulePerformanceData: any[];
  handleDotClick: (payload: any) => void;
  handleFrequencyBarClick: (data: any) => void;
  moduleColors: string[];
  detailedQueryData: any[] | undefined;
  selectedScoreRange: [number, number] | null;
  metricDistributionData: any[];
  metricPerformanceBreakdownData: Record<string, any[]>;
  handleZoomClick: (metricName: string) => void;
  handleZoomOut: () => void;
}

// 이 컴포넌트는 props를 받아 화면을 그리는 역할만 합니다.
export const DashboardView: React.FC<DashboardViewProps> = ({
    isZoomed,
    selectedBarMetric,
    selectedDate,
    selectedModule,
    zoomedFrequencyData,
    modulePerformanceData,
    handleDotClick,
    handleFrequencyBarClick,
    moduleColors,
    detailedQueryData,
    selectedScoreRange,
    metricDistributionData,
    metricPerformanceBreakdownData,
    handleZoomClick,
    handleZoomOut,
}) => {
  return (
    <S.DashboardContainer>
      <S.GridContainer>
        <S.MainChartWrapper>
          <S.ChartBox>
            <S.BoxTitle>
              {isZoomed
                ? `[Zoomed] ${selectedBarMetric} Score Distribution on ${selectedDate}`
                : "RAG Performance Change"}
            </S.BoxTitle>
            <ResponsiveContainer width="100%" height={400}>
              {isZoomed ? (
                <BarChart data={zoomedFrequencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="range" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      borderColor: "#4B5563",
                    }}
                  />
                  <Bar dataKey="count" name="Query Count">
                    {zoomedFrequencyData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={moduleColors[index % moduleColors.length]}
                        cursor="pointer"
                        onClick={() => handleFrequencyBarClick(entry)}
                      />
                    ))}
                  </Bar>
                </BarChart>
              ) : (
                <LineChart data={modulePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[60, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      borderColor: "#4B5563",
                    }}
                  />
                  <Legend />
                  {Object.keys(modulePerformanceData[0] || {})
                    .filter((k) => k !== "date")
                    .map((moduleName, index) => (
                      <Line
                        key={moduleName}
                        type="monotone"
                        dataKey={moduleName}
                        stroke={moduleColors[index % moduleColors.length]}
                        strokeWidth={2}
                        activeDot={{ 
                            onClick: (e, payload) => handleDotClick(payload), 
                            r: 8, 
                            style: { cursor: 'pointer' } 
                        }}
                        connectNulls
                      />
                    ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </S.ChartBox>
        </S.MainChartWrapper>
        <S.SidePanelWrapper>
          <S.ChartBox>
            <S.BoxHeader>
              <S.BoxTitle title={isZoomed ? `Queries for ${selectedBarMetric}` : `${selectedModule} on ${selectedDate}`}>
                {isZoomed ? `Queries for ${selectedBarMetric}` : `${selectedModule} on ${selectedDate}`}
              </S.BoxTitle>
              {isZoomed && (
                <S.IconButton onClick={handleZoomOut}>
                  <ArrowLeft size={18} />
                </S.IconButton>
              )}
            </S.BoxHeader>
            {isZoomed ? (
              <S.ScrollableContent>
                <S.QueryInfoText>
                  Showing {detailedQueryData?.length || 0} queries with scores in
                  range:{" "}
                  {selectedScoreRange
                    ? `${selectedScoreRange[0]}-${selectedScoreRange[1]}`
                    : "All"}
                </S.QueryInfoText>
                {detailedQueryData?.map((q, i) => (
                  <S.QueryItem key={i}>
                    <S.QueryText title={q.query}>
                      Query: {q.query}
                    </S.QueryText>
                    <S.ScoreWrapper>
                      <S.MetricName>{selectedBarMetric}</S.MetricName>
                      <S.ScoreText>
                        {(q.score * 100).toFixed(1)}%
                      </S.ScoreText>
                    </S.ScoreWrapper>
                  </S.QueryItem>
                ))}
              </S.ScrollableContent>
            ) : (
              <S.ScrollableContent>
                {metricDistributionData.length > 0 ? (
                  metricDistributionData.map((metric) => (
                    <div key={metric.metricName}>
                      <S.BoxHeader>
                        <S.BoxTitleH3>
                          {metric.metricName}
                        </S.BoxTitleH3>
                        <S.IconButton
                          onClick={() => handleZoomClick(metric.metricName)}
                        >
                          <Maximize2 size={16} />
                        </S.IconButton>
                      </S.BoxHeader>
                      <ResponsiveContainer width="100%" height={100}>
                        <BarChart data={metric.data}>
                          <XAxis
                            dataKey="range"
                            stroke="#9CA3AF"
                            fontSize={10}
                            interval={1}
                            angle={-30}
                            textAnchor="end"
                            height={40}
                          />
                          <YAxis
                            stroke="#9CA3AF"
                            allowDecimals={false}
                            fontSize={10}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#1F2937",
                              borderColor: "#4B5563",
                              fontSize: 12,
                            }}
                          />
                          <Bar dataKey="count" fill={moduleColors[2]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ))
                ) : (
                  <S.NoDataText>
                    No metric data available for this module on this date.
                  </S.NoDataText>
                )}
              </S.ScrollableContent>
            )}
          </S.ChartBox>
        </S.SidePanelWrapper>
      </S.GridContainer>
      
      <div>
        <S.BoxTitle as="h2" style={{ marginBottom: '1rem' }}>
          Metric Performance Breakdown
        </S.BoxTitle>
        <S.GridContainer style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          {Object.entries(metricPerformanceBreakdownData).map(([metricName, data]) => (
            <S.ChartBox key={metricName}>
              <S.BoxTitleH3 style={{ marginBottom: '0.5rem' }}>
                {metricName}
              </S.BoxTitleH3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[80, 100]} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1F2937",
                      borderColor: "#4B5563",
                    }}
                  />
                  <Legend />
                  {Object.keys(data.reduce((acc, curr) => ({...acc, ...curr}), {})).filter(key => key !== 'date').map((moduleName, i) => (
                      <Line
                        key={moduleName}
                        type="monotone"
                        dataKey={moduleName}
                        stroke={moduleColors[i % moduleColors.length]}
                        strokeWidth={2}
                        connectNulls
                      />
                    ))}
                </LineChart>
              </ResponsiveContainer>
            </S.ChartBox>
          ))}
        </S.GridContainer>
      </div>
    </S.DashboardContainer>
  );
};