// SecureStore is unavailable in Expo Web. Browser storage is used only for web development.
export const saveAuthTokens = async (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

export const getAccessToken = async () => localStorage.getItem('access_token');

export const clearAuthTokens = async () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};
