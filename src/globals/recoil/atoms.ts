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

interface TestQueryState {
  messages: { sender: "user" | "bot"; text: string }[];
  metrics: { moduleName: string; metrics: { name: string, score: number }[] }[];
  moduleStatuses: Record<string, ModuleStatus>;
  activeConnections: [string, string][];  // 현재 활성화된 모든 연결
}

const defaultTestQueryState: TestQueryState = {
  messages: [],
  metrics: [],
  moduleStatuses: {},
  activeConnections: [],
};

export const testQueryState = atom<TestQueryState>({
  key: 'testQueryState',
  default: defaultTestQueryState,
  // 이 상태는 페이지를 떠나도 유지되지만, 브라우저를 새로고침하면 초기화됩니다.
  // 만약 새로고침 시에도 유지하고 싶다면 effects_UNSTABLE: [persistAtom]을 추가하세요.
});