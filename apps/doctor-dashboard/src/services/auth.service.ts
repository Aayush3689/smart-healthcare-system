import { User } from '../types';
import { api } from './api';
import { authStorage } from './auth.storage';

type ApiRole = 'DOCTOR' | 'PHC_ADMIN';

interface ApiUser {
  id: string;
  email: string;
  role: ApiRole;
  status: string;
  isEmailVerified: boolean;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

interface LoginData {
  user: ApiUser;
  accessToken: string;
  refreshToken: string;
}

const toDashboardUser = (user: ApiUser): User => {
  if (user.role !== 'DOCTOR' && user.role !== 'PHC_ADMIN') {
    throw new Error('This account is not permitted to access the doctor dashboard.');
  }
  return {
    id: user.id,
    email: user.email,
    name: user.role === 'DOCTOR' ? 'Doctor' : 'PHC Administrator',
    role: user.role === 'DOCTOR' ? 'doctor' : 'admin',
  };
};

export const authService = {
  async requestOtp(email: string): Promise<string> {
    const response = await api.post<ApiEnvelope<null>>('/auth/request-otp', { email });
    return response.data.message;
  },

  async verifyOtp(email: string, otp: string): Promise<User> {
    const deviceId = this.getDeviceId();
    const response = await api.post<ApiEnvelope<LoginData>>('/auth/verify-otp', {
      email,
      otp,
      platform: 'DOCTOR_DASHBOARD',
      deviceId,
    });
    const { user: apiUser, accessToken, refreshToken } = response.data.data;
    const user = toDashboardUser(apiUser);
    authStorage.setSession(accessToken, refreshToken, user);
    return user;
  },

  getCurrentUser(): User | null {
    const raw = authStorage.getUser();
    try {
      return raw ? (JSON.parse(raw) as User) : null;
    } catch {
      authStorage.clear();
      return null;
    }
  },

  async validateSession(): Promise<User | null> {
    if (!authStorage.getAccessToken() || !authStorage.getRefreshToken()) return null;
    const response = await api.get<ApiEnvelope<ApiUser>>('/auth/me');
    const user = toDashboardUser(response.data.data);
    const accessToken = authStorage.getAccessToken();
    const refreshToken = authStorage.getRefreshToken();
    if (accessToken && refreshToken) authStorage.setSession(accessToken, refreshToken, user);
    return user;
  },

  async logout(): Promise<void> {
    const refreshToken = authStorage.getRefreshToken();
    authStorage.clear();
    if (!refreshToken) return;
    try {
      await api.post('/auth/logout', { refreshToken });
    } catch {
      // The local session is already cleared; a revoked/expired token needs no further action.
    }
  },

  getDeviceId(): string {
    const key = 'healthai_device_id';
    let deviceId = localStorage.getItem(key);
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem(key, deviceId);
    }
    return deviceId;
  }
};
