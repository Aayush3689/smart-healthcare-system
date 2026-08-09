const ACCESS_TOKEN_KEY = 'healthai_access_token';
const REFRESH_TOKEN_KEY = 'healthai_refresh_token';
const USER_KEY = 'healthai_user';

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  getUser: () => localStorage.getItem(USER_KEY),
  setSession: (accessToken: string, refreshToken: string, user: unknown) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Remove the previous mock-login token when upgrading an existing browser session.
    localStorage.removeItem('healthai_auth_token');
  },
};
