import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';

// Define the shape of our user data based on existing team structure
export interface User {
  login: string;
  email: string;
}

// Extended context value to include isAuthenticated flag for easier checks
interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // null = guest, User object = logged in
  const [user, setUser] = useState<User | null>(null);

  const login = (u: User) => setUser(u);
  
  const logout = () => {
    setUser(null);
    // TODO: Add API call to clear cookies/tokens on the backend later (T-15)
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}