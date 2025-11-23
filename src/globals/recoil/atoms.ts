import { DefaultNavInfo } from '@type/defaults';
import { EvaluationRun } from '@type/index';
import { NavInfo } from '@type/index';
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';

const { persistAtom } = recoilPersist();

export const naviState = atom<NavInfo>({
  key: 'naviState',
  default: DefaultNavInfo,
  effects_UNSTABLE: [persistAtom],
});

// TestQuery 페이지 상태를 위한 atom 추가
type ModuleStatus = 'pending' | 'loading' | 'completed';

// 실시간 차트에 사용될 데이터 구조 정의
export interface LiveMetric {
  query: string; // 어떤 질문이었는지 저장
  queryNumber: number; // 몇 번째 질문인지 저장
  [metricName: string]: string | number; // 각 메트릭 점수를 저장 (예: ACS: 85.2)
}

interface TestQueryState {
  messages: { sender: 'user' | 'bot'; text: string }[];
  metrics: { moduleName: string; metrics: { name: string; score: number }[] }[];
  moduleStatuses: Record<string, ModuleStatus>;
  liveMetricsHistory: LiveMetric[]; // 차트 데이터 기록을 위한 배열
  activeConnections: [string, string][]; // [추가] 그래프의 활성화된 연결을 추적
}

const defaultTestQueryState: TestQueryState = {
  messages: [],
  metrics: [],
  moduleStatuses: {},
  liveMetricsHistory: [],
  activeConnections: [], // [추가] 기본값 설정
};

export const testQueryState = atom<TestQueryState>({
  key: 'testQueryState',
  default: defaultTestQueryState,
  // 이 상태는 페이지를 떠나도 유지되지만, 브라우저를 새로고침하면 초기화됩니다.
  // 만약 새로고침 시에도 유지하고 싶다면 effects_UNSTABLE: [persistAtom]을 추가하세요.
});

// 1. 앱 전역 로딩 상태를 위한 타입 정의
export interface AppLoadingState {
  isLoading: boolean;
  message: string;
  totalQueries: number;
  completedQueries: number;
}

// 2. 기본 상태 정의
const defaultAppLoadingState: AppLoadingState = {
  isLoading: false,
  message: 'Initializing...',
  totalQueries: 0,
  completedQueries: 0,
};

// 3. 전역 로딩 atom 생성
export const appLoadingState = atom<AppLoadingState>({
  key: 'appLoadingState',
  default: defaultAppLoadingState,
});

// 4. Dashboard가 사용할 최종 결과 데이터 atom
//    Settings 페이지에서 평가를 실행하면, App.tsx가 이 atom을 업데이트합니다.
//    DashboardPage는 이 atom을 구독하여 최신 데이터를 표시합니다.
export const dashboardResultState = atom<EvaluationRun[]>({
  key: 'dashboardResultState',
  default: [],
});