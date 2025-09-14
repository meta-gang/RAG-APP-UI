// /src/pages/Dashboard/index.tsx
import React, { useState, useMemo } from 'react';
import { evaluationRuns } from '../../data/mockData';
import { QueryEvaluation } from '../../globals/types';
import { DashboardView } from './DashboardView';
import { CHART_COLORS } from '@styles/color';

const compressChartData = (data: any[], allModuleNames: string[], keyCheck: (item: any) => boolean) => {
    const compressedData = [];
    let consecutiveNulls = 0;
    for (let i = 0; i < data.length; i++) {
        if (keyCheck(data[i])) {
            if (consecutiveNulls > 2) {
                const ellipsisEntry: any = { date: `... (${consecutiveNulls} omitted)` };
                allModuleNames.forEach(name => { ellipsisEntry[name] = null; });
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

export const DashboardPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(evaluationRuns[evaluationRuns.length - 1].date);
    const [selectedModule, setSelectedModule] = useState<string>(evaluationRuns[evaluationRuns.length - 1].modules[0].moduleName);
    const [zoomedMetric, setZoomedMetric] = useState<string | null>(null);
    const [selectedScoreRange, setSelectedScoreRange] = useState<[number, number] | null>(null);

    const allModuleNames = useMemo(() => {
        const names = new Set<string>();
        evaluationRuns.forEach(run => { run.modules.forEach(module => names.add(module.moduleName)); });
        return Array.from(names);
    }, []);
    
    const kpiData = useMemo(() => {
        if (evaluationRuns.length === 0) return { overallScore: 'N/A', performanceChange: { value: 'N/A', isPositive: true }, worstModule: 'N/A' };
        const latestRun = evaluationRuns[evaluationRuns.length - 1];
        let totalScore = 0, metricCount = 0;
        latestRun.modules.forEach(m => m.queries.forEach(q => q.metrics.forEach(metric => {
            totalScore += metric.score;
            metricCount++;
        })));
        const overallScore = metricCount > 0 ? `${(totalScore / metricCount * 100).toFixed(1)}%` : '0%';
        let performanceChange = { value: '+0.0%', isPositive: true };
        if (evaluationRuns.length > 1) {
            const previousRun = evaluationRuns[evaluationRuns.length - 2];
            let prevTotalScore = 0, prevMetricCount = 0;
            previousRun.modules.forEach(m => m.queries.forEach(q => q.metrics.forEach(metric => {
                prevTotalScore += metric.score;
                prevMetricCount++;
            })));
            const latestAvg = metricCount > 0 ? totalScore / metricCount : 0;
            const prevAvg = prevMetricCount > 0 ? prevTotalScore / prevMetricCount : 0;
            const change = (latestAvg - prevAvg) * 100;
            performanceChange = { value: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`, isPositive: change >= 0 };
        }
        let worstModule = 'N/A', minScore = Infinity;
        latestRun.modules.forEach(module => {
            if (module.queries.length === 0) return;
            let moduleTotalScore = 0, moduleMetricCount = 0;
            module.queries.forEach(q => q.metrics.forEach(m => {
                moduleTotalScore += m.score;
                moduleMetricCount++;
            }));
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
        const rawData = evaluationRuns.map((run) => {
            const entry: { date: string; [key: string]: number | string | null } = { date: run.date };
            let hasData = false;
            allModuleNames.forEach((moduleName) => {
                const module = run.modules.find((m) => m.moduleName === moduleName);
                if (!module || module.queries.length === 0) {
                    entry[moduleName] = null;
                } else {
                    hasData = true;
                    const avgScore = module.queries.reduce((sum, q) => {
                        const metricCount = q.metrics.length;
                        if (metricCount === 0) return sum;
                        return sum + q.metrics.reduce((s, m) => s + m.score, 0) / metricCount;
                    }, 0) / module.queries.length;
                    entry[moduleName] = parseFloat((avgScore * 100).toFixed(2));
                }
            });
            return { ...entry, _hasData: hasData };
        });
        return compressChartData(rawData, allModuleNames, (item) => item._hasData);
    }, [allModuleNames]);

    const metricPerformanceBreakdownData = useMemo(() => {
        const breakdown: { [metricName: string]: any[] } = {};
        const allMetrics = new Set<string>();
        evaluationRuns.forEach(r => r.modules.forEach(m => m.queries.forEach(q => q.metrics.forEach(metric => allMetrics.add(metric.name)))));
        allMetrics.forEach(metricName => {
            const rawData = evaluationRuns.map(run => {
                const entry: { date: string, [key: string]: number | string | null } = { date: run.date };
                let hasData = false;
                allModuleNames.forEach(moduleName => {
                    const module = run.modules.find(m => m.moduleName === moduleName);
                    const scores = module?.queries.map(q => q.metrics.find(m => m.name === metricName)?.score).filter(s => s !== undefined) as number[] || [];
                    if (scores.length > 0) {
                        hasData = true;
                        const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
                        entry[moduleName] = parseFloat((avgScore * 100).toFixed(2));
                    } else {
                        entry[moduleName] = null;
                    }
                });
                return { ...entry, _hasData: hasData };
            });
            breakdown[metricName] = compressChartData(rawData, allModuleNames, (item) => item._hasData);
        });
        return breakdown;
    }, [allModuleNames]);

    const getFrequencyData = (queries: QueryEvaluation[], metricName: string) => {
        const scores = queries.map((q) => q.metrics.find((m) => m.name === metricName)?.score).filter((s) => s !== undefined).map((s) => s! * 100);
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
        let queries = selectedModuleData.queries.filter((q) => q.metrics.some((m) => m.name === zoomedMetric));
        if (selectedScoreRange) {
            queries = queries.filter((q) => {
                const score = q.metrics.find((m) => m.name === zoomedMetric)!.score * 100;
                return score >= selectedScoreRange[0] && score <= (selectedScoreRange[1] === 100 ? 100 : selectedScoreRange[1] - 0.01);
            });
        }
        return queries.map((q) => ({
            query: q.query,
            score: q.metrics.find((m) => m.name === zoomedMetric)!.score,
        })).sort((a, b) => b.score - a.score);
    }, [selectedModuleData, zoomedMetric, selectedScoreRange]);

    const handleDotClick = (payload: any) => {
        if (payload && payload.dataKey && payload.payload?.date && !payload.payload.date.startsWith('...')) {
            setSelectedDate(payload.payload.date);
            setSelectedModule(payload.dataKey);
            setZoomedMetric(null);
        }
    };
    
    const handleZoomClick = (metricName: string) => setZoomedMetric(metricName);
    const handleZoomOut = () => setZoomedMetric(null);
    const handleFrequencyBarClick = (data: any) => {
        if (data && data.range) {
            const [start, end] = data.range.split("-").map(Number);
            setSelectedScoreRange([start, end]);
        }
    };

    return (
        <DashboardView
            kpiData={kpiData}
            zoomedMetric={zoomedMetric}
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
            handleZoomClick={handleZoomClick}
            handleZoomOut={handleZoomOut}
            allModuleNames={allModuleNames}
            metricPerformanceBreakdownData={metricPerformanceBreakdownData}
        />
    );
};