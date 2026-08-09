import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authStorage } from './auth.storage';

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshRequest: Promise<TokenPair> | null = null;

const refreshAccessToken = async (): Promise<TokenPair> => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token is available.');

  const response = await axios.post<ApiEnvelope<TokenPair>>(
    `${api.defaults.baseURL}/auth/refresh`,
    { refreshToken },
    { headers: { 'Content-Type': 'application/json' } },
  );
  return response.data.data;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const request = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const isAuthenticationRequest = request?.url?.includes('/auth/') ?? false;

    if (error.response?.status !== 401 || !request || request._retry || isAuthenticationRequest) {
      return Promise.reject(error);
    }

    request._retry = true;
    try {
      refreshRequest ??= refreshAccessToken().finally(() => {
        refreshRequest = null;
      });
      const tokens = await refreshRequest;
      authStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      request.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return api(request);
    } catch (refreshError) {
      authStorage.clear();
      return Promise.reject(refreshError);
    }
  },
);
