// src/pages/Dashboard/transformData.ts
import { EvaluationRun, ModuleEvaluation, QueryEvaluation } from '@type/index';

/**
 * 백엔드의 storage 객체를 프론트엔드 EvaluationRun 타입으로 변환합니다.
 *
 * 처리 내용:
 * - 유효성 검사 (null/undefined 체크)
 * - timestamp로부터 날짜 부분 추출(format: MM-DD)
 * - states(이전 history)에서 각 쿼리의 snapshots 및 performances를 모듈/쿼리 구조로 변환
 * - private 필드명(_Performance__metric 등)에 대한 대응 처리 포함
 *
 * @param storage 백엔드 rag-result-data의 storage 필드
 * @returns 변환된 EvaluationRun 객체
 */
export function transformData(storage: any): EvaluationRun {
  // 빈 값이나 undefined/null 체크
  if (!storage || typeof storage !== 'object') {
    return {
      date: 'N/A',
      modules: []
    };
  }

  const ts = storage.ts;
  const states = storage.states || {}; 

  // 1. 날짜 포맷팅
  let formattedDate = "N/A";
  if (ts && typeof ts === 'string' && ts.length >= 8) {
    formattedDate = ts.substring(4, 6) + '-' + ts.substring(6, 8);
  }

  const modulesMap: Map<string, ModuleEvaluation> = new Map();

  // states 객체는 {"0": {...}, "1": {...}} 형태 -> 배열로 변환
  const queries = Object.values(states);

  for (const q of queries) {
    const queryData = q as any;
    const queryText = queryData?.query || "N/A";
    // E2E 답변 (명세서상 불명확하여 일단 빈값 또는 gen 사용)
    const answerText = "N/A"; 

    // -------------------------------------------------------
    // 2-1. 'snapshots' (모듈별 상세 메트릭) 처리
    // -------------------------------------------------------
    if (queryData?.snapshots) {
      const snapshotData = queryData.snapshots;

      for (const moduleName in snapshotData) {
        // 메타 데이터 키 건너뛰기
        if (moduleName === 'performances' || moduleName === 'x_time') continue;

        const moduleSnapshots = snapshotData[moduleName];
        if (!Array.isArray(moduleSnapshots) || moduleSnapshots.length === 0) continue;
        
        const snapshot = moduleSnapshots[0];

        const rawMetrics = snapshot.performances || [];
        const metrics: QueryEvaluation['metrics'] = rawMetrics.map((p: any) => ({
          name: p.metric || p._Performance__metric || "Unknown",
          score: p.score || p._Performance__score || 0
        }));

        const queryEval: QueryEvaluation = {
          query: queryText,
          answer: snapshot.data?.gen || answerText,
          metrics: metrics
        };

        if (!modulesMap.has(moduleName)) {
          modulesMap.set(moduleName, { moduleName: moduleName, queries: [] });
        }
        modulesMap.get(moduleName)!.queries.push(queryEval);
      }
    }
    
    // 2-2. 'performances' (E2E 메트릭 - 전체 평가) 처리
    if (queryData?.performances && queryData.performances.length > 0) {
      const e2eModuleName = "E2E-Metrics";
      if (!modulesMap.has(e2eModuleName)) {
        modulesMap.set(e2eModuleName, { moduleName: e2eModuleName, queries: [] });
      }

      const e2eMetrics: QueryEvaluation['metrics'] = queryData.performances.map((p: any) => ({
        // E2E 메트릭도 Private 변수명 대응
        name: p.metric || p._Performance__metric || "Unknown E2E",
        score: p.score || p._Performance__score || 0
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
    modules: Array.from(modulesMap.values())
  };
}