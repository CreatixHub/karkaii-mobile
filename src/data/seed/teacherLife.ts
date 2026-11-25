/** People & Admission seed data, part 4: what hangs off a teacher (leave requests, library loans). */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildTeacherAttendance, LAST_SCHOOL_DAY } from './hrm';
import { buildTeachers } from './master';
import { BOOKS } from './studentLife';
import { makeRng, SEED_TODAY } from './rng';

export type TeacherLeaveType = 'Medical Leave' | 'Casual Leave' | 'Sick Leave' | 'Maternity Leave' | 'Paternity Leave';
export const TEACHER_LEAVE_TYPES: TeacherLeaveType[] = ['Medical Leave', 'Casual Leave', 'Sick Leave', 'Maternity Leave', 'Paternity Leave'];

export interface TeacherLeaveRecord extends Entity {
  teacherId: string;
  leaveType: TeacherLeaveType;
  from: string;
  to: string;
  days: number;
  appliedOn: string;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  decidedBy: string;
  decisionNote: string;
}

/** Approved leave is rebuilt from the teacher attendance register's "On Leave" runs, so register and leave always agree. */
export const buildTeacherLeaves = (): TeacherLeaveRecord[] => {
  const attendance = buildTeacherAttendance();
  const out: TeacherLeaveRecord[] = [];
  for (const t of buildTeachers()) {
    const mine = attendance.filter((a) => a.teacherId === t.id).sort((a, b) => a.date.localeCompare(b.date));
    let run: string[] = [];
    const flush = () => {
      if (!run.length) return;
      out.push({ id: `tlv-${t.id}-${run[0]}`, teacherId: t.id, leaveType: run.length > 1 ? 'Medical Leave' : 'Casual Leave', from: run[0], to: run[run.length - 1], days: run.length, appliedOn: addDays(run[0], -3), status: 'Approved', reason: run.length > 1 ? 'Medical treatment' : 'Personal work', decidedBy: 'Dr. Meera Krishnan', decisionNote: '' });
      run = [];
    };
    for (const a of mine) {
      if (a.status === 'On Leave') run.push(a.date);
      else flush();
    }
    flush();
  }
  const base = LAST_SCHOOL_DAY;
  const extra: [string, TeacherLeaveType, number, number, TeacherLeaveRecord['status'], string, string][] = [
    ['tch-001', 'Casual Leave', 6, 1, 'Pending', 'Family function', ''],
    ['tch-003', 'Medical Leave', 3, 3, 'Pending', 'Scheduled surgery', ''],
    ['tch-010', 'Sick Leave', 1, 2, 'Pending', 'Viral fever', ''],
    ['tch-006', 'Casual Leave', 10, 5, 'Rejected', 'Holiday trip during exams', 'Mid-term exam duty is scheduled on these days.'],
    ['tch-002', 'Casual Leave', -40, 2, 'Approved', 'Wedding in the family', ''],
  ];
  for (const [id, leaveType, startIn, len, status, reason, decisionNote] of extra) {
    const from = addDays(base, startIn);
    out.push({ id: `tlv-${id}-x`, teacherId: id, leaveType, from, to: addDays(from, len - 1), days: len, appliedOn: addDays(from, -4), status, reason, decidedBy: status === 'Pending' ? '' : 'Dr. Meera Krishnan', decisionNote });
  }
  return out;
};
export const teacherLeaves = defineCollection<TeacherLeaveRecord>('teacherLeaves', buildTeacherLeaves);

export interface TeacherLoanRecord extends Entity {
  teacherId: string;
  title: string;
  author: string;
  issued: string;
  due: string;
  returned: string;
  status: 'Issued' | 'Returned' | 'Overdue';
}

export const buildTeacherLoans = (): TeacherLoanRecord[] => {
  const out: TeacherLoanRecord[] = [];
  buildTeachers().forEach((t, i) => {
    const r = makeRng(52000 + i);
    for (let k = r.int(1, 3); k > 0; k--) {
      const [title, author] = r.pick(BOOKS);
      const ago = r.int(10, 120);
      const issued = addDays(SEED_TODAY, -ago);
      const due = addDays(issued, 30);
      const returned = ago > 40 || r.chance(0.3) ? addDays(issued, Math.min(ago, r.int(8, 30))) : '';
      out.push({ id: `tln-${t.id}-${k}`, teacherId: t.id, title, author, issued, due, returned, status: returned ? 'Returned' : due < SEED_TODAY ? 'Overdue' : 'Issued' });
    }
  });
  return out;
};
export const teacherLoans = defineCollection<TeacherLoanRecord>('teacherLoans', buildTeacherLoans);
