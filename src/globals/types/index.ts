// 프로젝트 전체에서 사용되는 데이터 타입을 정의
/**
 * @description 단일 평가 지표(Metric)의 이름과 점수를 나타냅니다.
 */
export type MetricScore = {
    name: string; // 예: "Context-Relevancy"
    score: number | null; // 평가 실패/미실행이면 null
    didEval: boolean; // 실제 평가가 성공적으로 수행되었는지 여부
    unit: string; // 백엔드가 선언한 원래 단위/범위. 임의로 %로 변환하지 않음
};

/**
 * @description 단일 쿼리에 대한 답변 및 평가 지표 점수들을 나타냅니다.
 */
export type QueryEvaluation = {
    query: string; // 사용자가 입력한 질문
    answer: string; // RAG 파이프라인이 생성한 답변
    metrics: MetricScore[]; // 해당 쿼리에 대한 평가 지표 목록
    executionIndex?: number;
    executionId?: string;
};

/**
 * @description 단일 RAG 모듈(예: Retrieval, Generation)에 대한 평가 결과를 나타냅니다.
 */
export type ModuleEvaluation = {
    moduleName: string; // 모듈의 이름 (예: "MyRetrievalModule")
    queries: QueryEvaluation[]; // 해당 모듈에서 평가된 쿼리 목록
    isStarter?: boolean; // Starter 모듈 여부 (true일 경우 그래프에서 제외)
};

export type EvaluatorHealth = {
  evaluated: number;
  notEvaluated: number;
  coverage: number | null;
};

export type DiagnosticObservation = {
  code: string;
  stage: string;
  message: string;
  module?: string;
  metric?: string;
  query?: string;
  failureType?: string;
};

export type DiagnosticInference = {
  code: string;
  possibleCause: string;
  confidence: 'high' | 'medium' | 'low';
  nextAction: string;
  query?: string;
};

export type ExecutionTraceEvent = {
  query: string;
  queryId: string;
  executionId: string;
  moduleId: string;
  executionIndex: number;
  revisitCount: number;
  parentExecutionIds: string[];
  status: 'completed' | 'failed' | string;
  latencySeconds: number | null;
  nextModules: string[];
  failureType?: string;
};

export type GraphHealth = {
  totalExecutions: number;
  failedExecutions: number;
  moduleRevisits: number;
  cycleOrRetryObserved: boolean;
  terminatedQueries: number;
  totalLatencySeconds: number;
};

/**
 * @description 특정 날짜에 실행된 전체 RAG 평가 실행 단위를 나타냅니다.
 */
export type EvaluationRun = {
    date: string; // 평가 실행 날짜 (예: "09-21")
    timestamp: string; // 원본 타임스탬프 (예: "251130212120") - 정렬용
    modules: ModuleEvaluation[]; // 해당 실행에 포함된 모듈들의 평가 결과 목록
    evaluatorHealth: EvaluatorHealth;
    observations: DiagnosticObservation[];
    inferences: DiagnosticInference[];
    configFingerprint: string | null;
    executionTrace: ExecutionTraceEvent[];
    graphHealth: GraphHealth;
};

/**
 * @description 페이지 네비게이션 상태를 관리하기 위한 타입입니다. (현재 App.tsx에서는 사용되지 않음)
 */
export type NavInfo = {
  page: string; // 현재 페이지 이름
  history: string[]; // 방문 페이지 기록
};
