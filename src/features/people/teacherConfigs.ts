import { repo, snapshot } from '@/core/store/store';
import { diffDays, formatDate, todayISO } from '@/core/utils/date';
import { money, pct } from '@/core/utils/format';
import type { SubjectRecord } from '@/data/seed/academic';
import type { TeacherAttendanceRecord } from '@/data/seed/hrm';
import type { ClassRecord, StaffRecord, TeacherRecord } from '@/data/seed/master';
import type { DepartmentRecord, DesignationRecord, UserRecord } from '@/data/seed/peopleAdmin';
import { opts, parseCsvRows } from '@/features/academic/helpers';
import { logAudit } from '@/features/common/audit';
import { countBy } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import { attendanceSummaryOf, classesOfTeacher, homeSectionsOf, mappingsOfTeacher, periodsPerWeek, userOfTeacher } from './teacherData';
import { saveTeacher } from './teacherLogic';

const statusTone: Record<string, Tone> = { Active: 'success', 'On Leave': 'warning', Inactive: 'neutral' };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const BY = 'Admin Office';

const classLabels = (t: TeacherRecord) => classesOfTeacher(t.id).map((c) => c.name);
const homeLabels = (t: TeacherRecord) => homeSectionsOf(t.id).map((s) => `${snapshot<ClassRecord>('classes').find((c) => c.id === s.classId)?.name ?? ''}-${s.name}`);
const years = (t: TeacherRecord) => diffDays(t.joinedOn, todayISO()) / 365.25;

export const teachersCfg: ResourceConfig<TeacherRecord> = {
  entity: 'Teacher',
  collection: 'teachers',
  auditEntity: 'teacher',
  addHref: '/people/add-teacher',
  editHref: (r) => `/people/add-teacher?id=${r.id}`,
  searchPlaceholder: 'Search teacher, ID, subject or email…',
  searchText: (r) => `${r.name} ${r.employeeId} ${r.subjects.join(' ')} ${r.email} ${r.department} ${r.designation} ${r.phone}`,
  code: (r) => r.employeeId,
  title: (r) => r.name,
  subtitle: (r) => `${r.designation} · ${r.department}`,
  status: (r) => ({ label: r.status, tone: statusTone[r.status] }),
  badges: (r) => [{ label: r.contractType, tone: r.contractType === 'Permanent' ? 'success' : 'warning' }, ...homeLabels(r).map((l) => ({ label: `Class teacher ${l}`, tone: 'primary' as Tone })), { label: r.campus, tone: 'neutral' }],
  facts: [
    { label: 'Subjects', value: (r) => r.subjects.join(', ') || '—' },
    { label: 'Classes', value: (r) => classLabels(r).join(', ') || '—' },
    { label: 'Qualification', value: (r) => r.qualification },
    { label: 'Experience', value: (r) => `${r.experienceYears} years` },
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Email', value: (r) => r.email },
    { label: 'Joined', value: (r) => formatDate(r.joinedOn) },
  ],
  detail: [
    { title: 'Teacher', items: [{ label: 'Teacher ID', value: (r) => r.employeeId }, { label: 'Name', value: (r) => r.name }, { label: 'Gender', value: (r) => r.gender }, { label: 'Date of birth', value: (r) => formatDate(r.dob) }, { label: 'Marital status', value: (r) => r.maritalStatus }, { label: 'Blood group', value: (r) => r.bloodGroup }, { label: 'Languages', value: (r) => r.languages.join(', ') || '—' }, { label: 'Status', value: (r) => r.status }] },
    { title: 'Professional', items: [{ label: 'Department', value: (r) => r.department }, { label: 'Designation', value: (r) => r.designation }, { label: 'Campus', value: (r) => r.campus }, { label: 'Contract', value: (r) => `${r.contractType} · ${r.workShift} shift` }, { label: 'Joined', value: (r) => formatDate(r.joinedOn) }, { label: 'Qualification', value: (r) => r.qualification }, { label: 'Experience', value: (r) => `${r.experienceYears} years` }, { label: 'Previous school', value: (r) => r.previousSchool || '—' }] },
    { title: 'Classes & subjects (from the class mapping)', items: [{ label: 'Subjects', value: (r) => r.subjects.join(', ') || '—' }, { label: 'Class teacher of', value: (r) => homeLabels(r).join(', ') || '—' }, { label: 'Teaches in', value: (r) => classLabels(r).join(', ') || '—' }, { label: 'Assigned subject-classes', value: (r) => mappingsOfTeacher(r.id).length }, { label: 'Timetable periods a week', value: (r) => periodsPerWeek(r.id) }] },
    { title: 'Contact', items: [{ label: 'Phone', value: (r) => r.phone }, { label: 'Email', value: (r) => r.email }, { label: 'Address', value: (r) => r.address }, { label: 'Permanent address', value: (r) => r.permanentAddress }] },
    { title: 'Attendance (latest register days)', items: [{ label: 'Attendance', value: (r) => pct(attendanceSummaryOf(r.id).pct) }, { label: 'Present / late', value: (r) => `${attendanceSummaryOf(r.id).present} / ${attendanceSummaryOf(r.id).late}` }, { label: 'Absent', value: (r) => attendanceSummaryOf(r.id).absent }, { label: 'On leave', value: (r) => attendanceSummaryOf(r.id).leave }] },
    { title: 'Documents & login', items: [{ label: 'Resume', value: (r) => r.resume || '—' }, { label: 'Joining letter', value: (r) => r.joiningLetter || '—' }, { label: 'Login account', value: (r) => { const u = userOfTeacher(r.id); return u ? `${u.status}${u.lastLogin ? '' : ' (never signed in)'}` : 'None'; } }, { label: 'Basic salary', value: (r) => money(r.basicSalary) }] },
  ],
  stats: [
    { label: 'Teachers', value: (rows) => rows.length, icon: 'users' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'user-check' },
    { label: 'On leave', value: (rows) => countBy(rows, (r) => r.status === 'On Leave'), tone: 'warning', icon: 'calendar' },
    { label: 'Inactive', value: (rows) => countBy(rows, (r) => r.status === 'Inactive'), tone: 'neutral', icon: 'user-x' },
    { label: 'New this year', value: (rows) => countBy(rows, (r) => years(r) < 1), tone: 'info', icon: 'user-plus' },
    { label: 'Subjects', value: (rows) => new Set(rows.flatMap((r) => r.subjects)).size, tone: 'purple', icon: 'book' },
  ],
  views: [
    { key: 'all', label: 'All Teachers', match: () => true },
    { key: 'Active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'Leave', label: 'On Leave', match: (r) => r.status === 'On Leave' },
    { key: 'Inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'class', label: 'Class', options: () => snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => classesOfTeacher(r.id).some((c) => c.id === v) },
    { key: 'subject', label: 'Subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.name })), match: (r, v) => r.subjects.includes(v) },
    { key: 'status', label: 'Status', options: opts(['Active', 'On Leave', 'Inactive']), match: (r, v) => r.status === v },
    { key: 'department', label: 'Department', options: () => snapshot<DepartmentRecord>('departments').filter((d) => d.type === 'Academic').map((d) => ({ label: d.name, value: d.name })), match: (r, v) => r.department === v },
    { key: 'designation', label: 'Designation', options: opts(['Senior Teacher', 'Assistant Teacher']), match: (r, v) => r.designation === v },
    { key: 'contract', label: 'Contract', options: opts(['Permanent', 'Temporary']), match: (r, v) => r.contractType === v },
    { key: 'campus', label: 'Campus', options: opts(['Main Campus', 'North Campus']), match: (r, v) => r.campus === v },
    { key: 'gender', label: 'Gender', options: opts(['Male', 'Female']), match: (r, v) => r.gender === v },
  ],
  sorts: [
    { key: 'name', label: 'Teacher name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'subject', label: 'Subject', compare: (a, b) => (a.subjects[0] ?? '').localeCompare(b.subjects[0] ?? '') || a.name.localeCompare(b.name) },
    { key: 'recent', label: 'Recently joined', compare: (a, b) => b.joinedOn.localeCompare(a.joinedOn) },
    { key: 'experience', label: 'Most experienced', compare: (a, b) => b.experienceYears - a.experienceYears },
  ],
  form: [],
  /** Deleting a teacher also removes the login account that was created for them. */
  afterSave: (kind, record) => {
    if (kind !== 'delete') return;
    const ids = snapshot<UserRecord>('users').filter((u) => u.linkedType === 'teacher' && u.linkedId === record.id).map((u) => u.id);
    if (ids.length) repo<UserRecord>('users').removeMany(ids);
  },
  canDeleteRecord: (r) => {
    const links = [
      homeSectionsOf(r.id).length ? `class teacher of ${homeSectionsOf(r.id).length} section(s)` : '',
      mappingsOfTeacher(r.id).length ? `assigned to ${mappingsOfTeacher(r.id).length} class subject(s)` : '',
      periodsPerWeek(r.id) ? `${periodsPerWeek(r.id)} timetable period(s)` : '',
      snapshot<DepartmentRecord>('departments').some((d) => d.hod === `teacher:${r.id}`) ? 'a department head' : '',
      countBy(snapshot<TeacherAttendanceRecord>('teacherAttendance'), (a) => a.teacherId === r.id) ? 'attendance records' : '',
    ].filter(Boolean);
    return links.length ? `${r.name} is ${links.join(', ')}. Set the status to Inactive instead.` : null;
  },
  actions: [
    { key: 'profile', label: 'Open profile', icon: 'user', manage: false, run: (r, _v, ctx) => ctx.go(`/people/teacher-profile?id=${r.id}`) },
    { key: 'routine', label: 'View routine', icon: 'calendar', manage: false, run: (r, _v, ctx) => ctx.go(`/people/teacher-routine?id=${r.id}`) },
    { key: 'assign', label: 'Assign to a class', icon: 'users', manage: false, run: (_r, _v, ctx) => ctx.go('/academic/classes') },
    {
      key: 'status',
      label: 'Change status',
      icon: 'flag',
      form: { title: 'Change status', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'On Leave', 'Inactive'] }], initial: (r) => ({ status: r.status }) },
      run: (r, v, ctx) => {
        if (v.status === 'Inactive' && homeSectionsOf(r.id).length) { ctx.toast(`${r.name} is class teacher of ${homeLabels(r).join(', ')}. Assign a new class teacher first.`, 'error'); return; }
        ctx.update({ status: v.status });
        ctx.toast(`${r.name} is now ${v.status}`);
      },
    },
    {
      key: 'message',
      label: 'Message',
      icon: 'mail',
      form: { title: 'Message teacher', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: ['Message', 'Email'], default: 'Message' }, { key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] },
      run: (r, v, ctx) => ctx.toast(`${v.channel} “${v.subject}” queued for ${r.name} (mock: nothing is sent)`, 'info'),
    },
    {
      key: 'login',
      label: 'Create login account',
      icon: 'key',
      visible: (r) => !userOfTeacher(r.id),
      run: (r, _v, ctx) => {
        if (snapshot<UserRecord>('users').some((u) => u.email.toLowerCase() === r.email.toLowerCase())) { ctx.toast('Another account already uses this email', 'error'); return; }
        const [firstName, ...rest] = r.name.split(' ');
        repo<UserRecord>('users').create({ id: `usr-${r.id}`, firstName, lastName: rest.join(' '), name: r.name, email: r.email, phone: r.phone, roleId: 'role-teacher', department: r.department, branch: r.campus, status: 'Pending', online: false, lastLogin: '', created: todayISO(), linkedType: 'teacher', linkedId: r.id });
        logAudit({ entity: 'teacher', entityId: r.id, action: 'Action', summary: `${r.name}: login account created (invited)`, by: BY });
        ctx.toast(`Invitation recorded for ${r.email} (mock: nothing is sent)`, 'info');
      },
    },
    { key: 'print', label: 'Share profile', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(`${r.name} — teacher profile`, `KARKAII INTERNATIONAL SCHOOL — TEACHER PROFILE\n\n${r.name} (${r.employeeId})\n${r.designation}, ${r.department} · ${r.campus}\nSubjects: ${r.subjects.join(', ')}\nClasses: ${classLabels(r).join(', ') || '—'}\nQualification: ${r.qualification} · ${r.experienceYears} yrs\nJoined: ${formatDate(r.joinedOn)}\nEmail: ${r.email} · Phone: ${r.phone}`) },
  ],
  bulk: [
    {
      key: 'status',
      label: 'Set status',
      icon: 'flag',
      form: { title: 'Set status for selected teachers', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'On Leave', 'Inactive'] }] },
      run: (rows, v, ctx) => {
        const blocked = v.status === 'Inactive' ? rows.filter((r) => homeSectionsOf(r.id).length) : [];
        if (blocked.length) { ctx.toast(`${blocked.map((b) => b.name).join(', ')} lead a class. Assign new class teachers first.`, 'error'); return; }
        ctx.updateMany(() => ({ status: v.status }));
        ctx.toast(`${rows.length} teachers set to ${v.status}`);
      },
    },
    { key: 'message', label: 'Message', icon: 'mail', form: { title: 'Message selected teachers', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] }, run: (rows, v, ctx) => ctx.toast(`“${v.subject}” queued for ${rows.length} teachers (mock: nothing is sent)`, 'info') },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import teachers',
      icon: 'upload',
      form: {
        title: 'Import teachers',
        submitLabel: 'Import',
        fields: [
          { key: 'mode', label: 'Import mode', type: 'select', required: true, options: ['Create new teachers', 'Update existing by teacher ID', 'Create and update'], default: 'Create new teachers' },
          { key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Asha Menon,EMP-T20,Mathematics,Assistant Teacher,Mathematics;Physics,asha.m@karkaii.demo,+91 98400 99999,2026-06-01', hint: 'name, teacher ID, department, designation, subjects (separated by ;), email, phone, joining date. Rows that break a rule are skipped and counted.' },
        ],
      },
      run: (v, ctx) => {
        const create = v.mode !== 'Update existing by teacher ID';
        const update = v.mode !== 'Create new teachers';
        let added = 0;
        let updated = 0;
        let skipped = 0;
        const subjects = new Set(snapshot<SubjectRecord>('subjects').map((s) => s.name));
        for (const [name, employeeId, department, designation, subj, email, phone, joinedOn] of parseCsvRows(String(v.csv))) {
          const list = (subj ?? '').split(';').map((x) => x.trim()).filter(Boolean);
          const dept = snapshot<DepartmentRecord>('departments').find((d) => d.name.toLowerCase() === (department ?? '').toLowerCase() && d.status === 'Active');
          const desig = snapshot<DesignationRecord>('designations').find((d) => d.name.toLowerCase() === (designation ?? '').toLowerCase() && d.status === 'Active');
          const existing = snapshot<TeacherRecord>('teachers').find((t) => t.employeeId.toLowerCase() === (employeeId ?? '').toLowerCase());
          const mailTaken = (id?: string) => snapshot<TeacherRecord>('teachers').some((t) => t.id !== id && t.email.toLowerCase() === (email ?? '').toLowerCase()) || snapshot<StaffRecord>('staff').some((s) => s.email.toLowerCase() === (email ?? '').toLowerCase()) || snapshot<UserRecord>('users').some((u) => u.id !== (id ? `usr-${id}` : '') && u.email.toLowerCase() === (email ?? '').toLowerCase());
          const bad = !name || !employeeId || !dept || !desig || !list.length || !list.every((s) => subjects.has(s)) || !EMAIL.test(email ?? '') || !/^\+?[\d\s()-]{7,16}$/.test(phone ?? '') || !/^\d{4}-\d{2}-\d{2}$/.test(joinedOn ?? '') || joinedOn > todayISO() || mailTaken(existing?.id);
          if (bad || (existing && !update) || (!existing && !create)) { skipped += 1; continue; }
          if (existing) {
            repo<TeacherRecord>('teachers').update(existing.id, { name, department: dept!.name, designation: desig!.name, subjects: list, email, phone, joinedOn });
            updated += 1;
          } else {
            const [first, ...rest] = name.split(' ');
            saveTeacher({ employeeId, firstName: first, lastName: rest.join(' ') || '-', gender: 'Female', phone, email, dob: `${new Date().getFullYear() - 32}-01-01`, qualification: 'B.Ed', department: dept!.name, designation: desig!.name, subjects: list, joinedOn, campus: 'Main Campus', status: 'Active', basicSalary: '3000', languages: ['English'], createLogin: false }, undefined, BY);
            added += 1;
          }
        }
        ctx.toast(`${added} added, ${updated} updated${skipped ? `, ${skipped} skipped` : ''}`, added + updated ? 'success' : 'error');
      },
    },
  ],
  exportColumns: [
    { label: 'Teacher ID', value: (r) => r.employeeId },
    { label: 'Name', value: (r) => r.name },
    { label: 'Department', value: (r) => r.department },
    { label: 'Subjects', value: (r) => r.subjects.join('; ') },
    { label: 'Classes', value: (r) => classLabels(r).join('; ') },
    { label: 'Status', value: (r) => r.status },
    { label: 'Email', value: (r) => r.email },
    { label: 'Phone', value: (r) => r.phone },
  ],
};
