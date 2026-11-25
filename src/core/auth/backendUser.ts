/**
 * Turns the user the backend returns from POST /api/auth/login (and GET /api/auth/me) into the signed-in person the
 * app works with. The backend computes ONE role per person for their active school (backend session.ts
 * `toFrontendRole`): owner/admin -> "admin", otherwise the first matching role such as teacher, accountant, parent,
 * student. The role decides the dashboard and menu through the existing access rules; nothing is decided here.
 *
 * Pure functions (no React Native), so they can be tested in Node.
 */
import type { AuthUser } from '@/types/auth';
import { ROLES, type RoleKey } from './access';
import type { MockUser } from './mockUsers';

const ROLE_KEYS = new Set<string>(ROLES.map((r) => r.key));
/** Backend roles the app has no screens for (the general "staff" role, custom roles) get the narrowest built-in access. */
const BASIC_ROLE: RoleKey = 'librarian';

export interface RoleResult {
  role: RoleKey;
  /** Shown instead of the built-in role label when the backend role has no profile of its own. */
  roleName?: string;
}

const label = (code: string) => code.charAt(0).toUpperCase() + code.slice(1).replace(/_/g, ' ');

/** The app role for a backend role code, or null when the person has no role in a school yet (so they cannot be given a dashboard). */
export function roleFromBackend(role: string | null | undefined): RoleResult | null {
  const code = (role ?? '').trim().toLowerCase();
  if (!code) return null;
  if (code === 'superadmin' || code === 'owner') return { role: 'admin' };
  if (ROLE_KEYS.has(code)) return { role: code as RoleKey };
  return { role: BASIC_ROLE, roleName: label(code) };
}

/** The person for the app, or null when the backend gave no usable role. Student/teacher/parent record links are added by the caller. */
export function userFromBackend(u: AuthUser): MockUser | null {
  const mapped = roleFromBackend(u.role);
  if (!mapped) return null;
  return {
    id: String(u.id),
    name: u.name,
    email: u.email ?? '',
    phone: u.phone ?? '',
    role: mapped.role,
    roleName: mapped.roleName,
    title: mapped.roleName ?? ROLES.find((r) => r.key === mapped.role)?.label ?? '',
    school: u.organization?.name ?? '',
  };
}
