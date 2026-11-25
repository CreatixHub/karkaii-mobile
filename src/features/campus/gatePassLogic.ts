/** Gate pass rules: a pass's status comes from its approval, its validity window and the clock. */
import { snapshot } from '@/core/store/store';
import { toISO } from '@/core/utils/date';
import type { StudentRecord } from '@/data/seed/master';
import type { GatePassRecord } from '@/data/seed/gatePass';

export type PassState = 'Active' | 'Returned' | 'Expired' | 'Scheduled' | 'Pending Approval' | 'Revoked';

/** Local date-time of a pass's day at 'HH:mm'. */
export function stamp(date: string, hhmm: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3, 5)));
}

export function passState(p: GatePassRecord, now: Date = new Date()): PassState {
  if (p.approval === 'Revoked') return 'Revoked';
  if (p.approval === 'Pending') return 'Pending Approval';
  if (p.returnedAt) return 'Returned';
  if (now < stamp(p.date, p.validFrom)) return 'Scheduled';
  if (now > stamp(p.date, p.validUntil)) return 'Expired';
  return 'Active';
}

/** Minutes until an active pass expires (negative once expired). */
export const minutesLeft = (p: GatePassRecord, now: Date = new Date()) => Math.round((stamp(p.date, p.validUntil).getTime() - now.getTime()) / 60000);

export const nowHHmm = (now: Date = new Date()) => `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
export const todayOf = (now: Date = new Date()) => toISO(now);

export const studentOfPass = (p: GatePassRecord) => snapshot<StudentRecord>('students').find((s) => s.id === p.studentId);

/** Why this pass cannot be approved yet (empty list = it can). */
export function approvalBlockers(p: GatePassRecord): string[] {
  const out: string[] = [];
  if (p.idState === 'Failed') out.push('The ID check failed.');
  else if (p.idState !== 'Verified') out.push('Verify the ID first.');
  if (p.passType === 'Student Exit Pass') {
    const s = studentOfPass(p);
    if (!s) out.push('The student record was not found.');
    else if (s.status !== 'Active' && s.status !== 'On Leave') out.push(`${s.name} is ${s.status.toLowerCase()}.`);
    if (!p.host.trim()) out.push('A student exit needs the guardian who authorised it.');
  }
  if (p.passType === 'Vehicle Pass' && !p.vehicleReg.trim()) out.push('Enter the vehicle registration.');
  return out;
}

/** Another live pass for the same student overlapping this one's window. */
export function overlappingExit(p: Pick<GatePassRecord, 'id' | 'studentId' | 'date' | 'validFrom' | 'validUntil'>): GatePassRecord | undefined {
  if (!p.studentId) return undefined;
  return snapshot<GatePassRecord>('gatePasses').find((o) => o.id !== p.id && o.studentId === p.studentId && o.date === p.date && o.approval !== 'Revoked' && !o.returnedAt && o.validFrom < p.validUntil && p.validFrom < o.validUntil);
}
