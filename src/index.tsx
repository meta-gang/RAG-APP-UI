import { createRoot } from 'react-dom/client';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import { RecoilRoot } from 'recoil';
import { BrowserRouter } from 'react-router-dom';

const container = document.getElementById('root');
const root = createRoot(container as Element);

/**
 * 애플리케이션의 진입점입니다.
 * RecoilRoot와 BrowserRouter를 사용하여 상태 관리 및 라우팅 환경을 설정합니다.
 */
root.render(
  <RecoilRoot>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </RecoilRoot>
);

serviceWorkerRegistration.register();