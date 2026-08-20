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
        overallScore: 'N/A',
        performanceChange: { value: 'N/A', isPositive: true },
        worstModule: 'N/A',
        evaluatorCoverage: 'N/A',
      };

    const latestRun = evaluationRuns[evaluationRuns.length - 1];
    const evaluatorCoverage = latestRun.evaluatorHealth.coverage === null
      ? 'N/A'
      : `${(latestRun.evaluatorHealth.coverage * 100).toFixed(1)}%`;
    let totalScore = 0,
      metricCount = 0;

    latestRun.modules.forEach((m) => {
      if (!m.isStarter) {
        m.queries.forEach((q) =>
          q.metrics.forEach((metric) => {
            if (!isEvaluatedMetric(metric)) return;
            totalScore += metric.score;
            metricCount++;
          })
        );
      }
    });

    const overallScore = metricCount > 0 ? `${(totalScore / metricCount).toFixed(1)}%` : 'N/E';

    let performanceChange = { value: 'N/A', isPositive: true };
    if (evaluationRuns.length > 1) {
      const previousRun = evaluationRuns[evaluationRuns.length - 2];
      let prevTotalScore = 0,
        prevMetricCount = 0;

      previousRun.modules.forEach((m) => {
        if (!m.isStarter) {
          m.queries.forEach((q) =>
            q.metrics.forEach((metric) => {
              if (!isEvaluatedMetric(metric)) return;
              prevTotalScore += metric.score;
              prevMetricCount++;
            })
          );
        }
      });

      if (metricCount > 0 && prevMetricCount > 0) {
        const latestAvg = totalScore / metricCount;
        const prevAvg = prevTotalScore / prevMetricCount;
        const change = latestAvg - prevAvg;
        performanceChange = { value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, isPositive: change >= 0 };
      }
    }

    let worstModule = 'N/A',
      minScore = Infinity;

    latestRun.modules.forEach((module) => {
      if (module.isStarter || module.queries.length === 0) return;
      let moduleTotalScore = 0,
        moduleMetricCount = 0;

      module.queries.forEach((q) =>
        q.metrics.forEach((m) => {
          if (!isEvaluatedMetric(m)) return;
          moduleTotalScore += m.score;
          moduleMetricCount++;
        })
      );

      if (moduleMetricCount === 0) return;
      const moduleAvgScore = moduleTotalScore / moduleMetricCount;
      if (moduleAvgScore < minScore) {
        minScore = moduleAvgScore;
        worstModule = module.moduleName;
      }
    });

    return { overallScore, performanceChange, worstModule, evaluatorCoverage };
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
          const scores = module.queries.flatMap((query) =>
            query.metrics.filter(isEvaluatedMetric).map((metric) => metric.score),
          );
          if (scores.length === 0) {
            entry[moduleName] = null;
            return;
          }
          hasData = true;
          const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
          entry[moduleName] = parseFloat(avgScore.toFixed(2));
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
      r.modules.forEach((m) => m.queries.forEach((q) => q.metrics.forEach((metric) => allMetrics.add(metric.name))))
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
            const metric = query.metrics.find((candidate) => candidate.name === metricName);
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
      const metric = query.metrics.find((candidate) => candidate.name === metricName);
      return metric && isEvaluatedMetric(metric) ? [metric.score] : [];
    });
    const bins = Array.from({ length: 11 }, (_, i) => i * 10);
    const freqMap = bins.slice(0, -1).map((binStart, i) => {
      const binEnd = bins[i + 1];
      const count = scores.filter((s) => s >= binStart && s < binEnd).length;
      return { range: `${binStart}-${binEnd}`, count };
    });
    const lastBin = freqMap[freqMap.length - 1];
    if (lastBin) {
      lastBin.count += scores.filter((s) => s === 100).length;
      lastBin.range = `90-100`;
    }
    return freqMap;
  };

  const metricDistributionData = useMemo(() => {
    if (!selectedModuleData) return [];
    const metricNames = selectedModuleData.queries.reduce((acc, q) => {
      q.metrics.forEach((m) => acc.add(m.name));
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
      const metric = query.metrics.find((candidate) => candidate.name === zoomedMetric);
      return metric !== undefined && isEvaluatedMetric(metric);
    });
    if (selectedScoreRange) {
      queries = queries.filter((q) => {
        const metric = q.metrics.find((m) => m.name === zoomedMetric)!;
        if (!isEvaluatedMetric(metric)) return false;
        const score = metric.score;
        return (
          score >= selectedScoreRange[0] &&
          score <= (selectedScoreRange[1] === 100 ? 100 : selectedScoreRange[1] - 0.01)
        );
      });
    }
    return queries
      .flatMap((q) => {
        const metric = q.metrics.find((m) => m.name === zoomedMetric);
        return metric && isEvaluatedMetric(metric) ? [{ query: q.query, score: metric.score }] : [];
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

  const handleZoomClick = (metricName: string) => setZoomedMetric(metricName);
  const handleZoomOut = () => setZoomedMetric(null);
  const handleFrequencyBarClick = (data: any) => {
    if (data && data.range) {
      const [start, end] = data.range.split('-').map(Number);
      setSelectedScoreRange([start, end]);
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
    />
  );
};
