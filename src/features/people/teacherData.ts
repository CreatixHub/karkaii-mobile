/** Values about a teacher that are worked out from other records (timetable, class mapping, register, leave) rather than stored. */
import { snapshot } from '@/core/store/store';
import { todayISO, toISO } from '@/core/utils/date';
import type { ClassSubjectRecord, TimetableEntryRecord } from '@/data/seed/academic';
import { LAST_SCHOOL_DAY, type TeacherAttendanceRecord } from '@/data/seed/hrm';
import type { ClassRecord, SectionRecord, TeacherRecord } from '@/data/seed/master';
import type { UserRecord } from '@/data/seed/peopleAdmin';
import type { TeacherLeaveRecord, TeacherLeaveType } from '@/data/seed/teacherLife';
import { monthOf } from './attendanceHistory';

export const teachersAll = () => snapshot<TeacherRecord>('teachers');

/** Class-subject rows where this teacher is the assigned teacher. */
export const mappingsOfTeacher = (teacherId: string) => snapshot<ClassSubjectRecord>('classSubjects').filter((m) => m.teacherId === teacherId);
/** Sections whose class teacher is this teacher. */
export const homeSectionsOf = (teacherId: string) => snapshot<SectionRecord>('sections').filter((s) => s.classTeacherId === teacherId);

/** Distinct classes a teacher teaches in (from the class-subject mapping) or leads as class teacher. */
export function classesOfTeacher(teacherId: string): ClassRecord[] {
  const ids = new Set([...mappingsOfTeacher(teacherId).map((m) => m.classId), ...homeSectionsOf(teacherId).map((s) => s.classId)]);
  return snapshot<ClassRecord>('classes').filter((c) => ids.has(c.id));
}

export const timetableOfTeacher = (teacherId: string) => snapshot<TimetableEntryRecord>('timetableEntries').filter((e) => e.teacherId === teacherId);
export const periodsPerWeek = (teacherId: string) => timetableOfTeacher(teacherId).length;
export const mappedPeriods = (teacherId: string) => mappingsOfTeacher(teacherId).reduce((n, m) => n + m.periodsPerWeek, 0);

/** The login account created for a teacher, if any. */
export const userOfTeacher = (teacherId: string) => snapshot<UserRecord>('users').find((u) => u.linkedType === 'teacher' && u.linkedId === teacherId);

/* ---------------------------------- Attendance ---------------------------------- */

export interface DutySummary {
  present: number;
  late: number;
  half: number;
  absent: number;
  leave: number;
  pending: number;
  /** Days counted for or against the teacher (present, late, half day, absent). */
  counted: number;
  pct: number;
}

export function attendanceSummaryOf(teacherId: string): DutySummary {
  const mine = snapshot<TeacherAttendanceRecord>('teacherAttendance').filter((a) => a.teacherId === teacherId);
  const n = (s: string) => mine.filter((a) => a.status === s).length;
  const present = n('Present');
  const late = n('Late');
  const half = n('Half Day');
  const absent = n('Absent');
  const counted = present + late + half + absent;
  return { present, late, half, absent, leave: n('On Leave'), pending: n('Pending'), counted, pct: counted ? ((present + late + half * 0.5) / counted) * 100 : 100 };
}

/* ------------------------------------- Leave ------------------------------------- */

export interface LeaveBalance {
  type: TeacherLeaveType;
  allowed: number;
  used: number;
  available: number;
}

/** Yearly allowance (set on the teacher's record) less approved leave taken this calendar year. */
export function leaveBalancesOf(t: TeacherRecord): LeaveBalance[] {
  const year = todayISO().slice(0, 4);
  const taken = (type: TeacherLeaveType) => snapshot<TeacherLeaveRecord>('teacherLeaves').filter((l) => l.teacherId === t.id && l.leaveType === type && l.status === 'Approved' && l.from.startsWith(year)).reduce((n, l) => n + l.days, 0);
  const rows: [TeacherLeaveType, number][] = [['Medical Leave', t.medicalLeaves], ['Casual Leave', t.casualLeaves], ['Sick Leave', t.sickLeaves], ['Maternity Leave', t.maternityLeaves], ['Paternity Leave', 0]];
  return rows.map(([type, allowed]) => ({ type, allowed, used: taken(type), available: Math.max(0, allowed - taken(type)) }));
}

/* ------------------------------------- Payroll ------------------------------------- */

export interface Payroll {
  basic: number;
  hra: number;
  transport: number;
  special: number;
  gross: number;
  epf: number;
  tax: number;
  unpaidDays: number;
  leaveDeduction: number;
  deductions: number;
  net: number;
}

/**
 * Illustrative monthly pay from the stored basic salary: HRA 20%, transport 10%, special 5% on top; EPF 12% of basic and 4% of gross
 * as tax come off, plus one day of gross/26 for every register day marked Absent this month. (Payroll itself is not one of the app’s pages.)
 */
export function payrollOf(t: TeacherRecord): Payroll {
  const basic = Math.round(t.basicSalary);
  const hra = Math.round(basic * 0.2);
  const transport = Math.round(basic * 0.1);
  const special = Math.round(basic * 0.05);
  const gross = basic + hra + transport + special;
  const epf = Math.round(basic * 0.12);
  const tax = Math.round(gross * 0.04);
  const month = monthOf(LAST_SCHOOL_DAY);
  const unpaidDays = snapshot<TeacherAttendanceRecord>('teacherAttendance').filter((a) => a.teacherId === t.id && a.status === 'Absent' && a.date.startsWith(month)).length;
  const leaveDeduction = Math.round((gross / 26) * unpaidDays);
  const deductions = epf + tax + leaveDeduction;
  return { basic, hra, transport, special, gross, epf, tax, unpaidDays, leaveDeduction, deductions, net: gross - deductions };
}

export interface Payslip {
  payrollId: string;
  salaryFor: string;
  paidOn: string;
  method: 'Bank transfer' | 'Cheque';
  net: number;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** The previous six months’ payslips: the current net with a small, repeatable month-to-month variation (overtime, arrears). */
export function payslipsOf(t: TeacherRecord): Payslip[] {
  const base = payrollOf(t);
  const seed = Number(t.id.replace(/\D/g, '')) || 1;
  const [y, m] = todayISO().split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(first.getFullYear(), first.getMonth() - 1 - i, 1);
    const wobble = (((seed * 7 + i * 13) % 5) - 2) * 25;
    const paid = new Date(d.getFullYear(), d.getMonth() + 1, 5);
    return { payrollId: String(8100 + seed * 10 - i), salaryFor: `${MONTHS[d.getMonth()]} - ${d.getFullYear()}`, paidOn: toISO(paid), method: i % 2 === 0 ? ('Bank transfer' as const) : ('Cheque' as const), net: Math.max(0, base.net + wobble) };
  });
}
