// src/globals/recoil/atoms.ts
import { DefaultNavInfo } from '@type/defaults';
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
  messages: { sender: "user" | "bot"; text: string }[];
  metrics: { moduleName: string; metrics: { name: string, score: number }[] }[];
  moduleStatuses: Record<string, ModuleStatus>;
  liveMetricsHistory: LiveMetric[]; // 차트 데이터 기록을 위한 배열 추가
}

const defaultTestQueryState: TestQueryState = {
  messages: [],
  metrics: [],
  moduleStatuses: {},
  liveMetricsHistory: [],
};

export const testQueryState = atom<TestQueryState>({
  key: 'testQueryState',
  default: defaultTestQueryState,
  // 이 상태는 페이지를 떠나도 유지되지만, 브라우저를 새로고침하면 초기화됩니다.
  // 만약 새로고침 시에도 유지하고 싶다면 effects_UNSTABLE: [persistAtom]을 추가하세요.
});