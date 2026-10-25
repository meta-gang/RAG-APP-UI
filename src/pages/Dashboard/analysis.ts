import type { EvaluationRun, MetricScore, QueryEvaluation } from '../../globals/types';

export const isEvaluatedMetric = (metric: MetricScore): metric is MetricScore & { score: number } =>
  metric.didEval && metric.score !== null && Number.isFinite(metric.score);

/** Keep evaluator/version changes as separate chart series even when names match. */
export function metricIdentity(metric: MetricScore): string {
  const evaluator = metric.evaluator;
  const models = Array.isArray(evaluator?.adapters)
    ? evaluator!.adapters
        .filter((a: any) => a && typeof a === 'object' && !Array.isArray(a))
        .map(
          (a: any) =>
            `${typeof a.role === 'string' ? a.role : 'adapter'}:${typeof a.model === 'string' ? a.model : typeof a.implementation === 'string' ? a.implementation : 'unknown'}`,
        )
        .sort()
        .join(',')
    : '';
  const identity = evaluatorIdentity(evaluator) || '';
  // The readable suffix remains available in titles; no credentials or prompt text are included.
  const suffix = [
    metric.metricVersion && `v${metric.metricVersion}`,
    models,
    identity && `config:${evaluator?.fingerprint || 'legacy'}:${stableHash(identity)}`,
  ]
    .filter(Boolean)
    .join(' · ');
  return `${metric.name} [${metric.unit || 'unitless'}]${suffix ? ` · ${suffix}` : ''}`;
}
export function evaluatorIdentity(evaluator?: Record<string, any>): string | null {
  const canonical = (value: any): any =>
    Array.isArray(value)
      ? value.map(canonical)
      : value && typeof value === 'object'
        ? Object.fromEntries(
            Object.keys(value)
              .sort()
              .map((key) => [key, canonical(value[key])]),
          )
        : value;
  return evaluator ? JSON.stringify(canonical(evaluator)) : null;
}
function stableHash(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) hash = Math.imul(hash ^ value.charCodeAt(i), 16777619);
  return (hash >>> 0).toString(16);
}

export type Aggregation = 'step' | 'query' | 'final';
export type MetricSample = {
  query: string;
  queryId: string;
  answer: string;
  score: number;
  metric: MetricScore;
  executionIndex?: number;
};
export function metricSamples(queries: QueryEvaluation[], identity: string, aggregation: Aggregation): MetricSample[] {
  const grouped = new Map<string, QueryEvaluation[]>();
  queries.forEach((q, index) => {
    const key = q.queryId || `legacy:${q.query}`;
    grouped.set(key, [...(grouped.get(key) || []), q]);
  });
  if (aggregation === 'step')
    return queries.flatMap((q) =>
      q.metrics
        .filter((m) => metricIdentity(m) === identity && isEvaluatedMetric(m))
        .map((m) => ({
          query: q.query,
          queryId: q.queryId || q.query,
          answer: q.answer,
          score: m.score!,
          metric: m,
          executionIndex: q.executionIndex,
        })),
    );
  return Array.from(grouped.entries()).flatMap(([queryId, qs]) => {
    if (aggregation === 'final') {
      const last = [...qs].sort((a, b) => (a.executionIndex || 1) - (b.executionIndex || 1)).at(-1)!;
      const metric = last.metrics.find((m) => metricIdentity(m) === identity);
      return metric && isEvaluatedMetric(metric)
        ? [
            {
              query: last.query,
              queryId,
              answer: last.answer,
              score: metric.score,
              metric,
              executionIndex: last.executionIndex,
            },
          ]
        : [];
    }
    const samples = qs.flatMap((q) =>
      q.metrics.filter((m) => metricIdentity(m) === identity && isEvaluatedMetric(m)).map((m) => ({ q, m })),
    );
    if (!samples.length) return [];
    const last = samples.at(-1)!;
    return [
      {
        query: last.q.query,
        queryId,
        answer: last.q.answer,
        score: samples.reduce((sum, s) => sum + s.m.score!, 0) / samples.length,
        metric: last.m,
      },
    ];
  });
}
export type ScoreBin = { range: string; start: number; end: number; includeEnd: boolean; count: number };
export function inScoreBin(score: number, bin: Pick<ScoreBin, 'start' | 'end' | 'includeEnd'>): boolean {
  return score >= bin.start && (bin.includeEnd ? score <= bin.end : score < bin.end);
}
export function histogram(scores: number[]): ScoreBin[] {
  const finite = scores.filter(Number.isFinite);
  if (!finite.length) return [];
  const min = Math.min(...finite),
    max = Math.max(...finite);
  if (min === max) return [{ range: min.toPrecision(4), start: min, end: max, includeEnd: true, count: finite.length }];
  return Array.from({ length: 10 }, (_, i) => {
    const start = min + ((max - min) * i) / 10,
      end = i === 9 ? max : min + ((max - min) * (i + 1)) / 10;
    const bin = { start, end, includeEnd: i === 9 };
    return {
      ...bin,
      range: `${start.toPrecision(3)}–${end.toPrecision(3)}`,
      count: finite.filter((score) => inScoreBin(score, bin)).length,
    };
  });
}
export function selectedKpis(run?: EvaluationRun) {
  const health = run?.evaluatorHealth;
  return {
    evaluatedMetrics: health ? String(health.evaluated) : 'N/A',
    notEvaluatedMetrics: health ? String(health.notEvaluated) : 'N/A',
    evaluatorCoverage: health?.coverage == null ? 'N/A' : `${(health.coverage * 100).toFixed(1)}%`,
    traceExecutions: run ? String(run.graphHealth.totalExecutions) : 'N/A',
  };
}
export function formatRunTime(value: unknown): string {
  if (typeof value !== 'string' || !value) return '시각 정보 없음';
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    const instant = new Date(value);
    if (Number.isFinite(instant.getTime()))
      return (
        new Intl.DateTimeFormat('sv-SE', {
          timeZone: 'Asia/Seoul',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }).format(instant) + ' KST'
      );
  }
  const legacy = value.match(/^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\D.*)?$/);
  if (legacy) return `20${legacy[1]}-${legacy[2]}-${legacy[3]} ${legacy[4]}:${legacy[5]}:${legacy[6]}`;
  // Retain the timezone supplied by the backend rather than inferring the viewer's locale.
  return value;
}

/** Paired last-execution comparison. Judge changes form separate identities, never numeric improvements. */
export function compareModuleRuns(
  baseline: EvaluationRun | undefined,
  candidate: EvaluationRun | undefined,
  moduleName: string,
) {
  if (!baseline || !candidate || baseline.runId === candidate.runId) return [];
  const before = baseline.modules.find((m) => m.moduleName === moduleName)?.queries || [];
  const after = candidate.modules.find((m) => m.moduleName === moduleName)?.queries || [];
  const last = (qs: QueryEvaluation[]) => {
    const groups = new Map<string, QueryEvaluation>();
    qs.forEach((q) => {
      const key = q.queryId || q.sampleId || `legacy:${q.query}`;
      const old = groups.get(key);
      if (!old || (q.executionIndex || 1) >= (old.executionIndex || 1)) groups.set(key, q);
    });
    return Array.from(groups.values());
  };
  const left = last(before),
    right = last(after),
    remaining = [...right],
    pairs: [QueryEvaluation, QueryEvaluation][] = [];
  left.forEach((q) => {
    let i = q.sampleId ? remaining.findIndex((r) => q.sampleId === r.sampleId && q.query === r.query) : -1;
    if (i < 0 && !q.sampleId)
      i = remaining.findIndex((r) => q.queryId && q.queryId === r.queryId && q.query === r.query);
    if (i < 0 && !q.sampleId) i = remaining.findIndex((r) => !r.sampleId && r.query === q.query);
    if (i >= 0) pairs.push([q, remaining.splice(i, 1)[0]]);
  });
  const identities = Array.from(new Set([...left, ...right].flatMap((q) => q.metrics.map(metricIdentity))));
  return identities.map((identity) => {
    const eligible = pairs.flatMap(([a, b]) => {
      const x = a.metrics.find((m) => metricIdentity(m) === identity),
        y = b.metrics.find((m) => metricIdentity(m) === identity);
      return x &&
        y &&
        isEvaluatedMetric(x) &&
        isEvaluatedMetric(y) &&
        evaluatorIdentity(x.evaluator) === evaluatorIdentity(y.evaluator)
        ? [{ x, y }]
        : [];
    });
    const mean = (key: 'x' | 'y') =>
      eligible.length ? eligible.reduce((sum, p) => sum + p[key].score!, 0) / eligible.length : null;
    const baselineMean = mean('x'),
      candidateMean = mean('y');
    const evaluatorVerified = eligible.length > 0 && eligible.every((p) => !!p.x.evaluator && !!p.y.evaluator);
    return {
      identity,
      pairedQueries: pairs.length,
      evaluatedPairs: eligible.length,
      baselineQueries: left.length,
      candidateQueries: right.length,
      baselineMean,
      candidateMean,
      delta: evaluatorVerified && baselineMean !== null && candidateMean !== null ? candidateMean - baselineMean : null,
      evaluatorVerified,
      unmatchedQueries: left.length + right.length - 2 * pairs.length,
    };
  });
}
