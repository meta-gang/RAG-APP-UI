// src/index.tsx
import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { RecoilRoot } from 'recoil';
import { HashRouter } from 'react-router-dom';

const container = document.getElementById('root');
const root = createRoot(container as Element);

/**
 * 애플리케이션의 진입점입니다.
 * 404 오류 방지를 위해 HashRouter를 사용합니다.
 */
root.render(
  <RecoilRoot>
    <HashRouter>
      <App />
    </HashRouter>
  </RecoilRoot>
);

serviceWorkerRegistration.register();