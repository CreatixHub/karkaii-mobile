/**
 * Mock authentication (no network). One demo account per frontend role.
 *
 * The real implementation (Express backend, JWT, secure-store tokens) is parked, unused, in
 * src/services/api/ so it can be switched back on when the mobile app is connected to the API.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { canManage, canOpenModule, canOpenPage, roleHomePage, type RoleKey } from './access';
import { DEMO_PASSWORD, MOCK_USERS, type MockUser } from './mockUsers';

const SESSION_KEY = 'karkaii:session';

export { DEMO_PASSWORD, MOCK_USERS, type MockUser } from './mockUsers';

interface AuthValue {
  user: MockUser | null;
  role: RoleKey | null;
  isAuthenticated: boolean;
  /** True while the saved session is being restored at start-up. */
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginAs: (role: RoleKey) => Promise<void>;
  logout: () => Promise<void>;
  homePage: string;
  canManage: boolean;
  canOpenModule: (moduleLabel: string) => boolean;
  canOpenPage: (sectionKey: string, pageKey: string) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const id = await AsyncStorage.getItem(SESSION_KEY);
        const found = MOCK_USERS.find((u) => u.id === id);
        if (alive && found) setUser(found);
      } catch {
        /* no saved session */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const start = useCallback(async (u: MockUser) => {
    setUser(u);
    try {
      await AsyncStorage.setItem(SESSION_KEY, u.id);
    } catch {
      /* session just won't survive a restart */
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await new Promise((r) => setTimeout(r, 350));
      const found = MOCK_USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || password !== DEMO_PASSWORD) {
        throw new Error('Incorrect email or password.');
      }
      await start(found);
    },
    [start],
  );

  const loginAs = useCallback(
    async (role: RoleKey) => {
      const found = MOCK_USERS.find((u) => u.role === role);
      if (found) await start(found);
    },
    [start],
  );

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      login,
      loginAs,
      logout,
      homePage: user ? roleHomePage(user.role) : 'admin-dashboard',
      canManage: canManage(user?.role),
      canOpenModule: (label) => canOpenModule(user?.role, label),
      canOpenPage: (section, page) => canOpenPage(user?.role, section, page),
    }),
    [user, isLoading, login, loginAs, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
