import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import { tokenService } from '../services/tokenService';


export interface User {
  id?: number | string;
  username: string;
  login: string;
  email?: string;
  role?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (
    userData: Partial<User> & { username?: string; login?: string },
    tokens?: AuthTokens
  ) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const USER_STORAGE_KEY = 'pjmatch_user_profile';

function getStoredUser(): User | null {
  const savedUser = localStorage.getItem(USER_STORAGE_KEY);
  const token = tokenService.getAccessToken();

  if (token && savedUser) {
    try {
      return JSON.parse(savedUser) as User;
    } catch {
      tokenService.clearTokens();
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [isLoading] = useState<boolean>(false);

  useEffect(() => {
    // Listen for logout events dispatched by axios interceptor (e.g. failed refresh token)
    const unsubscribe = tokenService.onAuthExpired(() => {
      setUser(null);
      localStorage.removeItem(USER_STORAGE_KEY);
    });

    return () => unsubscribe();
  }, []);

  const login = (
    userData: Partial<User> & { username?: string; login?: string },
    tokens?: AuthTokens
  ) => {
    const name = userData.username || userData.login || 'User';
    const normalizedUser: User = {
      id: userData.id,
      username: name,
      login: name,
      email: userData.email,
      role: userData.role,
    };

    setUser(normalizedUser);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(normalizedUser));

    if (tokens?.accessToken) {
      tokenService.setTokens(tokens.accessToken, tokens.refreshToken);
    } else if (!tokenService.getAccessToken()) {
      // Fallback session tokens when logging in without backend (mock mode)
      tokenService.setTokens('session-access-token-' + Date.now(), 'session-refresh-token-' + Date.now());
    }
  };

  const logout = () => {
    tokenService.clearTokens();
    localStorage.removeItem(USER_STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
