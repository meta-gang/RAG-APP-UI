import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Expand, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import * as S from './Dashboard.styled';
import { KPICard } from '../../components/KPICard';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import type {
  DiagnosticInference,
  DiagnosticObservation,
  EvaluatorHealth,
} from '../../globals/types';

interface DashboardViewProps {
  kpiData: {
    overallScore: string;
    performanceChange: { value: string; isPositive: boolean; };
    worstModule: string;
    evaluatorCoverage: string;
  };
  zoomedMetric: string | null;
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
  allModuleNames: string[];
  evaluatorHealth?: EvaluatorHealth;
  diagnosticObservations: DiagnosticObservation[];
  diagnosticInferences: DiagnosticInference[];
  configFingerprint: string | null;
}

/**
 * DashboardView 컴포넌트
 * 대시보드의 프레젠테이션 레이어로 KPI 카드, 차트, 메트릭 분포 등을 렌더링합니다.
 */
export const DashboardView: React.FC<DashboardViewProps> = ({
    kpiData, zoomedMetric, selectedDate, selectedModule, zoomedFrequencyData,
    modulePerformanceData, handleDotClick, handleFrequencyBarClick, moduleColors,
    detailedQueryData, selectedScoreRange, metricDistributionData,
    handleZoomClick, handleZoomOut, allModuleNames, metricPerformanceBreakdownData,
    evaluatorHealth, diagnosticObservations, diagnosticInferences, configFingerprint
}) => {
  return (
    <S.DashboardContainer>
      <S.KpiCardWrapper>
        <Swiper
          modules={[Navigation]}
          spaceBetween={24}
          slidesPerView={'auto'}
          navigation={{
            nextEl: '.arrow-right',
            prevEl: '.arrow-left',
          }}
          className="swiper-container"
        >
          <SwiperSlide>
            <KPICard title="Overall Score" value={kpiData.overallScore} />
          </SwiperSlide>
          <SwiperSlide>
            <KPICard title="Perf. Change (vs last week)" value={kpiData.performanceChange.value} change={kpiData.performanceChange} />
          </SwiperSlide>
          <SwiperSlide>
            <KPICard title="Lowest Module" value={kpiData.worstModule} />
          </SwiperSlide>
          <SwiperSlide>
            <KPICard title="Evaluator Coverage" value={kpiData.evaluatorCoverage} />
          </SwiperSlide>
        </Swiper>
        <S.CarouselArrow className="arrow-left"><ChevronLeft size={20} /></S.CarouselArrow>
        <S.CarouselArrow className="arrow-right"><ChevronRight size={20} /></S.CarouselArrow>
      </S.KpiCardWrapper>

      <S.GridContainer>
        <S.MainChartWrapper>
          <S.ChartBox>
            <S.BoxTitle>RAG Performance Change</S.BoxTitle>
            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', flexGrow: 1 }}>
                <ResponsiveContainer width={Math.max(modulePerformanceData.length * 80, 400)} height="100%">
                    <LineChart data={modulePerformanceData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="date" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#4B5563" }} />
                        <Legend />
                        {allModuleNames.map((moduleName, index) => (
                            <Line
                                key={moduleName} type="monotone" dataKey={moduleName}
                                stroke={moduleColors[index % moduleColors.length]} strokeWidth={2}
                                dot={{ 
                                    onClick: (data: any) => {
                                        handleDotClick(data);
                                    }, 
                                    r: 5, 
                                    style: { cursor: 'pointer' },
                                    fill: moduleColors[index % moduleColors.length]
                                }}
                                activeDot={{ 
                                    onClick: (e: any, payload: any) => handleDotClick(payload),
                                    r: 8, 
                                    style: { cursor: 'pointer' } 
                                }}
                                connectNulls={false}
                            />
                        ))}
                    </LineChart>
                </ResponsiveContainer>
            </div>
          </S.ChartBox>
        </S.MainChartWrapper>
        
        <S.SidePanelWrapper>
          <S.ChartBox>
            <S.BoxHeader>
              <S.BoxTitle title={`${selectedModule} on ${selectedDate}`}>{`${selectedModule} on ${selectedDate}`}</S.BoxTitle>
            </S.BoxHeader>
            <S.ScrollableContent>
              {metricDistributionData.length > 0 ? (
                metricDistributionData.map((metric) => (
                  <motion.div layoutId={`metric-chart-container-${metric.metricName}`} key={metric.metricName} style={{borderRadius: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#374151'}}>
                    <S.BoxHeader style={{marginBottom: '0.5rem'}}>
                      <S.BoxTitleH3>{metric.metricName}</S.BoxTitleH3>
                      <S.IconButton onClick={() => handleZoomClick(metric.metricName)}>
                        <Expand size={16} />
                      </S.IconButton>
                    </S.BoxHeader>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={metric.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis dataKey="range" stroke="#9CA3AF" fontSize={10} interval={1} angle={-30} textAnchor="end" height={40}/>
                        <YAxis stroke="#9CA3AF" allowDecimals={false} fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#4B5563", fontSize: 12 }} />
                        <Bar dataKey="count" fill={moduleColors[2]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                ))
              ) : (
                <S.NoDataText>No metric data available for this module on this date.</S.NoDataText>
              )}
            </S.ScrollableContent>
          </S.ChartBox>
        </S.SidePanelWrapper>
      </S.GridContainer>
      
      <AnimatePresence>
        {zoomedMetric && (
          <S.ModalOverlay onClick={handleZoomOut}>
            <motion.div
              layoutId={`metric-chart-container-${zoomedMetric}`}
              style={{
                width: '80%',
                maxWidth: '900px',
                height: '60vh',
                backgroundColor: 'rgba(31, 41, 55, 0.6)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '0.75rem',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column'}}>
                <S.BoxHeader>
                  <S.BoxTitle title={`[Zoomed] ${zoomedMetric} on ${selectedDate}`}>{`[Zoomed] ${zoomedMetric} on ${selectedDate}`}</S.BoxTitle>
                  <S.IconButton onClick={handleZoomOut}><ArrowLeft size={18} /></S.IconButton>
                </S.BoxHeader>
                <S.ZoomedViewContainer>
                    <S.ZoomedChartWrapper>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={zoomedFrequencyData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="range" stroke="#9CA3AF" />
                                <YAxis stroke="#9CA3AF" allowDecimals={false} />
                                <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#4B5563" }} />
                                <Bar dataKey="count" name="Query Count">
                                    {zoomedFrequencyData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={moduleColors[index % moduleColors.length]} cursor="pointer" onClick={() => handleFrequencyBarClick(entry)} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </S.ZoomedChartWrapper>
                    <S.ZoomedQueryWrapper>
                          <S.BoxTitleH3>Queries in Score Range</S.BoxTitleH3>
                          <S.ScrollableContent style={{height: '100%'}}>
                            <S.QueryInfoText>
                              Showing {detailedQueryData?.length || 0} queries. Range:{" "}
                              {selectedScoreRange ? `${selectedScoreRange[0]}-${selectedScoreRange[1]}` : "All"}
                            </S.QueryInfoText>
                            {detailedQueryData?.map((q, i) => (
                              <S.QueryItem key={i}>
                                <S.QueryText title={q.query}>Query: {q.query}</S.QueryText>
                                <S.ScoreWrapper>
                                  <S.MetricName>{zoomedMetric}</S.MetricName>
                                  <S.ScoreText>{(q.score).toFixed(1)}%</S.ScoreText>
                                </S.ScoreWrapper>
                              </S.QueryItem>
                            ))}
                          </S.ScrollableContent>
                    </S.ZoomedQueryWrapper>
                </S.ZoomedViewContainer>
              </div>
            </motion.div>
          </S.ModalOverlay>
        )}
      </AnimatePresence>

      <div>
        <S.BoxTitle as="h2" style={{ marginBottom: '1rem' }}>Evaluation Diagnostics</S.BoxTitle>
        <S.GridContainer>
          <S.MainChartWrapper>
            <S.ChartBox>
              <S.BoxTitleH3>Observed evidence</S.BoxTitleH3>
              <S.QueryInfoText>
                Runtime facts only. Configuration: {configFingerprint || 'legacy / unavailable'}
              </S.QueryInfoText>
              <S.ScrollableContent style={{ height: '220px' }}>
                {diagnosticObservations.length === 0 ? (
                  <S.NoDataText>No runtime failures were observed for this run.</S.NoDataText>
                ) : diagnosticObservations.map((observation, index) => (
                  <S.QueryItem key={`${observation.code}-${index}`}>
                    <S.QueryText>{observation.code}</S.QueryText>
                    <S.QueryInfoText>{observation.message}</S.QueryInfoText>
                    <S.QueryInfoText>
                      {[observation.stage, observation.module, observation.metric].filter(Boolean).join(' · ')}
                    </S.QueryInfoText>
                  </S.QueryItem>
                ))}
              </S.ScrollableContent>
            </S.ChartBox>
          </S.MainChartWrapper>
          <S.SidePanelWrapper>
            <S.ChartBox>
              <S.BoxTitleH3>Possible causes (inferred)</S.BoxTitleH3>
              <S.QueryInfoText>
                These are hypotheses, not confirmed root causes. Evaluated: {evaluatorHealth?.evaluated || 0},
                not evaluated: {evaluatorHealth?.notEvaluated || 0}.
              </S.QueryInfoText>
              <S.ScrollableContent style={{ height: '220px' }}>
                {diagnosticInferences.length === 0 ? (
                  <S.NoDataText>No cause inference was produced.</S.NoDataText>
                ) : diagnosticInferences.map((inference, index) => (
                  <S.QueryItem key={`${inference.code}-${index}`}>
                    <S.QueryText>{inference.possibleCause}</S.QueryText>
                    <S.QueryInfoText>Confidence: {inference.confidence}</S.QueryInfoText>
                    <S.QueryInfoText>Next: {inference.nextAction}</S.QueryInfoText>
                  </S.QueryItem>
                ))}
              </S.ScrollableContent>
            </S.ChartBox>
          </S.SidePanelWrapper>
        </S.GridContainer>
      </div>
      
      <div>
        <S.BoxTitle as="h2" style={{ marginBottom: '1rem' }}>Metric Performance Breakdown</S.BoxTitle>
        <S.GridContainer style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          {Object.entries(metricPerformanceBreakdownData).map(([metricName, data]) => (
            <S.ChartBox key={metricName}>
              <S.BoxTitleH3 style={{ marginBottom: '0.5rem' }}>{metricName}</S.BoxTitleH3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: "#1F2937", borderColor: "#4B5563" }} />
                  <Legend />
                  {data.length > 0 && Object.keys(data.reduce((acc, curr) => ({...acc, ...curr}), {}))
                      .filter(key => key !== 'date' && key !== '_hasData')
                      .map((moduleName) => {
                        const colorIdx = allModuleNames.indexOf(moduleName);
                        return (
                          <Line
                              key={moduleName} type="monotone" dataKey={moduleName}
                              stroke={moduleColors[colorIdx % moduleColors.length]} strokeWidth={2}
                              connectNulls={false}
                          />
                        );
                      })}
                </LineChart>
              </ResponsiveContainer>
            </S.ChartBox>
          ))}
        </S.GridContainer>
      </div>
    </S.DashboardContainer>
  );
};
