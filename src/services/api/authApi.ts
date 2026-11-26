import { API_URL } from '@/config/env';
import { tokenStorage } from './tokenStorage';
import type {
  AuthSession,
  AuthUser,
  ForgotPasswordPayload,
  LoginCredentials,
  OrganizationInfo,
  ResetPasswordPayload,
} from '@/types/auth';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status = 500, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await tokenStorage.clearTokens();
      return null;
    }
    try {
      const refreshResponse = await authApi.refresh(refreshToken);
      await tokenStorage.setTokens(refreshResponse.accessToken, refreshResponse.refreshToken);
      if (refreshResponse.user) {
        await tokenStorage.setStoredUser(refreshResponse.user);
      }
      return refreshResponse.accessToken;
    } catch {
      await tokenStorage.clearTokens();
      return null;
    }
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_URL.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  const headers = new Headers(options.headers ?? {});

  headers.set('Content-Type', 'application/json');
  headers.set('X-Client', 'mobile');

  if (!options.skipAuth) {
    const token = await tokenStorage.getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (netError: any) {
    throw new ApiError(
      `Unable to connect to school server (${API_URL}). Please check your Wi-Fi/network connection.`,
      0,
      netError
    );
  }

  // Handle 401 Unauthorized with a single shared token refresh across concurrent requests
  if (response.status === 401 && !options.skipAuth && !options.skipRefresh) {
    const refreshToken = await tokenStorage.getRefreshToken();
    if (!refreshToken) {
      await tokenStorage.clearTokens();
      throw new ApiError('Session expired. Please sign in again.', 401);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await authApi.refresh(refreshToken);
        await tokenStorage.setTokens(refreshResponse.accessToken, refreshResponse.refreshToken);
        if (refreshResponse.user) {
          await tokenStorage.setStoredUser(refreshResponse.user);
        }
        isRefreshing = false;
        onRefreshed(refreshResponse.accessToken);
      } catch {
        isRefreshing = false;
        onRefreshed(null);
        await tokenStorage.clearTokens();
        throw new ApiError('Session expired. Please sign in again.', 401);
      }
    }

    // Wait for the refresh to complete
    const newToken = await new Promise<string | null>((resolve) => {
      subscribeTokenRefresh((token) => resolve(token));
    });

    if (!newToken) {
      throw new ApiError('Session expired. Please sign in again.', 401);
    }

    headers.set('Authorization', `Bearer ${newToken}`);
    let retryRes: Response;
    try {
      retryRes = await fetch(url, { ...options, headers });
    } catch (netError: any) {
      throw new ApiError(
        `Unable to connect to school server (${API_URL}). Please check your Wi-Fi/network connection.`,
        0,
        netError
      );
    }
    return parseResponse<T>(retryRes);
  }

  return parseResponse<T>(response);
}

// The backend wraps every successful response as { success: true, data, meta } (see backend/src/lib/respond.ts).
// Error responses are NOT wrapped (e.g. { message, errors }), so only unwrap on the success path.
function unwrapEnvelope<T>(body: unknown): T {
  if (body !== null && typeof body === 'object' && 'success' in body && 'data' in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const text = await response.text();
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { message: text };
    }
  }

  if (!response.ok) {
    const message =
      json?.message ||
      json?.error ||
      (response.status === 401 ? 'Invalid email or password' : `Server error (${response.status})`);
    throw new ApiError(message, response.status, json);
  }

  return unwrapEnvelope<T>(json);
}

export const authApi = {
  /**
   * POST /api/auth/login
   * Expects { email, password, organization? } with X-Client: mobile
   * Returns { accessToken, refreshToken, expiresIn, user, organizations }
   */
  async login(credentials: LoginCredentials): Promise<AuthSession> {
    const identifier = credentials.email.trim();
    const who = identifier.includes('@') ? { email: identifier } : { username: identifier };
    const payload: Record<string, string | undefined> = {
      ...who,
      password: credentials.password,
    };
    if (credentials.organization?.trim()) {
      payload.organization = credentials.organization.trim();
    }

    const res = await apiRequest<{
      accessToken: string;
      refreshToken?: string;
      expiresIn?: number | string;
      user: AuthUser;
      organizations?: OrganizationInfo[];
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
      skipRefresh: true,
    });

    return {
      accessToken: res.accessToken,
      refreshToken: res.refreshToken,
      expiresIn: res.expiresIn,
      user: res.user,
      organizations: res.organizations ?? [],
    };
  },

  /**
   * POST /api/auth/refresh
   * Mobile clients send { refreshToken } in JSON body
   */
  async refresh(refreshToken: string): Promise<AuthSession> {
    return apiRequest<AuthSession>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuth: true,
      skipRefresh: true,
    });
  },

  /**
   * POST /api/auth/logout
   * Sends { refreshToken } in body to revoke the session chain
   */
  async logout(refreshToken?: string): Promise<void> {
    try {
      await apiRequest<void>('/api/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
        skipAuth: true,
        skipRefresh: true,
      });
    } catch (e) {
      // Logout should never block client-side session cleanup
      console.warn('[authApi.logout] Server logout notice failed:', e);
    }
  },

  /**
   * GET /api/auth/me
   * Fetches current authenticated user profile & tenant organization
   */
  async getCurrentUser(): Promise<{ user: AuthUser; organizations: OrganizationInfo[] }> {
    const res = await apiRequest<AuthUser & { organizations?: OrganizationInfo[] }>('/api/auth/me', {
      method: 'GET',
    });
    const organizations = res.organizations ?? [];
    return { user: res, organizations };
  },

  /**
   * POST /api/auth/switch-organization
   * Switches the active school tenant
   */
  async switchOrganization(organizationSlug: string, refreshToken?: string): Promise<AuthSession> {
    return apiRequest<AuthSession>('/api/auth/switch-organization', {
      method: 'POST',
      body: JSON.stringify({ organization: organizationSlug, refreshToken }),
    });
  },

  /**
   * POST /api/auth/forgot-password
   */
  async forgotPassword(payload: ForgotPasswordPayload): Promise<{ message?: string }> {
    return apiRequest<{ message?: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
      skipRefresh: true,
    });
  },

  /**
   * POST /api/auth/reset-password
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<{ message?: string }> {
    return apiRequest<{ message?: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
      skipAuth: true,
      skipRefresh: true,
    });
  },
};

