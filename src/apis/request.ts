import axios from 'axios';
import { DOMAIN } from './domain';

const request = axios.create({ baseURL: DOMAIN.local, timeout: 1000 });

// using interceptor, handle errors and add auth datas in request header

request.interceptors.request.use(async (config) => {
  const accessToken = await localStorage.getItem('access_token');
  if (!accessToken) {
    config.headers.Authorization = null;
    return config;
  }
  config.headers.Authorization = `Bearer ${accessToken}`;
  return config;
});

request.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const errorStatus = [500, 501, 502, 503];  // server error
    if (errorStatus.includes(error.response.status)) {
      window.location.href = '/maintenance';
    }
    return Promise.reject(error);   
  },
);

request.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response.status == 401) {  // auth failed
      alert('로그인 / 재로그인이 필요합니다.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  },
);

export default request;
