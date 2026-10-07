import axios from 'axios';
import { AUTH_SESSION_EXPIRED_EVENT } from '../components/AuthSessionGuard';
import { getStoredUserInfo } from '../utils/auth';

const rawBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const baseURL = rawBaseURL.endsWith('/api') ? rawBaseURL : `${rawBaseURL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL,
  // 45s timeout to comfortably accommodate cold starts on Render/cloud services
  timeout: 45000,
});

api.interceptors.request.use(
  (config) => {
    const userInfo = getStoredUserInfo();
    if (userInfo?.token) {
      config.headers.Authorization = `Bearer ${userInfo.token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url || '';
    const isPublicAuthRequest = /\/auth\/(login|register|verify-otp|resend-otp|refresh-token|forgot-password|reset-password)(?:[/?]|$)/.test(requestUrl);

    if (
      error.response?.status === 401
      && error.config?.headers?.Authorization
      && !isPublicAuthRequest
    ) {
      window.dispatchEvent(new Event(AUTH_SESSION_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export default api;
