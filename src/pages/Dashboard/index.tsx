// src/pages/Dashboard/index.tsx

// 대시보드 페이지의 메인 로직과 UI를 담당

import React, { useState, useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Maximize2, ArrowLeft } from 'lucide-react';
import { evaluationRuns } from '../../data/mockData'; // 데이터 분리
import { EvaluationRun, ModuleEvaluation, QueryEvaluation } from '../../globals/types'; // 타입 분리

export const DashboardPage: React.FC = () => {
    const [selectedDate, setSelectedDate] = useState<string>(evaluationRuns[evaluationRuns.length - 1].date);
    const [selectedModule, setSelectedModule] = useState<string>(evaluationRuns[evaluationRuns.length - 1].modules[0].moduleName);
    const [isZoomed, setIsZoomed] = useState(false);
    const [selectedBarMetric, setSelectedBarMetric] = useState<string | null>(null);
    const [selectedScoreRange, setSelectedScoreRange] = useState<[number, number] | null>(null);

    const selectedRun = useMemo(() => evaluationRuns.find((run) => run.date === selectedDate), [selectedDate]);
    const selectedModuleData = useMemo(() => selectedRun?.modules.find((m) => m.moduleName === selectedModule), [selectedRun, selectedModule]);

    const modulePerformanceData = useMemo(() => {
        const data: { date: string; [key: string]: number | string }[] = [];
        evaluationRuns.forEach((run) => {
        const entry: { date: string; [key: string]: number | string } = {
            date: run.date,
        };
        run.modules.forEach((module) => {
            const totalQueries = module.queries.length;
            if (totalQueries === 0) {
            entry[module.moduleName] = 0;
            return;
            }
            const avgScore =
            module.queries.reduce((sum, q) => {
                const metricCount = q.metrics.length;
                if (metricCount === 0) return sum;
                return (
                sum + q.metrics.reduce((s, m) => s + m.score, 0) / metricCount
                );
            }, 0) / totalQueries;
            entry[module.moduleName] = parseFloat((avgScore * 100).toFixed(2));
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

    const handleLineChartClick = (data: any) => {
        // data 객체와 activePayload(클릭된 지점의 정보)가 유효한지 확인
        if (data && data.activePayload && data.activePayload.length > 0) {
            const clickedDate = data.activePayload[0].payload.date; // 클릭된 데이터의 'date'
            const clickedModule = data.activePayload[0].dataKey; // 클릭된 라인의 'moduleName'

            // 혹시 모를 비정상적인 데이터 클릭 방지
            const runExists = evaluationRuns.some(
                (run) =>
                run.date === clickedDate &&
                run.modules.some((m) => m.moduleName === clickedModule)
            );
            if (!runExists) return;

            // 상태 업데이트 -> 이로 인해 오른쪽 패널이 리렌더링 됨
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

    const handleFrequencyBarClick = (data: any) => {
        // data 객체와 range(점수 범위) 정보가 있는지 확인
        if (data && data.range) {
            const [start, end] = data.range.split("-").map(Number);
            // 점수 범위 상태 업데이트 -> 이로 인해 오른쪽 쿼리 목록이 필터링됨
            setSelectedScoreRange([start, end]);
        }
    };

    const moduleColors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#a4de6c", "#d0ed57"];

    return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-full">
            <h2 className="text-xl font-semibold text-white mb-4">
              {isZoomed
                ? `[Zoomed] ${selectedBarMetric} Score Distribution on ${selectedDate}`
                : "RAG Performance Change"}
            </h2>
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
                <LineChart
                  data={modulePerformanceData}
                  onClick={handleLineChartClick}
                >
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
                        activeDot={{ r: 8, style: { cursor: 'pointer' } }}
                        connectNulls
                      />
                    ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-gray-800 p-4 rounded-xl border border-gray-700 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2
                className="text-xl font-semibold text-white truncate"
                title={
                  isZoomed
                    ? `Queries for ${selectedBarMetric}`
                    : `${selectedModule} on ${selectedDate}`
                }
              >
                {isZoomed
                  ? `Queries for ${selectedBarMetric}`
                  : `${selectedModule} on ${selectedDate}`}
              </h2>
              {isZoomed && (
                <button
                  onClick={() => {
                    setIsZoomed(false);
                    setSelectedBarMetric(null);
                    setSelectedScoreRange(null);
                  }}
                  className="text-gray-400 hover:text-white flex-shrink-0 ml-2"
                >
                  <ArrowLeft size={18} />
                </button>
              )}
            </div>
            {isZoomed ? (
              <div className="space-y-2 overflow-y-auto h-[370px] pr-2">
                <p className="text-xs text-gray-400 pb-2">
                  Showing {detailedQueryData?.length || 0} queries with scores in
                  range:{" "}
                  {selectedScoreRange
                    ? `${selectedScoreRange[0]}-${selectedScoreRange[1]}`
                    : "All"}
                </p>
                {detailedQueryData?.map((q, i) => (
                  <div key={i} className="bg-gray-700 p-3 rounded-lg">
                    <p
                      className="text-sm font-semibold text-cyan-400 truncate"
                      title={q.query}
                    >
                      Query: {q.query}
                    </p>
                    <div className="flex justify-between text-xs mt-1">
                      <span className="text-gray-300">{selectedBarMetric}</span>
                      <span className="font-mono text-white">
                        {(q.score * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto h-[370px] pr-2">
                {metricDistributionData.length > 0 ? (
                  metricDistributionData.map((metric) => (
                    <div key={metric.metricName}>
                      <div className="flex justify-between items-center mb-1">
                        <h3 className="text-md font-semibold text-white">
                          {metric.metricName}
                        </h3>
                        <button
                          onClick={() => handleZoomClick(metric.metricName)}
                          className="text-gray-400 hover:text-white"
                        >
                          <Maximize2 size={16} />
                        </button>
                      </div>
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
                  <p className="text-gray-400 text-center pt-10">
                    No metric data available for this module on this date.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Metric Performance Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(metricPerformanceBreakdownData).map(([metricName, data]) => (
            <div
              key={metricName}
              className="bg-gray-800 p-4 rounded-xl border border-gray-700"
            >
              <h3 className="text-lg font-semibold text-white mb-2">
                {metricName}
              </h3>
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
            </div>
          ))}
        </div>
      </div>
    </div>
    );
};