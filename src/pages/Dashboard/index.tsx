// src/pages/Dashboard/index.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { dashboardResultState, appLoadingState, AppLoadingState } from '../../globals/recoil/atoms';
import { socket } from '../../apis/socket';
import { DashboardView } from './DashboardView';
import { transformData } from './transformData';
import { CHART_COLORS } from '../../globals/styles/color';
import { MetricScore, QueryEvaluation } from '../../globals/types';

const isEvaluatedMetric = (metric: MetricScore): metric is MetricScore & { score: number } =>
  metric.didEval && metric.score !== null && Number.isFinite(metric.score);

const metricIdentity = (metric: MetricScore) =>
  `${metric.name} [${metric.unit || 'unitless'}]`;

/**
 * 연속적으로 데이터가 없는 구간을 요약하여 차트 데이터 배열을 압축합니다.
 */
const compressChartData = (data: any[], allModuleNames: string[], keyCheck: (item: any) => boolean) => {
  const compressedData = [];
  let consecutiveNulls = 0;
  for (let i = 0; i < data.length; i++) {
    if (keyCheck(data[i])) {
      if (consecutiveNulls > 2) {
        // 생략된 데이터에도 timestamp 키가 없으면 에러가 날 수 있으므로 주의, 여기선 시각화용이라 무방
        const ellipsisEntry: any = { date: `... (${consecutiveNulls} omitted)` };
        allModuleNames.forEach((name) => {
          ellipsisEntry[name] = null;
        });
        compressedData.push(ellipsisEntry);
      }
      compressedData.push(data[i]);
      consecutiveNulls = 0;
    } else {
      if (consecutiveNulls < 3 && i > 0 && keyCheck(data[i - 1])) {
        compressedData.push(data[i]);
      }
      consecutiveNulls++;
    }
  }
  return compressedData;
};

/**
 * DashboardPage 컴포넌트
 * 백엔드로부터 RAG 실행 이력을 수신하여 시각화합니다.
 */
export const DashboardPage: React.FC = () => {
  const evaluationRuns = useRecoilValue(dashboardResultState);
  const setDashboardResult = useSetRecoilState(dashboardResultState);
  const setAppLoading = useSetRecoilState(appLoadingState);

  const [selectedTimestamp, setSelectedTimestamp] = useState<string>('');
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [zoomedMetric, setZoomedMetric] = useState<string | null>(null);
  const [selectedScoreRange, setSelectedScoreRange] = useState<[number, number] | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    if (evaluationRuns.length > 0) {
      const lastRun = evaluationRuns[evaluationRuns.length - 1];
      if (!selectedTimestamp) setSelectedTimestamp(lastRun.timestamp);
      if (!selectedModule && lastRun.modules.length > 0) setSelectedModule(lastRun.modules[0].moduleName);
      setIsDataLoaded(true);
    }
  }, [evaluationRuns, selectedTimestamp, selectedModule]);

  useEffect(() => {
    if (!isInitialLoad) {
      socket.send({ topic: 'start!', flow_id: 'loop_graph' });
      
      setAppLoading((prev: AppLoadingState) => ({
        ...prev,
        isLoading: true,
        message: 'Refreshing Data...',
      }));
    }
    
    return () => {
      setIsInitialLoad(false);
    };
  }, []);

  /**
   * 소켓 핸들러 등록 및 데이터 요청
   */
  useEffect(() => {
    const handleDashboardHistory = (data: any) => {
      if (data.topic === 'history' && data.history) {
        console.log('✅ [Dashboard] Received history data:', data.history);
        
        try {
          const historyData = data.history;
          const parsedRuns: any[] = [];

          Object.keys(historyData).forEach((timestampKey) => {
            const states = historyData[timestampKey];
            if (states && Object.keys(states).length > 0) {
                const simulatedStorageData = {
                  ts: timestampKey,
                  states: states,
                };
                const run = transformData(simulatedStorageData);
                parsedRuns.push(run);
            }
          });

          if (parsedRuns.length > 0) {
              parsedRuns.sort((a, b) => (a.timestamp > b.timestamp ? 1 : -1));
              setDashboardResult(parsedRuns);
              
              setAppLoading((prev: AppLoadingState) => ({
                ...prev,
                isLoading: false,
                message: 'Data Loaded',
              }));
          } else {
              console.warn('[Dashboard] Parsed runs are empty. Check data structure.');
          }
        } catch (error) {
          console.error('❌ [Dashboard] Data Processing Error:', error);
        }
      }
    };

    socket.on('history', handleDashboardHistory);
    socket.subscribe(['history']);
    
    setTimeout(() => {
        socket.send({ topic: 'start!', flow_id: 'loop_graph' });
    }, 200);

    setAppLoading((prev: AppLoadingState) => ({
      ...prev,
      isLoading: true,
      message: 'Fetching History...',
    }));        
    

    return () => {
      socket.off('history', handleDashboardHistory);
    };
  }, []);

  const allModuleNames = useMemo(() => {
    const names = new Set<string>();
    evaluationRuns.forEach((run) => {
      run.modules.forEach((module) => {
        if (!module.isStarter) {
          names.add(module.moduleName);
        }
      });
    });
    return Array.from(names);
  }, [evaluationRuns]);

  const kpiData = useMemo(() => {
    if (evaluationRuns.length === 0)
      return {
        evaluatedMetrics: 'N/A',
        notEvaluatedMetrics: 'N/A',
        evaluatorCoverage: 'N/A',
        traceExecutions: 'N/A',
      };

    const latestRun = evaluationRuns[evaluationRuns.length - 1];
    const evaluatorCoverage = latestRun.evaluatorHealth.coverage === null
      ? 'N/A'
      : `${(latestRun.evaluatorHealth.coverage * 100).toFixed(1)}%`;
    return {
      evaluatedMetrics: latestRun.evaluatorHealth.evaluated.toString(),
      notEvaluatedMetrics: latestRun.evaluatorHealth.notEvaluated.toString(),
      evaluatorCoverage,
      traceExecutions: latestRun.graphHealth.totalExecutions.toString(),
    };
  }, [evaluationRuns]);

  const selectedRun = useMemo(
    () => evaluationRuns.find((run) => run.timestamp === selectedTimestamp),
    [selectedTimestamp, evaluationRuns]
  );
  
  // selectedRun이 결정되면 date값도 가져올 수 있습니다. View에 넘겨주기 위해 계산
  const displayDate = selectedRun ? selectedRun.date : '';

  const selectedModuleData = useMemo(
    () => selectedRun?.modules.find((m) => m.moduleName === selectedModule),
    [selectedRun, selectedModule]
  );

  const modulePerformanceData = useMemo(() => {
    const rawData = evaluationRuns.map((run) => {
      const entry: { date: string; timestamp: string; [key: string]: number | string | null } = { 
        date: run.date,
        timestamp: run.timestamp
      };
      let hasData = false;
      allModuleNames.forEach((moduleName) => {
        const module = run.modules.find((m) => m.moduleName === moduleName);
        if (!module || module.isStarter || module.queries.length === 0) {
          entry[moduleName] = null;
        } else {
          const metrics = module.queries.flatMap((query) => query.metrics);
          if (metrics.length === 0) {
            entry[moduleName] = null;
            return;
          }
          hasData = true;
          const evaluatedCount = metrics.filter(isEvaluatedMetric).length;
          entry[moduleName] = parseFloat(((evaluatedCount / metrics.length) * 100).toFixed(2));
        }
      });
      return { ...entry, _hasData: hasData };
    });
    return compressChartData(rawData, allModuleNames, (item) => item._hasData);
  }, [allModuleNames, evaluationRuns]);

  const metricPerformanceBreakdownData = useMemo(() => {
    const breakdown: { [metricName: string]: any[] } = {};
    const allMetrics = new Set<string>();
    evaluationRuns.forEach((r) =>
      r.modules.forEach((m) => m.queries.forEach((q) => q.metrics.forEach((metric) => allMetrics.add(metricIdentity(metric)))))
    );
    allMetrics.forEach((metricName) => {
      const rawData = evaluationRuns.map((run) => {
        const entry: { date: string; [key: string]: number | string | null } = { date: run.date };
        let hasData = false;
        allModuleNames.forEach((moduleName) => {
          const module = run.modules.find((m) => m.moduleName === moduleName);
          if (module?.isStarter) {
            entry[moduleName] = null;
            return;
          }
          const scores = module?.queries.flatMap((query) => {
            const metric = query.metrics.find((candidate) => metricIdentity(candidate) === metricName);
            return metric && isEvaluatedMetric(metric) ? [metric.score] : [];
          }) || [];
          if (scores.length > 0) {
            hasData = true;
            const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
            entry[moduleName] = parseFloat(avgScore.toFixed(2));
          } else {
            entry[moduleName] = null;
          }
        });
        return { ...entry, _hasData: hasData };
      });
      breakdown[metricName] = compressChartData(rawData, allModuleNames, (item) => item._hasData);
    });
    return breakdown;
  }, [allModuleNames, evaluationRuns]);

  const getFrequencyData = (queries: QueryEvaluation[], metricName: string) => {
    const scores = queries.flatMap((query) => {
      const metric = query.metrics.find((candidate) => metricIdentity(candidate) === metricName);
      return metric && isEvaluatedMetric(metric) ? [metric.score] : [];
    });
    if (scores.length === 0) return [];
    const minimum = Math.min(...scores);
    const maximum = Math.max(...scores);
    if (minimum === maximum) {
      return [{ range: minimum.toPrecision(4), start: minimum, end: maximum, count: scores.length }];
    }
    const width = (maximum - minimum) / 10;
    return Array.from({ length: 10 }, (_, index) => {
      const start = minimum + width * index;
      const end = index === 9 ? maximum : minimum + width * (index + 1);
      const count = scores.filter((score) =>
        score >= start && (index === 9 ? score <= end : score < end)
      ).length;
      return {
        range: `${start.toPrecision(3)}–${end.toPrecision(3)}`,
        start,
        end,
        count,
      };
    });
  };

  const metricDistributionData = useMemo(() => {
    if (!selectedModuleData) return [];
    const metricNames = selectedModuleData.queries.reduce((acc, q) => {
      q.metrics.forEach((m) => acc.add(metricIdentity(m)));
      return acc;
    }, new Set<string>());
    return Array.from(metricNames).map((name) => ({
      metricName: name,
      data: getFrequencyData(selectedModuleData.queries, name),
    }));
  }, [selectedModuleData]);

  const zoomedFrequencyData = useMemo(() => {
    if (!selectedModuleData || !zoomedMetric) return [];
    return getFrequencyData(selectedModuleData.queries, zoomedMetric);
  }, [selectedModuleData, zoomedMetric]);

  const detailedQueryData = useMemo(() => {
    if (!selectedModuleData || !zoomedMetric) return [];
    let queries = selectedModuleData.queries.filter((query) => {
      const metric = query.metrics.find((candidate) => metricIdentity(candidate) === zoomedMetric);
      return metric !== undefined && isEvaluatedMetric(metric);
    });
    if (selectedScoreRange) {
      queries = queries.filter((q) => {
        const metric = q.metrics.find((m) => metricIdentity(m) === zoomedMetric)!;
        if (!isEvaluatedMetric(metric)) return false;
        const score = metric.score;
        return (
          score >= selectedScoreRange[0] &&
          score <= selectedScoreRange[1]
        );
      });
    }
    return queries
      .flatMap((q) => {
        const metric = q.metrics.find((m) => metricIdentity(m) === zoomedMetric);
        return metric && isEvaluatedMetric(metric)
          ? [{ query: q.query, score: metric.score, unit: metric.unit }]
          : [];
      })
      .sort((a, b) => b.score - a.score);
  }, [selectedModuleData, zoomedMetric, selectedScoreRange]);

  const handleDotClick = (payload: any) => {
    if (payload && payload.dataKey && payload.payload) {
      const clickedData = payload.payload;
      
      if (clickedData.timestamp && !clickedData.date.startsWith('...')) {
        setSelectedTimestamp(clickedData.timestamp);
        setSelectedModule(payload.dataKey);
        setZoomedMetric(null);
      }
    }
  };

  const handleZoomClick = (metricName: string) => {
    setZoomedMetric(metricName);
    setSelectedScoreRange(null);
  };
  const handleZoomOut = () => setZoomedMetric(null);
  const handleFrequencyBarClick = (data: any) => {
    if (data && typeof data.start === 'number' && typeof data.end === 'number') {
      setSelectedScoreRange([data.start, data.end]);
    }
  };

  const handleRetryFetch = () => {
      console.log('Manual Retry: Sending start!');
      socket.send({ topic: 'start!', flow_id: 'loop_graph' });
  };

  if (evaluationRuns.length === 0 && !isDataLoaded) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: '20px',
          color: 'white',
        }}
      >
        <h2>데이터를 기다리는 중...</h2>
        <p>서버와 연결되었으나 데이터가 오지 않는다면 아래 버튼을 눌러보세요.</p>
        <button
          onClick={handleRetryFetch}
          style={{
            padding: '10px 20px',
            backgroundColor: '#4f46e5',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
          }}
        >
          데이터 수동 요청 (Retry)
        </button>
      </div>
    );
  }

  return (
    <DashboardView
      kpiData={kpiData}
      zoomedMetric={zoomedMetric}
      selectedDate={displayDate}
      selectedModule={selectedModule}
      zoomedFrequencyData={zoomedFrequencyData}
      modulePerformanceData={modulePerformanceData}
      handleDotClick={handleDotClick}
      handleFrequencyBarClick={handleFrequencyBarClick}
      moduleColors={CHART_COLORS}
      detailedQueryData={detailedQueryData}
      selectedScoreRange={selectedScoreRange}
      metricDistributionData={metricDistributionData}
      handleZoomClick={handleZoomClick}
      handleZoomOut={handleZoomOut}
      allModuleNames={allModuleNames}
      metricPerformanceBreakdownData={metricPerformanceBreakdownData}
      evaluatorHealth={selectedRun?.evaluatorHealth}
      diagnosticObservations={selectedRun?.observations || []}
      diagnosticInferences={selectedRun?.inferences || []}
      configFingerprint={selectedRun?.configFingerprint || null}
      executionTrace={selectedRun?.executionTrace || []}
      graphHealth={selectedRun?.graphHealth}
    />
  );
};
