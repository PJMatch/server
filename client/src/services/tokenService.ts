const ACCESS_TOKEN_KEY = 'pjmatch_access_token';
const REFRESH_TOKEN_KEY = 'pjmatch_refresh_token';

type AuthExpiredCallback = () => void;
let authExpiredListeners: AuthExpiredCallback[] = [];

/**
 * Service managing JWT tokens and authentication state synchronization in localStorage.
 */
export const tokenService = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken?: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    authExpiredListeners.forEach((listener) => {
      try {
        listener();
      } catch (e) {
        console.error('Error in authExpired listener', e);
      }
    });
  },

  /**
   * Subscribe to auth expiration events triggered by Axios interceptor (e.g. failed refresh token).
   */
  onAuthExpired(cb: AuthExpiredCallback) {
    authExpiredListeners.push(cb);
    return () => {
      authExpiredListeners = authExpiredListeners.filter((l) => l !== cb);
    };
  },
};

