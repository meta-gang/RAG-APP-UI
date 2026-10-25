import { normalizeMetric } from '../Dashboard/transformData';
import { metricIdentity } from '../Dashboard/analysis';
import type { TestQueryState } from '../../globals/recoil/atoms';

/** Every query in a batched result is consumed once, including failed and metric-free queries. */
export function appendLiveResult(previous: TestQueryState, states: Record<string, any>): TestQueryState {
  const result: TestQueryState = {
    ...previous,
    messages: [...previous.messages],
    metrics: previous.metrics.map((g) => ({ ...g, metrics: [...g.metrics] })),
    liveMetricsHistory: [...previous.liveMetricsHistory],
    processedQueryIds: [...(previous.processedQueryIds || [])],
  };
  for (const [queryId, state] of Object.entries(states || {})) {
    if (!state || typeof state !== 'object' || result.processedQueryIds!.includes(queryId)) continue;
    result.processedQueryIds!.push(queryId);
    const failed = state.execution_summary?.terminated === true;
    const query = typeof state.query === 'string' ? state.query : '질문 정보 없음';
    result.messages.push({
      sender: 'bot',
      text: `질문: ${query}\n${failed ? `실행 실패 (${state.execution_summary?.termination_reason || '원인 미기록'}). 저장된 진단을 확인하세요.` : state.gen || '답변이 기록되지 않았습니다.'}`,
    });
    const groups: { moduleName: string; metrics: ReturnType<typeof normalizeMetric>[] }[] = [];
    Object.entries(state.snapshots || {}).forEach(([moduleName, snapshots]) => {
      if (!Array.isArray(snapshots)) return;
      snapshots.forEach((snapshot, index) => {
        const metrics = Array.isArray(snapshot?.performances)
          ? snapshot.performances.map((p: any) => normalizeMetric(p))
          : [];
        if (metrics.length) groups.push({ moduleName: `${moduleName}#${index + 1}`, metrics });
      });
    });
    if (Array.isArray(state.performances) && state.performances.length)
      groups.push({
        moduleName: 'E2E-Metrics',
        metrics: state.performances.map((p: any) => normalizeMetric(p, 'Unknown E2E')),
      });
    const chart: any = { queryNumber: result.liveMetricsHistory.length + 1, query, queryId };
    groups.forEach((group) => {
      const existing = result.metrics.find((g) => g.moduleName === group.moduleName && g.queryId === queryId);
      if (existing) existing.metrics.push(...group.metrics);
      else result.metrics.push({ ...group, queryId, query });
      group.metrics.forEach((metric) => {
        if (metric.didEval && metric.score !== null)
          chart[`${group.moduleName} · ${metricIdentity(metric)}`] = metric.score;
      });
    });
    result.liveMetricsHistory.push(chart);
  }
  return result;
}
export function statusKey(moduleId: string, queryId?: string) {
  return queryId ? `${queryId}::${moduleId}` : moduleId;
}
export function normalizedStatus(message: any): string {
  if (message.status === 'failed' || message.statu === 'failed') return 'failed';
  if (message.status === 'completed' || message.statu === 'completed' || message.statu === 'end') return 'completed';
  if (message.statu === 'start' || message.statu === 'running' || message.status === 'running') return 'loading';
  return 'pending';
}
