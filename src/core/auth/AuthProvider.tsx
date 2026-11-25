/**
 * Real authentication against the existing backend (POST /api/auth/login, refresh, logout, GET /api/auth/me).
 * The person's role comes from the backend response and decides the dashboard and menu through ./access.
 * Tokens live in the device's secure storage (Keychain / Keystore); see src/services/api/.
 *
 * The rest of the app still shows its local sample data; only sign-in is real. A student, teacher or parent is linked
 * to the matching local record (by admission number, email or phone) so their own-records views have something to show.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { snapshot } from '@/core/store/store';
import type { StaffRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';
import { ApiError, authApi } from '@/services/api/authApi';
import { tokenStorage } from '@/services/api/tokenStorage';
import { canManage, canOpenModule, canOpenPage, roleHomePage, type RoleKey } from './access';
import { phoneKey } from './accounts';
import { userFromBackend } from './backendUser';
import type { MockUser } from './mockUsers';
import type { AuthUser } from '@/types/auth';

export { MOCK_USERS, type MockUser } from './mockUsers';

interface AuthValue {
  user: MockUser | null;
  role: RoleKey | null;
  isAuthenticated: boolean;
  /** True while the saved session is being restored at start-up. */
  isLoading: boolean;
  /** `identifier` is the User ID: the email or username the backend knows. Throws an Error with a readable message. */
  login: (identifier: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  homePage: string;
  canManage: boolean;
  canOpenModule: (moduleLabel: string) => boolean;
  canOpenPage: (sectionKey: string, pageKey: string) => boolean;
}

const AuthContext = createContext<AuthValue | null>(null);
const NOT_ASSIGNED = 'Your account is not assigned to a school role yet. Please contact the school office.';

/** Link the signed-in person to their local sample record, so own-records screens (student, parent, teacher) have data. */
function withRecordLinks(person: MockUser, raw: AuthUser): MockUser {
  const username = (raw.username ?? '').toLowerCase();
  const email = (raw.email ?? '').toLowerCase();
  const phone = phoneKey(raw.phone ?? '');
  const sameContact = (e?: string, p?: string) => (!!email && (e ?? '').toLowerCase() === email) || (phone.length === 10 && phoneKey(p ?? '') === phone);
  if (person.role === 'student') {
    const s = snapshot<StudentRecord>('students').find((x) => (!!username && x.admissionNo.toLowerCase() === username) || sameContact(x.email, x.phone));
    return s ? { ...person, studentId: s.id } : person;
  }
  if (person.role === 'teacher') {
    const t = snapshot<TeacherRecord>('teachers').find((x) => (!!username && x.employeeId.toLowerCase() === username) || sameContact(x.email, x.phone));
    return t ? { ...person, teacherId: t.id } : person;
  }
  if (person.role === 'parent') {
    const kids = snapshot<StudentRecord>('students').filter((x) => phone.length === 10 && phoneKey(x.parentPhone) === phone).map((x) => x.id);
    return kids.length ? { ...person, childIds: kids } : person;
  }
  if (person.role !== 'admin') {
    const st = snapshot<StaffRecord>('staff').find((x) => sameContact(x.email, x.phone));
    return st ? { ...person, title: `${st.designation}, ${st.department}` } : person;
  }
  return person;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setLoading] = useState(true);

  // Restore the session saved on this device: check it with the server, or keep it for offline use if the server is unreachable.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (await tokenStorage.isSessionOnly()) {
          await tokenStorage.clearTokens(); // last sign-in was "Remember Me" off: the session ended with the app
          await tokenStorage.setSessionOnly(false);
          return;
        }
        const cached = await tokenStorage.getStoredUser();
        if (!cached || !(await tokenStorage.getAccessToken())) return;
        try {
          const { user: fresh } = await authApi.getCurrentUser(); // refreshes the access token once if it has expired
          const person = userFromBackend(fresh);
          if (!person) throw new ApiError(NOT_ASSIGNED, 401);
          await tokenStorage.setStoredUser(fresh);
          if (alive) setUser(withRecordLinks(person, fresh));
        } catch (e) {
          if (e instanceof ApiError && e.status === 0) {
            const person = userFromBackend(cached); // offline: keep the saved session
            if (alive && person) setUser(withRecordLinks(person, cached));
          } else {
            await tokenStorage.clearTokens(); // expired, revoked or account switched off
          }
        }
      } catch {
        /* no usable saved session: show the sign-in screen */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const login = useCallback(async (identifier: string, password: string, rememberMe = true) => {
    // The backend answers with its own readable message ("Invalid email or password"); a network failure says the server cannot be reached.
    const session = await authApi.login({ email: identifier, password });
    const person = userFromBackend(session.user);
    if (!person) throw new Error(NOT_ASSIGNED);
    await tokenStorage.setTokens(session.accessToken, session.refreshToken);
    await tokenStorage.setStoredUser(session.user);
    await tokenStorage.setSessionOnly(!rememberMe);
    setUser(withRecordLinks(person, session.user));
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await tokenStorage.getRefreshToken();
    setUser(null);
    try {
      await authApi.logout(refreshToken ?? undefined); // revokes the session on the server; never blocks signing out
    } finally {
      await tokenStorage.clearTokens();
      await tokenStorage.setSessionOnly(false);
    }
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      homePage: user ? roleHomePage(user.role) : 'admin-dashboard',
      canManage: canManage(user?.role),
      canOpenModule: (label) => canOpenModule(user?.role, label),
      canOpenPage: (section, page) => canOpenPage(user?.role, section, page),
    }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
