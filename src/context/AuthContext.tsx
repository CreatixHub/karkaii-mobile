import React, { createContext, useCallback, useEffect, useState } from 'react';
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

const DEMO_ORGANIZATIONS: OrganizationInfo[] = [
  { id: '1', slug: 'oxford', name: 'Oxford International School', status: 'Active' },
  { id: '2', slug: 'sunrise', name: 'Sunrise Public School', status: 'Active' },
  { id: '3', slug: 'riverside', name: 'Riverside Academy', status: 'Active' },
];

function createMockUser(credentials: LoginCredentials): AuthUser {
  const role = (credentials.role || 'admin').toLowerCase();
  const email = credentials.email || `${role}@karkaii.com`;

  const roleNames: Record<string, string> = {
    admin: 'Principal Arthur Wright',
    teacher: 'Sarah Mitchell (Senior Faculty)',
    student: 'Emily Carter (Grade XII-A)',
    parent: 'Robert Carter (Guardian)',
    accountant: 'Arthur Pendelton (Bursar)',
    staff: 'Clara Oswald (Operations)',
    librarian: 'Clara Oswald (Chief Librarian)',
    receptionist: 'Jane Cooper (Admissions)',
  };

  const name = roleNames[role] || (email.split('@')[0].replace(/[._-]/g, ' ') || 'School Staff');

  return {
    id: `usr-${Date.now()}`,
    username: email.split('@')[0],
    name: name.charAt(0).toUpperCase() + name.slice(1),
    email: email,
    role: role as any,
    permissions: ['all'],
    avatar: null,
    avatarUrl: null,
    phone: '+44 1865 270000',
    organization: DEMO_ORGANIZATIONS[0],
    organizations: DEMO_ORGANIZATIONS,
    status: 'Active',
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationInfo[]>(DEMO_ORGANIZATIONS);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  /**
   * Restores session on application startup:
   * 1. Checks cached user and tokens in SecureStore.
   * 2. In static / offline development phase: uses cached user or stays at login.
   */
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const cachedUser = await tokenStorage.getStoredUser();
        if (cachedUser && isMounted) {
          setUser(cachedUser);
          setOrganizations(cachedUser.organizations?.length ? cachedUser.organizations : DEMO_ORGANIZATIONS);
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
   * Logs in against static mock session (preserving architecture for future API calls).
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoggingIn(true);
    setError(null);
    try {
      // Static mock session creation for local mobile development
      const mockUser = createMockUser(credentials);
      await tokenStorage.setTokens('mock-access-token-karkaii', 'mock-refresh-token-karkaii');
      await tokenStorage.setStoredUser(mockUser);

      // Manage rememberMe for email field
      if (credentials.rememberMe && credentials.email) {
        await tokenStorage.setRememberedEmail(credentials.email.trim());
      } else {
        await tokenStorage.setRememberedEmail(null);
      }

      setUser(mockUser);
      setOrganizations(mockUser.organizations || DEMO_ORGANIZATIONS);
      return mockUser;
    } catch (err: any) {
      const message = err?.message || 'Login failed. Please check credentials and try again.';
      setError(message);
      throw err;
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  /**
   * Logs out: removes tokens and resets local state.
   */
  const logout = useCallback(async () => {
    try {
      await tokenStorage.clearTokens();
    } catch (e) {
      console.warn('[AuthProvider.logout] Logout error:', e);
    } finally {
      setUser(null);
      setError(null);
    }
  }, []);

  /**
   * Switches organization (for multi-campus / multi-school).
   */
  const switchOrganization = useCallback(async (slug: string) => {
    setIsLoading(true);
    try {
      const selectedOrg = organizations.find((o) => o.slug === slug) || organizations[0];
      if (user && selectedOrg) {
        const updatedUser = { ...user, organization: selectedOrg };
        await tokenStorage.setStoredUser(updatedUser);
        setUser(updatedUser);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to switch school campus');
    } finally {
      setIsLoading(false);
    }
  }, [organizations, user]);

  /**
   * Manually triggers token refresh (mock).
   */
  const refreshSession = useCallback(async (): Promise<boolean> => {
    return true;
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
