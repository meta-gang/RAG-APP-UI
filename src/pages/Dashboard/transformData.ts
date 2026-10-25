import type {
  DiagnosticInference,
  DiagnosticObservation,
  EvaluationRun,
  ExecutionTraceEvent,
  MetricScore,
  ModuleEvaluation,
  QueryEvaluation,
} from '@type/index';
import { formatRunTime } from './analysis';

const field = (value: any, name: string) =>
  value?.[name] !== undefined ? value[name] : value?.[`_Performance__${name}`];
const object = (value: any): value is Record<string, any> =>
  value !== null && typeof value === 'object' && !Array.isArray(value);
const array = (value: any): any[] => (Array.isArray(value) ? value : []);
const string = (value: any, fallback = ''): string => (typeof value === 'string' ? value : fallback);

/** Preserve a successful zero while keeping malformed scores and explicit failures unevaluated. */
export function normalizeMetric(performance: any, fallbackName = 'Unknown'): MetricScore {
  const score = field(performance, 'score');
  const rawDidEval = performance?.didEval ?? field(performance, 'did_eval');
  const valid = typeof score === 'number' && Number.isFinite(score);
  const didEval = rawDidEval === undefined ? valid : rawDidEval === true && valid;
  const evaluator = field(performance, 'evaluator'),
    failure = field(performance, 'failure'),
    scope = field(performance, 'scope'),
    evidence = field(performance, 'evidence');
  const direction = field(performance, 'direction'),
    version = field(performance, 'metric_version');
  return {
    name: string(field(performance, 'metric'), fallbackName) || fallbackName,
    score: didEval ? score : null,
    didEval,
    unit: string(field(performance, 'unit')),
    ...(object(evaluator) && Object.keys(evaluator).length ? { evaluator } : {}),
    ...(object(failure)
      ? {
          failure: {
            type: string(failure.type, 'not_evaluated'),
            message: string(failure.message, '평가 실패 상세를 읽을 수 없습니다.'),
          },
        }
      : {}),
    ...(object(scope) && Object.keys(scope).length
      ? {
          scope: Object.fromEntries(
            Object.entries(scope).filter(
              ([, value]) =>
                typeof value === 'boolean' ||
                typeof value === 'string' ||
                (typeof value === 'number' && Number.isFinite(value)),
            ),
          ),
        }
      : {}),
    ...(Array.isArray(evidence) && evidence.length
      ? {
          evidence: evidence.filter(object).map((e) => ({
            claim_id: string(e.claim_id),
            claim: string(e.claim),
            ...(typeof e.grounded === 'boolean' ? { grounded: e.grounded } : {}),
            source_document_indices: array(e.source_document_indices).filter(
              (index) => Number.isInteger(index) && index >= 0,
            ),
            reason: string(e.reason),
          })),
        }
      : {}),
    ...(typeof direction === 'string' ? { direction } : {}),
    ...(typeof version === 'string' ? { metricVersion: version } : {}),
  };
}

/** Public and legacy history are normalized without inventing quality scores or successful queries. */
export function transformData(storage: any): EvaluationRun {
  const source = object(storage) ? storage : {};
  const states = object(source.states) ? source.states : {};
  const values = Object.values(states).filter(object);
  const metadata = values.map((s: any) => s.run_metadata).find(object) || {};
  const timestamp = String(source.ts || metadata.started_at || 'N/A');
  const modulesMap = new Map<string, ModuleEvaluation>();
  const observations: DiagnosticObservation[] = [],
    inferences: DiagnosticInference[] = [],
    executionTrace: ExecutionTraceEvent[] = [];
  const fingerprints = new Set<string>();
  const queryOutcomes: NonNullable<EvaluationRun['queryOutcomes']> = [];
  let terminatedQueries = 0;
  for (const [queryId, value] of Object.entries(states)) {
    if (!object(value)) continue;
    const q = value,
      queryText = typeof q.query === 'string' ? q.query : '질문 정보 없음',
      answerText = typeof q.gen === 'string' ? q.gen : '';
    const summary = object(q.execution_summary) ? q.execution_summary : {};
    const reason = typeof summary.termination_reason === 'string' ? summary.termination_reason : '';
    const status =
      summary.success === false || summary.terminated === true
        ? 'failed'
        : summary.success === true || reason === 'answer' || (answerText.trim() && !reason)
          ? 'succeeded'
          : 'unknown';
    queryOutcomes.push({ queryId, query: queryText, answer: answerText, status, reason });
    if (status === 'failed') terminatedQueries++;
    if (typeof q.run_metadata?.config_fingerprint === 'string') fingerprints.add(q.run_metadata.config_fingerprint);
    array(q.execution_trace)
      .filter(object)
      .forEach((event) =>
        executionTrace.push({
          query: queryText,
          queryId,
          executionId: string(event.execution_id, 'unknown'),
          moduleId: string(event.module_id, 'unknown'),
          executionIndex: Number.isInteger(event.execution_index) ? event.execution_index : 1,
          revisitCount: Number.isInteger(event.revisit_count) ? event.revisit_count : 0,
          parentExecutionIds: array(event.parent_execution_ids).filter((v) => typeof v === 'string'),
          status: string(event.status, 'unknown'),
          latencySeconds:
            typeof event.latency_seconds === 'number' && Number.isFinite(event.latency_seconds)
              ? event.latency_seconds
              : null,
          nextModules: array(event.next_modules).filter((v) => typeof v === 'string'),
          failureType: string(event.failure?.type),
        }),
      );
    array(q.diagnosis?.observations)
      .filter(object)
      .forEach((item) =>
        observations.push({
          code: string(item.code, 'unknown'),
          stage: string(item.stage, 'unknown'),
          message: string(item.message, '진단 메시지 없음'),
          module: typeof item.module === 'string' ? item.module : undefined,
          metric: typeof item.metric === 'string' ? item.metric : undefined,
          failureType: typeof item.failure_type === 'string' ? item.failure_type : undefined,
          query: queryText,
        }),
      );
    array(q.diagnosis?.inferences)
      .filter(object)
      .forEach((item) =>
        inferences.push({
          code: string(item.code, 'unknown'),
          possibleCause: string(item.possible_cause, '원인 정보 없음'),
          confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'low',
          nextAction: string(item.next_action, '기록된 근거를 확인하세요.'),
          query: queryText,
        }),
      );
    const snapshots = object(q.snapshots) ? q.snapshots : {};
    for (const [moduleName, rawSnapshots] of Object.entries(snapshots)) {
      array(rawSnapshots)
        .filter(object)
        .forEach((snapshot, index) => {
          const metrics = array(snapshot.performances).map((p) => normalizeMetric(p));
          // Starter metrics are real attempts too; only metric-free input nodes are omitted.
          if ((snapshot.is_starter === true || moduleName === 'starter') && !metrics.length) return;
          const executionIndex = index + 1;
          const event = executionTrace.find(
            (e) => e.queryId === queryId && e.moduleId === moduleName && e.executionIndex === executionIndex,
          );
          metrics.forEach((metric) => {
            const references = Array.isArray(metric.evaluator?.parameter_sources)
              ? metric.evaluator!.parameter_sources
              : [];
            const ref = references.find((r: any) => typeof r === 'string' && r.endsWith('.ret_docs'));
            if (!ref) return;
            const sourceModule = ref.slice(0, -'.ret_docs'.length);
            const ancestors = new Set<string>();
            const visit = (id: string) => {
              if (ancestors.has(id)) return;
              ancestors.add(id);
              const parent = executionTrace.find((e) => e.queryId === queryId && e.executionId === id);
              parent?.parentExecutionIds.forEach(visit);
            };
            event?.parentExecutionIds.forEach(visit);
            const sourceEvent = [...executionTrace]
              .reverse()
              .find(
                (e) =>
                  e.queryId === queryId &&
                  e.moduleId === sourceModule &&
                  (ancestors.has(e.executionId) || e.executionId === event?.executionId),
              );
            const packets = array(snapshots[sourceModule]);
            const packet =
              sourceModule === moduleName
                ? snapshot
                : sourceEvent
                  ? packets[sourceEvent.executionIndex - 1]
                  : undefined;
            const documents = packet?.data?.ret_docs;
            if (Array.isArray(documents) && documents.every((d) => typeof d === 'string'))
              metric.sourceDocuments = documents;
          });
          const entry: QueryEvaluation = {
            query: queryText,
            queryId,
            sampleId: typeof q.sample_id === 'string' ? q.sample_id : undefined,
            answer: typeof snapshot.data?.gen === 'string' ? snapshot.data.gen : answerText,
            metrics,
            executionIndex,
            executionId: event?.executionId,
          };
          if (!modulesMap.has(moduleName)) modulesMap.set(moduleName, { moduleName, queries: [], isStarter: false });
          modulesMap.get(moduleName)!.queries.push(entry);
        });
    }
    if (array(q.performances).length) {
      const name = 'E2E-Metrics';
      if (!modulesMap.has(name)) modulesMap.set(name, { moduleName: name, queries: [] });
      modulesMap.get(name)!.queries.push({
        query: queryText,
        queryId,
        sampleId: typeof q.sample_id === 'string' ? q.sample_id : undefined,
        answer: answerText,
        metrics: array(q.performances).map((p) => normalizeMetric(p, 'Unknown E2E')),
      });
    }
  }
  const all = Array.from(modulesMap.values()).flatMap((m) => m.queries.flatMap((q) => q.metrics));
  const evaluated = all.filter((m) => m.didEval && m.score !== null).length;
  return {
    date: formatRunTime(metadata.started_at || timestamp),
    timestamp,
    runId: string(source.run_id) || string(metadata.run_id) || timestamp,
    ...(typeof source.persisted === 'boolean' ? { persisted: source.persisted } : {}),
    modules: Array.from(modulesMap.values()),
    evaluatorHealth: {
      evaluated,
      notEvaluated: all.length - evaluated,
      coverage: all.length ? evaluated / all.length : null,
    },
    observations,
    inferences,
    configFingerprint: fingerprints.size === 1 ? Array.from(fingerprints)[0] : null,
    executionTrace,
    graphHealth: {
      totalExecutions: executionTrace.length,
      failedExecutions: executionTrace.filter((e) => e.status === 'failed').length,
      moduleRevisits: executionTrace.filter((e) => e.revisitCount > 0).length,
      cycleOrRetryObserved: executionTrace.some((e) => e.revisitCount > 0),
      terminatedQueries,
      totalLatencySeconds: executionTrace.reduce((s, e) => s + (e.latencySeconds || 0), 0),
    },
    queryOutcomes,
    pipelineHealth: {
      attempted: queryOutcomes.length,
      succeeded: queryOutcomes.filter((q) => q.status === 'succeeded').length,
      failed: queryOutcomes.filter((q) => q.status === 'failed').length,
      unknown: queryOutcomes.filter((q) => q.status === 'unknown').length,
    },
    ...(values.some((q) => object(q.evaluation_summary))
      ? {
          evaluationPlan: {
            notReachedE2E: values.reduce(
              (sum, q) =>
                sum +
                (Number.isFinite(q.evaluation_summary?.not_reached_e2e_metrics)
                  ? q.evaluation_summary.not_reached_e2e_metrics
                  : 0),
              0,
            ),
            notReachedModuleMetrics: values.reduce(
              (sum, q) =>
                sum +
                array(q.evaluation_summary?.not_reached_modules).reduce(
                  (n, m) => n + (Number.isFinite(m?.configured_metrics) ? m.configured_metrics : 0),
                  0,
                ),
              0,
            ),
            notReachedModules: Array.from(
              new Set(
                values.flatMap((q) =>
                  array(q.evaluation_summary?.not_reached_modules)
                    .map((m) => m.module_id)
                    .filter((v) => typeof v === 'string'),
                ),
              ),
            ),
          },
        }
      : {}),
    ...(values.some((q) => typeof q.execution_summary?.total_wall_seconds === 'number')
      ? {
          timing: {
            evaluatorSeconds: values.reduce(
              (sum, q) =>
                sum +
                (Number.isFinite(q.execution_summary?.evaluator_latency_seconds)
                  ? q.execution_summary.evaluator_latency_seconds
                  : 0),
              0,
            ),
            queryWallSecondsSum: values.reduce(
              (sum, q) =>
                sum +
                (Number.isFinite(q.execution_summary?.total_wall_seconds) ? q.execution_summary.total_wall_seconds : 0),
              0,
            ),
          },
        }
      : {}),
  };
}
