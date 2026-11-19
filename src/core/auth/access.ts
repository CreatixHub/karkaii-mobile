/**
 * Role rules, ported from karkaii-frontend/src/core/data/json/sidebarAccess.ts.
 *
 * - "admin" sees everything.
 * - A module that is not listed here is hidden from every other role (safe default).
 * - Students and parents are read-only (frontend: ManageOnly / useIsReadOnly).
 */
import { MENU, type ModuleDef, type SectionDef } from '@/core/nav/menu';

export type RoleKey =
  | 'admin'
  | 'teacher'
  | 'student'
  | 'parent'
  | 'accountant'
  | 'receptionist'
  | 'librarian'
  | 'warden'
  | 'transport_manager'
  | 'nurse'
  | 'security';

export const ROLES: { key: RoleKey; label: string; blurb: string }[] = [
  { key: 'admin', label: 'Admin', blurb: 'Principal / owner. Sees every module.' },
  { key: 'teacher', label: 'Teacher', blurb: 'Classes, timetable, attendance, learning.' },
  { key: 'student', label: 'Student', blurb: 'Own timetable, fees, transport (read-only).' },
  { key: 'parent', label: 'Parent', blurb: 'Child progress, fees, transport (read-only).' },
  { key: 'accountant', label: 'Accounts', blurb: 'Fees and school expenses.' },
  { key: 'receptionist', label: 'Front desk', blurb: 'Students directory and gate passes.' },
  { key: 'librarian', label: 'Librarian', blurb: 'Dashboard and holidays.' },
  { key: 'warden', label: 'Warden', blurb: 'Dashboard and holidays.' },
  { key: 'transport_manager', label: 'Transport', blurb: 'Fleet, routes and drivers.' },
  { key: 'nurse', label: 'Nurse', blurb: 'Dashboard and holidays.' },
  { key: 'security', label: 'Security', blurb: 'Gate passes.' },
];

export function roleLabel(role: RoleKey | null | undefined): string {
  return ROLES.find((r) => r.key === role)?.label ?? 'Guest';
}

const ALL_STAFF: RoleKey[] = ['accountant', 'receptionist', 'librarian', 'warden', 'transport_manager', 'nurse', 'security'];
const EVERYONE: RoleKey[] = ['teacher', 'student', 'parent', ...ALL_STAFF];

/** Module label -> roles (besides admin) that may open it. */
const MODULE_ACCESS: Record<string, RoleKey[]> = {
  Dashboard: EVERYONE,
  Students: ['teacher', 'receptionist'],
  'Classes & Sections': ['teacher'],
  Subjects: ['teacher', 'student', 'parent'],
  Timetable: ['teacher', 'student', 'parent'],
  Learning: ['teacher', 'student', 'parent'],
  Holidays: EVERYONE,
  Attendance: ['teacher', 'student', 'parent'],
  Fees: ['accountant', 'student', 'parent'],
  Accounts: ['accountant'],
  Transport: ['transport_manager', 'student', 'parent'],
  'Gate Pass': ['security', 'receptionist'],
  // Teachers, Staff, Users, Assets and School Strength Report have no entry: admin only.
};

/** Which dashboards each role may open (frontend: dashboardLinkAllowed). */
export function dashboardAllowed(pageKey: string, role: RoleKey): boolean {
  if (role === 'admin') return true;
  if (pageKey === 'teacher-dashboard') return role === 'teacher';
  if (pageKey === 'student-dashboard') return role === 'student';
  if (pageKey === 'parent-dashboard') return role === 'parent';
  if (pageKey === 'admin-dashboard') return ALL_STAFF.includes(role);
  return false;
}

export function roleHomePage(role: RoleKey): string {
  if (role === 'teacher') return 'teacher-dashboard';
  if (role === 'student') return 'student-dashboard';
  if (role === 'parent') return 'parent-dashboard';
  return 'admin-dashboard';
}

export function canOpenModule(role: RoleKey | null | undefined, moduleLabel: string): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  return MODULE_ACCESS[moduleLabel]?.includes(role) ?? false;
}

export function canOpenPage(role: RoleKey | null | undefined, sectionKey: string, pageKey: string): boolean {
  if (!role) return false;
  if (sectionKey === 'dashboard') return dashboardAllowed(pageKey, role);
  const section = MENU.find((s) => s.key === sectionKey);
  const module = section?.modules.find((m) => m.pages.some((pg) => pg.key === pageKey));
  return module ? canOpenModule(role, module.label) : false;
}

/** Add / edit / delete allowed? Students and parents can only look. */
export function canManage(role: RoleKey | null | undefined): boolean {
  return !!role && role !== 'student' && role !== 'parent';
}

/** The part of the menu a role may see (sections with nothing visible are dropped). */
export function visibleMenu(role: RoleKey | null | undefined): SectionDef[] {
  if (!role) return [];
  const out: SectionDef[] = [];
  for (const section of MENU) {
    const modules: ModuleDef[] = [];
    for (const module of section.modules) {
      if (section.key === 'dashboard') {
        const pages = module.pages.filter((pg) => dashboardAllowed(pg.key, role));
        if (pages.length) modules.push({ ...module, pages });
      } else if (canOpenModule(role, module.label)) {
        modules.push(module);
      }
    }
    if (modules.length) out.push({ ...section, modules });
  }
  return out;
}
