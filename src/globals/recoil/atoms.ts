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