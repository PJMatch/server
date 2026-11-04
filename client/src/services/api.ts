import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { tokenService } from './tokenService';

const baseURL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenService.getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    // Reject if request config is missing or status is not 401
    if (!originalRequest || !error.response || error.response.status !== 401) {
      return Promise.reject(error);
    }

    // Do not retry if request already retried, or if it is an auth endpoint
    const requestUrl = originalRequest.url || '';
    if (
      originalRequest._retry ||
      requestUrl.includes('/auth/refresh-token') ||
      requestUrl.includes('/auth/login')
    ) {
      return Promise.reject(error);
    }

    // If a refresh is already in progress, enqueue this request
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = tokenService.getRefreshToken();
    if (!refreshToken) {
      isRefreshing = false;
      tokenService.clearTokens();
      return Promise.reject(error);
    }

    try {
      // Direct POST using isolated axios call to avoid circular interceptor execution
      const refreshUrl = baseURL.endsWith('/')
        ? `${baseURL}auth/refresh-token`
        : `${baseURL}/auth/refresh-token`;

      const response = await axios.post<{
        accessToken?: string;
        access_token?: string;
        refreshToken?: string;
        refresh_token?: string;
      }>(
        refreshUrl,
        {
          refreshToken,
          refresh_token: refreshToken,
        },
        { withCredentials: true }
      );

      const newAccessToken = response.data?.accessToken || response.data?.access_token;
      const newRefreshToken = response.data?.refreshToken || response.data?.refresh_token;

      if (!newAccessToken) {
        throw new Error('No access token returned from refresh endpoint');
      }

      tokenService.setTokens(newAccessToken, newRefreshToken || refreshToken);

      // Drain queue with the new access token
      processQueue(null, newAccessToken);

      // Retry original request with the new access token
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      tokenService.clearTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
