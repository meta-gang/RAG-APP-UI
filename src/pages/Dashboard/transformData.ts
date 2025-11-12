// src/pages/Dashboard/transformData.ts
// ⭐️ 이 파일은 App.tsx와 Dashboard/index.tsx 두 곳에서 임포트합니다.

import { EvaluationRun, ModuleEvaluation, QueryEvaluation } from '@type/index';

/**
 * 백엔드 소켓의 `storage` 객체를 프론트엔드의 `EvaluationRun` 객체로 변환
 * @param storage 백엔드 `rag-result-data`의 `storage` 필드
 * @returns 프론트엔드 `EvaluationRun` 타입의 객체 1개
 */
export function transformData(storage: any): EvaluationRun {
  const { ts, history } = storage;

  // 1. 날짜 포맷팅 (예: "20250915-13:27" -> "09-15")
  let formattedDate = "N/A";
  if (ts && typeof ts === 'string' && ts.length >= 8) {
    formattedDate = ts.substring(4, 6) + '-' + ts.substring(6, 8);
  }

  // 2. 데이터 구조 뒤집기 (Query -> Module 에서 Module -> Query)
  // [ { moduleName: "ret", queries: [...] }, { moduleName: "gen", queries: [...] } ]
  const modulesMap: Map<string, ModuleEvaluation> = new Map();

  // history 객체는 {"0": {...}, "1": {...}} 형태
  const queries = Object.values(history) as any[];

  for (const queryData of queries) {
    const queryText = queryData.query || "N/A";
    // 'gen' 필드를 E2E 답변으로 간주
    const answerText = queryData.gen || "No answer"; 

    // 2-1. 'snapshots' (모듈별 상세 메트릭) 처리
    if (queryData.snapshots) {
      // snapshots 객체는 {"starter": [...], "ret": [...], "gen": [...]} 형태
      for (const moduleName in queryData.snapshots) {
        // 모듈이 맵에 없으면 맵에 추가
        if (!modulesMap.has(moduleName)) {
          modulesMap.set(moduleName, { moduleName: moduleName, queries: [] });
        }
        
        const snapshotArray = queryData.snapshots[moduleName];
        if (!snapshotArray || snapshotArray.length === 0) continue;

        const snapshot = snapshotArray[0]; // ⭐️ 첫 번째 스냅샷만 사용한다고 가정
        
        // 'performances' (정우님 명세서) -> 'metrics' (재준님 타입)
        const metrics: QueryEvaluation['metrics'] = (snapshot.performances || []).map((p: any) => ({
          name: p.metric || "Unknown Metric",
          score: p.score || 0
        }));

        // 프론트엔드 QueryEvaluation 객체 생성
        const queryEval: QueryEvaluation = {
          query: queryText,
          answer: snapshot.data?.gen || answerText, // ⭐️ 모듈별 gen이 있으면 사용, 없으면 E2E gen 사용
          metrics: metrics
        };
        
        // 해당 모듈의 queries 배열에 추가
        modulesMap.get(moduleName)!.queries.push(queryEval);
      }
    }

    // 2-2. 'performances' (E2E 메트릭) 처리
    // E2E 메트릭을 "E2E-Metrics"라는 가상 모듈에 추가
    if (queryData.performances && queryData.performances.length > 0) {
      const e2eModuleName = "E2E-Metrics";
      if (!modulesMap.has(e2eModuleName)) {
        modulesMap.set(e2eModuleName, { moduleName: e2eModuleName, queries: [] });
      }

      const e2eMetrics: QueryEvaluation['metrics'] = queryData.performances.map((p: any) => ({
        name: p.metric || "Unknown E2E Metric",
        score: p.score || 0
      }));

      const e2eQueryEval: QueryEvaluation = {
        query: queryText,
        answer: answerText,
        metrics: e2eMetrics
      };
      modulesMap.get(e2eModuleName)!.queries.push(e2eQueryEval);
    }
  }

  // 3. 최종 EvaluationRun 객체 반환
  return {
    date: formattedDate,
    modules: Array.from(modulesMap.values())
  };
}