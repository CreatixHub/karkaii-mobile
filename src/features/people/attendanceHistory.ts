/** Month view of one student's attendance register (the logic behind the Student Attendance History page). */
import { snapshot } from '@/core/store/store';
import { dayName, parseISO, toISO } from '@/core/utils/date';
import { LAST_SCHOOL_DAY, type StudentAttendanceRecord, type StudentAttendanceStatus } from '@/data/seed/hrm';
import type { Tone } from '@/ui/tone';

export type DayKind = 'present' | 'late' | 'half' | 'absent' | 'leave' | 'none';

export const kindOf = (status: StudentAttendanceStatus): DayKind =>
  status === 'Present' ? 'present' : status === 'Late' ? 'late' : status === 'Half Day' ? 'half' : status === 'Absent' ? 'absent' : status === 'On Leave' || status === 'Excused' ? 'leave' : 'none';

export const KIND_TONE: Record<DayKind, Tone> = { present: 'success', late: 'warning', half: 'teal', absent: 'danger', leave: 'info', none: 'neutral' };
export const KIND_LABEL: Record<DayKind, string> = { present: 'Present', late: 'Late', half: 'Half day', absent: 'Absent', leave: 'Leave', none: 'Not counted' };

/** 'YYYY-MM' of a date. */
export const monthOf = (iso: string) => iso.slice(0, 7);
export const defaultMonth = () => monthOf(LAST_SCHOOL_DAY);

export function addMonths(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(y, m - 1 + n, 1);
  return toISO(d).slice(0, 7);
}

export function monthLabel(ym: string): string {
  const d = parseISO(`${ym}-01`);
  return d ? `${['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()]} ${d.getFullYear()}` : ym;
}

export const recordsOf = (studentId: string, ym: string): StudentAttendanceRecord[] =>
  snapshot<StudentAttendanceRecord>('studentAttendance')
    .filter((r) => r.studentId === studentId && r.date.startsWith(ym))
    .sort((a, b) => b.date.localeCompare(a.date));

export interface MonthSummary {
  present: number;
  late: number;
  half: number;
  absent: number;
  leave: number;
  /** Days counted for or against the student: present, late, half day and absent. */
  counted: number;
  /** Days attended, with a half day counting as half. */
  attended: number;
  presentPct: number;
  absentPct: number;
}

export function summarise(records: StudentAttendanceRecord[]): MonthSummary {
  const n = (k: DayKind) => records.filter((r) => kindOf(r.status) === k).length;
  const present = n('present');
  const late = n('late');
  const half = n('half');
  const absent = n('absent');
  const counted = present + late + half + absent;
  const attended = present + late + half * 0.5;
  return { present, late, half, absent, leave: n('leave'), counted, attended, presentPct: counted ? (attended / counted) * 100 : 0, absentPct: counted ? (absent / counted) * 100 : 0 };
}

export interface CalendarCell {
  date: string;
  day: number;
  kind?: DayKind;
}

/** Weeks (Sunday first) of a month; leading and trailing cells outside the month are null. */
export function monthGrid(ym: string, records: StudentAttendanceRecord[]): (CalendarCell | null)[][] {
  const first = parseISO(`${ym}-01`);
  if (!first) return [];
  const byDate = new Map(records.map((r) => [r.date, kindOf(r.status)] as const));
  const days = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells: (CalendarCell | null)[] = Array.from({ length: first.getDay() }, () => null);
  for (let d = 1; d <= days; d++) {
    const date = `${ym}-${String(d).padStart(2, '0')}`;
    cells.push({ date, day: d, kind: byDate.get(date) });
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (CalendarCell | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

export const weekdayShort = (iso: string) => dayName(iso).slice(0, 3);
