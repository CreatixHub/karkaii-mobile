/** Values about a student that are worked out from other records (marks, fees, conduct, attendance) rather than stored on the student. */
import { snapshot } from '@/core/store/store';
import { diffDays, formatDate, todayISO } from '@/core/utils/date';
import { gradeFor } from '@/core/academic';
import type { FeeInvoiceRecord } from '@/data/seed/finance';
import type { StudentRecord, TeacherRecord } from '@/data/seed/master';
import type { DisciplineRecord, ExamResultRecord } from '@/data/seed/studentLife';
import { attendancePct } from '@/features/hrm/configs';
import { balanceOf, isOverdue, netAmount } from '@/features/finance/configs';
import { classSection, getSection } from '@/features/common/refs';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

export const ageOf = (dob: string): number => Math.floor(diffDays(dob, todayISO()) / 365.25);

export const classTeacherOf = (s: Pick<StudentRecord, 'sectionId'>): TeacherRecord | undefined => {
  const teacherId = getSection(s.sectionId)?.classTeacherId;
  return snapshot<TeacherRecord>('teachers').find((t) => t.id === teacherId);
};

/* ----------------------------------- Exams & rank ----------------------------------- */

export const examPercent = (r: ExamResultRecord): number => {
  const subjects = Object.keys(r.marks).length;
  if (!subjects) return 0;
  return (Object.values(r.marks).reduce((a, b) => a + b, 0) / (subjects * r.max)) * 100;
};

let academicCache: { source: ExamResultRecord[]; table: Map<string, number> } | null = null;
/** Average of a student's exam percentages. */
export function academicPercent(studentId: string): number {
  const source = snapshot<ExamResultRecord>('examResults');
  if (!academicCache || academicCache.source !== source) {
    const sums = new Map<string, { t: number; n: number }>();
    for (const r of source) {
      const cur = sums.get(r.studentId) ?? { t: 0, n: 0 };
      cur.t += examPercent(r);
      cur.n += 1;
      sums.set(r.studentId, cur);
    }
    const table = new Map<string, number>();
    sums.forEach((v, k) => table.set(k, v.n ? v.t / v.n : 0));
    academicCache = { source, table };
  }
  return academicCache.table.get(studentId) ?? 0;
}

export const gpaOf = (percent: number): number => Math.round(percent) / 10;
export const gradeOfPercent = gradeFor;

/** Rank among students in the same section (1 = best); students without results are not ranked. */
export function rankInSection(student: StudentRecord): { rank: number; of: number } {
  const peers = snapshot<StudentRecord>('students').filter((s) => s.sectionId === student.sectionId && (s.status === 'Active' || s.status === 'On Leave'));
  const mine = academicPercent(student.id);
  const ranked = peers.filter((p) => academicPercent(p.id) > 0);
  return { rank: ranked.filter((p) => academicPercent(p.id) > mine).length + 1, of: ranked.length };
}

/* ------------------------------------- Fees ------------------------------------- */

export interface FeeSummary {
  total: number;
  paid: number;
  balance: number;
  overdue: number;
  status: 'Paid' | 'Due' | 'Overdue';
}

export function feeSummary(studentId: string): FeeSummary {
  const mine = snapshot<FeeInvoiceRecord>('feeInvoices').filter((i) => i.studentId === studentId);
  const total = mine.reduce((n, i) => n + netAmount(i), 0);
  const paid = mine.reduce((n, i) => n + i.paid, 0);
  const balance = mine.reduce((n, i) => n + balanceOf(i), 0);
  const overdue = mine.filter(isOverdue).length;
  return { total, paid, balance, overdue, status: balance <= 0 ? 'Paid' : overdue > 0 ? 'Overdue' : 'Due' };
}

/* ------------------------------------ Conduct ------------------------------------ */

export const conductPoints = (studentId: string): number => snapshot<DisciplineRecord>('disciplineRecords').filter((d) => d.studentId === studentId).reduce((n, d) => n + d.points, 0);
export const behaviourScore = (studentId: string): number => clamp(Math.round(75 + conductPoints(studentId) / 2), 0, 100);
export const behaviourLabel = (score: number): string => (score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Needs attention');

/** 50% academics, 25% attendance, 25% behaviour. */
export const performanceIndex = (studentId: string): number => Math.round(0.5 * academicPercent(studentId) + 0.25 * attendancePct(studentId) + 0.25 * behaviourScore(studentId));

/* --------------------------- Transport & hostel (derived) --------------------------- */

const ROUTES = [
  { name: 'Route 12 — Downtown', bus: 'BUS-04 / TN-01-1234', driver: 'Michael Doe', phone: '+91 98400 22145', pickup: 'Maple Street', pickupTime: '07:45', dropTime: '15:45' },
  { name: 'Route 4 — Lakeside', bus: 'BUS-02 / TN-01-2231', driver: 'Selvam Raj', phone: '+91 98400 22146', pickup: 'Lake View Corner', pickupTime: '07:30', dropTime: '15:50' },
  { name: 'Route 7 — Airport Road', bus: 'BUS-06 / TN-01-4410', driver: 'Imran Pasha', phone: '+91 98400 22147', pickup: 'Temple Junction', pickupTime: '07:20', dropTime: '16:00' },
  { name: 'Route 9 — Green Park', bus: 'BUS-01 / TN-01-1198', driver: 'Joseph Anand', phone: '+91 98400 22148', pickup: 'Green Park Gate', pickupTime: '07:50', dropTime: '15:40' },
  { name: 'Route 2 — Anna Nagar', bus: 'BUS-03 / TN-01-3392', driver: 'Prakash Kumar', phone: '+91 98400 22149', pickup: 'Anna Nagar Roundabout', pickupTime: '07:35', dropTime: '15:55' },
  { name: 'Route 15 — Beach Road', bus: 'BUS-05 / TN-01-5520', driver: 'Faisal Ahmed', phone: '+91 98400 22150', pickup: 'Beach Road Stop', pickupTime: '07:25', dropTime: '16:05' },
];
const numOf = (id: string) => Number(id.replace(/\D/g, '')) || 0;

export const transportOf = (s: StudentRecord) => (s.transport ? ROUTES[numOf(s.id) % ROUTES.length] : null);

export function hostelOf(s: StudentRecord) {
  if (!s.hostel) return null;
  const girls = s.gender === 'Female';
  const mates = snapshot<StudentRecord>('students').filter((x) => x.hostel && x.gender === s.gender && x.id !== s.id);
  const n = numOf(s.id);
  return {
    room: `H-${200 + (n % 40)}`,
    block: girls ? 'Sunrise Girls Block B' : 'Horizon Boys Block A',
    warden: girls ? 'Kavitha Suresh' : 'Ramesh Babu',
    roommates: [mates[n % Math.max(1, mates.length)], mates[(n + 3) % Math.max(1, mates.length)]].filter((m, i, a) => !!m && a.indexOf(m) === i).map((m) => m.name.split(' ')[0]),
    checkIn: s.joinedOn,
  };
}

/* ------------------------------------- Text ------------------------------------- */

export function profileText(s: StudentRecord): string {
  const fee = feeSummary(s.id);
  return [
    'KARKAII INTERNATIONAL SCHOOL — STUDENT PROFILE',
    '================================================',
    `Name: ${s.name}`,
    `Admission No: ${s.admissionNo}   Roll No: ${s.rollNo}`,
    `Class: ${classSection(s)}   House: ${s.house}`,
    `DOB: ${formatDate(s.dob)} (${ageOf(s.dob)} yrs)   Blood group: ${s.bloodGroup}`,
    `Guardian: ${s.parentName} (${s.parentPhone})`,
    `Attendance: ${Math.round(attendancePct(s.id))}%   Academic: ${Math.round(academicPercent(s.id))}%   Behaviour: ${behaviourScore(s.id)}/100`,
    `Fees: ${fee.status}${fee.balance ? ` ($${Math.round(fee.balance).toLocaleString('en-US')} outstanding)` : ''}`,
  ].join('\n');
}

/* ------------------------------ One exam, one student ------------------------------ */

export const PASS_PERCENT = 33;
export const examTotals = (r: ExamResultRecord) => ({ obtained: Object.values(r.marks).reduce((a, b) => a + b, 0), max: Object.keys(r.marks).length * r.max });

/** Rank of a student in their section for one exam, by total marks. */
export function examRank(student: StudentRecord, examId: string): { rank: number; of: number } {
  const peers = new Set(snapshot<StudentRecord>('students').filter((s) => s.sectionId === student.sectionId && (s.status === 'Active' || s.status === 'On Leave')).map((s) => s.id));
  const totals = snapshot<ExamResultRecord>('examResults').filter((r) => r.examId === examId && peers.has(r.studentId)).map((r) => ({ id: r.studentId, total: examTotals(r).obtained }));
  const mine = totals.find((t) => t.id === student.id)?.total ?? 0;
  return { rank: totals.filter((t) => t.total > mine).length + 1, of: totals.length };
}
