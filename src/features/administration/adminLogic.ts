/** Administration rules: event registration, campus usage and academic-year integrity. */
import { snapshot } from '@/core/store/store';
import { diffDays, todayISO } from '@/core/utils/date';
import type { RoleKey } from '@/core/auth/access';
import type { MockUser } from '@/core/auth/mockUsers';
import type { AcademicYearRecord, EventAudience, EventRecord } from '@/data/seed/administration';
import type { StaffRecord, TeacherRecord } from '@/data/seed/master';
import type { UserRecord } from '@/data/seed/peopleAdmin';

/* ------------------------------------------ events ------------------------------------------ */

export type EventState = 'Cancelled' | 'Completed' | 'Ongoing' | 'Invite Only' | 'Registration Closed' | 'Full' | 'Closing Soon' | 'Open';
export const CLOSING_SOON_DAYS = 3;

/** Local date-time of a day at 'HH:mm'. */
const at = (date: string, hhmm: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, Number(hhmm.slice(0, 2)), Number(hhmm.slice(3, 5)));
};

export const spotsLeft = (e: Pick<EventRecord, 'capacity' | 'registrations'>): number | null => (e.capacity > 0 ? Math.max(0, e.capacity - e.registrations.length) : null);

export function eventState(e: EventRecord, now: Date = new Date()): EventState {
  const today = todayISO();
  if (e.cancelled) return 'Cancelled';
  if (now > at(e.date, e.endTime)) return 'Completed';
  if (now >= at(e.date, e.startTime)) return 'Ongoing';
  if (e.inviteOnly) return 'Invite Only';
  if (e.deadline < today) return 'Registration Closed';
  if (e.capacity > 0 && e.registrations.length >= e.capacity) return 'Full';
  if (diffDays(today, e.deadline) <= CLOSING_SOON_DAYS) return 'Closing Soon';
  return 'Open';
}

/** Which audiences a signed-in role belongs to. The principal belongs to all of them. */
export function audiencesOf(role: RoleKey | null | undefined): EventAudience[] {
  if (role === 'admin') return ['All', 'Students', 'Parents', 'Teachers', 'Staff'];
  if (role === 'student') return ['All', 'Students'];
  if (role === 'parent') return ['All', 'Parents'];
  if (role === 'teacher') return ['All', 'Teachers'];
  return role ? ['All', 'Staff'] : ['All'];
}

/** Events a person may see: everyone sees "All" events, the rest only if they are in that audience. */
export const eventVisible = (e: Pick<EventRecord, 'audience'>, user: MockUser | null) => audiencesOf(user?.role).includes(e.audience);

export const isRegistered = (e: Pick<EventRecord, 'registrations'>, user: MockUser | null | undefined) => !!user && e.registrations.some((r) => r.key === user.id);

const roleName = (role: RoleKey | null | undefined) => (role === 'student' ? 'Student' : role === 'parent' ? 'Parent' : role === 'teacher' ? 'Teacher' : role ? 'Staff' : 'Guest');
export const registrantRole = roleName;

/** Why this user cannot register themselves for the event (empty = they can). */
export function registerBlockers(e: EventRecord, user: MockUser | null | undefined, now: Date = new Date()): string[] {
  if (!user) return ['Sign in to register.'];
  if (isRegistered(e, user)) return ['You are already registered.'];
  switch (eventState(e, now)) {
    case 'Cancelled': return ['This event was cancelled.'];
    case 'Completed': return ['This event has finished.'];
    case 'Ongoing': return ['This event has already started.'];
    case 'Invite Only': return ['This event is by invitation. The school office adds attendees.'];
    case 'Registration Closed': return ['Registration closed on the deadline.'];
    case 'Full': return ['No seats are left.'];
    default: break;
  }
  if (!audiencesOf(user.role).includes(e.audience)) return [`This event is for ${e.audience.toLowerCase()}.`];
  return [];
}

/** Another live event using the same venue at an overlapping time. */
export function venueConflict(draft: Pick<EventRecord, 'id' | 'venue' | 'date' | 'startTime' | 'endTime'>, rows: EventRecord[] = snapshot<EventRecord>('events')): EventRecord | undefined {
  return rows.find((o) => o.id !== draft.id && !o.cancelled && o.venue === draft.venue && o.date === draft.date && o.startTime < draft.endTime && draft.startTime < o.endTime);
}

/* ----------------------------------------- campuses ----------------------------------------- */

export interface CampusUsage {
  teachers: number;
  staff: number;
  users: number;
  total: number;
}

export function campusUsage(name: string): CampusUsage {
  const teachers = snapshot<TeacherRecord>('teachers').filter((t) => t.campus === name).length;
  const staff = snapshot<StaffRecord>('staff').filter((s) => s.campus === name).length;
  const users = snapshot<UserRecord>('users').filter((u) => u.branch === name).length;
  return { teachers, staff, users, total: teachers + staff };
}

/* -------------------------------------- academic years -------------------------------------- */

export type YearState = 'Current' | 'Upcoming' | 'Completed';
export const yearState = (y: Pick<AcademicYearRecord, 'current' | 'endDate'>, today = todayISO()): YearState => (y.current ? 'Current' : y.endDate < today ? 'Completed' : 'Upcoming');

/** "2026-27" for a year running from 2026 to 2027. */
export const yearNameFor = (start: string, end: string) => `${start.slice(0, 4)}-${end.slice(2, 4)}`;

/** Collections that stamp records with an academic year (a year in use cannot be deleted). */
const YEAR_COLLECTIONS = ['feeTypes', 'feeGroups', 'feeStructures', 'feeInvoices', 'scholarships', 'holidays', 'routeSchedules', 'studentTransport', 'admissions', 'promotions'];
export function yearUsage(name: string): number {
  return YEAR_COLLECTIONS.reduce((n, c) => n + snapshot<{ id: string; academicYear?: string }>(c).filter((r) => r.academicYear === name).length, 0);
}

/** Problems with a year's dates and name, given the other years. */
export function yearProblems(v: { name: string; startDate: string; endDate: string }, rows: AcademicYearRecord[], exceptId?: string): Record<string, string> {
  const out: Record<string, string> = {};
  const others = rows.filter((r) => r.id !== exceptId);
  if (v.endDate <= v.startDate) out.endDate = 'The year must end after it starts';
  else {
    const days = diffDays(v.startDate, v.endDate) + 1;
    if (days < 150) out.endDate = 'An academic year is at least about five months long';
    else if (days > 400) out.endDate = 'An academic year is at most about thirteen months long';
  }
  if (!out.endDate && v.name !== yearNameFor(v.startDate, v.endDate)) out.name = `The name should be ${yearNameFor(v.startDate, v.endDate)} for these dates`;
  if (others.some((o) => o.name.toLowerCase() === v.name.trim().toLowerCase())) out.name = 'This academic year already exists';
  const clash = others.find((o) => v.startDate <= o.endDate && o.startDate <= v.endDate);
  if (clash && !out.startDate) out.startDate = `These dates overlap ${clash.name}`;
  return out;
}
