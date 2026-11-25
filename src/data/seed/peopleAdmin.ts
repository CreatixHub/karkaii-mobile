/** People & Admission seed data, part 1: departments, designations, roles, users, delete requests, audit log. */
import { MOCK_USERS } from '@/core/auth/mockUsers';
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import type { AuditRecord } from '@/features/common/audit';
import { buildStaff, buildStudents, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

/* ---------------------------------- Departments ---------------------------------- */

export type DepartmentType = 'Academic' | 'Administrative' | 'Support';

export interface DepartmentRecord extends Entity {
  code: string;
  name: string;
  type: DepartmentType;
  status: 'Active' | 'Inactive';
  description: string;
  contact: string;
  location: string;
  established: string;
  extension: string;
  email: string;
  /** Head of department as 'teacher:<id>' or 'staff:<id>' ('' = vacant). */
  hod: string;
}

const DEPARTMENTS: [string, DepartmentType, string, string][] = [
  ['Mathematics', 'Academic', 'Pure and applied mathematics from primary to secondary.', 'Block B, 2nd floor'],
  ['Science', 'Academic', 'Physics, chemistry, biology and integrated science.', 'Science Block'],
  ['English', 'Academic', 'English language, literature and communication skills.', 'Block A, 1st floor'],
  ['Social Studies', 'Academic', 'History, geography, civics and economics.', 'Block A, 2nd floor'],
  ['Languages', 'Academic', 'Hindi, Sanskrit and other second languages.', 'Block A, ground floor'],
  ['Computer Science', 'Academic', 'Computing, programming and digital literacy.', 'Computer Labs'],
  ['Physical Education', 'Academic', 'Sports, fitness and co-curricular games.', 'Sports Complex'],
  ['Arts', 'Academic', 'Visual arts, craft and performing arts.', 'Art Studio'],
  ['Administration', 'Administrative', 'Principal’s office, records and school administration.', 'Admin Block'],
  ['Accounts', 'Administrative', 'Fees, payroll, budgets and expenses.', 'Admin Block, ground floor'],
  ['Front Office', 'Administrative', 'Reception, enquiries, visitors and gate passes.', 'Main Gate'],
  ['Library', 'Support', 'Library services, circulation and reading programmes.', 'Library Hall'],
  ['Transport', 'Support', 'School buses, drivers, routes and fleet compliance.', 'Transport Yard'],
  ['IT Support', 'Support', 'Network, devices and school software.', 'Admin Block, 1st floor'],
  ['Housekeeping', 'Support', 'Cleanliness, maintenance and facilities.', 'Facilities Office'],
  ['Health', 'Support', 'Sick room, medical checks and first aid.', 'Sick Room'],
  ['Security', 'Support', 'Campus security and access control.', 'Main Gate'],
  ['Hostel', 'Support', 'Hostel management and student welfare.', 'Hostel Block A'],
];

export const buildDepartments = (): DepartmentRecord[] => {
  const teachers = buildTeachers();
  const staff = buildStaff();
  return DEPARTMENTS.map(([name, type, description, location], i) => {
    const t = teachers.filter((x) => x.department === name).sort((a, b) => b.experienceYears - a.experienceYears)[0];
    const s = staff.filter((x) => x.department === name).sort((a, b) => b.experienceYears - a.experienceYears)[0];
    return {
      id: `dept-${pad(i + 1, 2)}`,
      code: `D75${7248 - i * 3}`,
      name,
      type,
      status: 'Active',
      description,
      contact: `+91 44 2${pad(4100 + i * 7, 4)}00`,
      location,
      established: `${2005 + (i % 9)}-06-01`,
      extension: String(200 + i),
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}@karkaii.demo`,
      hod: t ? `teacher:${t.id}` : s ? `staff:${s.id}` : '',
    };
  });
};
export const departments = defineCollection<DepartmentRecord>('departments', buildDepartments);

/* --------------------------------- Designations --------------------------------- */

export interface DesignationRecord extends Entity {
  code: string;
  name: string;
  status: 'Active' | 'Inactive';
}

export const buildDesignations = (): DesignationRecord[] => {
  const names = new Set<string>(['Technical Head', 'Teacher', 'Doctor', 'Driver', 'Warden', 'Receptionist', 'Therapist', 'Coach']);
  buildStaff().forEach((s) => names.add(s.designation));
  buildTeachers().forEach((t) => names.add(t.designation));
  const inactive = new Set(['Doctor', 'Therapist']);
  return [...names].map((name, i) => ({ id: `des-${pad(i + 1, 2)}`, code: `DS${748294 - i}`, name, status: inactive.has(name) ? 'Inactive' : 'Active' }));
};
export const designations = defineCollection<DesignationRecord>('designations', buildDesignations);

/* ------------------------------------- Roles ------------------------------------- */

export const PERMISSION_ACTIONS = ['View', 'Create', 'Edit', 'Delete', 'Import', 'Export', 'Approve', 'Print', 'Download', 'Manage'] as const;
export const PERMISSION_MODULES: { id: string; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'students', label: 'Students' },
  { id: 'admissions', label: 'Admissions' },
  { id: 'teachers', label: 'Teachers' },
  { id: 'academics', label: 'Academics' },
  { id: 'attendance', label: 'Attendance' },
  { id: 'examinations', label: 'Examinations' },
  { id: 'finance', label: 'Finance' },
];

const flags = (...v: number[]) => v.map((x) => x === 1);
export const PRESETS: Record<string, boolean[]> = {
  none: flags(0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
  read_only: flags(1, 0, 0, 0, 0, 1, 0, 1, 1, 0),
  editor: flags(1, 1, 1, 0, 1, 1, 0, 1, 1, 0),
  manager: flags(1, 1, 1, 1, 1, 1, 1, 1, 1, 0),
  full_access: flags(1, 1, 1, 1, 1, 1, 1, 1, 1, 1),
};

export interface RoleRecord extends Entity {
  name: string;
  description: string;
  type: 'System Role' | 'Custom Role';
  status: 'Active' | 'Inactive';
  updatedOn: string;
  /** module id -> one flag per PERMISSION_ACTIONS entry */
  permissions: Record<string, boolean[]>;
}

const perms = (map: Record<string, keyof typeof PRESETS>): Record<string, boolean[]> =>
  Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, [...PRESETS[map[m.id] ?? 'none']]]));

const ROLE_ROWS: [string, string, string, 'System Role' | 'Custom Role', Record<string, keyof typeof PRESETS>][] = [
  ['admin', 'Administrator', 'Full, unrestricted access to every module, setting and user across the institution.', 'System Role', Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, 'full_access' as const]))],
  ['teacher', 'Teacher', 'Teaching staff: class registers, timetable, homework and marks for their own classes.', 'System Role', { dashboard: 'read_only', students: 'editor', teachers: 'read_only', academics: 'manager', attendance: 'manager', examinations: 'manager' }],
  ['student', 'Student', 'Read-only access to their own timetable, homework, attendance and fees.', 'System Role', { dashboard: 'read_only', academics: 'read_only', attendance: 'read_only', finance: 'read_only' }],
  ['parent', 'Parent', 'Read-only access to their children’s progress, attendance, fees and transport.', 'System Role', { dashboard: 'read_only', academics: 'read_only', attendance: 'read_only', finance: 'read_only' }],
  ['accountant', 'Accountant', 'Fees, receipts, expenses and financial reports.', 'System Role', { dashboard: 'read_only', students: 'read_only', finance: 'full_access' }],
  ['receptionist', 'Front Desk', 'Student directory, admissions enquiries and gate passes.', 'System Role', { dashboard: 'read_only', students: 'editor', admissions: 'manager' }],
  ['librarian', 'Librarian', 'Library catalogue and circulation.', 'System Role', { dashboard: 'read_only' }],
  ['warden', 'Warden', 'Hostel residents and visitor log.', 'System Role', { dashboard: 'read_only', students: 'read_only' }],
  ['transport_manager', 'Transport Manager', 'Fleet, routes, drivers and transport assignments.', 'System Role', { dashboard: 'read_only' }],
  ['nurse', 'Nurse', 'Student health records and sick-room log.', 'System Role', { dashboard: 'read_only', students: 'read_only' }],
  ['security', 'Security', 'Gate passes and visitor verification.', 'System Role', { dashboard: 'read_only' }],
  ['staff', 'Staff', 'General non-teaching staff access.', 'System Role', { dashboard: 'read_only', attendance: 'read_only' }],
  ['exam_coordinator', 'Exam Coordinator', 'Plans exams and publishes results; reads student data.', 'Custom Role', { dashboard: 'read_only', students: 'read_only', academics: 'editor', examinations: 'full_access' }],
  ['admissions_officer', 'Admissions Officer', 'Runs the admissions pipeline end to end.', 'Custom Role', { dashboard: 'read_only', students: 'editor', admissions: 'full_access' }],
];

export const roleIdOf = (key: string) => `role-${key}`;

export const roles = defineCollection<RoleRecord>('roles', () =>
  ROLE_ROWS.map(([key, name, description, type, map], i) => ({
    id: roleIdOf(key),
    name,
    description,
    type,
    status: 'Active' as const,
    updatedOn: addDays(SEED_TODAY, -(i * 5 + 2)),
    permissions: perms(map),
  })),
);

/* ------------------------------------- Users ------------------------------------- */

export type UserStatus = 'Active' | 'Pending' | 'Inactive' | 'Suspended' | 'Blocked';

export interface UserRecord extends Entity {
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  department: string;
  branch: string;
  status: UserStatus;
  online: boolean;
  /** ISO date-time, '' = never signed in. */
  lastLogin: string;
  created: string;
  linkedType: 'admin' | 'teacher' | 'staff' | 'student' | 'parent';
  linkedId: string;
}

const staffRole = (designation: string): string => {
  if (/Bursar|Accountant|Cashier/.test(designation)) return 'accountant';
  if (/Front Desk|Receptionist/.test(designation)) return 'receptionist';
  if (/Librarian/.test(designation)) return 'librarian';
  if (/Transport/.test(designation)) return 'transport_manager';
  if (/Nurse/.test(designation)) return 'nurse';
  if (/Security/.test(designation)) return 'security';
  if (/Warden/.test(designation)) return 'warden';
  return 'staff';
};

export const buildUsers = (): UserRecord[] => {
  const rng = makeRng(7070);
  const out: UserRecord[] = [];
  const seen = new Set<string>();
  const login = (daysAgo: number) => `${addDays(SEED_TODAY, -daysAgo)}T${pad(rng.int(7, 21), 2)}:${pad(rng.int(0, 59), 2)}:00`;
  const push = (u: Omit<UserRecord, 'firstName' | 'lastName' | 'online' | 'lastLogin' | 'created'> & Partial<Pick<UserRecord, 'online' | 'lastLogin' | 'created'>>) => {
    if (seen.has(u.email)) return;
    seen.add(u.email);
    const daysAgo = rng.int(0, 9);
    const [firstName, ...rest] = u.name.split(' ');
    out.push({ firstName, lastName: rest.join(' '), online: u.status === 'Active' && rng.chance(0.25), lastLogin: u.status === 'Pending' ? '' : login(daysAgo), created: addDays(SEED_TODAY, -rng.int(40, 400)), ...u });
  };

  // The 11 demo accounts exist as real users (same ids/emails as the sign-in screen).
  for (const d of MOCK_USERS) {
    push({ id: d.id, name: d.name, email: d.email, phone: d.phone, roleId: roleIdOf(d.role), department: d.role === 'admin' ? 'Administration' : d.title, branch: 'Main Campus', status: 'Active', linkedType: d.role === 'admin' ? 'admin' : d.teacherId ? 'teacher' : d.studentId ? 'student' : d.childIds ? 'parent' : 'staff', linkedId: d.teacherId ?? d.studentId ?? d.childIds?.[0] ?? '', online: d.role === 'admin' });
  }
  const demoNames = new Set(MOCK_USERS.map((d) => d.name));

  buildTeachers().forEach((t) => {
    if (demoNames.has(t.name)) return;
    push({ id: `usr-${t.id}`, name: t.name, email: t.email, phone: t.phone, roleId: roleIdOf('teacher'), department: t.department, branch: t.campus, status: t.status === 'On Leave' ? 'Inactive' : 'Active', linkedType: 'teacher', linkedId: t.id });
  });
  buildStaff().forEach((s) => {
    if (demoNames.has(s.name)) return;
    push({ id: `usr-${s.id}`, name: s.name, email: s.email, phone: s.phone, roleId: roleIdOf(staffRole(s.designation)), department: s.department, branch: s.campus, status: s.status === 'Suspended' ? 'Suspended' : s.status === 'Probation' ? 'Pending' : 'Active', linkedType: 'staff', linkedId: s.id });
  });

  const students = buildStudents();
  // One parent account per distinct guardian among the first 14 families, then 24 student accounts.
  const parents = new Map<string, string>();
  for (const st of students) if (!parents.has(st.parentName)) parents.set(st.parentName, st.id);
  [...parents.entries()].slice(0, 15).forEach(([name, childId], i) => {
    const child = students.find((s) => s.id === childId)!;
    push({ id: `usr-par-${pad(i + 1, 2)}`, name, email: `${name.toLowerCase().replace(/\s+/g, '.')}.${i + 1}@parent.karkaii.demo`, phone: child.parentPhone, roleId: roleIdOf('parent'), department: `Parent of ${child.name}`, branch: 'Main Campus', status: i === 6 ? 'Pending' : 'Active', linkedType: 'parent', linkedId: child.id });
  });
  students.slice(0, 24).forEach((st, i) => {
    push({ id: `usr-${st.id}`, name: st.name, email: st.email, phone: st.phone, roleId: roleIdOf('student'), department: `Grade ${st.classId.slice(4)}`, branch: 'Main Campus', status: i === 9 ? 'Blocked' : i === 15 ? 'Inactive' : 'Active', linkedType: 'student', linkedId: st.id });
  });
  return out;
};
/** Accounts whose deletion request is already Completed no longer exist. */
export const users = defineCollection<UserRecord>('users', () => {
  const gone = new Set(buildDeleteRequests().filter((r) => r.status === 'Completed').map((r) => r.userId));
  return buildUsers().filter((u) => !gone.has(u.id));
});

/* ------------------------------- Delete account requests ------------------------------- */

export type RequestStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected' | 'Completed' | 'Cancelled';
export type RequestUserType = 'Student' | 'Teacher' | 'Parent' | 'Employee';

export interface DeleteRequestRecord extends Entity {
  code: string;
  /** Account the request is about (may no longer exist once the request is Completed). */
  userId: string;
  /** Snapshot so the request stays readable after the account is gone. */
  name: string;
  email: string;
  accountNo: string;
  userType: RequestUserType;
  department: string;
  reason: string;
  reasonNote: string;
  requestedOn: string;
  status: RequestStatus;
  reviewer: string;
  decisionNote: string;
  /** Scheduled (Approved) or actual (Completed) deletion date. */
  deletionDate: string;
}

const REASONS: [string, string][] = [
  ['Moved to another school', 'The family is relocating and has enrolled the student elsewhere.'],
  ['Left the institution', 'Resigned from the school; account no longer required.'],
  ['Privacy concerns', 'Requests removal of personal data under the school’s data-protection policy.'],
  ['Duplicate account', 'A second account was created by mistake; keep the original.'],
  ['Graduated', 'Student graduated and no longer needs portal access.'],
  ['Account no longer needed', 'No longer using the parent portal.'],
  ['Data protection request', 'Formal request to erase personal data.'],
];

export const buildDeleteRequests = (): DeleteRequestRecord[] => {
  const all = buildUsers();
  const pick = (type: UserRecord['linkedType'], n: number) => all.filter((u) => u.linkedType === type)[n];
  const typeOf = (u: UserRecord): RequestUserType => (u.linkedType === 'student' ? 'Student' : u.linkedType === 'parent' ? 'Parent' : u.linkedType === 'teacher' ? 'Teacher' : 'Employee');
  // [user, reasonIdx, daysAgo, status, reviewer, decisionNote, deletion offset]
  const rows: [UserRecord | undefined, number, number, RequestStatus, string, string, number | null][] = [
    [pick('student', 5), 0, 2, 'Pending', '', '', null],
    [pick('parent', 2), 5, 3, 'Pending', '', '', null],
    [pick('teacher', 2), 1, 5, 'Pending', '', '', null],
    [pick('student', 8), 2, 8, 'Under Review', 'Rebecca Hall', '', null],
    [pick('staff', 4), 1, 9, 'Under Review', 'Priya Venkatesh', '', null],
    [pick('parent', 5), 6, 14, 'Approved', 'Rebecca Hall', 'Approved after identity verification.', 21],
    [pick('student', 12), 3, 16, 'Approved', 'Rebecca Hall', 'Duplicate confirmed.', 14],
    [pick('staff', 7), 2, 20, 'Rejected', 'Priya Venkatesh', 'Records must be retained for audit until year end.', null],
    [pick('student', 20), 4, 40, 'Completed', 'Rebecca Hall', 'Data erased as scheduled.', -26],
    [pick('parent', 8), 5, 30, 'Cancelled', '', 'Cancelled by the requester.', null],
  ];
  return rows.flatMap(([u, ri, daysAgo, status, reviewer, decisionNote, del], i) => {
    if (!u) return [];
    return [{
      id: `dr-${pad(i + 1, 2)}`,
      code: `DR-${1001 + i}`,
      userId: u.id,
      name: u.name,
      email: u.email,
      accountNo: `U${461893 + i * 17}`,
      userType: typeOf(u),
      department: u.department,
      reason: REASONS[ri][0],
      reasonNote: REASONS[ri][1],
      requestedOn: addDays(SEED_TODAY, -daysAgo),
      status,
      reviewer,
      decisionNote,
      deletionDate: del === null ? '' : addDays(SEED_TODAY, del),
    }];
  });
};
export const deleteRequests = defineCollection<DeleteRequestRecord>('deleteRequests', buildDeleteRequests);

/* ------------------------------------ Audit log ------------------------------------ */

const AUDIT_ROWS: [string, string, AuditRecord['action'], string, string, number][] = [
  ['student', 'stu-001', 'Updated', 'Janet Daniel: changed Phone, Emergency Phone', 'Dr. Meera Krishnan', 3],
  ['student', 'stu-001', 'Action', 'Janet Daniel: Message guardian', 'Arun Pillai', 7],
  ['student', 'stu-001', 'Updated', 'Janet Daniel: changed Class, Section', 'Rebecca Hall', 41],
  ['student', 'stu-002', 'Created', 'Lucas Daniel created', 'Rebecca Hall', 120],
  ['teacher', 'tch-001', 'Updated', 'Sarah Mitchell: changed Basic Salary', 'Priya Venkatesh', 30],
  ['teacher', 'tch-001', 'Updated', 'Sarah Mitchell: changed Address', 'Dr. Meera Krishnan', 75],
  ['staff', 'stf-015', 'Updated', 'Ava Robinson: changed Status', 'Rebecca Hall', 12],
  ['staff', 'stf-001', 'Action', 'Priya Venkatesh: Assign department', 'Dr. Meera Krishnan', 60],
];
export const auditLog = defineCollection<AuditRecord>('auditLog', () =>
  AUDIT_ROWS.map(([entity, entityId, action, summary, by, daysAgo], i) => ({
    id: `aud-${pad(i + 1)}`,
    entity,
    entityId,
    action,
    summary,
    by,
    at: `${addDays(SEED_TODAY, -daysAgo)}T${pad(9 + (i % 8), 2)}:${pad((i * 13) % 60, 2)}:00`,
  })),
);
