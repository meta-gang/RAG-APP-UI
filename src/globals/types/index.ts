// 프로젝트 전체에서 사용되는 데이터 타입을 정의

export type MetricScore = {
    name: string;
    score: number;
};

export type QueryEvaluation = {
    query: string;
    answer: string;
    metrics: MetricScore[];
};

export type ModuleEvaluation = {
    moduleName: string;
    queries: QueryEvaluation[];
};

export type EvaluationRun = {
    date: string;
    modules: ModuleEvaluation[];
};

export type NavInfo = {
  page: string;
  history: string[];
};