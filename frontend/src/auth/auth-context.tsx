import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../api/client';
import type { AuthSession } from '../api/types';
import { clearStoredSession, storeSession } from './session';

interface AuthContextValue {
  session: AuthSession | null;
  loading: boolean;
  login(identifier: string, password: string): Promise<AuthSession>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading] = useState(false);

  const login = useCallback(async (identifier: string, password: string) => {
    clearStoredSession();
    const next = await api.login(identifier.trim().toLowerCase(), password);
    storeSession(next);
    setSession(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // local cleanup still happens
    } finally {
      clearStoredSession();
      try {
        window.sessionStorage.removeItem('omnivita-active-tab');
      } catch {
        // sessionStorage can be unavailable in restricted browser contexts.
      }
      setSession(null);
    }
  }, []);

  const value = useMemo(() => ({ session, loading, login, logout }), [session, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth precisa estar dentro de AuthProvider');
  return value;
}
