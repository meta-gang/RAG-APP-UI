// /src/pages/Dashboard/index.tsx
import React, { useState, useMemo } from 'react';
import { evaluationRuns } from '../../data/mockData';
import { QueryEvaluation } from '../../globals/types';
import { DashboardView } from './DashboardView';
import { CHART_COLORS } from '@styles/color';

export const DashboardPage: React.FC = () => {
    // ... (기존 state 및 useMemo 로직은 그대로 유지)
    const [selectedDate, setSelectedDate] = useState<string>(evaluationRuns[evaluationRuns.length - 1].date);
    const [selectedModule, setSelectedModule] = useState<string>(evaluationRuns[evaluationRuns.length - 1].modules[0].moduleName);
    
    const allModuleNames = useMemo(() => {
        const names = new Set<string>();
        evaluationRuns.forEach(run => {
            run.modules.forEach(module => names.add(module.moduleName));
        });
        return Array.from(names);
    }, []);
    
    const [isZoomed, setIsZoomed] = useState(false);
    const [selectedBarMetric, setSelectedBarMetric] = useState<string | null>(null);
    const [selectedScoreRange, setSelectedScoreRange] = useState<[number, number] | null>(null);

    // ... (기존 useMemo 로직들은 그대로 유지)
    
    // Step 1: KPI 계산 로직 추가
    const kpiData = useMemo(() => {
        // 데이터가 비어있으면 계산하지 않음
        if (evaluationRuns.length === 0) {
            return {
                overallScore: 'N/A',
                performanceChange: { value: 'N/A', isPositive: true },
                worstModule: 'N/A',
            };
        }

        // 최신 평가 데이터 가져오기
        const latestRun = evaluationRuns[evaluationRuns.length - 1];
        
        // 1. 전체 평균 점수 계산
        let totalScore = 0;
        let metricCount = 0;
        latestRun.modules.forEach(module => {
            module.queries.forEach(query => {
                query.metrics.forEach(metric => {
                    totalScore += metric.score;
                    metricCount++;
                });
            });
        });
        const overallScore = metricCount > 0 ? (totalScore / metricCount * 100).toFixed(1) + '%' : '0%';

        // 2. 최근 7일(이전 데이터 대비) 성능 변화율 계산
        let performanceChange = { value: '+0.0%', isPositive: true };
        if (evaluationRuns.length > 1) {
            const previousRun = evaluationRuns[evaluationRuns.length - 2];
            let previousTotalScore = 0;
            let previousMetricCount = 0;
            previousRun.modules.forEach(module => {
                module.queries.forEach(query => {
                    query.metrics.forEach(metric => {
                        previousTotalScore += metric.score;
                        previousMetricCount++;
                    });
                });
            });
            const latestAvg = metricCount > 0 ? totalScore / metricCount : 0;
            const previousAvg = previousMetricCount > 0 ? previousTotalScore / previousMetricCount : 0;
            const change = (latestAvg - previousAvg) * 100;
            performanceChange = {
                value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
                isPositive: change >= 0,
            };
        }

        // 3. 가장 성능이 낮은 모듈 찾기
        let worstModule = 'N/A';
        let minScore = Infinity;
        latestRun.modules.forEach(module => {
            if (module.queries.length === 0) return;
            let moduleTotalScore = 0;
            let moduleMetricCount = 0;
            module.queries.forEach(query => {
                query.metrics.forEach(metric => {
                    moduleTotalScore += metric.score;
                    moduleMetricCount++;
                });
            });
            const moduleAvgScore = moduleMetricCount > 0 ? moduleTotalScore / moduleMetricCount : 0;
            if (moduleAvgScore < minScore) {
                minScore = moduleAvgScore;
                worstModule = module.moduleName;
            }
        });

        return { overallScore, performanceChange, worstModule };
    }, []);
    
    const selectedRun = useMemo(() => evaluationRuns.find((run) => run.date === selectedDate), [selectedDate]);
    const selectedModuleData = useMemo(() => selectedRun?.modules.find((m) => m.moduleName === selectedModule), [selectedRun, selectedModule]);

    const modulePerformanceData = useMemo(() => {
        const data: { date: string; [key: string]: number | string | null }[] = [];
        evaluationRuns.forEach((run) => {
        const entry: { date: string; [key: string]: number | string | null } = {
            date: run.date,
        };
        allModuleNames.forEach((moduleName) => {
            const module = run.modules.find((m) => m.moduleName === moduleName);
            if (!module) {
                entry[moduleName] = null;
            } else {
                const totalQueries = module.queries.length;
                if (totalQueries === 0) {
                entry[moduleName] = 0;
                } else {
                const avgScore =
                    module.queries.reduce((sum, q) => {
                    const metricCount = q.metrics.length;
                    if (metricCount === 0) return sum;
                    return sum + q.metrics.reduce((s, m) => s + m.score, 0) / metricCount;
                    }, 0) / totalQueries;
                entry[moduleName] = parseFloat((avgScore * 100).toFixed(2));
                }
            }
            });
            data.push(entry);
        });
        return data;
    }, []);

    const metricPerformanceBreakdownData = useMemo(() => {
        interface BreakdownEntry {
            date: string;
            [moduleName: string]: number | string;
        }
        const breakdown: { [metricName: string]: BreakdownEntry[] } = {};

        evaluationRuns.forEach(run => {
            run.modules.forEach(module => {
                module.queries.forEach(query => {
                    query.metrics.forEach(metric => {
                        if (!breakdown[metric.name]) {
                            breakdown[metric.name] = [];
                        }
                        let dateEntry = breakdown[metric.name].find(d => d.date === run.date);
                        if (!dateEntry) {
                            dateEntry = { date: run.date };
                            breakdown[metric.name].push(dateEntry);
                        }
                        dateEntry[module.moduleName] = parseFloat((metric.score * 100).toFixed(2));
                    });
                });
            });
        });

        Object.values(breakdown).forEach(dataArray => {
            dataArray.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        });

        return breakdown;
    }, []);

    const getFrequencyData = (queries: QueryEvaluation[], metricName: string) => {
        const scores = queries
        .map((q) => q.metrics.find((m) => m.name === metricName)?.score)
        .filter((s) => s !== undefined)
        .map((s) => s! * 100);

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
        if (!selectedModuleData || !selectedBarMetric) return [];
        return getFrequencyData(selectedModuleData.queries, selectedBarMetric);
    }, [selectedModuleData, selectedBarMetric]);

    const detailedQueryData = useMemo(() => {
        if (!selectedModuleData || !selectedBarMetric) return [];

        let queries = selectedModuleData.queries.filter((q) =>
        q.metrics.some((m) => m.name === selectedBarMetric)
        );

        if (selectedScoreRange) {
        queries = queries.filter((q) => {
            const score =
            q.metrics.find((m) => m.name === selectedBarMetric)!.score * 100;
            if (selectedScoreRange[1] === 100) {
            return (
                score >= selectedScoreRange[0] && score <= selectedScoreRange[1]
            );
            }
            return score >= selectedScoreRange[0] && score < selectedScoreRange[1];
        });
        }
        return queries
        .map((q) => ({
            query: q.query,
            score: q.metrics.find((m) => m.name === selectedBarMetric)!.score,
        }))
        .sort((a, b) => b.score - a.score);
    }, [selectedModuleData, selectedBarMetric, selectedScoreRange]);

    const handleDotClick = (payload: any) => {
        if (payload && payload.dataKey && payload.payload?.date) {
            const clickedDate = payload.payload.date;
            const clickedModule = payload.dataKey;
            
            setSelectedDate(clickedDate);
            setSelectedModule(clickedModule);
            setIsZoomed(false);
            setSelectedBarMetric(null);
            setSelectedScoreRange(null);
        }
    };

    const handleZoomClick = (metricName: string) => {
        setIsZoomed(true);
        setSelectedBarMetric(metricName);
        setSelectedScoreRange(null);
    };
    
    const handleZoomOut = () => {
        setIsZoomed(false);
        setSelectedBarMetric(null);
        setSelectedScoreRange(null);
    };

    const handleFrequencyBarClick = (data: any) => {
        if (data && data.range) {
            const [start, end] = data.range.split("-").map(Number);
            setSelectedScoreRange([start, end]);
        }
    };

    return (
        <DashboardView
            // Step 2: 계산된 kpiData를 props로 전달
            kpiData={kpiData}
            isZoomed={isZoomed}
            selectedBarMetric={selectedBarMetric}
            selectedDate={selectedDate}
            selectedModule={selectedModule}
            zoomedFrequencyData={zoomedFrequencyData}
            modulePerformanceData={modulePerformanceData}
            handleDotClick={handleDotClick}
            handleFrequencyBarClick={handleFrequencyBarClick}
            moduleColors={CHART_COLORS}
            detailedQueryData={detailedQueryData}
            selectedScoreRange={selectedScoreRange}
            metricDistributionData={metricDistributionData}
            metricPerformanceBreakdownData={metricPerformanceBreakdownData}
            handleZoomClick={handleZoomClick}
            handleZoomOut={handleZoomOut}
            allModuleNames={allModuleNames}
        />
    );
};