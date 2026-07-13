import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import {
    login as mockLogin,
    logout as mockLogout,
    register as mockRegister,
    requestPasswordReset as mockRequestPasswordReset,
    type MockAuthUser,
} from '@/services/mock-auth-service';

type AuthContextValue = {
  user: MockAuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<MockAuthUser | null>(null);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      isAuthenticated: user !== null,
      login: async (email, password) => {
        const authenticatedUser = await mockLogin(email, password);
        setUser(authenticatedUser);
      },
      register: async (name, email, password) => {
        const authenticatedUser = await mockRegister(name, email, password);
        setUser(authenticatedUser);
      },
      requestPasswordReset: async (email) => {
        await mockRequestPasswordReset(email);
      },
      logout: async () => {
        await mockLogout();
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
