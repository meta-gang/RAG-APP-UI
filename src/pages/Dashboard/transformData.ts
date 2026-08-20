// src/pages/Dashboard/transformData.ts
import type {
  DiagnosticInference,
  DiagnosticObservation,
  EvaluationRun,
  ExecutionTraceEvent,
  MetricScore,
  ModuleEvaluation,
  QueryEvaluation,
} from '@type/index';

/**
 * 백엔드의 공개/레거시 직렬화 형식을 하나의 명시적 평가 상태로 정규화합니다.
 * 점수가 없거나 유한하지 않으면 0점으로 대체하지 않고 미평가로 유지합니다.
 */
export function normalizeMetric(performance: any, fallbackName = 'Unknown'): MetricScore {
  const rawScore = performance?.score !== undefined
    ? performance.score
    : performance?._Performance__score;
  const rawDidEval = performance?.didEval
    ?? performance?.did_eval
    ?? performance?._Performance__did_eval;
  const hasFiniteScore = typeof rawScore === 'number' && Number.isFinite(rawScore);
  const didEval = rawDidEval === undefined ? hasFiniteScore : rawDidEval === true && hasFiniteScore;

  return {
    name: performance?.metric || performance?._Performance__metric || fallbackName,
    score: didEval ? rawScore : null,
    didEval,
    unit: performance?.unit || performance?._Performance__unit || '',
  };
}

/**
 * 백엔드의 storage 객체를 프론트엔드 EvaluationRun 타입으로 변환합니다.
 * 백엔드의 _Performance__score 같은 private 변수명을 표준화합니다.
 *
 * @param storage 백엔드 rag-result-data의 storage 필드
 * @returns 변환된 EvaluationRun 객체
 */
export function transformData(storage: any): EvaluationRun {
  if (!storage || typeof storage !== 'object') {
    console.warn('[transformData] Storage is null or invalid');
    return {
      date: 'N/A',
      timestamp: 'N/A',
      modules: [],
      evaluatorHealth: { evaluated: 0, notEvaluated: 0, coverage: null },
      observations: [],
      inferences: [],
      configFingerprint: null,
      executionTrace: [],
      graphHealth: {
        totalExecutions: 0,
        failedExecutions: 0,
        moduleRevisits: 0,
        cycleOrRetryObserved: false,
        terminatedQueries: 0,
        totalLatencySeconds: 0,
      },
    };
  }

  const ts = storage.ts;
  const states = storage.states || {};

  let formattedDate = "N/A";
  if (ts && typeof ts === 'string' && ts.length >= 6) {
    formattedDate = ts.substring(2, 4) + '-' + ts.substring(4, 6);
  }

  const originalTimestamp = ts || "N/A";
  const modulesMap: Map<string, ModuleEvaluation> = new Map();
  const observations: DiagnosticObservation[] = [];
  const inferences: DiagnosticInference[] = [];
  const executionTrace: ExecutionTraceEvent[] = [];
  const configFingerprints = new Set<string>();
  let terminatedQueries = 0;

  for (const [queryId, q] of Object.entries(states)) {
    const queryData = q as any;
    const queryText = queryData?.query || "N/A";
    const answerText = queryData?.gen || "N/A";
    const configFingerprint = queryData?.run_metadata?.config_fingerprint;
    if (typeof configFingerprint === 'string' && configFingerprint) {
      configFingerprints.add(configFingerprint);
    }
    const diagnosis = queryData?.diagnosis;
    if (queryData?.execution_summary?.terminated === true) terminatedQueries += 1;
    (queryData?.execution_trace || []).forEach((event: any) => executionTrace.push({
      query: queryText,
      queryId,
      executionId: event.execution_id || 'unknown',
      moduleId: event.module_id || 'unknown',
      executionIndex: Number.isInteger(event.execution_index) ? event.execution_index : 1,
      revisitCount: Number.isInteger(event.revisit_count) ? event.revisit_count : 0,
      parentExecutionIds: Array.isArray(event.parent_execution_ids) ? event.parent_execution_ids : [],
      status: event.status || 'unknown',
      latencySeconds: typeof event.latency_seconds === 'number' && Number.isFinite(event.latency_seconds)
        ? event.latency_seconds
        : null,
      nextModules: Array.isArray(event.next_modules) ? event.next_modules : [],
      failureType: event.failure?.type,
    }));
    (diagnosis?.observations || []).forEach((item: any) => observations.push({
      code: item.code || 'unknown',
      stage: item.stage || 'unknown',
      message: item.message || 'No diagnostic message.',
      module: item.module,
      metric: item.metric,
      failureType: item.failure_type,
      query: queryText,
    }));
    (diagnosis?.inferences || []).forEach((item: any) => inferences.push({
      code: item.code || 'unknown',
      possibleCause: item.possible_cause || 'Unknown possible cause.',
      confidence: ['high', 'medium', 'low'].includes(item.confidence) ? item.confidence : 'low',
      nextAction: item.next_action || 'Inspect the recorded evidence.',
      query: queryText,
    }));

    if (queryData?.snapshots) {
      const snapshotData = queryData.snapshots;

      for (const moduleName in snapshotData) {
        if (moduleName === 'performances' || moduleName === 'x_time') continue;
        if (moduleName === 'starter') continue;

        const moduleSnapshots = snapshotData[moduleName];
        if (!Array.isArray(moduleSnapshots) || moduleSnapshots.length === 0) continue;
        
        moduleSnapshots.forEach((snapshot: any, snapshotIndex: number) => {
          const rawMetrics = snapshot.performances || [];
          const isStarter = snapshot.is_starter === true || snapshot.is_starter === 'true';
          const executionIndex = snapshotIndex + 1;
          const traceEvent = executionTrace.find((event) =>
            event.queryId === queryId
            && event.moduleId === moduleName
            && event.executionIndex === executionIndex
          );

          const metrics: QueryEvaluation['metrics'] = rawMetrics.map((p: any) => normalizeMetric(p));
          const queryEval: QueryEvaluation = {
            query: queryText,
            answer: snapshot.data?.gen || answerText,
            metrics,
            executionIndex,
            executionId: traceEvent?.executionId,
          };

          if (!modulesMap.has(moduleName)) {
            modulesMap.set(moduleName, { moduleName, queries: [], isStarter });
          }
          modulesMap.get(moduleName)!.queries.push(queryEval);
        });
      }
    }

    if (queryData?.performances && queryData.performances.length > 0) {
      const e2eModuleName = "E2E-Metrics";
      if (!modulesMap.has(e2eModuleName)) {
        modulesMap.set(e2eModuleName, { moduleName: e2eModuleName, queries: [] });
      }

      const e2eMetrics: QueryEvaluation['metrics'] = queryData.performances.map((p: any) =>
        normalizeMetric(p, 'Unknown E2E')
      );

      const e2eQueryEval: QueryEvaluation = {
        query: queryText,
        answer: answerText,
        metrics: e2eMetrics
      };
      modulesMap.get(e2eModuleName)!.queries.push(e2eQueryEval);
    }
  }

  const allMetrics = Array.from(modulesMap.values()).flatMap((module) =>
    module.queries.flatMap((query) => query.metrics)
  );
  const evaluated = allMetrics.filter((metric) => metric.didEval && metric.score !== null).length;
  const notEvaluated = allMetrics.length - evaluated;
  const total = evaluated + notEvaluated;

  return {
    date: formattedDate,
    timestamp: originalTimestamp,
    modules: Array.from(modulesMap.values()),
    evaluatorHealth: {
      evaluated,
      notEvaluated,
      coverage: total > 0 ? evaluated / total : null,
    },
    observations,
    inferences,
    configFingerprint: configFingerprints.size === 1 ? Array.from(configFingerprints)[0] : null,
    executionTrace,
    graphHealth: {
      totalExecutions: executionTrace.length,
      failedExecutions: executionTrace.filter((event) => event.status === 'failed').length,
      moduleRevisits: executionTrace.reduce((total, event) => total + (event.revisitCount > 0 ? 1 : 0), 0),
      cycleOrRetryObserved: executionTrace.some((event) => event.revisitCount > 0),
      terminatedQueries,
      totalLatencySeconds: executionTrace.reduce((total, event) => total + (event.latencySeconds || 0), 0),
    },
  };
}
