import React, { createContext, useCallback, useEffect, useState } from 'react';
import { tokenStorage } from '@/services/api/tokenStorage';
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

function formatDisplayName(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return 'User';

  let rawName = trimmed;
  if (trimmed.includes('@')) {
    rawName = trimmed.split('@')[0];
  }

  const words = rawName.replace(/[._-]+/g, ' ').trim().split(/\s+/);
  return words
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

function createMockUser(credentials: LoginCredentials): AuthUser {
  const rawInput = credentials.email?.trim() || '';

  // Determine role
  let role = (credentials.role || '').toLowerCase();
  if (!role) {
    const lowerInput = rawInput.toLowerCase();
    if (lowerInput.includes('teacher')) role = 'teacher';
    else if (lowerInput.includes('student')) role = 'student';
    else if (lowerInput.includes('parent')) role = 'parent';
    else if (lowerInput.includes('accountant')) role = 'accountant';
    else if (lowerInput.includes('librarian')) role = 'librarian';
    else if (lowerInput.includes('staff')) role = 'staff';
    else role = 'admin';
  }

  // Exact frontend demo user mapping
  const demoEmailMap: Record<string, { name: string; role: string }> = {
    'admin@example.com': { name: 'Kevin Larry', role: 'admin' },
    'teacher@example.com': { name: 'Teresa Fischer', role: 'teacher' },
    'student@example.com': { name: 'Janet Daniel', role: 'student' },
    'parent@example.com': { name: 'Thomas Daniel', role: 'parent' },
  };

  let name = '';
  let email = '';
  let username = '';

  const matchedDemo = demoEmailMap[rawInput.toLowerCase()];
  if (matchedDemo) {
    name = matchedDemo.name;
    email = rawInput.toLowerCase();
    username = rawInput.split('@')[0];
    if (!credentials.role) role = matchedDemo.role;
  } else if (rawInput) {
    // Custom user login identifier (e.g. "mesiya", "mesiya@agaramsoft.com", "John Doe")
    if (rawInput.includes('@')) {
      email = rawInput.toLowerCase();
      username = rawInput.split('@')[0];
      name = formatDisplayName(username);
    } else {
      name = formatDisplayName(rawInput);
      username = rawInput.toLowerCase().replace(/\s+/g, '.');
      email = `${username}@karkaii-school.org`;
    }
  } else {
    // Blank input fallback by role (matching frontend fixtures)
    const fallbackByRole: Record<string, { name: string; email: string }> = {
      admin: { name: 'Kevin Larry', email: 'admin@example.com' },
      teacher: { name: 'Teresa Fischer', email: 'teacher@example.com' },
      student: { name: 'Janet Daniel', email: 'student@example.com' },
      parent: { name: 'Thomas Daniel', email: 'parent@example.com' },
      accountant: { name: 'Arthur Pendelton', email: 'accountant@karkaii.com' },
      librarian: { name: 'Clara Oswald', email: 'librarian@karkaii.com' },
      staff: { name: 'Campus Operations', email: 'staff@karkaii.com' },
    };
    const fb = fallbackByRole[role] || { name: 'Kevin Larry', email: 'admin@example.com' };
    name = fb.name;
    email = fb.email;
    username = fb.email.split('@')[0];
  }

  return {
    id: `usr-${Date.now()}`,
    username,
    name,
    email,
    role: role as any,
    permissions: ['all'],
    avatar: null,
    avatarUrl: null,
    phone: '+91 98450 12345',
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
