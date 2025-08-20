// 프로젝트 전체에서 사용되는 데이터 타입을 정의

export interface MetricScore {
    name: string;
    score: number;
}

export interface QueryEvaluation {
    query: string;
    answer: string;
    metrics: MetricScore[];
}

export interface ModuleEvaluation {
    moduleName: string;
    queries: QueryEvaluation[];
}

export interface EvaluationRun {
    date: string;
    modules: ModuleEvaluation[];
}