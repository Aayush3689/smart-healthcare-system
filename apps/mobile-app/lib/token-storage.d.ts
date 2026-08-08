export declare const saveAuthTokens: (accessToken: string, refreshToken: string) => Promise<unknown>;
export declare const getAccessToken: () => Promise<string | null>;
export declare const clearAuthTokens: () => Promise<unknown>;
