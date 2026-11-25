/**
 * Sign-in for the mock phase, following the web app's login page: one field takes an email address, a phone
 * number or (for students) an admission number, and the account found decides the role. The role then drives the
 * profile, the dashboard and the menu, exactly as before; nothing here changes what a role may do.
 *
 * Accounts are the people on the Users page, so a student, parent, teacher or staff member added or blocked there
 * signs in (or is refused) accordingly. The 11 built-in demo accounts always work so the app cannot lock itself out.
 * Every account uses the one demo password; there is no server to check real credentials.
 */
import { snapshot } from '@/core/store/store';
import type { SchoolProfileRecord } from '@/data/seed/administration';
import type { ClassRecord, SectionRecord, StaffRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';
import type { RoleRecord, UserRecord } from '@/data/seed/peopleAdmin';
import { ROLES, type RoleKey } from './access';
import { DEMO_PASSWORD, MOCK_USERS, type MockUser } from './mockUsers';

export type SignInResult = { ok: true; user: MockUser } | { ok: false; message: string };

export const WRONG_CREDENTIALS = 'Invalid email, phone number or password.';

const digits = (s: string) => s.replace(/\D/g, '');
/** The last ten digits, so "+91 98400 11001", "098400 11001" and "9840011001" are the same number. */
export const phoneKey = (s: string) => {
  const d = digits(s);
  return d.length > 10 ? d.slice(-10) : d;
};

const ROLE_KEYS = new Set<string>(ROLES.map((r) => r.key));
/** Staff whose role has no screens of its own (the general Staff role, custom roles) get the narrowest built-in access: Dashboard, Holidays and Events. */
export const BASIC_ROLE: RoleKey = 'librarian';

const isLive = (s: StudentRecord) => s.status === 'Active' || s.status === 'On Leave';

/** The role a Users-page account signs in as, and the name to show when it is not one of the built-in profiles. */
export function roleOfAccount(roleId: string): { role: RoleKey; roleName?: string } {
  const key = roleId.replace(/^role-/, '');
  if (ROLE_KEYS.has(key)) return { role: key as RoleKey };
  return { role: BASIC_ROLE, roleName: snapshot<RoleRecord>('roles').find((r) => r.id === roleId)?.name ?? 'Staff' };
}

function findDemo(id: string): MockUser | undefined {
  const lower = id.toLowerCase();
  const phone = phoneKey(id);
  return MOCK_USERS.find((u) => u.email.toLowerCase() === lower || (phone.length === 10 && phoneKey(u.phone) === phone));
}

function findAccount(id: string): UserRecord | undefined {
  const users = snapshot<UserRecord>('users');
  const lower = id.toLowerCase();
  if (id.includes('@')) return users.find((u) => u.email.toLowerCase() === lower);
  const phone = phoneKey(id);
  if (phone.length === 10) {
    const byPhone = users.find((u) => phoneKey(u.phone) === phone);
    if (byPhone) return byPhone;
  }
  // A student's username is their admission number.
  const student = snapshot<StudentRecord>('students').find((s) => s.admissionNo.toLowerCase() === lower);
  return student ? users.find((u) => u.linkedType === 'student' && u.linkedId === student.id) : undefined;
}

/** Why this account cannot sign in right now, or null. */
function refusal(u: UserRecord): string | null {
  if (u.status === 'Blocked') return 'This account is blocked. Please contact the school office.';
  if (u.status === 'Suspended') return 'This account is suspended. Please contact the school office.';
  if (u.status === 'Inactive') return 'Your account is inactive. Please contact the school office.';
  const role = snapshot<RoleRecord>('roles').find((r) => r.id === u.roleId);
  if (role && role.status === 'Inactive') return `The ${role.name} role is switched off. Please contact the school office.`;
  return null;
}

/** The signed-in person for a Users-page account: role from the account, scope from the record it is linked to. */
export function toMockUser(u: UserRecord): MockUser {
  const demo = MOCK_USERS.find((m) => m.id === u.id);
  if (demo) return demo;
  const { role, roleName } = roleOfAccount(u.roleId);
  const school = snapshot<SchoolProfileRecord>('schoolProfile')[0]?.name ?? 'Karkaii International School';
  const base: MockUser = { id: u.id, name: u.name, email: u.email, phone: u.phone, role, roleName, title: u.department || roleName || '', school };
  const students = snapshot<StudentRecord>('students');
  if (u.linkedType === 'student') {
    const s = students.find((x) => x.id === u.linkedId);
    const cls = snapshot<ClassRecord>('classes').find((c) => c.id === s?.classId)?.name;
    const sec = snapshot<SectionRecord>('sections').find((c) => c.id === s?.sectionId)?.name;
    return { ...base, studentId: u.linkedId, title: s ? `${cls ?? 'Class'} ${sec ?? ''}`.trim() : base.title };
  }
  if (u.linkedType === 'parent') {
    const child = students.find((x) => x.id === u.linkedId);
    const kids = child ? students.filter((x) => x.parentName === child.parentName && x.parentPhone === child.parentPhone && isLive(x)).map((x) => x.id) : [];
    const childIds = kids.length ? kids : [u.linkedId];
    return { ...base, childIds, title: `Parent of ${childIds.length} student${childIds.length === 1 ? '' : 's'}` };
  }
  if (u.linkedType === 'teacher') {
    const t = snapshot<TeacherRecord>('teachers').find((x) => x.id === u.linkedId);
    return { ...base, teacherId: u.linkedId, title: t ? `${t.designation}, ${t.department}` : base.title };
  }
  if (u.linkedType === 'staff') {
    const st = snapshot<StaffRecord>('staff').find((x) => x.id === u.linkedId);
    return { ...base, title: st ? `${st.designation}, ${st.department}` : base.title };
  }
  return base;
}

/** Check an email / phone / admission number and password. The account found decides the role. */
export function signIn(identifier: string, password: string): SignInResult {
  const id = identifier.trim();
  if (!id) return { ok: false, message: 'Email or phone number is required' };
  if (!password) return { ok: false, message: 'Password is required' };
  const demo = findDemo(id);
  const account = demo ? undefined : findAccount(id);
  if (!demo && !account) return { ok: false, message: WRONG_CREDENTIALS };
  if (password !== DEMO_PASSWORD) return { ok: false, message: WRONG_CREDENTIALS };
  if (demo) return { ok: true, user: demo };
  const why = refusal(account!);
  if (why) return { ok: false, message: why };
  return { ok: true, user: toMockUser(account!) };
}

/** Does an account exist for this email, phone number or admission number? (Used by "Forgot password".) */
export function accountExists(identifier: string): boolean {
  const id = identifier.trim();
  if (!id) return false;
  return !!findDemo(id) || !!findAccount(id);
}

/** Bring a saved session back: the same account, unless it has since been deleted or switched off. */
export function restoreSession(userId: string): MockUser | null {
  const demo = MOCK_USERS.find((m) => m.id === userId);
  if (demo) return demo;
  const account = snapshot<UserRecord>('users').find((u) => u.id === userId);
  if (!account || refusal(account)) return null;
  return toMockUser(account);
}

/** Is this one of the 11 built-in demo accounts (the only ones that may use the demo role switcher)? */
export const isDemoAccount = (user: MockUser | null | undefined) => !!user && MOCK_USERS.some((m) => m.id === user.id);

/** The IDs a person can sign in with, for the profile page. */
export function signInIds(user: MockUser): string[] {
  const ids = [user.email, user.phone].filter(Boolean);
  if (user.studentId) {
    const s = snapshot<StudentRecord>('students').find((x) => x.id === user.studentId);
    if (s) ids.push(s.admissionNo);
  }
  return ids;
}
