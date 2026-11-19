/** HRM seed data: holidays, student/teacher/staff attendance registers, staff leave requests. */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays, parseISO } from '@/core/utils/date';
import { buildStaff, buildStudents, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

/* ---------------------------------- Holidays ---------------------------------- */

export type HolidayCategory = 'Public' | 'School' | 'Festival' | 'Examination' | 'Optional';

export interface HolidayRecord extends Entity {
  code: string;
  name: string;
  category: HolidayCategory;
  start: string;
  end: string;
  classes: string;
  branch: string;
  academicYear: string;
  description: string;
  createdBy: string;
  createdOn: string;
}

/** name, category, start, end, classes, branch, description (the frontend's holiday calendar). */
const HOLIDAY_ROWS: [string, HolidayCategory, string, string, string, string, string][] = [
  ["New Year's Day", 'Public', '2026-01-01', '2026-01-01', 'All Classes', 'All Branches', 'Public holiday marking the new year.'],
  ['Republic Day', 'Public', '2026-01-26', '2026-01-26', 'All Classes', 'All Branches', 'National holiday with a flag-hoisting ceremony at the main campus.'],
  ['Holi', 'Festival', '2026-03-03', '2026-03-03', 'All Classes', 'All Branches', 'Festival of colours.'],
  ['Good Friday', 'Public', '2026-04-03', '2026-04-03', 'All Classes', 'All Branches', 'Public holiday.'],
  ['Summer Break', 'School', '2026-05-01', '2026-06-15', 'All Classes', 'All Branches', 'Annual summer vacation for all classes.'],
  ["Teachers' Training", 'School', '2026-08-03', '2026-08-03', 'All Classes', 'Main Campus', 'Staff development day — no classes for students.'],
  ['Raksha Bandhan', 'Festival', '2026-08-09', '2026-08-09', 'All Classes', 'All Branches', 'Festival celebrating the bond between siblings.'],
  ['Independence Day', 'Public', '2026-08-15', '2026-08-15', 'All Classes', 'All Branches', 'National holiday with a flag-hoisting ceremony.'],
  ['Janmashtami', 'Festival', '2026-08-19', '2026-08-19', 'All Classes', 'All Branches', 'Festival holiday.'],
  ['Half-Yearly Exam Break', 'Examination', '2026-08-24', '2026-08-26', 'Grade VI - Grade X', 'All Branches', 'Study break between half-yearly exam papers.'],
  ['Onam', 'Optional', '2026-08-28', '2026-08-28', 'All Classes', 'South Wing', 'Optional holiday for the South Wing.'],
  ['Gandhi Jayanti', 'Public', '2026-10-02', '2026-10-02', 'All Classes', 'All Branches', 'National holiday.'],
  ['Diwali Break', 'Festival', '2026-11-07', '2026-11-11', 'All Classes', 'All Branches', 'Festival of lights break.'],
  ['Christmas', 'Public', '2026-12-25', '2026-12-25', 'All Classes', 'All Branches', 'Public holiday.'],
  ['Winter Vacation', 'School', '2026-12-28', '2027-01-03', 'All Classes', 'All Branches', 'Year-end winter vacation.'],
];

export const holidays = defineCollection<HolidayRecord>('holidays', () =>
  HOLIDAY_ROWS.map(([name, category, start, end, classes, branch, description], i) => ({
    id: `hol-${pad(i + 1, 2)}`,
    code: `HOL-${pad(i + 1, 2)}`,
    name,
    category,
    start,
    end,
    classes,
    branch,
    academicYear: '2026-27',
    description,
    createdBy: 'HR Office',
    createdOn: addDays(start, -365),
  })),
);

const isHoliday = (iso: string) => HOLIDAY_ROWS.some(([, , s, e]) => iso >= s && iso <= e);

/** The most recent `n` school days up to the seed "today" (no weekends, no holidays), oldest first. */
export function schoolDays(n: number): string[] {
  const out: string[] = [];
  let d = SEED_TODAY;
  while (out.length < n) {
    const dow = parseISO(d)!.getDay();
    if (dow !== 0 && dow !== 6 && !isHoliday(d)) out.push(d);
    d = addDays(d, -1);
  }
  return out.reverse();
}

const hhmm = (mins: number) => `${pad(Math.floor(mins / 60), 2)}:${pad(mins % 60, 2)}`;

/* ------------------------------- Student attendance ------------------------------- */

export type StudentAttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Half Day' | 'On Leave' | 'Holiday' | 'Excused' | 'Not Marked';

export interface StudentAttendanceRecord extends Entity {
  studentId: string;
  date: string;
  session: 'Morning' | 'Afternoon';
  status: StudentAttendanceStatus;
  checkIn: string;
  checkInNote: string;
  checkOut: string;
  lateMinutes: number;
  leaveNote: string;
  remark: string;
}

/** School starts at 08:45; a check-in after that is "Late". */
export const SCHOOL_START = 8 * 60 + 45;
/** Students at or below this attendance % are "At Risk" (the frontend's "Below 75%" band). */
export const AT_RISK_BELOW = 75;
const AT_RISK_IDS = new Set(['stu-005', 'stu-012', 'stu-027']);
const NOT_MARKED_TODAY = new Set(['stu-036', 'stu-037', 'stu-038']);
const LEAVE_NOTES = ['Medical – viral fever', 'Family function', 'Emergency at home', 'Dental appointment'];

export const studentAttendance = defineCollection<StudentAttendanceRecord>('studentAttendance', () => {
  const rng = makeRng(555);
  const days = schoolDays(10);
  const out: StudentAttendanceRecord[] = [];
  for (const st of buildStudents()) {
    days.forEach((date, di) => {
      const today = date === SEED_TODAY;
      const risk = AT_RISK_IDS.has(st.id);
      const roll = rng.next();
      let status: StudentAttendanceStatus;
      if (today && NOT_MARKED_TODAY.has(st.id)) status = 'Not Marked';
      else if (st.status === 'On Leave') status = 'On Leave';
      // At-risk students follow a fixed pattern (5 absent, 1 late, 4 present of 10 = 50%) so the demo is deterministic.
      else if (risk) status = di % 2 === 0 ? 'Absent' : di === 3 ? 'Late' : 'Present';
      else if (roll < 0.03) status = 'Absent';
      else if (roll < 0.07) status = 'Late';
      else if (roll < 0.09) status = 'Half Day';
      else if (roll < 0.1) status = 'On Leave';
      else status = 'Present';

      let checkIn = '';
      let checkOut = '';
      let lateMinutes = 0;
      let remark = '';
      let leaveNote = '';
      const attended = status === 'Present' || status === 'Late' || status === 'Half Day';
      if (status === 'Present') checkIn = hhmm(rng.int(8 * 60 + 12, SCHOOL_START - 1));
      if (status === 'Late') {
        const at = rng.int(SCHOOL_START + 1, SCHOOL_START + 50);
        checkIn = hhmm(at);
        lateMinutes = at - SCHOOL_START;
        if (rng.chance(0.4)) remark = 'Bus delayed';
      }
      if (status === 'Half Day') {
        checkIn = hhmm(rng.int(8 * 60 + 20, 8 * 60 + 44));
        checkOut = '12:15';
        remark = 'Left early – parent pick-up';
      }
      if (attended && !today && status !== 'Half Day') checkOut = '15:30';
      if (status === 'Absent' && rng.chance(0.5)) remark = 'Guardian informed';
      if (status === 'On Leave') leaveNote = rng.pick(LEAVE_NOTES);
      out.push({
        id: `sa-${st.id}-${date}`,
        studentId: st.id,
        date,
        session: 'Morning',
        status,
        checkIn,
        checkInNote: attended ? (st.transport ? `Bus ${rng.int(1, 6)}` : 'Gate 1') : '',
        checkOut,
        lateMinutes,
        leaveNote,
        remark,
      });
    });
  }
  return out;
});

/* --------------------------- Teacher & staff attendance --------------------------- */

export type DutyStatus = 'Present' | 'Absent' | 'Late' | 'On Leave' | 'Half Day' | 'Pending';
export type DutyMethod = 'Biometric' | 'RFID' | 'Manual';

interface DutyBase extends Entity {
  date: string;
  status: DutyStatus;
  checkIn: string;
  checkOut: string;
  breakMin: number;
  overtimeMin: number;
  method: DutyMethod;
  device: string;
  recordedBy: string;
  lastUpdated: string;
  notes: string;
  corrections: number;
  campus: string;
}

export interface TeacherAttendanceRecord extends DutyBase {
  teacherId: string;
}
export interface StaffAttendanceRecord extends DutyBase {
  staffId: string;
}

export const DEVICES: Record<DutyMethod, string> = { Biometric: 'Staff Room Bio-02', RFID: 'Main Gate RFID-01', Manual: 'Manual Entry' };

function dutyRows<T extends DutyBase>(
  people: { id: string; campus: string; status: string }[],
  idKey: 'teacherId' | 'staffId',
  idPrefix: string,
  seed: number,
  startMin: number,
  pendingToday: string[],
): T[] {
  const rng = makeRng(seed);
  const days = schoolDays(10);
  const out: T[] = [];
  for (const p of people) {
    days.forEach((date, di) => {
      const today = date === SEED_TODAY;
      const roll = rng.next();
      const onLeaveBlock = p.status === 'On Leave' && di >= days.length - 4;
      let status: DutyStatus = 'Present';
      if (today && pendingToday.includes(p.id)) status = 'Pending';
      else if (onLeaveBlock) status = 'On Leave';
      else if (roll < 0.02) status = 'Absent';
      else if (roll < 0.1) status = 'Late';
      else if (roll < 0.12) status = 'On Leave';
      else if (roll < 0.14) status = 'Half Day';

      const method: DutyMethod = status === 'Pending' ? 'Manual' : roll > 0.9 ? 'Manual' : roll > 0.7 ? 'RFID' : 'Biometric';
      let checkIn = '';
      let checkOut = '';
      let overtimeMin = 0;
      const attended = status === 'Present' || status === 'Late' || status === 'Half Day' || status === 'Pending';
      if (attended) {
        checkIn = hhmm(status === 'Late' ? startMin + rng.int(8, 40) : startMin - rng.int(0, 12));
        if (status === 'Half Day') checkOut = '12:30';
        else if (!today) {
          overtimeMin = rng.chance(0.2) ? rng.int(30, 90) : 0;
          checkOut = hhmm(15 * 60 + 20 + rng.int(0, 55) + overtimeMin);
        }
      }
      out.push({
        id: `${idPrefix}-${p.id}-${date}`,
        [idKey]: p.id,
        date,
        status,
        checkIn,
        checkOut,
        breakMin: attended ? 45 : 0,
        overtimeMin,
        method,
        device: DEVICES[method],
        recordedBy: method === 'Manual' ? 'Admin Office' : 'System',
        lastUpdated: checkOut || checkIn || '',
        notes: status === 'Pending' ? 'Manual entry awaiting approval.' : status === 'On Leave' ? 'Approved leave.' : 'Attendance recorded normally.',
        corrections: 0,
        campus: p.campus,
      } as unknown as T);
    });
  }
  return out;
}

export const teacherAttendance = defineCollection<TeacherAttendanceRecord>('teacherAttendance', () =>
  dutyRows<TeacherAttendanceRecord>(buildTeachers(), 'teacherId', 'ta', 811, 8 * 60, ['tch-004', 'tch-009']),
);

export const staffAttendance = defineCollection<StaffAttendanceRecord>('staffAttendance', () =>
  dutyRows<StaffAttendanceRecord>(buildStaff(), 'staffId', 'sta', 913, 8 * 60 + 30, ['stf-005']),
);

/* ---------------------------------- Leave requests ---------------------------------- */

export type LeaveStatus = 'Approved' | 'Pending' | 'Forwarded' | 'Rejected' | 'Cancelled';

export interface LeaveRecord extends Entity {
  code: string;
  staffId: string;
  leaveType: 'Casual Leave' | 'Sick Leave' | 'Earned Leave' | 'Maternity Leave';
  days: number;
  from: string;
  to: string;
  applied: string;
  approver: string;
  status: LeaveStatus;
  hasAttachment: boolean;
  reason: string;
  decisionNote: string;
}

/** staffId, type, days, from-offset, applied-offset, approver, status, attachment, reason (offsets relative to today). */
const LEAVE_ROWS: [string, LeaveRecord['leaveType'], number, number, number, string, LeaveStatus, boolean, string][] = [
  ['stf-016', 'Casual Leave', 2, -6, -10, 'Principal Office', 'Approved', true, 'Personal work at home.'],
  ['stf-002', 'Sick Leave', 3, 2, -1, 'Finance Head', 'Pending', true, 'Viral fever, advised rest.'],
  ['stf-007', 'Earned Leave', 5, 20, -8, 'Academic Head', 'Approved', false, 'Annual family holiday.'],
  ['stf-009', 'Casual Leave', 1, 1, -2, 'Operations Head', 'Forwarded', false, 'Attending a family function.'],
  ['stf-005', 'Maternity Leave', 90, 30, -14, 'HR Head', 'Approved', true, 'Statutory maternity leave.'],
  ['stf-010', 'Sick Leave', 2, -4, -4, 'IT Head', 'Pending', true, 'Migraine, unable to attend.'],
  ['stf-011', 'Casual Leave', 2, -15, -18, 'Operations Head', 'Rejected', false, 'Short notice, cover unavailable.'],
  ['stf-003', 'Earned Leave', 5, 40, -9, 'Finance Head', 'Approved', false, 'Planned personal travel.'],
  ['stf-015', 'Sick Leave', 1, 0, 0, 'Admin Officer', 'Pending', true, 'Unwell, same-day intimation.'],
  ['stf-014', 'Casual Leave', 2, -22, -25, 'Operations Head', 'Cancelled', false, 'Withdrawn by the employee.'],
  ['stf-017', 'Casual Leave', 1, 5, -1, 'Principal Office', 'Pending', false, 'Visiting parents for a function.'],
  ['stf-012', 'Sick Leave', 2, -9, -9, 'Principal Office', 'Approved', true, 'Seasonal flu.'],
];

export const leaves = defineCollection<LeaveRecord>('leaves', () =>
  LEAVE_ROWS.map(([staffId, leaveType, days, fromOffset, appliedOffset, approver, status, hasAttachment, reason], i) => {
    const from = addDays(SEED_TODAY, fromOffset);
    return {
      id: `lv-${pad(i + 1)}`,
      code: `LV-${2001 + i}`,
      staffId,
      leaveType,
      days,
      from,
      to: addDays(from, Math.max(0, days - 1)),
      applied: addDays(SEED_TODAY, appliedOffset),
      approver,
      status,
      hasAttachment,
      reason,
      decisionNote: status === 'Rejected' ? reason : '',
    };
  }),
);
