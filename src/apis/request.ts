// /src/apis/request.ts

import axios from 'axios';
import { DOMAIN } from './domain';

/**
 * @description Axios 인스턴스를 생성합니다.
 * @param baseURL 로컬 환경에서는 local, 프로덕션 환경에서는 main 도메인을 사용합니다.
 * @param timeout 요청 제한 시간을 1초로 설정합니다.
 */
const request = axios.create({ baseURL: DOMAIN.local, timeout: 1000 });

/**
 * @description 요청 인터셉터 (Request Interceptor)
 * 모든 API 요청이 서버로 전송되기 전에 실행됩니다.
 * localStorage에서 'access_token'을 가져와 요청 헤더에 Authorization 값을 추가합니다.
 */
request.interceptors.request.use(async (config) => {
  const accessToken = await localStorage.getItem('access_token');
  // 토큰이 있으면 Bearer 형식으로 헤더에 추가, 없으면 null로 설정합니다.
  config.headers.Authorization = accessToken ? `Bearer ${accessToken}` : null;
  return config;
});

/**
 * @description 응답 인터셉터 (Response Interceptor)
 * 서버로부터 응답을 받은 후 실행됩니다.
 * 응답 상태 코드에 따라 에러를 처리합니다.
 */
request.interceptors.response.use(
  (response) => {
    // 성공적인 응답은 그대로 반환합니다.
    return response;
  },
  async (error) => {
    // 응답 에러가 발생했을 때의 처리입니다.
    if (error.response) {
      const { status } = error.response;
      // 5xx 서버 에러 발생 시, 점검 페이지로 이동합니다.
      if (status >= 500 && status < 600) {
        window.location.href = '/maintenance';
      }
      // 401 인증 실패 시, 사용자에게 알리고 로그인 페이지로 이동합니다.
      else if (status === 401) {
        alert('로그인 또는 재로그인이 필요합니다.');
        window.location.href = '/login';
      }
    }
    // 처리된 에러 외 다른 에러들은 Promise.reject를 통해 호출한 쪽으로 전파합니다.
    return Promise.reject(error);
  },
);

export default request;