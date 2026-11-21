import { MOCK_USERS } from '@/core/auth/mockUsers';
import { repo, snapshot } from '@/core/store/store';
import { addDays, diffDays, formatDate, relativeDay, todayISO } from '@/core/utils/date';
import type { SubjectRecord } from '@/data/seed/academic';
import { LAST_SCHOOL_DAY, type LeaveRecord, type StaffAttendanceRecord } from '@/data/seed/hrm';
import type { StaffRecord, TeacherRecord } from '@/data/seed/master';
import {
  PERMISSION_ACTIONS,
  PERMISSION_MODULES,
  PRESETS,
  type DeleteRequestRecord,
  type DepartmentRecord,
  type DesignationRecord,
  type RoleRecord,
  type UserRecord,
} from '@/data/seed/peopleAdmin';
import { campusChoices, countBy, getStaff, mainCampusName, nextNo, personName, sum } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Option } from '@/ui/Fields';
import type { Tone } from '@/ui/tone';
import { mappingsOfSubject, opts } from '@/features/academic/helpers';

const staffAll = () => snapshot<StaffRecord>('staff');
const teachersAll = () => snapshot<TeacherRecord>('teachers');
const deptNames = () => snapshot<DepartmentRecord>('departments').map((d) => d.name);
const roleName = (id: string) => snapshot<RoleRecord>('roles').find((r) => r.id === id)?.name ?? '—';
const yearsSince = (iso: string) => diffDays(iso, todayISO()) / 365;

/** Everyone who can head a department (teachers and non-teaching staff) as 'kind:id' options. */
const headOptions = (): Option[] => [
  ...teachersAll().map((t) => ({ label: t.name, value: `teacher:${t.id}`, hint: `Teacher · ${t.department}` })),
  ...staffAll().map((s) => ({ label: s.name, value: `staff:${s.id}`, hint: `Staff · ${s.department}` })),
];

/* ===================================== Staff list ===================================== */

const staffTone: Record<string, Tone> = { Active: 'success', 'On Leave': 'warning', Probation: 'info', Suspended: 'danger', Inactive: 'neutral' };
const EMPLOYMENT = ['Full-time', 'Contract'];

const todayAttendance = (s: StaffRecord): string => snapshot<StaffAttendanceRecord>('staffAttendance').find((a) => a.staffId === s.id && a.date === LAST_SCHOOL_DAY)?.status ?? 'Not recorded';
const staffDeptTone = (s: StaffRecord): Tone => ((['primary', 'purple', 'teal', 'info', 'pink', 'warning'] as Tone[])[Math.max(0, deptNames().indexOf(s.department)) % 6]);

export const staffCfg: ResourceConfig<StaffRecord> = {
  entity: 'Staff Member',
  collection: 'staff',
  auditEntity: 'staff',
  searchPlaceholder: 'Search name, ID, department…',
  searchText: (r) => `${r.name} ${r.employeeId} ${r.department} ${r.designation} ${r.email} ${r.phone}`,
  code: (r) => r.employeeId,
  title: (r) => r.name,
  subtitle: (r) => `${r.designation} · ${r.department}`,
  status: (r) => ({ label: r.status, tone: staffTone[r.status] }),
  badges: (r) => [{ label: r.employmentType, tone: r.employmentType === 'Contract' ? 'warning' : 'success' }, { label: r.department, tone: staffDeptTone(r) }, { label: `Today: ${todayAttendance(r)}`, tone: todayAttendance(r) === 'Present' ? 'success' : todayAttendance(r) === 'On Leave' ? 'info' : 'neutral' }],
  facts: [
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Email', value: (r) => r.email },
    { label: 'Branch', value: (r) => r.campus },
    { label: 'Joined', value: (r) => formatDate(r.joinedOn) },
    { label: 'Reports to', value: (r) => r.reportsTo },
    { label: 'Experience', value: (r) => `${r.experienceYears} yrs` },
  ],
  detail: [
    { title: 'Staff', items: [{ label: 'Employee ID', value: (r) => r.employeeId }, { label: 'Name', value: (r) => r.name }, { label: 'Gender', value: (r) => r.gender }, { label: 'Department', value: (r) => r.department }, { label: 'Designation', value: (r) => r.designation }, { label: 'Staff type', value: (r) => r.staffType }, { label: 'Status', value: (r) => r.status }] },
    { title: 'Contact', items: [{ label: 'Email', value: (r) => r.email }, { label: 'Phone', value: (r) => r.phone }, { label: 'Emergency contact', value: (r) => r.emergencyContact }, { label: 'Emergency phone', value: (r) => r.emergencyPhone }] },
    { title: 'Work', items: [{ label: 'Branch', value: (r) => r.campus }, { label: 'Shift', value: (r) => r.shift }, { label: 'Employment', value: (r) => r.employmentType }, { label: 'Joined', value: (r) => formatDate(r.joinedOn) }, { label: 'Reports to', value: (r) => r.reportsTo }, { label: 'Qualification', value: (r) => r.qualification }, { label: 'Experience', value: (r) => `${r.experienceYears} years` }, { label: 'Last login', value: (r) => r.lastLogin }] },
    {
      title: 'This register',
      items: [
        { label: 'Attendance (latest day)', value: todayAttendance },
        { label: 'Days present', value: (r) => countBy(snapshot<StaffAttendanceRecord>('staffAttendance'), (a) => a.staffId === r.id && (a.status === 'Present' || a.status === 'Late')) },
        { label: 'Leave requests', value: (r) => countBy(snapshot<LeaveRecord>('leaves'), (l) => l.staffId === r.id) },
        { label: 'Performance note', value: (r) => r.performanceNote },
        { label: 'Remarks', value: (r) => r.remarks || '—' },
      ],
    },
  ],
  stats: [
    { label: 'Total staff', value: (rows) => rows.length, icon: 'users' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'user-check' },
    { label: 'On leave', value: (rows) => countBy(rows, (r) => r.status === 'On Leave'), tone: 'warning', icon: 'calendar' },
    { label: 'Probation', value: (rows) => countBy(rows, (r) => r.status === 'Probation'), tone: 'info', icon: 'clock' },
    { label: 'Suspended', value: (rows) => countBy(rows, (r) => r.status === 'Suspended'), tone: 'danger', icon: 'slash' },
    { label: 'Inactive', value: (rows) => countBy(rows, (r) => r.status === 'Inactive'), tone: 'neutral', icon: 'user-x' },
  ],
  views: [
    { key: 'all', label: 'All Staff', match: () => true },
    { key: 'Active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'On Leave', label: 'On Leave', match: (r) => r.status === 'On Leave' },
    { key: 'Probation', label: 'Probation', match: (r) => r.status === 'Probation' },
    { key: 'Suspended', label: 'Suspended', match: (r) => r.status === 'Suspended' },
  ],
  filters: [
    { key: 'department', label: 'Department', options: () => deptNames().map((d) => ({ label: d, value: d })), match: (r, v) => r.department === v },
    { key: 'designation', label: 'Designation', options: () => [...new Set(staffAll().map((s) => s.designation))].map((d) => ({ label: d, value: d })), match: (r, v) => r.designation === v },
    { key: 'type', label: 'Staff type', options: opts(['Administrative', 'Support']), match: (r, v) => r.staffType === v },
    { key: 'employment', label: 'Employment', options: opts(EMPLOYMENT), match: (r, v) => r.employmentType === v },
    { key: 'gender', label: 'Gender', options: opts(['Male', 'Female']), match: (r, v) => r.gender === v },
    { key: 'branch', label: 'Branch', options: () => campusChoices(), match: (r, v) => r.campus === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'On Leave', 'Probation', 'Suspended', 'Inactive']), match: (r, v) => r.status === v },
    { key: 'joined', label: 'Joining period', single: true, options: opts(['Within 1 year', '1–5 years', 'Over 5 years']), match: (r, v) => { const y = yearsSince(r.joinedOn); return v === 'Within 1 year' ? y < 1 : v === '1–5 years' ? y >= 1 && y <= 5 : y > 5; } },
  ],
  sorts: [
    { key: 'name', label: 'Employee name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'department', label: 'Department', compare: (a, b) => a.department.localeCompare(b.department) || a.name.localeCompare(b.name) },
    { key: 'experience', label: 'Experience (most first)', compare: (a, b) => b.experienceYears - a.experienceYears },
    { key: 'joined', label: 'Joining date (earliest)', compare: (a, b) => a.joinedOn.localeCompare(b.joinedOn) },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
  ],
  form: [
    { key: 'name', label: 'Employee Name', type: 'text', required: true },
    { key: 'employeeId', label: 'Employee ID', type: 'text', required: true },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'], default: 'Male' },
    { key: 'department', label: 'Department', type: 'select', required: true, options: () => deptNames().map((d) => ({ label: d, value: d })) },
    { key: 'designation', label: 'Designation', type: 'select', required: true, options: () => snapshot<DesignationRecord>('designations').filter((d) => d.status === 'Active').map((d) => ({ label: d.name, value: d.name })) },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Mobile', type: 'phone', required: true },
    { key: 'employmentType', label: 'Employment Type', type: 'select', required: true, options: EMPLOYMENT, default: 'Full-time' },
    { key: 'joinedOn', label: 'Joining Date', type: 'date', required: true },
    { key: 'campus', label: 'Branch', type: 'select', required: true, options: campusChoices, default: mainCampusName() },
    { key: 'shift', label: 'Shift', type: 'select', options: ['Morning', 'General'], default: 'General' },
    { key: 'reportsTo', label: 'Reports To', type: 'text' },
    { key: 'qualification', label: 'Qualification', type: 'text' },
    { key: 'experienceYears', label: 'Experience (years)', type: 'number', min: 0, max: 50, default: 0 },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'On Leave', 'Probation', 'Suspended', 'Inactive'], default: 'Probation' },
    { key: 'emergencyContact', label: 'Emergency Contact', type: 'text' },
    { key: 'emergencyPhone', label: 'Emergency Phone', type: 'phone' },
    { key: 'remarks', label: 'Remarks', type: 'textarea' },
  ],
  defaults: (rows) => ({ employeeId: nextNo('EMP-S', rows.map((r) => r.employeeId), 3), joinedOn: todayISO() }),
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.employeeId.toLowerCase() === String(v.employeeId).trim().toLowerCase()) ? { employeeId: 'This employee ID is already used' } : {}),
    ...(rows.some((r) => r.id !== existing?.id && r.email.toLowerCase() === String(v.email).trim().toLowerCase()) ? { email: 'This email belongs to another staff member' } : {}),
    ...(String(v.joinedOn) > todayISO() ? { joinedOn: 'Joining date cannot be in the future' } : {}),
  }),
  prepare: (v, { existing }) => ({
    staffType: snapshot<DepartmentRecord>('departments').find((d) => d.name === v.department)?.type === 'Administrative' ? 'Administrative' : 'Support',
    reportsTo: v.reportsTo || existing?.reportsTo || 'Principal Office',
    performanceNote: existing?.performanceNote ?? '',
    lastLogin: existing?.lastLogin ?? 'Never',
  }),
  canDeleteRecord: (r) => {
    const heads = snapshot<DepartmentRecord>('departments').filter((d) => d.hod === `staff:${r.id}`).map((d) => d.name);
    if (heads.length) return `${r.name} heads ${heads.join(', ')}. Assign a new head first.`;
    const records = countBy(snapshot<StaffAttendanceRecord>('staffAttendance'), (a) => a.staffId === r.id) + countBy(snapshot<LeaveRecord>('leaves'), (l) => l.staffId === r.id);
    return records ? `${r.name} has ${records} attendance / leave record(s) that must be kept. Set the status to Inactive instead.` : null;
  },
  actions: [
    {
      key: 'department',
      label: 'Assign department',
      icon: 'layers',
      form: { title: 'Assign department', submitLabel: 'Assign', fields: [{ key: 'department', label: 'Department', type: 'select', required: true, options: () => deptNames().map((d) => ({ label: d, value: d })) }, { key: 'effectiveFrom', label: 'Effective Date', type: 'date', required: true }], initial: (r) => ({ department: r.department, effectiveFrom: todayISO() }) },
      run: (r, v, ctx) => {
        const type = snapshot<DepartmentRecord>('departments').find((d) => d.name === v.department)?.type;
        ctx.update({ department: v.department, staffType: type === 'Administrative' ? 'Administrative' : 'Support', remarks: `Moved to ${v.department} effective ${formatDate(v.effectiveFrom)}.` });
        ctx.toast(`${r.name} moved to ${v.department}`);
      },
    },
    { key: 'attendance', label: 'Attendance history', icon: 'calendar', manage: false, run: (_r, _v, ctx) => ctx.go('/hrm/staff-attendance') },
    {
      key: 'print',
      label: 'Print profile',
      icon: 'printer',
      manage: false,
      run: (r, _v, ctx) => ctx.share(`${r.name} — staff profile`, `KARKAII INTERNATIONAL SCHOOL — STAFF PROFILE\n\n${r.name} (${r.employeeId})\n${r.designation}, ${r.department}\nBranch: ${r.campus} · ${r.employmentType}\nJoined: ${formatDate(r.joinedOn)} · Reports to ${r.reportsTo}\nQualification: ${r.qualification} · ${r.experienceYears} yrs\nEmail: ${r.email} · Phone: ${r.phone}\nEmergency: ${r.emergencyContact} (${r.emergencyPhone})`),
    },
  ],
  bulk: [
    { key: 'status', label: 'Set status', icon: 'flag', form: { title: 'Set status for selected staff', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'On Leave', 'Probation', 'Suspended', 'Inactive'] }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ status: v.status })); ctx.toast(`${rows.length} staff set to ${v.status}`); } },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import staff',
      icon: 'upload',
      form: { title: 'Import staff', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Asha Menon,EMP-S030,Accounts,Cashier,asha@school.org,+91 98400 55555,Full-time,2026-06-01', hint: 'name, employee ID, department, designation, email, mobile, employment type, joining date. Existing IDs and emails are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        const emails = new Set(ctx.rows.map((r) => r.email.toLowerCase()));
        const ids = new Set(ctx.rows.map((r) => r.employeeId.toLowerCase()));
        const designations = new Set(snapshot<DesignationRecord>('designations').map((d) => d.name));
        for (const line of String(v.csv).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
          const [name, employeeId, department, designation, email, phone, employmentType, joinedOn] = line.split(',').map((c) => c.trim());
          const dept = snapshot<DepartmentRecord>('departments').find((d) => d.name.toLowerCase() === (department ?? '').toLowerCase());
          if (!name || !employeeId || !dept || !designations.has(designation) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '') || !EMPLOYMENT.includes(employmentType) || !/^\d{4}-\d{2}-\d{2}$/.test(joinedOn ?? '') || emails.has(email.toLowerCase()) || ids.has(employeeId.toLowerCase())) { skipped += 1; continue; }
          emails.add(email.toLowerCase());
          ids.add(employeeId.toLowerCase());
          ctx.create({ employeeId, name, department: dept.name, designation, staffType: dept.type === 'Administrative' ? 'Administrative' : 'Support', campus: mainCampusName(), shift: 'General', email, phone, employmentType: employmentType as StaffRecord['employmentType'], joinedOn, reportsTo: 'Principal Office', qualification: '', experienceYears: 0, status: 'Probation', gender: 'Male', emergencyContact: '', emergencyPhone: '', performanceNote: '', remarks: 'Imported', lastLogin: 'Never' });
          added += 1;
        }
        ctx.toast(`${added} staff imported${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ==================================== Departments ==================================== */

const deptStaff = (d: DepartmentRecord) => staffAll().filter((s) => s.department === d.name);
const deptTeachers = (d: DepartmentRecord) => teachersAll().filter((t) => t.department === d.name);
const deptSubjects = (d: DepartmentRecord) => snapshot<SubjectRecord>('subjects').filter((s) => s.department === d.name);
const deptClasses = (d: DepartmentRecord) => new Set(deptSubjects(d).flatMap((s) => mappingsOfSubject(s.id).map((m) => m.classId))).size;
const deptEmployees = (d: DepartmentRecord) => deptStaff(d).length + deptTeachers(d).length;
const typeTone: Record<string, Tone> = { Academic: 'primary', Administrative: 'purple', Support: 'teal' };

export const departmentsCfg: ResourceConfig<DepartmentRecord> = {
  entity: 'Department',
  collection: 'departments',
  searchPlaceholder: 'Search department, head, code…',
  searchText: (r) => `${r.name} ${r.code} ${r.type} ${personName(r.hod)} ${r.location}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.type} · HoD: ${personName(r.hod)}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : 'neutral' }),
  badges: (r) => [{ label: `${deptEmployees(r)} staff`, tone: typeTone[r.type] }, { label: `${deptTeachers(r).length} teachers`, tone: 'neutral' }],
  facts: [
    { label: 'Head of department', value: (r) => personName(r.hod) },
    { label: 'Subjects', value: (r) => deptSubjects(r).length },
    { label: 'Assigned classes', value: (r) => deptClasses(r) || undefined },
    { label: 'Contact', value: (r) => r.contact },
    { label: 'Location', value: (r) => r.location },
    { label: 'Established', value: (r) => formatDate(r.established) },
  ],
  detail: [
    { title: 'Department', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Type', value: (r) => r.type }, { label: 'Status', value: (r) => r.status }, { label: 'Description', value: (r) => r.description }, { label: 'Head of department', value: (r) => personName(r.hod) }, { label: 'Established', value: (r) => formatDate(r.established) }] },
    { title: 'Contact', items: [{ label: 'Contact information', value: (r) => r.contact }, { label: 'Location', value: (r) => r.location }, { label: 'Office extension', value: (r) => r.extension }, { label: 'Department email', value: (r) => r.email }] },
    { title: 'People & curriculum', items: [{ label: 'Total employees', value: (r) => deptEmployees(r) }, { label: 'Active teachers', value: (r) => countBy(deptTeachers(r), (t) => t.status === 'Active') }, { label: 'Total subjects', value: (r) => deptSubjects(r).length }, { label: 'Assigned classes', value: (r) => deptClasses(r) }, { label: 'Staff', value: (r) => [...deptTeachers(r).map((t) => t.name), ...deptStaff(r).map((s) => s.name)].join(', ') || 'None assigned' }, { label: 'Subjects taught', value: (r) => deptSubjects(r).map((s) => s.name).join(', ') || 'None' }] },
  ],
  stats: [
    { label: 'Departments', value: (rows) => rows.length, icon: 'layers' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Employees', value: (rows) => sum(rows, deptEmployees), tone: 'info', icon: 'users' },
    { label: 'Subjects', value: (rows) => sum(rows, (r) => deptSubjects(r).length), tone: 'purple', icon: 'book' },
  ],
  views: [
    { key: 'all', label: 'All Departments', match: () => true },
    { key: 'academic', label: 'Academic Only', match: (r) => r.type === 'Academic' },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'type', label: 'Department type', options: opts(['Academic', 'Administrative', 'Support']), match: (r, v) => r.type === v },
    { key: 'head', label: 'Department head', options: headOptions, match: (r, v) => r.hod === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'Inactive']), match: (r, v) => r.status === v },
    { key: 'count', label: 'Staff count', single: true, options: opts(['1–2', '3–5', '6 or more']), match: (r, v) => { const n = deptEmployees(r); return v === '1–2' ? n >= 1 && n <= 2 : v === '3–5' ? n >= 3 && n <= 5 : n >= 6; } },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'staff', label: 'Most employees', compare: (a, b) => deptEmployees(b) - deptEmployees(a) },
    { key: 'type', label: 'Type', compare: (a, b) => a.type.localeCompare(b.type) || a.name.localeCompare(b.name) },
  ],
  form: [
    { key: 'name', label: 'Department Name', type: 'text', required: true },
    { key: 'code', label: 'Code', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: ['Academic', 'Administrative', 'Support'], default: 'Academic' },
    { key: 'hod', label: 'Head of Department', type: 'select', options: headOptions },
    { key: 'contact', label: 'Contact', type: 'phone' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'established', label: 'Established', type: 'date' },
    { key: 'extension', label: 'Office Extension', type: 'text' },
    { key: 'email', label: 'Department Email', type: 'email' },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive'], default: 'Active' },
  ],
  defaults: (rows) => ({ code: nextNo('D', rows.map((r) => r.code), 6), established: todayISO() }),
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A department with this name already exists' } : {}),
    ...(rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This code is already used' } : {}),
  }),
  /** Renaming a department renames it everywhere it is used (staff, teachers, subjects). */
  afterSave: (kind, record, previous) => {
    if (kind !== 'update' || !previous || previous.name === record.name) return;
    repo<StaffRecord>('staff').updateMany(staffAll().filter((s) => s.department === previous.name).map((s) => s.id), () => ({ department: record.name }));
    repo<TeacherRecord>('teachers').updateMany(teachersAll().filter((t) => t.department === previous.name).map((t) => t.id), () => ({ department: record.name }));
    repo<SubjectRecord>('subjects').updateMany(snapshot<SubjectRecord>('subjects').filter((s) => s.department === previous.name).map((s) => s.id), () => ({ department: record.name }));
  },
  canDeleteRecord: (r) => {
    const e = deptEmployees(r);
    const s = deptSubjects(r).length;
    return e || s ? `${r.name} still has ${e} employee(s) and ${s} subject(s). Reassign them first, or set the department to Inactive.` : null;
  },
  actions: [
    {
      key: 'head',
      label: 'Assign head',
      icon: 'user-check',
      form: { title: 'Assign head of department', submitLabel: 'Assign', fields: [{ key: 'hod', label: 'Head of Department', type: 'select', required: true, options: headOptions }], initial: (r) => ({ hod: r.hod }) },
      run: (r, v, ctx) => { ctx.update({ hod: v.hod }); ctx.toast(`${personName(v.hod)} now heads ${r.name}`); },
    },
    {
      key: 'staff',
      label: 'Assign staff',
      icon: 'user-plus',
      form: { title: 'Assign staff to department', submitLabel: 'Assign', fields: [{ key: 'people', label: 'Select staff', type: 'multiselect', required: true, options: headOptions }] },
      run: (r, v, ctx) => {
        let moved = 0;
        for (const ref of v.people as string[]) {
          const [kind, id] = ref.split(':');
          if (kind === 'staff' && getStaff(id)?.department !== r.name) { repo<StaffRecord>('staff').update(id, { department: r.name }); moved += 1; }
          if (kind === 'teacher' && teachersAll().find((t) => t.id === id)?.department !== r.name) { repo<TeacherRecord>('teachers').update(id, { department: r.name }); moved += 1; }
        }
        ctx.toast(moved ? `${moved} people moved to ${r.name}` : 'Everyone selected is already in this department', moved ? 'success' : 'info');
      },
    },
    {
      key: 'subjects',
      label: 'Assign subjects',
      icon: 'book',
      form: { title: 'Assign subjects to department', submitLabel: 'Assign', fields: [{ key: 'subjects', label: 'Subjects', type: 'multiselect', required: true, options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id, hint: `Now: ${s.department}` })) }] },
      run: (r, v, ctx) => { repo<SubjectRecord>('subjects').updateMany(v.subjects as string[], () => ({ department: r.name })); ctx.toast(`${(v.subjects as string[]).length} subject(s) assigned to ${r.name}`); },
    },
    { key: 'status', label: 'Change status', icon: 'toggle-right', run: (r, _v, ctx) => { const next = r.status === 'Active' ? 'Inactive' : 'Active'; ctx.update({ status: next }); ctx.toast(`${r.name} is now ${next}`); } },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      run: (r, _v, ctx) => {
        const rows = snapshot<DepartmentRecord>('departments');
        repo<DepartmentRecord>('departments').create({ ...r, id: undefined, name: `${r.name} (Copy)`, code: nextNo('D', rows.map((x) => x.code), 6), hod: '', status: 'Inactive' });
        ctx.toast(`Copy of ${r.name} created (inactive, no head)`);
      },
    },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status === 'Active', confirm: 'Archive this department? It becomes Inactive and is hidden from new assignments.', run: (r, _v, ctx) => { ctx.update({ status: 'Inactive' }); ctx.toast(`${r.name} archived`, 'info'); } },
    {
      key: 'print',
      label: 'Print',
      icon: 'printer',
      manage: false,
      run: (r, _v, ctx) => ctx.share(`${r.name} department`, `${r.name} (${r.code}) — ${r.type}\nHead: ${personName(r.hod)}\nEmployees: ${deptEmployees(r)} · Subjects: ${deptSubjects(r).length}\n${r.description}\nContact: ${r.contact} · Ext ${r.extension} · ${r.email}\nLocation: ${r.location}`),
    },
  ],
};

/* ==================================== Designations ==================================== */

const designationUse = (d: DesignationRecord) => countBy(staffAll(), (s) => s.designation === d.name) + countBy(teachersAll(), (t) => t.designation === d.name);

export const designationsCfg: ResourceConfig<DesignationRecord> = {
  entity: 'Designation',
  collection: 'designations',
  searchText: (r) => `${r.name} ${r.code}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${designationUse(r)} ${designationUse(r) === 1 ? 'person holds' : 'people hold'} this designation`,
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : 'neutral' }),
  facts: [{ label: 'In use by', value: (r) => designationUse(r) }],
  stats: [
    { label: 'Designations', value: (rows) => rows.length, icon: 'tag' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Inactive', value: (rows) => countBy(rows, (r) => r.status === 'Inactive'), tone: 'neutral', icon: 'slash' },
    { label: 'In use', value: (rows) => countBy(rows, (r) => designationUse(r) > 0), tone: 'info', icon: 'users' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, { key: 'active', label: 'Active', match: (r) => r.status === 'Active' }, { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' }],
  sorts: [{ key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) }, { key: 'use', label: 'Most used', compare: (a, b) => designationUse(b) - designationUse(a) }],
  form: [{ key: 'name', label: 'Designation', type: 'text', required: true }, { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive'], default: 'Active' }],
  validate: (v, { existing, rows }) => (rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'This designation already exists' } : {}),
  prepare: (_v, { existing, rows }) => ({ code: existing?.code ?? nextNo('DS', rows.map((r) => r.code), 6) }),
  afterSave: (kind, record, previous) => {
    if (kind !== 'update' || !previous || previous.name === record.name) return;
    repo<StaffRecord>('staff').updateMany(staffAll().filter((s) => s.designation === previous.name).map((s) => s.id), () => ({ designation: record.name }));
    repo<TeacherRecord>('teachers').updateMany(teachersAll().filter((t) => t.designation === previous.name).map((t) => t.id), () => ({ designation: record.name }));
  },
  canDeleteRecord: (r) => (designationUse(r) ? `${designationUse(r)} staff / teachers hold “${r.name}”. Reassign them first, or set it to Inactive.` : null),
  actions: [{ key: 'toggle', label: 'Toggle status', icon: 'toggle-right', run: (r, _v, ctx) => { ctx.update({ status: r.status === 'Active' ? 'Inactive' : 'Active' }); ctx.toast(`${r.name} is now ${r.status === 'Active' ? 'Inactive' : 'Active'}`); } }],
};

/* ======================================== Users ======================================== */

const userTone: Record<string, Tone> = { Active: 'success', Pending: 'warning', Inactive: 'neutral', Suspended: 'danger', Blocked: 'danger' };
const DEMO_IDS = new Set(MOCK_USERS.map((u) => u.id));
const ROLE_OPTIONS = (): Option[] => snapshot<RoleRecord>('roles').filter((r) => r.status === 'Active').map((r) => ({ label: r.name, value: r.id }));

export const usersCfg: ResourceConfig<UserRecord> = {
  entity: 'User',
  collection: 'users',
  auditEntity: 'user',
  searchPlaceholder: 'Search name, email, role…',
  searchText: (r) => `${r.name} ${r.email} ${roleName(r.roleId)} ${r.department} ${r.phone}`,
  code: (r) => roleName(r.roleId),
  title: (r) => r.name,
  subtitle: (r) => `${r.department} · ${r.branch}`,
  status: (r) => ({ label: r.status, tone: userTone[r.status] }),
  badges: (r) => [...(r.online ? [{ label: 'Online', tone: 'success' as Tone }] : []), ...(r.status === 'Pending' ? [{ label: 'Invited', tone: 'warning' as Tone }] : [])],
  facts: [
    { label: 'Email', value: (r) => r.email },
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Last login', value: (r) => relativeDay(r.lastLogin) },
    { label: 'Created', value: (r) => formatDate(r.created) },
  ],
  detail: [
    { title: 'Account', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Role', value: (r) => roleName(r.roleId) }, { label: 'Department', value: (r) => r.department }, { label: 'Branch', value: (r) => r.branch }, { label: 'Status', value: (r) => r.status }, { label: 'Linked record', value: (r) => (r.linkedId ? `${r.linkedType} · ${r.linkedId}` : 'None') }] },
    { title: 'Contact & activity', items: [{ label: 'Email', value: (r) => r.email }, { label: 'Phone', value: (r) => r.phone }, { label: 'Last login', value: (r) => relativeDay(r.lastLogin) }, { label: 'Created', value: (r) => formatDate(r.created) }, { label: 'Presence', value: (r) => (r.online ? 'Online' : r.status === 'Pending' ? 'Invited' : 'Offline') }] },
  ],
  stats: [
    { label: 'Users', value: (rows) => rows.length, icon: 'users' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'user-check' },
    { label: 'Pending', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'mail' },
    { label: 'Inactive / blocked', value: (rows) => countBy(rows, (r) => r.status === 'Inactive' || r.status === 'Blocked' || r.status === 'Suspended'), tone: 'danger', icon: 'slash' },
  ],
  views: [
    { key: 'all', label: 'All Users', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'pending', label: 'Pending', match: (r) => r.status === 'Pending' },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
    { key: 'blocked', label: 'Blocked', match: (r) => r.status === 'Blocked' || r.status === 'Suspended' },
  ],
  filters: [
    { key: 'role', label: 'Role', options: () => snapshot<RoleRecord>('roles').map((r) => ({ label: r.name, value: r.id })), match: (r, v) => r.roleId === v },
    { key: 'department', label: 'Department', options: () => [...new Set(snapshot<UserRecord>('users').map((u) => u.department))].slice(0, 30).map((d) => ({ label: d, value: d })), match: (r, v) => r.department === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'Pending', 'Inactive', 'Suspended', 'Blocked']), match: (r, v) => r.status === v },
    { key: 'branch', label: 'Branch', options: () => campusChoices(), match: (r, v) => r.branch === v },
    { key: 'joined', label: 'Joined', single: true, options: opts(['Last 3 months', 'Last year', 'Older']), match: (r, v) => { const d = diffDays(r.created, todayISO()); return v === 'Last 3 months' ? d <= 90 : v === 'Last year' ? d > 90 && d <= 365 : d > 365; } },
  ],
  sorts: [
    { key: 'recent', label: 'Recently active', compare: (a, b) => b.lastLogin.localeCompare(a.lastLogin) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'role', label: 'Role', compare: (a, b) => roleName(a.roleId).localeCompare(roleName(b.roleId)) },
    { key: 'created', label: 'Newest account', compare: (a, b) => b.created.localeCompare(a.created) },
  ],
  form: [
    { key: 'firstName', label: 'First Name', type: 'text', required: true },
    { key: 'lastName', label: 'Last Name', type: 'text', required: true },
    { key: 'email', label: 'Email Address', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'roleId', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'branch', label: 'Branch', type: 'select', required: true, options: campusChoices, default: mainCampusName() },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Pending', 'Active', 'Inactive', 'Suspended', 'Blocked'], default: 'Pending', hint: 'Pending means an invitation has been sent and the person has not signed in yet.' },
  ],
  validate: (v, { existing, rows }) => (rows.some((r) => r.id !== existing?.id && r.email.toLowerCase() === String(v.email).trim().toLowerCase()) ? { email: 'An account with this email already exists' } : {}),
  prepare: (v, { existing }) => ({
    name: `${String(v.firstName).trim()} ${String(v.lastName).trim()}`.trim(),
    online: v.status === 'Active' ? existing?.online ?? false : false,
    lastLogin: existing?.lastLogin ?? '',
    created: existing?.created ?? todayISO(),
    linkedType: existing?.linkedType ?? 'staff',
    linkedId: existing?.linkedId ?? '',
  }),
  canDeleteRecord: (r) => (DEMO_IDS.has(r.id) ? `${r.name} is one of the demo sign-in accounts used by this app, so it cannot be deleted.` : null),
  actions: [
    { key: 'activate', label: 'Activate', icon: 'user-check', tone: 'success', visible: (r) => r.status !== 'Active', run: (r, _v, ctx) => { ctx.update({ status: 'Active', ...(r.lastLogin ? {} : { lastLogin: '' }) }); ctx.toast(`${r.name} activated`); } },
    { key: 'deactivate', label: 'Deactivate', icon: 'user-x', visible: (r) => r.status === 'Active', confirm: 'They will no longer be able to sign in.', run: (r, _v, ctx) => { ctx.update({ status: 'Inactive', online: false }); ctx.toast(`${r.name} deactivated`, 'info'); } },
    { key: 'block', label: 'Block', icon: 'slash', tone: 'danger', visible: (r) => r.status !== 'Blocked', confirm: 'Block this account? It will be locked out until activated again.', run: (r, _v, ctx) => { ctx.update({ status: 'Blocked', online: false }); ctx.toast(`${r.name} blocked`, 'info'); } },
    { key: 'reset', label: 'Reset password', icon: 'key', confirm: 'Send a password-reset link to this user?', run: (r, _v, ctx) => ctx.toast(`Reset link sent to ${r.email} (mock — nothing is sent)`, 'info') },
    { key: 'email', label: 'Send email', icon: 'mail', form: { title: 'Send email', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] }, run: (r, v, ctx) => ctx.toast(`“${v.subject}” queued for ${r.email} (mock)`, 'info') },
  ],
  bulk: [
    { key: 'activate', label: 'Activate', icon: 'user-check', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ status: 'Active' as const })); ctx.toast(`${rows.length} users activated`); } },
    { key: 'deactivate', label: 'Deactivate', icon: 'user-x', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ status: 'Inactive' as const, online: false })); ctx.toast(`${rows.length} users deactivated`, 'info'); } },
    { key: 'role', label: 'Assign role', icon: 'shield', form: { title: 'Assign role to selected users', fields: [{ key: 'roleId', label: 'Role', type: 'select', required: true, options: ROLE_OPTIONS }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ roleId: v.roleId })); ctx.toast(`${rows.length} users are now ${roleName(v.roleId)}`); } },
    { key: 'reset', label: 'Reset password', icon: 'key', run: (rows, _v, ctx) => ctx.toast(`Reset links queued for ${rows.length} users (mock)`, 'info') },
    { key: 'email', label: 'Email', icon: 'mail', form: { title: 'Email selected users', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] }, run: (rows, v, ctx) => ctx.toast(`“${v.subject}” queued for ${rows.length} users (mock)`, 'info') },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import users',
      icon: 'upload',
      form: { title: 'Import users', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Asha,Menon,asha@school.org,Teacher,Main Campus', hint: 'first name, last name, email, role name, branch. Imported accounts are Pending (invited).' }] },
      run: (v, ctx) => {
        const emails = new Set(ctx.rows.map((r) => r.email.toLowerCase()));
        const rolesAll = snapshot<RoleRecord>('roles');
        let added = 0;
        let skipped = 0;
        for (const line of String(v.csv).split(/\r?\n/).map((l) => l.trim()).filter(Boolean)) {
          const [firstName, lastName, email, role, branch] = line.split(',').map((c) => c.trim());
          const r = rolesAll.find((x) => x.name.toLowerCase() === (role ?? '').toLowerCase());
          if (!firstName || !lastName || !r || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '') || emails.has(email.toLowerCase())) { skipped += 1; continue; }
          emails.add(email.toLowerCase());
          ctx.create({ firstName, lastName, name: `${firstName} ${lastName}`, email, phone: '', roleId: r.id, department: '', branch: branch || mainCampusName(), status: 'Pending', online: false, lastLogin: '', created: todayISO(), linkedType: 'staff', linkedId: '' });
          added += 1;
        }
        ctx.toast(`${added} user${added === 1 ? '' : 's'} invited${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ================================ Roles & permissions ================================ */

export const permissionCount = (r: RoleRecord) => sum(Object.values(r.permissions), (flags) => flags.filter(Boolean).length);
export const roleUsers = (r: RoleRecord) => snapshot<UserRecord>('users').filter((u) => u.roleId === r.id);
const categoriesOf = (r: RoleRecord) => PERMISSION_MODULES.filter((m) => r.permissions[m.id]?.some(Boolean)).map((m) => m.label);

/** Lines describing where two roles' permissions differ. */
export function comparePermissions(a: RoleRecord, b: RoleRecord): string[] {
  const lines: string[] = [];
  for (const m of PERMISSION_MODULES) {
    PERMISSION_ACTIONS.forEach((action, i) => {
      const x = a.permissions[m.id]?.[i] ?? false;
      const y = b.permissions[m.id]?.[i] ?? false;
      if (x !== y) lines.push(`${m.label} · ${action}: ${a.name} ${x ? '✓' : '✗'}  |  ${b.name} ${y ? '✓' : '✗'}`);
    });
  }
  return lines;
}

export const applyPreset = (role: RoleRecord, preset: string, moduleId?: string): Record<string, boolean[]> => {
  const flags = PRESETS[preset] ?? PRESETS.none;
  return Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, !moduleId || m.id === moduleId ? [...flags] : [...(role.permissions[m.id] ?? PRESETS.none)]]));
};

export const rolesCfg: ResourceConfig<RoleRecord> = {
  entity: 'Role',
  collection: 'roles',
  auditEntity: 'role',
  searchText: (r) => `${r.name} ${r.description} ${r.type}`,
  title: (r) => r.name,
  subtitle: (r) => r.description,
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : 'neutral' }),
  badges: (r) => [{ label: r.type, tone: r.type === 'System Role' ? 'primary' : 'purple' }],
  facts: [
    { label: 'Users', value: (r) => roleUsers(r).length },
    { label: 'Permissions', value: (r) => `${permissionCount(r)} of ${PERMISSION_MODULES.length * PERMISSION_ACTIONS.length}` },
    { label: 'Categories', value: (r) => categoriesOf(r).join(', ') || 'None' },
    { label: 'Updated', value: (r) => formatDate(r.updatedOn) },
  ],
  detail: [{ title: 'Role', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Type', value: (r) => r.type }, { label: 'Description', value: (r) => r.description }, { label: 'Users', value: (r) => roleUsers(r).length }, { label: 'Permissions granted', value: (r) => permissionCount(r) }] }],
  stats: [
    { label: 'Roles', value: (rows) => rows.length, icon: 'shield' },
    { label: 'Custom', value: (rows) => countBy(rows, (r) => r.type === 'Custom Role'), tone: 'purple', icon: 'edit' },
    { label: 'Users assigned', value: () => snapshot<UserRecord>('users').length, tone: 'info', icon: 'users' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
  ],
  views: [
    { key: 'all', label: 'All Roles', match: () => true },
    { key: 'system', label: 'System', match: (r) => r.type === 'System Role' },
    { key: 'custom', label: 'Custom', match: (r) => r.type === 'Custom Role' },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'type', label: 'Type', options: opts(['System Role', 'Custom Role']), match: (r, v) => r.type === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'Inactive']), match: (r, v) => r.status === v },
    { key: 'category', label: 'Has access to', options: PERMISSION_MODULES.map((m) => ({ label: m.label, value: m.id })), match: (r, v) => !!r.permissions[v]?.some(Boolean) },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'users', label: 'Most users', compare: (a, b) => roleUsers(b).length - roleUsers(a).length },
    { key: 'perms', label: 'Most permissions', compare: (a, b) => permissionCount(b) - permissionCount(a) },
    { key: 'recent', label: 'Recently updated', compare: (a, b) => b.updatedOn.localeCompare(a.updatedOn) },
  ],
  form: [
    { key: 'name', label: 'Role Name', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Inactive'], default: 'Active' },
  ],
  validate: (v, { existing, rows }) => (rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A role with this name already exists' } : {}),
  prepare: (_v, { existing }) => ({ type: existing?.type ?? 'Custom Role', permissions: existing?.permissions ?? Object.fromEntries(PERMISSION_MODULES.map((m) => [m.id, [...PRESETS.none]])), updatedOn: todayISO() }),
  canDeleteRecord: (r) => (r.type === 'System Role' ? `${r.name} is a system role and cannot be deleted.` : roleUsers(r).length ? `${roleUsers(r).length} user(s) still have the ${r.name} role. Reassign them first.` : null),
  actions: [
    {
      key: 'clone',
      label: 'Clone',
      icon: 'copy',
      form: { title: 'Clone role', submitLabel: 'Clone', fields: [{ key: 'name', label: 'New role name', type: 'text', required: true }], initial: (r) => ({ name: `${r.name} (Copy)` }), validate: (v) => (snapshot<RoleRecord>('roles').some((x) => x.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A role with this name already exists' } : {}) },
      run: (r, v, ctx) => { repo<RoleRecord>('roles').create({ ...r, id: undefined, name: v.name, type: 'Custom Role', permissions: JSON.parse(JSON.stringify(r.permissions)), updatedOn: todayISO() }); ctx.toast(`${v.name} created from ${r.name}`); },
    },
    {
      key: 'compare',
      label: 'Compare with…',
      icon: 'git-merge',
      manage: false,
      form: { title: 'Compare roles', submitLabel: 'Compare', fields: [{ key: 'other', label: 'Compare with', type: 'select', required: true, options: () => snapshot<RoleRecord>('roles').map((x) => ({ label: x.name, value: x.id })) }] },
      run: (r, v, ctx) => {
        const other = snapshot<RoleRecord>('roles').find((x) => x.id === v.other);
        if (!other || other.id === r.id) { ctx.toast('Choose a different role', 'error'); return; }
        const lines = comparePermissions(r, other);
        ctx.alert(`${r.name} vs ${other.name}`, lines.length ? `${lines.length} difference${lines.length > 1 ? 's' : ''}:\n\n${lines.slice(0, 14).join('\n')}${lines.length > 14 ? `\n… and ${lines.length - 14} more` : ''}` : 'These roles have identical permissions.');
      },
    },
  ],
};

/* ============================== Delete account requests ============================== */

const requestTone: Record<string, Tone> = { Pending: 'warning', 'Under Review': 'info', Approved: 'success', Rejected: 'danger', Completed: 'neutral', Cancelled: 'neutral' };
const OPEN: DeleteRequestRecord['status'][] = ['Pending', 'Under Review'];
export const GRACE_DAYS = 30;

export interface WorkflowStep {
  title: string;
  state: 'done' | 'active' | 'pending' | 'stopped';
  meta: string;
}

/** The approval workflow for one request, derived from its status. */
export function workflowOf(r: DeleteRequestRecord): WorkflowStep[] {
  const stopped = r.status === 'Rejected' || r.status === 'Cancelled';
  const reviewed = r.status !== 'Pending';
  const decided = r.status === 'Approved' || r.status === 'Completed' || stopped;
  return [
    { title: 'Request submitted', state: 'done', meta: formatDate(r.requestedOn) },
    { title: 'Under review', state: !reviewed ? 'active' : 'done', meta: reviewed ? `Reviewer: ${r.reviewer || 'Unassigned'}` : 'Waiting for a reviewer' },
    { title: r.status === 'Rejected' ? 'Rejected' : r.status === 'Cancelled' ? 'Cancelled' : 'Approval decision', state: decided ? (stopped ? 'stopped' : 'done') : reviewed ? 'active' : 'pending', meta: r.decisionNote || (decided ? '' : 'Pending decision') },
    { title: 'Deletion scheduled', state: r.status === 'Approved' ? 'active' : r.status === 'Completed' ? 'done' : 'pending', meta: r.deletionDate ? formatDate(r.deletionDate) : `${GRACE_DAYS}-day grace period after approval` },
    { title: 'Data deleted', state: r.status === 'Completed' ? 'done' : 'pending', meta: r.status === 'Completed' ? formatDate(r.deletionDate) : 'Pending' },
  ];
}

export const deleteRequestsCfg: ResourceConfig<DeleteRequestRecord> = {
  entity: 'Delete Request',
  collection: 'deleteRequests',
  auditEntity: 'deleteRequest',
  canCreate: false,
  canEdit: false,
  canDelete: false,
  searchPlaceholder: 'Search name, email, request ID…',
  searchText: (r) => `${r.name} ${r.email} ${r.code} ${r.accountNo} ${r.reason} ${r.userType}`,
  code: (r) => `${r.code} · ${r.accountNo}`,
  title: (r) => r.name,
  subtitle: (r) => `${r.userType} · ${r.department}`,
  status: (r) => ({ label: r.status, tone: requestTone[r.status] }),
  badges: (r) => [{ label: r.reviewer ? `Reviewer: ${r.reviewer}` : 'Unassigned', tone: r.reviewer ? 'primary' : 'neutral' }, ...(OPEN.includes(r.status) && diffDays(r.requestedOn, todayISO()) > 7 ? [{ label: `Waiting ${diffDays(r.requestedOn, todayISO())} days`, tone: 'danger' as Tone }] : [])],
  facts: [
    { label: 'Email', value: (r) => r.email },
    { label: 'Reason', value: (r) => r.reason },
    { label: 'Requested', value: (r) => formatDate(r.requestedOn) },
    { label: 'Deletion date', value: (r) => (r.deletionDate ? formatDate(r.deletionDate) : undefined) },
  ],
  detail: [
    { title: 'Request', items: [{ label: 'Request ID', value: (r) => r.code }, { label: 'Name', value: (r) => r.name }, { label: 'Account', value: (r) => r.accountNo }, { label: 'Email', value: (r) => r.email }, { label: 'User type', value: (r) => r.userType }, { label: 'Class / department', value: (r) => r.department }, { label: 'Reason', value: (r) => r.reason }, { label: 'Details', value: (r) => r.reasonNote }, { label: 'Requested', value: (r) => formatDate(r.requestedOn) }] },
    { title: 'Decision', items: [{ label: 'Status', value: (r) => r.status }, { label: 'Reviewer', value: (r) => r.reviewer || 'Unassigned' }, { label: 'Decision note', value: (r) => r.decisionNote || '—' }, { label: 'Deletion date', value: (r) => (r.deletionDate ? formatDate(r.deletionDate) : '—') }, { label: 'Account still exists', value: (r) => (snapshot<UserRecord>('users').some((u) => u.id === r.userId) ? 'Yes' : 'No') }] },
  ],
  stats: [
    { label: 'Requests', value: (rows) => rows.length, icon: 'trash' },
    { label: 'Pending', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Under review', value: (rows) => countBy(rows, (r) => r.status === 'Under Review'), tone: 'info', icon: 'eye' },
    { label: 'Approved', value: (rows) => countBy(rows, (r) => r.status === 'Approved'), tone: 'success', icon: 'check' },
    { label: 'Completed', value: (rows) => countBy(rows, (r) => r.status === 'Completed'), tone: 'neutral', icon: 'check-circle' },
  ],
  views: [
    { key: 'all', label: 'All Requests', match: () => true },
    { key: 'pending', label: 'Pending', match: (r) => OPEN.includes(r.status) },
    { key: 'approved', label: 'Approved', match: (r) => r.status === 'Approved' || r.status === 'Completed' },
    { key: 'rejected', label: 'Rejected', match: (r) => r.status === 'Rejected' || r.status === 'Cancelled' },
  ],
  filters: [
    { key: 'type', label: 'User type', options: opts(['Student', 'Teacher', 'Parent', 'Employee']), match: (r, v) => r.userType === v },
    { key: 'status', label: 'Status', options: opts(['Pending', 'Under Review', 'Approved', 'Rejected', 'Completed', 'Cancelled']), match: (r, v) => r.status === v },
    { key: 'date', label: 'Request date', single: true, options: opts(['Last 7 days', 'Last 30 days', 'Older']), match: (r, v) => { const d = diffDays(r.requestedOn, todayISO()); return v === 'Last 7 days' ? d <= 7 : v === 'Last 30 days' ? d > 7 && d <= 30 : d > 30; } },
    { key: 'approval', label: 'Approval status', options: opts(['Awaiting', 'Approved', 'Rejected']), match: (r, v) => (v === 'Awaiting' ? OPEN.includes(r.status) : v === 'Approved' ? r.status === 'Approved' || r.status === 'Completed' : r.status === 'Rejected' || r.status === 'Cancelled') },
    { key: 'waiting', label: 'Waiting time', single: true, options: opts(['Over 7 days']), match: (r) => OPEN.includes(r.status) && diffDays(r.requestedOn, todayISO()) > 7 },
  ],
  sorts: [
    { key: 'recent', label: 'Newest request', compare: (a, b) => b.requestedOn.localeCompare(a.requestedOn) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'type', label: 'User type', compare: (a, b) => a.userType.localeCompare(b.userType) },
    { key: 'oldest', label: 'Longest waiting', compare: (a, b) => a.requestedOn.localeCompare(b.requestedOn) },
  ],
  form: [],
  actions: [
    { key: 'review', label: 'Start review', icon: 'eye', visible: (r) => r.status === 'Pending', run: (r, _v, ctx) => { ctx.update({ status: 'Under Review', reviewer: r.reviewer || 'Admin Office' }); ctx.toast('Request is now under review', 'info'); } },
    {
      key: 'approve',
      label: 'Approve',
      icon: 'check',
      tone: 'success',
      visible: (r) => OPEN.includes(r.status),
      form: { title: 'Approve deletion', submitLabel: 'Approve', fields: [{ key: 'note', label: 'Approval note', type: 'textarea' }] },
      run: (r, v, ctx) => { ctx.update({ status: 'Approved', reviewer: r.reviewer || 'Admin Office', decisionNote: v.note || 'Approved.', deletionDate: addDays(todayISO(), GRACE_DAYS) }); ctx.toast(`Approved: the account will be deleted on ${formatDate(addDays(todayISO(), GRACE_DAYS))}`); },
    },
    {
      key: 'reject',
      label: 'Reject',
      icon: 'x',
      tone: 'danger',
      visible: (r) => OPEN.includes(r.status),
      form: { title: 'Reject request', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason for rejection', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update({ status: 'Rejected', reviewer: r.reviewer || 'Admin Office', decisionNote: v.reason }); ctx.toast('Request rejected', 'info'); },
    },
    {
      key: 'info',
      label: 'Request more information',
      icon: 'help-circle',
      visible: (r) => OPEN.includes(r.status),
      form: { title: 'Request more information', submitLabel: 'Send', fields: [{ key: 'message', label: 'What do you need?', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update({ status: 'Under Review', reviewer: r.reviewer || 'Admin Office', decisionNote: `Information requested: ${v.message}` }); ctx.toast(`Message sent to ${r.email} (mock)`, 'info'); },
    },
    {
      key: 'report',
      label: 'Download report',
      icon: 'download',
      manage: false,
      run: (r, _v, ctx) => ctx.share(`${r.code} report`, `ACCOUNT DELETION REQUEST ${r.code}\n\n${r.name} (${r.accountNo}) · ${r.userType} · ${r.department}\nEmail: ${r.email}\nRequested: ${formatDate(r.requestedOn)}\nReason: ${r.reason} — ${r.reasonNote}\nStatus: ${r.status}\nReviewer: ${r.reviewer || 'Unassigned'}\nDecision: ${r.decisionNote || '—'}\nDeletion date: ${r.deletionDate ? formatDate(r.deletionDate) : '—'}\n\nWorkflow:\n${workflowOf(r).map((s) => `- ${s.title}: ${s.state} ${s.meta}`).join('\n')}`),
    },
    {
      key: 'delete',
      label: 'Delete permanently',
      icon: 'trash-2',
      tone: 'danger',
      visible: (r) => r.status === 'Approved',
      confirm: 'Delete the login account now? This cannot be undone. (Student, teacher and staff records follow the school retention policy and are not removed.)',
      run: (r, _v, ctx) => {
        const had = snapshot<UserRecord>('users').some((u) => u.id === r.userId);
        if (had) repo<UserRecord>('users').remove(r.userId);
        ctx.update({ status: 'Completed', deletionDate: todayISO(), decisionNote: `${r.decisionNote} Account deleted ${formatDate(todayISO())}.`.trim() });
        ctx.toast(had ? `${r.name}'s account was deleted` : 'Marked completed (the account was already gone)');
      },
    },
  ],
  bulk: [
    {
      key: 'approve',
      label: 'Approve',
      icon: 'check',
      run: (rows, _v, ctx) => {
        const open = rows.filter((r) => OPEN.includes(r.status)).length;
        if (!open) { ctx.toast('No open requests in the selection', 'info'); return; }
        ctx.updateMany((r) => (OPEN.includes(r.status) ? { status: 'Approved' as const, reviewer: r.reviewer || 'Admin Office', decisionNote: 'Approved.', deletionDate: addDays(todayISO(), GRACE_DAYS) } : {}));
        ctx.toast(`${open} request${open > 1 ? 's' : ''} approved`);
      },
    },
    {
      key: 'reject',
      label: 'Reject',
      icon: 'x',
      form: { title: 'Reject selected requests', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason for rejection', type: 'textarea', required: true }] },
      run: (rows, v, ctx) => {
        const open = rows.filter((r) => OPEN.includes(r.status)).length;
        if (!open) { ctx.toast('No open requests in the selection', 'info'); return; }
        ctx.updateMany((r) => (OPEN.includes(r.status) ? { status: 'Rejected' as const, reviewer: r.reviewer || 'Admin Office', decisionNote: v.reason } : {}));
        ctx.toast(`${open} request${open > 1 ? 's' : ''} rejected`, 'info');
      },
    },
  ],
};
