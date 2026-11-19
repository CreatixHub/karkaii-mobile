/** Lookups across collections, used to turn stored ids into readable labels. */
import { snapshot } from '@/core/store/store';
import type { ClassRecord, SectionRecord, StaffRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';
import type { MockUser } from '@/core/auth/AuthProvider';
import type { FieldDef } from '@/features/engine/types';

const find = <T extends { id: string }>(collection: string, id?: string): T | undefined =>
  id ? snapshot<T>(collection).find((r) => r.id === id) : undefined;

export const getStudent = (id?: string) => find<StudentRecord>('students', id);
export const getClass = (id?: string) => find<ClassRecord>('classes', id);
export const getSection = (id?: string) => find<SectionRecord>('sections', id);
export const getTeacher = (id?: string) => find<TeacherRecord>('teachers', id);

export const studentName = (id?: string) => getStudent(id)?.name ?? '—';

/** "Grade X-A" */
export function classSection(s?: Pick<StudentRecord, 'classId' | 'sectionId'>): string {
  if (!s) return '—';
  const c = getClass(s.classId);
  const sec = getSection(s.sectionId);
  return c ? `${c.name}${sec ? `-${sec.name}` : ''}` : '—';
}

export const getStaff = (id?: string) => find<StaffRecord>('staff', id);

export const teacherName = (id?: string) => getTeacher(id)?.name ?? '—';

export const studentOptions: NonNullable<FieldDef['optionsFrom']> = {
  collection: 'students',
  label: (s: StudentRecord) => s.name,
  hint: (s: StudentRecord) => `${s.admissionNo} · ${classSection(s)}`,
};

export const classOptions: NonNullable<FieldDef['optionsFrom']> = {
  collection: 'classes',
  label: (c: ClassRecord) => c.name,
};

export const teacherOptions: NonNullable<FieldDef['optionsFrom']> = {
  collection: 'teachers',
  label: (t: TeacherRecord) => t.name,
  hint: (t: TeacherRecord) => t.department,
};

export function countBy<T>(rows: T[], pred: (r: T) => boolean): number {
  let n = 0;
  for (const r of rows) if (pred(r)) n += 1;
  return n;
}

export const sum = <T,>(rows: T[], pick: (r: T) => number): number => rows.reduce((s, r) => s + (pick(r) || 0), 0);

/** Next record number such as RCT-2026-0031. */
export function nextNo(prefix: string, existing: string[], width = 4): string {
  let max = 0;
  for (const code of existing) {
    const m = /(\d+)$/.exec(code ?? '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(width, '0')}`;
}

/**
 * Students see only their own records and parents only their children's; every other role sees everything.
 * (The web app gets this from the API; the mock phase enforces it here.)
 */
export function ownStudentScope(r: { studentId: string }, user: MockUser | null): boolean {
  if (user?.role === 'student') return r.studentId === user.studentId;
  if (user?.role === 'parent') return !!user.childIds?.includes(r.studentId);
  return true;
}

/** Staff-side records (teacher/staff attendance, leave requests) are not shown to students and parents. */
export const staffSideScope = (_r: unknown, user: MockUser | null): boolean => user?.role !== 'student' && user?.role !== 'parent';
