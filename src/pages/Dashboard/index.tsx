import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dashboardResultState, appLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';
import { DashboardView } from './DashboardView';
import { transformData } from './transformData';
import { CHART_COLORS } from '../../globals/styles/color';
import {
  Aggregation,
  ScoreBin,
  histogram,
  inScoreBin,
  isEvaluatedMetric,
  metricIdentity,
  metricSamples,
  selectedKpis,
  compareModuleRuns,
} from './analysis';
import type { EvaluationRun } from '../../globals/types';
import { metricDisplayCatalog, runDisplayNames, runKey, moduleDisplayNames } from '../../utils/display';

export const DashboardPage: React.FC = () => {
  const runs = useRecoilValue(dashboardResultState),
    setRuns = useSetRecoilState(dashboardResultState),
    setLoading = useSetRecoilState(appLoadingState);
  const [selectedTimestamp, setSelectedTimestamp] = useState(''),
    [selectedModule, setSelectedModule] = useState('');
  const [baselineId, setBaselineId] = useState('');
  const [persistenceError, setPersistenceError] = useState('');
  const [aggregation, setAggregation] = useState<Aggregation>('final');
  const [zoomedMetric, setZoomedMetric] = useState<string | null>(null),
    [selectedBin, setSelectedBin] = useState<ScoreBin | null>(null);
  const [error, setError] = useState(''),
    [connection, setConnection] = useState(''),
    [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const finish = () => setLoading((prev) => ({ ...prev, isLoading: false }));
    const history = (data: any) => {
      if (!data.history || typeof data.history !== 'object') return;
      const parsed: EvaluationRun[] = Object.entries(data.history)
        .filter(([, v]) => v && typeof v === 'object')
        .map(([ts, states]) => transformData({ ts, states }));
      parsed.sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp));
      setRuns((previous) =>
        [...parsed, ...previous.filter((r) => r.persisted === false && !parsed.some((p) => p.runId === r.runId))].sort(
          (a, b) => a.date.localeCompare(b.date),
        ),
      );
      setLoaded(true);
      setError('');
      finish();
    };
    const result = (data: any) => {
      if (!data.storage?.states) return;
      const run = transformData({ ...data.storage, ts: data.run_id || data.ts, persisted: data.persisted });
      if (data.persisted === false)
        setPersistenceError('이 실행을 이력에 저장하지 못했습니다. 현재 결과는 임시 표시입니다.');
      else setPersistenceError('');
      setRuns((previous) =>
        [...previous.filter((r) => r.runId !== run.runId), run].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setLoaded(true);
      finish();
    };
    const failure = (data: any) => {
      setError(data.message || '실행에 실패했습니다. 저장된 실패 기록을 확인하세요.');
      finish();
    };
    const status = (data: any) =>
      setConnection(data.status === 'connected' ? '연결됨' : data.message || '연결 확인 중');
    socket.on('history', history);
    socket.on('rag-result-data', result);
    socket.on('error', failure);
    socket.on('connection-state', status);
    socket.subscribe(['history', 'rag-result-data', 'error']);
    socket.send({ topic: 'start!' });
    return () => {
      socket.off('history', history);
      socket.off('rag-result-data', result);
      socket.off('error', failure);
      socket.off('connection-state', status);
    };
  }, [setRuns, setLoading]);
  const metricCatalog = useRef(metricDisplayCatalog);
  const metricLabels = useMemo(
    () =>
      metricCatalog.current.labelsFor(
        runs.flatMap((run) => run.modules.flatMap((module) => module.queries.flatMap((query) => query.metrics))),
      ),
    [runs],
  );
  const runLabels = useMemo(() => runDisplayNames(runs), [runs]);
  const selectedRun = runs.find((r) => (r.runId || r.timestamp) === selectedTimestamp) || runs.at(-1);
  const module = selectedRun?.modules.find((m) => m.moduleName === selectedModule) || selectedRun?.modules[0];
  const moduleName = module?.moduleName || '';
  const baselineCandidates = runs.filter((r) => r.runId !== selectedRun?.runId);
  const baselineRun =
    baselineCandidates.find((r) => (r.runId || r.timestamp) === baselineId) || baselineCandidates.at(-1);
  const comparisons = compareModuleRuns(baselineRun, selectedRun, moduleName);
  const allModuleNames = useMemo(
    () => Array.from(new Set(runs.flatMap((r) => r.modules.map((m) => m.moduleName)))),
    [runs],
  );
  const moduleLabels = useMemo(
    () =>
      moduleDisplayNames([
        ...allModuleNames,
        ...runs.flatMap((run) => run.executionTrace.flatMap((event) => [event.moduleId, ...event.nextModules])),
      ]),
    [allModuleNames, runs],
  );
  const modulePerformanceData = useMemo(
    () =>
      runs.map((run) => {
        const entry: any = {
          date: runLabels[runKey(run)]?.split(' · ')[0] || '실행',
          timestamp: run.runId || run.timestamp,
        };
        allModuleNames.forEach((name) => {
          const metrics = run.modules.find((m) => m.moduleName === name)?.queries.flatMap((q) => q.metrics) || [];
          entry[name] = metrics.length ? (metrics.filter(isEvaluatedMetric).length / metrics.length) * 100 : null;
        });
        return entry;
      }),
    [runs, allModuleNames, runLabels],
  );
  const metricPerformanceBreakdownData = useMemo(() => {
    const identities = Array.from(
      new Set(runs.flatMap((r) => r.modules.flatMap((m) => m.queries.flatMap((q) => q.metrics.map(metricIdentity))))),
    );
    const output: Record<string, any[]> = {};
    identities.forEach((identity) => {
      output[identity] = runs.map((run) => {
        const entry: any = { date: runLabels[runKey(run)]?.split(' · ')[0] || '실행' };
        allModuleNames.forEach((name) => {
          const samples = metricSamples(
            run.modules.find((m) => m.moduleName === name)?.queries || [],
            identity,
            aggregation,
          );
          entry[name] = samples.length ? samples.reduce((s, x) => s + x.score, 0) / samples.length : null;
        });
        return entry;
      });
    });
    return output;
  }, [runs, allModuleNames, aggregation, runLabels]);
  const identities = Array.from(new Set(module?.queries.flatMap((q) => q.metrics.map(metricIdentity)) || []));
  const metricDistributionData = identities.map((identity) => {
    const samples = metricSamples(module?.queries || [], identity, aggregation);
    return { metricName: identity, data: histogram(samples.map((s) => s.score)), sampleCount: samples.length };
  });
  const samples = zoomedMetric ? metricSamples(module?.queries || [], zoomedMetric, aggregation) : [];
  const detailedQueryData = samples
    .filter((s) => !selectedBin || inScoreBin(s.score, selectedBin))
    .map((s) => ({ ...s, unit: s.metric.unit }))
    .sort((a, b) => b.score - a.score);
  const notEvaluated =
    module?.queries.flatMap((q) =>
      q.metrics
        .filter((m) => !isEvaluatedMetric(m))
        .map((metric) => ({ query: q.query, queryId: q.queryId, executionIndex: q.executionIndex, metric })),
    ) || [];
  const resetView = () => {
    setZoomedMetric(null);
    setSelectedBin(null);
  };
  const fieldStyle: React.CSSProperties = {
    padding: 8,
    background: '#1f2937',
    color: '#e5e7eb',
    border: '1px solid #64748b',
    borderRadius: 4,
    maxWidth: '100%',
  };
  return (
    <>
      <div
        style={{
          padding: '20px 32px',
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
          alignItems: 'end',
          color: '#e5e7eb',
        }}
      >
        <label>
          실행 선택
          <br />
          <select
            aria-label="실행 선택"
            style={fieldStyle}
            value={selectedRun?.runId || selectedRun?.timestamp || ''}
            onChange={(e) => {
              setSelectedTimestamp(e.target.value);
              resetView();
            }}
          >
            {runs.map((r) => (
              <option key={r.runId || r.timestamp} value={r.runId || r.timestamp}>
                {runLabels[runKey(r)]}
              </option>
            ))}
          </select>
        </label>
        <label>
          비교 기준 실행
          <br />
          <select
            aria-label="비교 기준 실행"
            style={fieldStyle}
            value={baselineRun?.runId || baselineRun?.timestamp || ''}
            onChange={(e) => setBaselineId(e.target.value)}
          >
            {baselineCandidates.map((r) => (
              <option key={r.runId || r.timestamp} value={r.runId || r.timestamp}>
                {runLabels[runKey(r)]}
              </option>
            ))}
          </select>
        </label>
        <label>
          모듈
          <br />
          <select
            aria-label="모듈 선택"
            style={fieldStyle}
            value={moduleName}
            onChange={(e) => {
              setSelectedModule(e.target.value);
              resetView();
            }}
          >
            {selectedRun?.modules.map((m) => (
              <option key={m.moduleName} value={m.moduleName}>
                {moduleLabels[m.moduleName] || '모듈'}
              </option>
            ))}
          </select>
        </label>
        <label>
          점수 집계
          <br />
          <select
            aria-label="점수 집계"
            style={fieldStyle}
            value={aggregation}
            onChange={(e) => {
              setAggregation(e.target.value as Aggregation);
              resetView();
            }}
          >
            <option value="final">질문별 마지막 실행</option>
            <option value="query">질문별 실행 평균</option>
            <option value="step">모든 실행 단계</option>
          </select>
        </label>
        <button
          onClick={() => {
            socket.reconnect();
            socket.send({ topic: 'start!' });
          }}
          style={fieldStyle}
        >
          이력 새로고침
        </button>
        <span role="status">{connection}</span>
      </div>
      {(persistenceError || selectedRun?.persisted === false) && (
        <p role="alert" style={{ padding: '0 32px', color: '#fcd34d' }}>
          {persistenceError || '이 실행은 이력에 저장되지 않았습니다. 화면을 다시 로드하면 결과가 사라질 수 있습니다.'}
        </p>
      )}
      {error && (
        <p role="alert" style={{ padding: '0 32px', color: '#fca5a5' }}>
          {error}
        </p>
      )}
      {!runs.length ? (
        <p style={{ padding: 32, color: '#e5e7eb' }}>
          {loaded
            ? '저장된 실행이 없습니다. Test Query에서 질문을 실행하거나 Run Queries에서 질문 파일을 선택하세요.'
            : '실행 이력을 불러오는 중입니다. 서버가 실행 중인지 확인하세요.'}
        </p>
      ) : (
        <DashboardView
          metricLabels={metricLabels}
          moduleLabels={moduleLabels}
          selectedRunLabel={selectedRun ? runLabels[runKey(selectedRun)] : ''}
          baselineRunLabel={baselineRun ? runLabels[runKey(baselineRun)] : ''}
          kpiData={selectedKpis(selectedRun)}
          comparisons={comparisons}
          baselineRun={baselineRun}
          selectedRun={selectedRun}
          aggregation={aggregation}
          notEvaluated={notEvaluated}
          zoomedMetric={zoomedMetric}
          selectedDate={selectedRun?.date || ''}
          selectedModule={moduleName}
          zoomedFrequencyData={histogram(samples.map((s) => s.score))}
          modulePerformanceData={modulePerformanceData}
          handleDotClick={(p) => {
            if (p?.payload?.timestamp) {
              setSelectedTimestamp(p.payload.timestamp);
              setSelectedModule(p.dataKey || moduleName);
              resetView();
            }
          }}
          handleFrequencyBarClick={setSelectedBin}
          moduleColors={CHART_COLORS}
          detailedQueryData={detailedQueryData}
          selectedScoreRange={selectedBin ? [selectedBin.start, selectedBin.end] : null}
          metricDistributionData={metricDistributionData}
          metricPerformanceBreakdownData={metricPerformanceBreakdownData}
          handleZoomClick={(m) => {
            setZoomedMetric(m);
            setSelectedBin(null);
          }}
          handleZoomOut={() => setZoomedMetric(null)}
          allModuleNames={allModuleNames}
          evaluatorHealth={selectedRun?.evaluatorHealth}
          diagnosticObservations={selectedRun?.observations || []}
          diagnosticInferences={selectedRun?.inferences || []}
          configFingerprint={selectedRun?.configFingerprint || null}
          executionTrace={selectedRun?.executionTrace || []}
          graphHealth={selectedRun?.graphHealth}
        />
      )}
    </>
  );
};
