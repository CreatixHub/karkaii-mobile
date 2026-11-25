/** Teacher form definition, validation, saving and leave decisions (shared by the Add / Edit Teacher page and the tests). */
import { repo, snapshot } from '@/core/store/store';
import { diffDays, todayISO } from '@/core/utils/date';
import type { SubjectRecord } from '@/data/seed/academic';
import type { TeacherAttendanceRecord } from '@/data/seed/hrm';
import type { StaffRecord, TeacherRecord } from '@/data/seed/master';
import type { DepartmentRecord, DesignationRecord, UserRecord } from '@/data/seed/peopleAdmin';
import type { TeacherLeaveRecord } from '@/data/seed/teacherLife';
import { logAudit } from '@/features/common/audit';
import { campusChoices, mainCampusName, nextNo } from '@/features/common/refs';
import type { FieldDef, FormValues } from '@/features/engine/types';
import { homeSectionsOf } from './teacherData';

const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Spanish', 'French'];
const departmentNames = () => snapshot<DepartmentRecord>('departments').filter((d) => d.status === 'Active').map((d) => ({ label: d.name, value: d.name }));
const designationNames = () => snapshot<DesignationRecord>('designations').filter((d) => d.status === 'Active').map((d) => ({ label: d.name, value: d.name }));
const subjectNames = () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.name }));

export interface FormSection {
  key: string;
  title: string;
  fields: FieldDef[];
}

export const TEACHER_SECTIONS: FormSection[] = [
  {
    key: 'personal',
    title: 'Personal information',
    fields: [
      { key: 'employeeId', label: 'Teacher ID', type: 'text', required: true },
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
      { key: 'phone', label: 'Primary Contact Number', type: 'phone', required: true },
      { key: 'email', label: 'Email Address', type: 'email', required: true },
      { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: BLOOD },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { key: 'maritalStatus', label: 'Marital Status', type: 'select', options: ['Single', 'Married'], default: 'Single' },
      { key: 'languages', label: 'Languages Known', type: 'multiselect', options: LANGUAGES },
      { key: 'fatherName', label: 'Father’s Name', type: 'text' },
      { key: 'motherName', label: 'Mother’s Name', type: 'text' },
      { key: 'qualification', label: 'Qualification', type: 'text', required: true },
      { key: 'experienceYears', label: 'Work Experience (years)', type: 'number', min: 0, max: 50, default: 0 },
      { key: 'previousSchool', label: 'Previous School (if any)', type: 'text' },
      { key: 'previousSchoolAddress', label: 'Previous School Address', type: 'text' },
      { key: 'previousSchoolPhone', label: 'Previous School Phone', type: 'phone' },
      { key: 'address', label: 'Address', type: 'textarea' },
      { key: 'permanentAddress', label: 'Permanent Address', type: 'textarea' },
      { key: 'panId', label: 'PAN / ID Number', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    key: 'professional',
    title: 'Professional details',
    fields: [
      { key: 'department', label: 'Department', type: 'select', required: true, options: departmentNames },
      { key: 'designation', label: 'Designation', type: 'select', required: true, options: designationNames },
      { key: 'subjects', label: 'Subjects', type: 'multiselect', required: true, options: subjectNames, hint: 'Subjects this teacher can teach. Assign them to classes from Academic → Classes.' },
      { key: 'joinedOn', label: 'Date of Joining', type: 'date', required: true },
      { key: 'campus', label: 'Campus', type: 'select', required: true, options: campusChoices, default: mainCampusName() },
      { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'On Leave', 'Inactive'], default: 'Active' },
    ],
  },
  {
    key: 'payroll',
    title: 'Payroll',
    fields: [
      { key: 'epfNo', label: 'EPF No', type: 'text' },
      { key: 'basicSalary', label: 'Basic Salary', type: 'money', required: true, min: 0 },
      { key: 'contractType', label: 'Contract Type', type: 'select', options: ['Permanent', 'Temporary'], default: 'Permanent' },
      { key: 'workShift', label: 'Work Shift', type: 'select', options: ['Morning', 'Afternoon'], default: 'Morning' },
      { key: 'workLocation', label: 'Work Location', type: 'text' },
      { key: 'dateOfLeaving', label: 'Date of Leaving', type: 'date' },
    ],
  },
  {
    key: 'leaves',
    title: 'Yearly leave allowance',
    fields: [
      { key: 'medicalLeaves', label: 'Medical Leaves', type: 'number', min: 0, max: 365, default: 8 },
      { key: 'casualLeaves', label: 'Casual Leaves', type: 'number', min: 0, max: 365, default: 12 },
      { key: 'sickLeaves', label: 'Sick Leaves', type: 'number', min: 0, max: 365, default: 10 },
      { key: 'maternityLeaves', label: 'Maternity Leaves', type: 'number', min: 0, max: 365, default: 0 },
    ],
  },
  {
    key: 'bank',
    title: 'Bank account',
    fields: [
      { key: 'accountName', label: 'Account Name', type: 'text' },
      { key: 'accountNumber', label: 'Account Number', type: 'text' },
      { key: 'bankName', label: 'Bank Name', type: 'text' },
      { key: 'ifscCode', label: 'IFSC Code', type: 'text' },
      { key: 'branchName', label: 'Branch Name', type: 'text' },
    ],
  },
  {
    key: 'transport',
    title: 'Transport & hostel',
    fields: [
      { key: 'route', label: 'Route', type: 'text' },
      { key: 'vehicleNumber', label: 'Vehicle Number', type: 'text' },
      { key: 'pickupPoint', label: 'Pick-up Point', type: 'text' },
      { key: 'hostel', label: 'Hostel', type: 'text' },
      { key: 'roomNo', label: 'Room No', type: 'text' },
    ],
  },
  {
    key: 'social',
    title: 'Social media & documents',
    fields: [
      { key: 'facebook', label: 'Facebook', type: 'text' },
      { key: 'instagram', label: 'Instagram', type: 'text' },
      { key: 'linkedin', label: 'LinkedIn', type: 'text' },
      { key: 'youtube', label: 'YouTube', type: 'text' },
      { key: 'twitter', label: 'Twitter', type: 'text' },
      { key: 'resume', label: 'Resume (file name)', type: 'text', hint: 'File names are recorded as metadata in this demo; no file is stored.' },
      { key: 'joiningLetter', label: 'Joining Letter (file name)', type: 'text' },
    ],
  },
  {
    key: 'login',
    title: 'Login account',
    fields: [{ key: 'createLogin', label: 'Create a login account (sends an invitation)', type: 'switch', default: true, hint: 'The account appears under Users as Pending. Demo sign-in on this build uses the fixed demo accounts.' }],
  },
];

export const ALL_FIELDS: FieldDef[] = TEACHER_SECTIONS.flatMap((s) => s.fields);

/** Form values (strings / arrays / booleans) for a teacher, or the defaults for a new one. */
export function teacherToValues(t?: TeacherRecord): FormValues {
  const out: FormValues = {};
  const [firstName, ...rest] = (t?.name ?? '').split(' ');
  for (const f of ALL_FIELDS) {
    const raw = f.key === 'firstName' ? firstName : f.key === 'lastName' ? rest.join(' ') : f.key === 'createLogin' ? (t ? false : undefined) : (t as unknown as Record<string, unknown> | undefined)?.[f.key];
    if (f.type === 'multiselect') out[f.key] = Array.isArray(raw) ? raw : [];
    else if (f.type === 'switch') out[f.key] = typeof raw === 'boolean' ? raw : f.default === true;
    else if (raw !== undefined && raw !== null && raw !== '') out[f.key] = String(raw);
    else out[f.key] = f.default !== undefined && !t ? String(f.default) : '';
  }
  if (!t) out.employeeId = nextNo('EMP-T', snapshot<TeacherRecord>('teachers').map((x) => x.employeeId), 2);
  if (!t) out.joinedOn = todayISO();
  if (!t) out.languages = ['English'];
  return out;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Field → message for everything wrong with the form. Empty object means it can be saved. */
export function validateTeacher(v: FormValues, existing?: TeacherRecord): Record<string, string> {
  const e: Record<string, string> = {};
  const teachers = snapshot<TeacherRecord>('teachers').filter((t) => t.id !== existing?.id);
  const required: [string, string][] = [['employeeId', 'Teacher ID'], ['firstName', 'First name'], ['lastName', 'Last name'], ['gender', 'Gender'], ['phone', 'Contact number'], ['email', 'Email'], ['dob', 'Date of birth'], ['qualification', 'Qualification'], ['department', 'Department'], ['designation', 'Designation'], ['joinedOn', 'Date of joining']];
  for (const [k, label] of required) if (!String(v[k] ?? '').trim()) e[k] = `${label} is required`;
  if (!(v.subjects ?? []).length) e.subjects = 'Choose at least one subject';
  if (!String(v.basicSalary ?? '').trim()) e.basicSalary = 'Basic salary is required';
  if (!e.email && !EMAIL.test(String(v.email).trim())) e.email = 'Enter a valid email address';
  if (!e.phone && !/^\+?[\d\s()-]{7,16}$/.test(String(v.phone).trim())) e.phone = 'Enter a valid phone number';
  if (!e.employeeId && teachers.some((t) => t.employeeId.toLowerCase() === String(v.employeeId).trim().toLowerCase())) e.employeeId = 'This teacher ID is already used';
  if (!e.email) {
    const mail = String(v.email).trim().toLowerCase();
    const own = existing ? snapshot<UserRecord>('users').find((u) => u.linkedType === 'teacher' && u.linkedId === existing.id)?.id : undefined;
    if (teachers.some((t) => t.email.toLowerCase() === mail) || snapshot<StaffRecord>('staff').some((s) => s.email.toLowerCase() === mail) || snapshot<UserRecord>('users').some((u) => u.id !== own && u.email.toLowerCase() === mail)) e.email = 'This email is already used by another person or account';
  }
  if (!e.dob) {
    const age = diffDays(String(v.dob), todayISO()) / 365.25;
    if (age < 20) e.dob = 'A teacher must be at least 20 years old';
    else if (age > 70) e.dob = 'Date of birth looks too early';
  }
  if (!e.joinedOn) {
    if (String(v.joinedOn) > todayISO()) e.joinedOn = 'Joining date cannot be in the future';
    else if (!e.dob && diffDays(String(v.dob), String(v.joinedOn)) / 365.25 < 18) e.joinedOn = 'Joining date is before the teacher turned 18';
  }
  if (v.dateOfLeaving && String(v.dateOfLeaving) < String(v.joinedOn)) e.dateOfLeaving = 'Leaving date is before the joining date';
  if (Number(v.basicSalary) < 0) e.basicSalary = 'Salary cannot be negative';
  for (const k of ['medicalLeaves', 'casualLeaves', 'sickLeaves', 'maternityLeaves']) if (Number(v[k]) < 0 || Number(v[k]) > 365) e[k] = 'Enter 0 to 365';
  if (v.accountNumber && !/^\d{6,20}$/.test(String(v.accountNumber).replace(/\s/g, ''))) e.accountNumber = 'Use digits only (6 to 20)';
  if (v.ifscCode && !/^[A-Za-z0-9]{8,15}$/.test(String(v.ifscCode).trim())) e.ifscCode = 'Enter 8 to 15 letters or digits';
  if (existing) {
    if (v.status === 'Inactive') {
      const homes = homeSectionsOf(existing.id).map((s) => s.name);
      if (homes.length) e.status = `${existing.name} is class teacher of ${homes.length} section(s). Assign a new class teacher first.`;
    }
    if (v.department !== existing.department) {
      const heads = snapshot<DepartmentRecord>('departments').filter((d) => d.hod === `teacher:${existing.id}`).map((d) => d.name);
      if (heads.length) e.department = `${existing.name} heads ${heads.join(', ')}. Assign a new head first.`;
    }
  }
  return e;
}

/** Create or update a teacher from the form, keeping the login account, audit trail and department links in step. */
export function saveTeacher(v: FormValues, existing: TeacherRecord | undefined, by: string): { teacher: TeacherRecord; created: boolean } {
  const num = (k: string) => Number(v[k] || 0);
  const str = (k: string) => String(v[k] ?? '').trim();
  const fields: Omit<TeacherRecord, 'id'> = {
    employeeId: str('employeeId'),
    name: `${str('firstName')} ${str('lastName')}`.trim(),
    department: str('department'),
    subjects: [...(v.subjects ?? [])],
    qualification: str('qualification'),
    phone: str('phone'),
    email: str('email'),
    gender: v.gender,
    experienceYears: num('experienceYears'),
    designation: str('designation'),
    campus: str('campus') || mainCampusName(),
    status: v.status || 'Active',
    joinedOn: str('joinedOn'),
    dob: str('dob'),
    maritalStatus: v.maritalStatus || 'Single',
    languages: [...(v.languages ?? [])],
    fatherName: str('fatherName'),
    motherName: str('motherName'),
    bloodGroup: str('bloodGroup'),
    address: str('address'),
    permanentAddress: str('permanentAddress'),
    panId: str('panId'),
    notes: str('notes'),
    previousSchool: str('previousSchool'),
    previousSchoolAddress: str('previousSchoolAddress'),
    previousSchoolPhone: str('previousSchoolPhone'),
    epfNo: str('epfNo'),
    basicSalary: num('basicSalary'),
    contractType: v.contractType || 'Permanent',
    workShift: v.workShift || 'Morning',
    workLocation: str('workLocation'),
    dateOfLeaving: str('dateOfLeaving'),
    medicalLeaves: num('medicalLeaves'),
    casualLeaves: num('casualLeaves'),
    maternityLeaves: num('maternityLeaves'),
    sickLeaves: num('sickLeaves'),
    accountName: str('accountName'),
    accountNumber: str('accountNumber'),
    bankName: str('bankName'),
    ifscCode: str('ifscCode'),
    branchName: str('branchName'),
    route: str('route'),
    vehicleNumber: str('vehicleNumber'),
    pickupPoint: str('pickupPoint'),
    hostel: str('hostel'),
    roomNo: str('roomNo'),
    facebook: str('facebook'),
    instagram: str('instagram'),
    linkedin: str('linkedin'),
    youtube: str('youtube'),
    twitter: str('twitter'),
    resume: str('resume'),
    joiningLetter: str('joiningLetter'),
  };
  const teachers = repo<TeacherRecord>('teachers');
  if (existing) {
    const teacher = teachers.update(existing.id, fields)!;
    const account = snapshot<UserRecord>('users').find((u) => u.linkedType === 'teacher' && u.linkedId === existing.id);
    if (account) repo<UserRecord>('users').update(account.id, { name: teacher.name, firstName: str('firstName'), lastName: str('lastName'), email: teacher.email, phone: teacher.phone, department: teacher.department, branch: teacher.campus });
    logAudit({ entity: 'teacher', entityId: existing.id, action: 'Updated', summary: `${teacher.name}: profile updated`, by });
    return { teacher, created: false };
  }
  const teacher = teachers.create({ ...fields, id: `tch-${String(snapshot<TeacherRecord>('teachers').reduce((n, t) => Math.max(n, Number(t.id.replace(/\D/g, '')) || 0), 0) + 1).padStart(3, '0')}` });
  if (v.createLogin) {
    repo<UserRecord>('users').create({ id: `usr-${teacher.id}`, firstName: str('firstName'), lastName: str('lastName'), name: teacher.name, email: teacher.email, phone: teacher.phone, roleId: 'role-teacher', department: teacher.department, branch: teacher.campus, status: 'Pending', online: false, lastLogin: '', created: todayISO(), linkedType: 'teacher', linkedId: teacher.id });
  }
  logAudit({ entity: 'teacher', entityId: teacher.id, action: 'Created', summary: `${teacher.name} added as ${teacher.designation}`, by });
  return { teacher, created: true };
}

/** Approve or reject a teacher's leave; approving marks the existing register days On Leave. Returns how many days changed. */
export function decideTeacherLeave(leave: TeacherLeaveRecord, status: 'Approved' | 'Rejected', by: string, note = ''): number {
  repo<TeacherLeaveRecord>('teacherLeaves').update(leave.id, { status, decidedBy: by, decisionNote: note });
  let marked = 0;
  if (status === 'Approved') {
    const ids = snapshot<TeacherAttendanceRecord>('teacherAttendance').filter((a) => a.teacherId === leave.teacherId && a.date >= leave.from && a.date <= leave.to && a.status !== 'On Leave').map((a) => a.id);
    repo<TeacherAttendanceRecord>('teacherAttendance').updateMany(ids, () => ({ status: 'On Leave' as const, checkIn: '', checkOut: '', notes: 'Approved leave.' }));
    marked = ids.length;
  }
  logAudit({ entity: 'teacher', entityId: leave.teacherId, action: 'Action', summary: `${leave.leaveType} ${leave.from}${leave.to !== leave.from ? ` to ${leave.to}` : ''} ${status.toLowerCase()}${marked ? ` (${marked} register day${marked > 1 ? 's' : ''} marked)` : ''}`, by });
  return marked;
}
