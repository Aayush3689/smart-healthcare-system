import { clearAuthTokens, getAccessToken, saveAuthTokens } from '@/lib/token-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL?.replace(/\/+$/, '');

type ApiFailure = {
  success: false;
  message?: string;
  error?: { code?: string };
};

export type ApiSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

type LoginData = {
  user: { id: string; email: string; role: string; status: string; isEmailVerified: boolean };
  accessToken: string;
  refreshToken: string;
};

export type AshaProfile = {
  id: string;
  userId: string;
  fullName: string;
  employeeCode: string;
  status: 'INVITED' | 'ACTIVE' | 'INACTIVE' | string;
  village: { id: string; name: string; district: string; state: string };
  phc: { id: string; name: string } | null;
};

export type AshaDashboard = {
  patients: { total: number; registeredThisMonth: number };
  assessments: { today: number; thisMonth: number };
  risk: { highRisk: number; mediumRisk: number; lowRisk: number };
  referrals: { pending: number; accepted: number; completed: number };
  followUps: { pending: number; today: number };
  sync: { pending: number; failed: number };
};

export type AshaStatistics = {
  totalPatients: number;
  totalAssessments: number;
  highRiskPatients: number;
  totalReferrals: number;
  completedReferrals: number;
  pendingFollowUps: number;
  completedFollowUps: number;
};

export class AuthApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
  }
}

const authErrorMessage = (code: string, fallback?: string) => {
  const messages: Record<string, string> = {
    ACCOUNT_NOT_FOUND: 'No active account was found for this email address.',
    INVALID_OTP: 'That code is incorrect, expired, or has already been used. Request a new code and try again.',
    VALIDATION_ERROR: 'Please check your email address and verification code, then try again.',
    FORBIDDEN: 'This account is not permitted to access the ASHA Worker app.',
  };
  return messages[code] ?? fallback ?? 'We could not complete your request. Please try again.';
};

async function post<T>(path: string, body: object): Promise<ApiSuccess<T>> {
  if (!API_BASE_URL) {
    throw new AuthApiError('API_URL_MISSING', 'The app is not connected to the backend yet. Set EXPO_PUBLIC_API_URL and restart Expo.');
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthApiError('NETWORK_ERROR', 'Unable to reach the server. Check your internet connection and the API address.');
  }

  const payload = await response.json().catch(() => null) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !payload || !payload.success) {
    const failure = payload as ApiFailure | null;
    const code = failure?.error?.code ?? 'REQUEST_FAILED';
    throw new AuthApiError(code, authErrorMessage(code, failure?.message));
  }
  return payload;
}

export async function authorizedRequest<T>(
  path: string,
  method: 'GET' | 'POST' | 'PATCH',
  body?: object | FormData,
): Promise<ApiSuccess<T>> {
  if (!API_BASE_URL) {
    throw new AuthApiError('API_URL_MISSING', 'The app is not connected to the backend yet. Set EXPO_PUBLIC_API_URL and restart Expo.');
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    throw new AuthApiError('UNAUTHENTICATED', 'Your session has ended. Please sign in again.');
  }

  let response: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...(body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        },
        ...(body ? { body: isFormData ? body : JSON.stringify(body) } : {}),
      });
      break;
    } catch {
      if (attempt === 2) {
        throw new AuthApiError('NETWORK_ERROR', 'Unable to reach the server. Check your internet connection and the API address.');
      }
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  if (!response) {
    throw new AuthApiError('NETWORK_ERROR', 'Unable to reach the server. Check your internet connection and the API address.');
  }

  const payload = await response.json().catch(() => null) as ApiSuccess<T> | ApiFailure | null;
  if (!response.ok || !payload || !payload.success) {
    const failure = payload as ApiFailure | null;
    const code = failure?.error?.code ?? 'REQUEST_FAILED';
    throw new AuthApiError(code, authErrorMessage(code, failure?.message));
  }
  return payload;
}

export const auth = {
  requestOtp: (email: string) => post<null>('/api/v1/auth/request-otp', { email }),
  verifyOtp: (email: string, otp: string) => post<LoginData>('/api/v1/auth/verify-otp', {
    email,
    otp,
    platform: 'MOBILE_APP',
  }),
  saveTokens: saveAuthTokens,
  clearTokens: clearAuthTokens,
  getAshaProfile: () => authorizedRequest<AshaProfile>('/api/v1/asha/me', 'GET'),
  getAshaDashboard: () => authorizedRequest<AshaDashboard>('/api/v1/asha/me/dashboard', 'GET'),
  getAshaStatistics: () => authorizedRequest<AshaStatistics>('/api/v1/asha/me/statistics', 'GET'),
  updateAshaProfile: (fullName: string) =>
    authorizedRequest<AshaProfile>('/api/v1/asha/me', 'PATCH', { fullName }),
};
