// src/pages/Dashboard/transformData.ts
import { EvaluationRun, ModuleEvaluation, QueryEvaluation } from '@type/index';

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
    return { date: 'N/A', timestamp: 'N/A', modules: [] };
  }

  const ts = storage.ts;
  const states = storage.states || {};

  let formattedDate = "N/A";
  if (ts && typeof ts === 'string' && ts.length >= 6) {
    formattedDate = ts.substring(2, 4) + '-' + ts.substring(4, 6);
  }

  const originalTimestamp = ts || "N/A";
  const modulesMap: Map<string, ModuleEvaluation> = new Map();
  const queries = Object.values(states);

  for (const q of queries) {
    const queryData = q as any;
    const queryText = queryData?.query || "N/A";
    const answerText = queryData?.gen || "N/A";

    if (queryData?.snapshots) {
      const snapshotData = queryData.snapshots;

      for (const moduleName in snapshotData) {
        if (moduleName === 'performances' || moduleName === 'x_time') continue;
        if (moduleName === 'starter') continue;

        const moduleSnapshots = snapshotData[moduleName];
        if (!Array.isArray(moduleSnapshots) || moduleSnapshots.length === 0) continue;
        
        const snapshot = moduleSnapshots[0]; 
        const rawMetrics = snapshot.performances || [];
        const isStarter = snapshot.is_starter === true || snapshot.is_starter === 'true';

        const metrics: QueryEvaluation['metrics'] = rawMetrics.map((p: any) => ({
          name: p.metric || p._Performance__metric || "Unknown",
          score: p.score !== undefined ? p.score : (p._Performance__score !== undefined ? p._Performance__score : 0)
        }));

        const queryEval: QueryEvaluation = {
          query: queryText,
          answer: snapshot.data?.gen || answerText,
          metrics: metrics
        };

        if (!modulesMap.has(moduleName)) {
          modulesMap.set(moduleName, { moduleName: moduleName, queries: [], isStarter: isStarter });
        }
        modulesMap.get(moduleName)!.queries.push(queryEval);
      }
    }

    if (queryData?.performances && queryData.performances.length > 0) {
      const e2eModuleName = "E2E-Metrics";
      if (!modulesMap.has(e2eModuleName)) {
        modulesMap.set(e2eModuleName, { moduleName: e2eModuleName, queries: [] });
      }

      const e2eMetrics: QueryEvaluation['metrics'] = queryData.performances.map((p: any) => ({
        name: p.metric || p._Performance__metric || "Unknown E2E",
        score: p.score !== undefined ? p.score : (p._Performance__score !== undefined ? p._Performance__score : 0)
      }));

      const e2eQueryEval: QueryEvaluation = {
        query: queryText,
        answer: answerText,
        metrics: e2eMetrics
      };
      modulesMap.get(e2eModuleName)!.queries.push(e2eQueryEval);
    }
  }

  return {
    date: formattedDate,
    timestamp: originalTimestamp,
    modules: Array.from(modulesMap.values())
  };
}