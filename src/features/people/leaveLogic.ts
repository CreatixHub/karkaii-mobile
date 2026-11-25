import { repo, snapshot } from '@/core/store/store';
import { diffDays } from '@/core/utils/date';
import type { StudentAttendanceRecord } from '@/data/seed/hrm';
import type { StudentLeaveRecord } from '@/data/seed/studentLife';
import { logAudit } from '@/features/common/audit';

/**
 * Approve or reject a student's leave request. Approving also marks the days that already exist in the attendance
 * register as "On Leave" (days with no entry yet pick it up when the register is created). Returns how many register days changed.
 */
export function decideLeave(leave: StudentLeaveRecord, status: 'Approved' | 'Rejected', by: string, note = ''): number {
  repo<StudentLeaveRecord>('studentLeaves').update(leave.id, { status, decidedBy: by, decisionNote: note });
  let marked = 0;
  if (status === 'Approved') {
    const ids = snapshot<StudentAttendanceRecord>('studentAttendance')
      .filter((a) => a.studentId === leave.studentId && a.date >= leave.from && a.date <= leave.to && a.status !== 'Holiday' && a.status !== 'On Leave')
      .map((a) => a.id);
    repo<StudentAttendanceRecord>('studentAttendance').updateMany(ids, () => ({ status: 'On Leave' as const, leaveNote: leave.reason, checkIn: '', checkOut: '', lateMinutes: 0, remark: '' }));
    marked = ids.length;
  }
  logAudit({ entity: 'student', entityId: leave.studentId, action: 'Action', summary: `Leave ${leave.from}${leave.to !== leave.from ? ` to ${leave.to}` : ''} ${status.toLowerCase()}${marked ? ` (${marked} register day${marked > 1 ? 's' : ''} marked)` : ''}`, by });
  return marked;
}

export const leaveDays = (from: string, to: string) => diffDays(from, to) + 1;
