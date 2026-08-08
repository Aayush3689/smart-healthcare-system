import * as SecureStore from 'expo-secure-store';

export const saveAuthTokens = (accessToken: string, refreshToken: string) =>
  Promise.all([
    SecureStore.setItemAsync('access_token', accessToken),
    SecureStore.setItemAsync('refresh_token', refreshToken),
  ]);

export const getAccessToken = () => SecureStore.getItemAsync('access_token');

export const clearAuthTokens = () =>
  Promise.all([
    SecureStore.deleteItemAsync('access_token'),
    SecureStore.deleteItemAsync('refresh_token'),
  ]);
