import React, { createContext, useCallback, useEffect, useState } from 'react';
import { authApi, ApiError } from '@/services/authApi';
import { tokenStorage } from '@/services/tokenStorage';
import type { AuthUser, LoginCredentials, OrganizationInfo } from '@/types/auth';

interface AuthContextType {
  user: AuthUser | null;
  organizations: OrganizationInfo[];
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoggingIn: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
  switchOrganization: (slug: string) => Promise<void>;
  refreshSession: () => Promise<boolean>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  organizations: [],
  isAuthenticated: false,
  isLoading: true,
  isLoggingIn: false,
  error: null,
  login: async () => {
    throw new Error('AuthProvider not mounted');
  },
  logout: async () => {},
  switchOrganization: async () => {},
  refreshSession: async () => false,
  clearError: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Restores session on application startup:
   * 1. Checks cached user and tokens in SecureStore.
   * 2. If access token exists, verifies with GET /api/auth/me.
   * 3. If access token expired, uses refresh token to obtain a fresh session.
   */
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const accessToken = await tokenStorage.getAccessToken();
        const refreshToken = await tokenStorage.getRefreshToken();
        const cachedUser = await tokenStorage.getStoredUser();

        if (!accessToken && !refreshToken) {
          if (isMounted) setIsLoading(false);
          return;
        }

        if (cachedUser && isMounted) {
          setUser(cachedUser);
        }

        if (accessToken) {
          try {
            const { user: liveUser, organizations: orgs } = await authApi.getCurrentUser();
            if (isMounted) {
              setUser(liveUser);
              setOrganizations(orgs);
              await tokenStorage.setStoredUser(liveUser);
              setIsLoading(false);
            }
            return;
          } catch (meError: any) {
            if (meError?.status !== 401) {
              if (isMounted) setIsLoading(false);
              return;
            }
          }
        }

        if (refreshToken) {
          try {
            const session = await authApi.refresh(refreshToken);
            await tokenStorage.setTokens(session.accessToken, session.refreshToken);
            if (isMounted) {
              setUser(session.user);
              setOrganizations(session.organizations ?? []);
            }
            await tokenStorage.setStoredUser(session.user);
          } catch {
            await tokenStorage.clearTokens();
            if (isMounted) {
              setUser(null);
              setOrganizations([]);
            }
          }
        }
      } catch (e) {
        console.warn('[AuthProvider] restoreSession failed:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initSession();

    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Logs in against POST /api/auth/login.
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const session = await authApi.login(credentials);

      // Save tokens in secure storage
      await tokenStorage.setTokens(session.accessToken, session.refreshToken);
      await tokenStorage.setStoredUser(session.user);

      // Manage rememberMe for email field
      if (credentials.rememberMe) {
        await tokenStorage.setRememberedEmail(credentials.email.trim());
      } else {
        await tokenStorage.setRememberedEmail(null);
      }

      setUser(session.user);
      setOrganizations(session.organizations ?? []);
      return session.user;
    } catch (err: any) {
      const message =
        err instanceof ApiError
          ? err.message
          : err?.message || 'Login failed. Please check your credentials and try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  /**
   * Logs out: notifies backend and removes tokens from SecureStore.
   */
  const logout = useCallback(async () => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      await authApi.logout(refreshToken ?? undefined);
    } catch (e) {
      console.warn('[AuthProvider.logout] Logout error:', e);
    } finally {
      await tokenStorage.clearTokens();
      setUser(null);
      setOrganizations([]);
      setError(null);
    }
  }, []);

  /**
   * Switches organization (for multi-tenant accounts).
   */
  const switchOrganization = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      const session = await authApi.switchOrganization(slug, refreshToken ?? undefined);
      await tokenStorage.setTokens(session.accessToken, session.refreshToken);
      await tokenStorage.setStoredUser(session.user);
      setUser(session.user);
      setOrganizations(session.organizations ?? []);
    } catch (err: any) {
      const message = err?.message || 'Failed to switch organization';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Manually triggers token refresh.
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) return false;
      const session = await authApi.refresh(refreshToken);
      await tokenStorage.setTokens(session.accessToken, session.refreshToken);
      await tokenStorage.setStoredUser(session.user);
      setUser(session.user);
      setOrganizations(session.organizations ?? []);
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = {
    user,
    organizations,
    isAuthenticated: Boolean(user),
    isLoading,
    isLoggingIn,
    error,
    login,
    logout,
    switchOrganization,
    refreshSession,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
