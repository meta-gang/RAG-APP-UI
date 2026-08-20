// src/globals/recoil/atoms.ts
import { DefaultNavInfo } from '@type/defaults';
import { EvaluationRun, MetricScore, NavInfo } from '@type/index';
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

/**
 * 네비게이션 상태 Atom
 * 현재 페이지와 페이지 방문 기록을 관리합니다.
 */
export const naviState = atom<NavInfo>({
  key: 'naviState',
  default: DefaultNavInfo,
  effects_UNSTABLE: [persistAtom],
});

/**
 * 모듈 실행 상태 타입 정의
 * pending: 대기 중, loading: 실행 중, completed: 완료됨
 */
type ModuleStatus = 'pending' | 'loading' | 'completed';

/**
 * 실시간 차트 데이터 인터페이스
 * TestQuery 페이지의 실시간 점수 그래프에 사용됩니다.
 */
export interface LiveMetric {
  query: string; // 쿼리 내용
  queryNumber: number; // 쿼리 순번
  [metricName: string]: string | number; // 메트릭 이름과 점수
}

/**
 * TestQuery 페이지의 전체 상태 인터페이스
 */
interface TestQueryState {
  messages: { sender: 'user' | 'bot'; text: string }[]; // 채팅 메시지 목록
  metrics: { moduleName: string; metrics: MetricScore[] }[]; // 모듈별 메트릭 결과
  moduleStatuses: Record<string, ModuleStatus>; // 각 모듈의 현재 상태
  liveMetricsHistory: LiveMetric[]; // 차트용 히스토리 데이터
  activeConnections: [string, string][]; // 그래프에서 활성화된 엣지(연결선)
}

/**
 * TestQueryState 기본값
 */
const defaultTestQueryState: TestQueryState = {
  messages: [],
  metrics: [],
  moduleStatuses: {},
  liveMetricsHistory: [],
  activeConnections: [],
};

/**
 * TestQuery 페이지 상태 Atom
 * 실시간 테스트 화면의 UI 상태를 전역적으로 관리합니다.
 */
export const testQueryState = atom<TestQueryState>({
  key: 'testQueryState',
  default: defaultTestQueryState,
});

/**
 * 앱 전역 로딩 상태 인터페이스
 * RAG 실행 시 진행률 표시 및 모달 제어에 사용됩니다.
 */
export interface AppLoadingState {
  isLoading: boolean; // 로딩 모달 표시 여부
  message: string; // 로딩 메시지
  totalQueries: number; // 실행할 총 쿼리 수
  completedQueries: number; // 완료된 쿼리 수
}

/**
 * AppLoadingState 기본값
 */
const defaultAppLoadingState: AppLoadingState = {
  isLoading: false,
  message: 'Initializing...',
  totalQueries: 0,
  completedQueries: 0,
};

/**
 * 전역 로딩 상태 Atom
 * 앱 어디서든 로딩 모달을 띄우거나 진행률을 업데이트할 수 있습니다.
 */
export const appLoadingState = atom<AppLoadingState>({
  key: 'appLoadingState',
  default: defaultAppLoadingState,
});

/**
 * 대시보드 최종 결과 데이터 Atom
 * 백엔드로부터 수신한 전체 평가 결과(EvaluationRun[])를 저장합니다.
 * Dashboard 페이지는 이 상태를 구독하여 차트와 KPI를 렌더링합니다.
 */
export const dashboardResultState = atom<EvaluationRun[]>({
  key: 'dashboardResultState',
  default: [],
});
