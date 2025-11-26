import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { RecoilRoot } from 'recoil';

/**
 * 앱 엔트리 포인트: React 루트를 생성하고 Recoil 루트로 App을 렌더링합니다.
 */
const container = document.getElementById('root');
const root = createRoot(container as Element);

root.render(
  <RecoilRoot>
    <App />
  </RecoilRoot>
);

serviceWorkerRegistration.register();
