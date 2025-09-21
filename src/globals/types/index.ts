// 프로젝트 전체에서 사용되는 데이터 타입을 정의
/**
 * @description 단일 평가 지표(Metric)의 이름과 점수를 나타냅니다.
 */
export type MetricScore = {
    name: string; // 예: "Context-Relevancy"
    score: number; // 0.0 ~ 1.0 사이의 값
};

/**
 * @description 단일 쿼리에 대한 답변 및 평가 지표 점수들을 나타냅니다.
 */
export type QueryEvaluation = {
    query: string; // 사용자가 입력한 질문
    answer: string; // RAG 파이프라인이 생성한 답변
    metrics: MetricScore[]; // 해당 쿼리에 대한 평가 지표 목록
};

/**
 * @description 단일 RAG 모듈(예: Retrieval, Generation)에 대한 평가 결과를 나타냅니다.
 */
export type ModuleEvaluation = {
    moduleName: string; // 모듈의 이름 (예: "MyRetrievalModule")
    queries: QueryEvaluation[]; // 해당 모듈에서 평가된 쿼리 목록
};

/**
 * @description 특정 날짜에 실행된 전체 RAG 평가 실행 단위를 나타냅니다.
 */
export type EvaluationRun = {
    date: string; // 평가 실행 날짜 (예: "09-21")
    modules: ModuleEvaluation[]; // 해당 실행에 포함된 모듈들의 평가 결과 목록
};

/**
 * @description 페이지 네비게이션 상태를 관리하기 위한 타입입니다. (현재 App.tsx에서는 사용되지 않음)
 */
export type NavInfo = {
  page: string; // 현재 페이지 이름
  history: string[]; // 방문 페이지 기록
};