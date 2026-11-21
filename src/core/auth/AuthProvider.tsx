/**
 * Mock authentication (no network). Sign in with an email, phone number or admission number; the account found
 * decides the role (see ./accounts). One demo account exists per frontend role.
 *
 * The real implementation (Express backend, JWT, secure-store tokens) is parked, unused, in src/services/api/ so it
 * can be switched back on when the mobile app is connected to the API.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { canManage, canOpenModule, canOpenPage, roleHomePage, type RoleKey } from './access';
import { isDemoAccount, restoreSession, signIn } from './accounts';
import { MOCK_USERS, type MockUser } from './mockUsers';

const SESSION_KEY = 'karkaii:session';

export { DEMO_PASSWORD, MOCK_USERS, type MockUser } from './mockUsers';

interface AuthValue {
  user: MockUser | null;
  role: RoleKey | null;
  isAuthenticated: boolean;
  /** True while the saved session is being restored at start-up. */
  isLoading: boolean;
  /** `identifier` is an email address, a phone number or an admission number. "Remember me" keeps the session across restarts. */
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  /** Demo shortcut: become the built-in account for a role. */
  loginAs: (role: RoleKey) => Promise<void>;
  logout: () => Promise<void>;
  homePage: string;
  canManage: boolean;
  /** One of the 11 built-in demo accounts (the only ones that can use the demo role switcher). */
  isDemoAccount: boolean;
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
        const found = id ? restoreSession(id) : null;
        if (alive && found) setUser(found);
        else if (id && !found) await AsyncStorage.removeItem(SESSION_KEY); // the account is gone or switched off
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

  const start = useCallback(async (u: MockUser, remember = true) => {
    setUser(u);
    try {
      if (remember) await AsyncStorage.setItem(SESSION_KEY, u.id);
      else await AsyncStorage.removeItem(SESSION_KEY);
    } catch {
      /* session just won't survive a restart */
    }
  }, []);

  const login = useCallback(
    async (identifier: string, password: string, rememberMe = true) => {
      await new Promise((r) => setTimeout(r, 350));
      const result = signIn(identifier, password);
      if (!result.ok) throw new Error(result.message);
      await start(result.user, rememberMe);
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
      isDemoAccount: isDemoAccount(user),
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
