import React from 'react';
import { MetricDetails } from '../../components/MetricDetails';
import type { EvaluationRun, MetricScore } from '../../globals/types';
import type { Aggregation } from './analysis';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Expand, ArrowLeft } from 'lucide-react';
import * as S from './Dashboard.styled';
import { KPICard } from '../../components/KPICard';
import type {
  DiagnosticInference,
  DiagnosticObservation,
  EvaluatorHealth,
  ExecutionTraceEvent,
  GraphHealth,
} from '../../globals/types';

interface DashboardViewProps {
  selectedRun?: EvaluationRun;
  baselineRun?: EvaluationRun;
  comparisons: ReturnType<typeof import('./analysis').compareModuleRuns>;
  aggregation: Aggregation;
  notEvaluated: { query: string; queryId?: string; executionIndex?: number; metric: MetricScore }[];
  kpiData: {
    evaluatedMetrics: string;
    notEvaluatedMetrics: string;
    evaluatorCoverage: string;
    traceExecutions: string;
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
  executionTrace: ExecutionTraceEvent[];
  graphHealth?: GraphHealth;
}

/**
 * DashboardView 컴포넌트
 * 대시보드의 프레젠테이션 레이어로 KPI 카드, 차트, 메트릭 분포 등을 렌더링합니다.
 */
export const DashboardView: React.FC<DashboardViewProps> = ({
  kpiData,
  zoomedMetric,
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
  handleZoomClick,
  handleZoomOut,
  allModuleNames,
  metricPerformanceBreakdownData,
  evaluatorHealth,
  diagnosticObservations,
  diagnosticInferences,
  configFingerprint,
  executionTrace,
  graphHealth,
  selectedRun,
  baselineRun,
  comparisons,
  aggregation,
  notEvaluated,
}) => {
  return (
    <S.DashboardContainer>
      <S.RunSummary aria-label="선택 실행 요약">
        <p>
          선택 실행: {selectedDate} · {selectedRun?.runId}
        </p>
        <p>
          질문 실행 {selectedRun?.pipelineHealth?.attempted ?? '미기록'}건 · 성공{' '}
          {selectedRun?.pipelineHealth?.succeeded ?? '미기록'} · 실패 {selectedRun?.pipelineHealth?.failed ?? '미기록'}{' '}
          · 상태 미기록 {selectedRun?.pipelineHealth?.unknown ?? '미기록'}
        </p>
        <p>평가 성공률은 기록된 평가의 계산 완료 비율입니다. 답변 정확도와 질문 실행 성공률은 별도로 확인하세요.</p>
        <details>
          <summary>집계 기준·평가 범위·시간 설명</summary>
          <div>
            <p>
              점수 집계:{' '}
              {aggregation === 'step'
                ? '실행 단계마다 1표본'
                : aggregation === 'query'
                  ? '질문별 실행 평균에 동일 가중치'
                  : '질문별 마지막 모듈 실행에 동일 가중치'}
              . 미평가 점수는 평균·분포에서 제외합니다.
            </p>
            {selectedRun?.evaluationPlan && (
              <p>
                미도달 E2E 평가 {selectedRun.evaluationPlan.notReachedE2E}건 · 실행하지 않은 모듈의 설정 지표{' '}
                {selectedRun.evaluationPlan.notReachedModuleMetrics}건 (
                {selectedRun.evaluationPlan.notReachedModules.join(', ') || '없음'}). 비활성 분기일 수 있으므로 미평가
                실패와 구분합니다.
              </p>
            )}
            {selectedRun?.timing && (
              <p>
                모듈 실행 시간 합 {selectedRun.graphHealth.totalLatencySeconds.toFixed(3)}초 · 평가 시간 합{' '}
                {selectedRun.timing.evaluatorSeconds.toFixed(3)}초 · 질문별 전체 소요 시간 합{' '}
                {selectedRun.timing.queryWallSecondsSum.toFixed(3)}초. 동시 배치의 실제 경과 시간과는 다릅니다.
              </p>
            )}
          </div>
        </details>
      </S.RunSummary>
      <S.KpiCardWrapper aria-label="선택 실행의 평가 지표 요약">
        <KPICard title="Evaluated Metrics" value={kpiData.evaluatedMetrics} />
        <KPICard title="Not Evaluated" value={kpiData.notEvaluatedMetrics} />
        <KPICard title="Trace Executions" value={kpiData.traceExecutions} />
        <KPICard title="평가 성공률" value={kpiData.evaluatorCoverage} />
      </S.KpiCardWrapper>

      {selectedRun?.queryOutcomes?.some((q) => q.status !== 'succeeded') && (
        <S.ChartBox>
          <S.BoxTitleH3>완료되지 않은 질문</S.BoxTitleH3>
          {selectedRun.queryOutcomes
            .filter((q) => q.status !== 'succeeded')
            .map((q) => (
              <S.QueryItem key={q.queryId}>
                <S.QueryText>
                  {q.query} · {q.status === 'failed' ? '실패' : '상태 미기록'}
                </S.QueryText>
                <S.QueryInfoText>
                  {q.queryId} · 종료 이유: {q.reason || '미기록'}
                </S.QueryInfoText>
              </S.QueryItem>
            ))}
        </S.ChartBox>
      )}
      {baselineRun && (
        <S.ChartBox>
          <S.BoxTitleH3>동일 질문의 마지막 실행 비교 · {selectedModule}</S.BoxTitleH3>
          <S.QueryInfoText>
            기준: {baselineRun.date} → 선택: {selectedDate}. 각 지표의 판정자·버전·설정이 같고 양쪽 평가가 성공한 질문만
            차이를 계산합니다. 양수·음수의 의미는 지표 방향에 따라 다릅니다.
          </S.QueryInfoText>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>지표 · 평가 조건</th>
                  <th>공통 질문 / 양쪽 평가 성공</th>
                  <th>기준 평균</th>
                  <th>선택 평균</th>
                  <th>차이</th>
                </tr>
              </thead>
              <tbody>
                {comparisons.map((row) => (
                  <tr key={row.identity}>
                    <td style={{ padding: '8px 12px 8px 0', overflowWrap: 'anywhere' }}>
                      {row.identity}
                      {!row.evaluatorVerified && (
                        <small style={{ display: 'block' }}>판정자 동일성 미확인 / 비교 불가</small>
                      )}
                    </td>
                    <td>
                      {row.pairedQueries} / {row.evaluatedPairs}
                      <small style={{ display: 'block' }}>
                        기준 {row.baselineQueries}, 선택 {row.candidateQueries}, 짝 없는 질문 {row.unmatchedQueries}
                      </small>
                      <small style={{ display: 'block' }}>
                        양쪽 모듈 기록 {row.pairedModuleRecords}, 한쪽 이상 모듈 미도달 {row.missingModulePairs}
                      </small>
                    </td>
                    <td>{row.baselineMean?.toPrecision(4) ?? '미평가'}</td>
                    <td>{row.candidateMean?.toPrecision(4) ?? '미평가'}</td>
                    <td>{row.delta?.toPrecision(4) ?? '비교 불가'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </S.ChartBox>
      )}
      <S.GridContainer>
        <S.MainChartWrapper>
          <S.ChartBox>
            <S.BoxTitle>Evaluator Coverage by Module</S.BoxTitle>
            <div style={{ width: '100%', overflowX: 'auto', overflowY: 'hidden', flexGrow: 1 }}>
              <ResponsiveContainer width={Math.max(modulePerformanceData.length * 80, 400)} height="100%">
                <LineChart data={modulePerformanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={[0, 100]} unit="%" />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }} />
                  <Legend />
                  {allModuleNames.map((moduleName, index) => (
                    <Line
                      key={moduleName}
                      type="monotone"
                      dataKey={moduleName}
                      stroke={moduleColors[index % moduleColors.length]}
                      strokeWidth={2}
                      dot={{
                        onClick: (data: any) => {
                          handleDotClick(data);
                        },
                        r: 5,
                        style: { cursor: 'pointer' },
                        fill: moduleColors[index % moduleColors.length],
                      }}
                      activeDot={{
                        onClick: (data: any) => handleDotClick(data),
                        r: 8,
                        style: { cursor: 'pointer' },
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
              <S.BoxTitle
                title={`${selectedModule} on ${selectedDate}`}
              >{`${selectedModule} on ${selectedDate}`}</S.BoxTitle>
            </S.BoxHeader>
            <S.ScrollableContent>
              {metricDistributionData.length > 0 ? (
                metricDistributionData.map((metric) => (
                  <motion.div
                    layoutId={`metric-chart-container-${metric.metricName}`}
                    key={metric.metricName}
                    style={{ borderRadius: '0.5rem', padding: '0.5rem 1rem', backgroundColor: '#374151' }}
                  >
                    <S.BoxHeader style={{ marginBottom: '0.5rem' }}>
                      <S.BoxTitleH3>{metric.metricName}</S.BoxTitleH3>
                      <S.IconButton
                        aria-label={`${metric.metricName} 상세 보기`}
                        onClick={() => handleZoomClick(metric.metricName)}
                      >
                        <Expand size={16} />
                      </S.IconButton>
                    </S.BoxHeader>
                    <ResponsiveContainer width="100%" height={100}>
                      <BarChart data={metric.data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                        <XAxis
                          dataKey="range"
                          stroke="#9CA3AF"
                          fontSize={10}
                          interval={1}
                          angle={-30}
                          textAnchor="end"
                          height={40}
                        />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563', fontSize: 12 }} />
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
              <div style={{ padding: '1rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
                <S.BoxHeader>
                  <S.BoxTitle
                    title={`[Zoomed] ${zoomedMetric} on ${selectedDate}`}
                  >{`[Zoomed] ${zoomedMetric} on ${selectedDate}`}</S.BoxTitle>
                  <S.IconButton aria-label="상세 닫기" onClick={handleZoomOut}>
                    <ArrowLeft size={18} />
                  </S.IconButton>
                </S.BoxHeader>
                <S.ZoomedViewContainer>
                  <S.ZoomedChartWrapper>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={zoomedFrequencyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                        <XAxis dataKey="range" stroke="#9CA3AF" />
                        <YAxis stroke="#9CA3AF" allowDecimals={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }} />
                        <Bar dataKey="count" name={aggregation === 'step' ? '실행 표본 수' : '질문 표본 수'}>
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
                    </ResponsiveContainer>
                  </S.ZoomedChartWrapper>
                  <S.ZoomedQueryWrapper>
                    <S.BoxTitleH3>점수 구간의 평가 성공 표본</S.BoxTitleH3>
                    <S.ScrollableContent style={{ height: '100%' }}>
                      <S.QueryInfoText>
                        표본 {detailedQueryData?.length || 0}건. 구간:{' '}
                        {selectedScoreRange ? `${selectedScoreRange[0]}-${selectedScoreRange[1]}` : 'All'}
                      </S.QueryInfoText>
                      {detailedQueryData?.map((q, i) => (
                        <S.QueryItem key={i}>
                          <S.QueryText title={q.query}>
                            질문: {q.query} · {q.queryId}
                            {q.executionIndex ? ` · 실행 ${q.executionIndex}` : ''}
                          </S.QueryText>
                          <S.ScoreWrapper>
                            <S.MetricName>{zoomedMetric}</S.MetricName>
                            <S.ScoreText>
                              {q.score.toPrecision(4)} {q.unit}
                            </S.ScoreText>
                          </S.ScoreWrapper>
                          <S.QueryInfoText>답변: {q.answer || '답변 없음'}</S.QueryInfoText>
                          {q.metric && <MetricDetails metric={q.metric} />}
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
        {notEvaluated.length > 0 && (
          <S.ChartBox>
            <S.BoxTitleH3>선택 모듈의 미평가 기록 {notEvaluated.length}건</S.BoxTitleH3>
            <S.ScrollableContent style={{ maxHeight: 260 }}>
              {notEvaluated.map((item, i) => (
                <S.QueryItem key={i}>
                  <S.QueryText>
                    {item.query} · {item.metric.name}
                  </S.QueryText>
                  <MetricDetails metric={item.metric} />
                </S.QueryItem>
              ))}
            </S.ScrollableContent>
          </S.ChartBox>
        )}
        <S.BoxTitle as="h2" style={{ marginBottom: '1rem' }}>
          Evaluation Diagnostics
        </S.BoxTitle>
        <S.GridContainer>
          <S.MainChartWrapper>
            <S.ChartBox>
              <S.BoxTitleH3>Observed evidence</S.BoxTitleH3>
              <S.QueryInfoText>
                Runtime facts only. Configuration: {configFingerprint || 'legacy / unavailable'}
              </S.QueryInfoText>
              <S.ScrollableContent style={{ height: '220px' }}>
                {diagnosticObservations.length === 0 ? (
                  <S.NoDataText>기록된 진단 항목이 없습니다. 진단 미기록과 오류가 없다는 판단은 다릅니다.</S.NoDataText>
                ) : (
                  diagnosticObservations.map((observation, index) => (
                    <S.QueryItem key={`${observation.code}-${index}`}>
                      <S.QueryText>
                        {observation.query} · {observation.code}
                      </S.QueryText>
                      <S.QueryInfoText>{observation.message}</S.QueryInfoText>
                      <S.QueryInfoText>
                        {[observation.stage, observation.module, observation.metric].filter(Boolean).join(' · ')}
                      </S.QueryInfoText>
                    </S.QueryItem>
                  ))
                )}
              </S.ScrollableContent>
            </S.ChartBox>
          </S.MainChartWrapper>
          <S.SidePanelWrapper>
            <S.ChartBox>
              <S.BoxTitleH3>Possible causes (inferred)</S.BoxTitleH3>
              <S.QueryInfoText>
                These are hypotheses, not confirmed root causes. Evaluated: {evaluatorHealth?.evaluated || 0}, not
                evaluated: {evaluatorHealth?.notEvaluated || 0}.
              </S.QueryInfoText>
              <S.ScrollableContent style={{ height: '220px' }}>
                {diagnosticInferences.length === 0 ? (
                  <S.NoDataText>No cause inference was produced.</S.NoDataText>
                ) : (
                  diagnosticInferences.map((inference, index) => (
                    <S.QueryItem key={`${inference.code}-${index}`}>
                      <S.QueryText>
                        {inference.query} · {inference.possibleCause}
                      </S.QueryText>
                      <S.QueryInfoText>규칙 기반 신뢰 수준: {inference.confidence} (검증된 확률 아님)</S.QueryInfoText>
                      <S.QueryInfoText>Next: {inference.nextAction}</S.QueryInfoText>
                    </S.QueryItem>
                  ))
                )}
              </S.ScrollableContent>
            </S.ChartBox>
          </S.SidePanelWrapper>
        </S.GridContainer>
      </div>

      <div>
        <S.BoxTitle as="h2" style={{ marginBottom: '1rem' }}>
          Graph / Cycle Execution Trace
        </S.BoxTitle>
        <S.ChartBox>
          <S.QueryInfoText>
            Executions: {graphHealth?.totalExecutions || 0} · failures: {graphHealth?.failedExecutions || 0} · revisits:{' '}
            {graphHealth?.moduleRevisits || 0} · terminated queries: {graphHealth?.terminatedQueries || 0}
          </S.QueryInfoText>
          <S.ScrollableContent style={{ height: '260px' }}>
            {executionTrace.length === 0 ? (
              <S.NoDataText>Execution trace is unavailable for this legacy run.</S.NoDataText>
            ) : (
              executionTrace.map((event) => (
                <S.QueryItem key={`${event.queryId}-${event.executionId}`}>
                  <S.QueryText>
                    {event.query} · {event.moduleId}#{event.executionIndex} · {event.status}
                  </S.QueryText>
                  <S.QueryInfoText>
                    {event.executionId} · parents: {event.parentExecutionIds.join(', ') || 'root'} · next:{' '}
                    {event.nextModules.join(', ') || 'none'}
                  </S.QueryInfoText>
                  <S.QueryInfoText>
                    모듈 실행 시간:{' '}
                    {event.latencySeconds === null ? 'N/A' : `${(event.latencySeconds * 1000).toFixed(2)} ms`}
                    {event.failureType ? ` · failure: ${event.failureType}` : ''}
                    {event.revisitCount > 0 ? ` · revisit ${event.revisitCount}` : ''}
                  </S.QueryInfoText>
                </S.QueryItem>
              ))
            )}
          </S.ScrollableContent>
        </S.ChartBox>
      </div>

      <div>
        <S.BoxTitle as="h2" style={{ marginBottom: '1rem' }}>
          Metric Performance Breakdown
        </S.BoxTitle>
        <S.GridContainer style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
          {Object.entries(metricPerformanceBreakdownData).map(([metricName, data]) => (
            <S.ChartBox key={metricName}>
              <S.BoxTitleH3 style={{ marginBottom: '0.5rem' }}>{metricName}</S.BoxTitleH3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" domain={['auto', 'auto']} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', borderColor: '#4B5563' }} />
                  <Legend />
                  {data.length > 0 &&
                    Object.keys(data.reduce((acc, curr) => ({ ...acc, ...curr }), {}))
                      .filter((key) => key !== 'date' && key !== '_hasData' && key !== 'timestamp')
                      .map((moduleName) => {
                        const colorIdx = allModuleNames.indexOf(moduleName);
                        return (
                          <Line
                            key={moduleName}
                            type="monotone"
                            dataKey={moduleName}
                            stroke={moduleColors[colorIdx % moduleColors.length]}
                            strokeWidth={2}
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
