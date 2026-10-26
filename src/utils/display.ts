import type { EvaluationRun, ExecutionTraceEvent, MetricScore } from '../globals/types';
import { metricIdentity } from '../pages/Dashboard/analysis';

export const metricTitle = (metric: MetricScore): string =>
  `${metric.name}${metric.unit ? ` [${metric.unit}]` : ' [단위 없음]'}`;

/** Display names are independent of the identity used for calculation and pairing. */
export class MetricDisplayNames {
  private settings = new Map<string, Map<string, number>>();
  labelsFor(metrics: MetricScore[]): Record<string, string> {
    const unique = new Map(metrics.map((metric) => [metricIdentity(metric), metric]));
    // Sorting makes the first assignment independent of source property order.
    Array.from(unique.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([identity, metric]) => {
        const title = metricTitle(metric);
        if (!this.settings.has(title)) this.settings.set(title, new Map());
        const variants = this.settings.get(title)!;
        if (!variants.has(identity)) variants.set(identity, variants.size + 1);
      });
    return Object.fromEntries(
      Array.from(unique.entries()).map(([identity, metric]) => {
        const title = metricTitle(metric),
          variants = this.settings.get(title)!;
        return [identity, variants.size > 1 ? `${title} · 평가 설정 ${variants.get(identity)}` : title];
      }),
    );
  }
}

export const metricDisplayCatalog = new MetricDisplayNames();

export const runKey = (run: EvaluationRun): string => run.runId || run.timestamp;
export function runDisplayNames(runs: EvaluationRun[]): Record<string, string> {
  return Object.fromEntries(
    [...runs]
      .sort((a, b) => a.date.localeCompare(b.date) || a.timestamp.localeCompare(b.timestamp))
      .map((run, index) => [
        runKey(run),
        `실행 ${index + 1} · ${/^\d{4}-\d{2}-\d{2}/.test(run.date) ? run.date : '시각 미기록'}`,
      ]),
  );
}
export function questionDisplayName(query: string | undefined, number: number): string {
  return `질문 ${number}${typeof query === 'string' && query.trim() ? ` · ${query}` : ''}`;
}

/** Known stage names explain purpose; opaque source identifiers stay in technical details. */
export function moduleDisplayName(id: string, number = 1): string {
  const [base, repetition] = id.split('#');
  const known: Record<string, string> = {
    starter: '질문 입력',
    input: '질문 입력',
    ret: '검색',
    retriever: '검색',
    retrieval: '검색',
    generation: '답변 생성',
    generator: '답변 생성',
    gen: '답변 생성',
    output: '답변 출력',
    final: '답변 출력',
    rewrite: '질문 재작성',
    critic: '답변 검증',
    'E2E-Metrics': '전체 흐름',
  };
  const opaque = /^[\da-f-]{16,}$/i.test(base) || base.length > 48 || base.includes('://');
  const title = known[base] || (opaque ? `모듈 ${number}` : base.replace(/_/g, ' '));
  return repetition && /^\d+$/.test(repetition) ? `${title} · ${repetition}회차` : title;
}
export function moduleDisplayNames(ids: string[]): Record<string, string> {
  const unique = Array.from(new Set(ids)),
    bases = Array.from(new Set(unique.map((id) => id.split('#')[0])));
  const titles = bases.map((base, index) => moduleDisplayName(base, index + 1));
  return Object.fromEntries(
    unique.map((id) => {
      const [base, repetition] = id.split('#'),
        index = bases.indexOf(base),
        title = titles[index];
      const matching = bases.filter((_, i) => titles[i] === title);
      const distinct = matching.length > 1 ? `${title} ${matching.indexOf(base) + 1}` : title;
      return [id, repetition && /^\d+$/.test(repetition) ? `${distinct} · ${repetition}회차` : distinct];
    }),
  );
}
export function statusDisplayName(status: string): string {
  return (
    (
      { completed: '완료', failed: '실패', running: '실행 중', pending: '대기', unknown: '상태 미기록' } as Record<
        string,
        string
      >
    )[status] || '상태 확인 필요'
  );
}
export function terminationDisplayName(reason: string): string {
  return (
    (
      {
        answer: '답변 완료',
        module_error: '모듈 실행 실패',
        scheduler_error: '다음 단계 연결 실패',
        max_steps: '최대 실행 단계 도달',
        missing_output: '최종 답변 없음',
      } as Record<string, string>
    )[reason] || '종료 상세 확인 필요'
  );
}
export function traceDisplayRows(trace: ExecutionTraceEvent[], modules: Record<string, string>, queryOrder?: string[]) {
  const queries = Array.from(new Set([...(queryOrder || []), ...trace.map((event) => event.queryId)]));
  return trace.map((event) => {
    const sameQuery = trace.filter((other) => other.queryId === event.queryId);
    const step = (id: string) => {
      const index = sameQuery.findIndex((other) => other.executionId === id);
      return index < 0
        ? '이전 단계 미기록'
        : `단계 ${index + 1} (${modules[sameQuery[index].moduleId] || moduleDisplayName(sameQuery[index].moduleId)})`;
    };
    return {
      event,
      questionLabel: questionDisplayName(event.query, queries.indexOf(event.queryId) + 1),
      stepLabel: step(event.executionId),
      moduleLabel: `${modules[event.moduleId] || moduleDisplayName(event.moduleId)} · ${event.executionIndex}회차`,
      parentLabels: event.parentExecutionIds.map(step),
      nextLabels: event.nextModules.map((id) => modules[id] || moduleDisplayName(id)),
      statusLabel: statusDisplayName(event.status),
    };
  });
}

export function liveSeriesDisplayNames(
  groups: { moduleName: string; metrics: MetricScore[] }[],
  metricLabels: Record<string, string>,
  moduleLabels: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    groups.flatMap((group) =>
      group.metrics.map((metric) => [
        `${group.moduleName} · ${metricIdentity(metric)}`,
        `${moduleLabels[group.moduleName] || moduleDisplayName(group.moduleName)} · ${metricLabels[metricIdentity(metric)] || metricTitle(metric)}`,
      ]),
    ),
  );
}
export function directionDisplayName(direction: string | null | undefined): string {
  return (
    (
      {
        higher: '높을수록 좋음',
        lower: '낮을수록 좋음',
        higher_is_better: '높을수록 좋음',
        lower_is_better: '낮을수록 좋음',
      } as Record<string, string>
    )[direction || ''] || '지표 설명 확인'
  );
}
