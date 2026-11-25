/**
 * Timetable primitives and the automatic scheduler.
 *
 * Period times follow the frontend's class timetable (seven 45-minute periods, Monday to Saturday).
 * Break rows are not stored: they are the gaps between consecutive periods.
 */
import { formatTime } from '@/core/utils/date';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;
export type Day = (typeof DAYS)[number];
export const DAY_NAMES: Record<Day, string> = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday' };

export interface TimeSlot {
  period: number;
  start: string;
  end: string;
}

export const TIME_SLOTS: TimeSlot[] = [
  { period: 1, start: '09:00', end: '09:45' },
  { period: 2, start: '09:45', end: '10:30' },
  { period: 3, start: '10:45', end: '11:30' },
  { period: 4, start: '11:30', end: '12:15' },
  { period: 5, start: '13:30', end: '14:15' },
  { period: 6, start: '14:15', end: '15:00' },
  { period: 7, start: '15:15', end: '16:00' },
];

export const PERIODS = TIME_SLOTS.length;
export const slotOf = (period: number): TimeSlot | undefined => TIME_SLOTS.find((s) => s.period === period);
export const slotLabel = (period: number): string => {
  const s = slotOf(period);
  return s ? `${formatTime(s.start)} – ${formatTime(s.end)}` : '—';
};
export const PERIOD_MINUTES = 45;

const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));

export interface BreakRow {
  afterPeriod: number;
  label: string;
  start: string;
  end: string;
}

/** Gaps between periods: 60+ minutes is "Lunch break", anything shorter is "Short break". */
export const BREAKS: BreakRow[] = TIME_SLOTS.slice(0, -1).flatMap((s, i) => {
  const next = TIME_SLOTS[i + 1];
  const gap = toMin(next.start) - toMin(s.end);
  return gap > 0 ? [{ afterPeriod: s.period, label: gap >= 60 ? 'Lunch break' : 'Short break', start: s.end, end: next.start }] : [];
});

/** Rooms other than ordinary 3-digit classrooms (labs, ground, studio, hall) can host one class at a time. */
export const isSharedRoom = (room: string): boolean => !/^\d{3}$/.test(room);

export const busyTeacher = (teacherId: string, day: string, period: number) => `t|${teacherId}|${day}|${period}`;
export const busyRoom = (room: string, day: string, period: number) => `r|${room}|${day}|${period}`;
/** A section's own period that is already taken (for example by an exam), so no teaching can go there. */
export const busySection = (sectionId: string, day: string, period: number) => `s|${sectionId}|${day}|${period}`;

export interface Demand {
  subjectId: string;
  teacherId: string;
  periods: number;
  /** Shared rooms this subject can use (e.g. two computer labs). Omit to use the section's own room. */
  rooms?: string[];
  mode?: 'Teaching' | 'Lab Session';
}

export interface SectionPlan {
  sectionId: string;
  homeRoom: string;
  demands: Demand[];
}

export interface Placed {
  sectionId: string;
  day: Day;
  period: number;
  subjectId: string;
  teacherId: string;
  room: string;
  mode: 'Teaching' | 'Lab Session';
}

export interface ScheduleResult {
  entries: Placed[];
  unplaced: { sectionId: string; subjectId: string; missing: number }[];
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Fill each section's week with its subjects' periods.
 *
 * `busy` holds resources already taken (existing timetable, staff meetings…) as keys from busyTeacher()/busyRoom().
 * A teacher is never double-booked and a shared room is never used by two sections at once. The greedy fill is
 * retried with different (deterministic) seeds and the attempt that places the most periods wins.
 */
export function generateSchedule(opts: {
  plans: SectionPlan[];
  busy: Set<string>;
  days?: readonly Day[];
  attempts?: number;
  /** A subject may appear at most this many times per day in one section. */
  maxPerDay?: number;
}): ScheduleResult {
  const days = opts.days ?? DAYS;
  const maxPerDay = opts.maxPerDay ?? 2;
  const attempts = opts.attempts ?? 400;

  const run = (seed: number): ScheduleResult => {
    const rnd = mulberry32(seed);
    const used = new Set(opts.busy);
    const entries: Placed[] = [];
    const unplaced: ScheduleResult['unplaced'] = [];

    for (const plan of opts.plans) {
      const remaining = new Map(plan.demands.map((d) => [d.subjectId, d.periods]));
      for (const day of days) {
        const today = new Map<string, number>();
        let previous = '';
        for (let period = 1; period <= PERIODS; period++) {
          if (used.has(busySection(plan.sectionId, day, period))) {
            previous = '';
            continue;
          }
          let best: { d: Demand; room: string; score: number } | null = null;
          for (const d of plan.demands) {
            const left = remaining.get(d.subjectId) ?? 0;
            if (left <= 0) continue;
            if ((today.get(d.subjectId) ?? 0) >= maxPerDay) continue;
            if (used.has(busyTeacher(d.teacherId, day, period))) continue;
            let room = plan.homeRoom;
            if (d.rooms?.length) {
              const free = d.rooms.find((r) => !used.has(busyRoom(r, day, period)));
              if (!free) continue;
              room = free;
            }
            const score = left * 10 + (d.subjectId !== previous ? 6 : 0) + rnd() * 4;
            if (!best || score > best.score) best = { d, room, score };
          }
          if (!best) {
            previous = '';
            continue;
          }
          const { d, room } = best;
          entries.push({ sectionId: plan.sectionId, day, period, subjectId: d.subjectId, teacherId: d.teacherId, room, mode: d.mode ?? 'Teaching' });
          used.add(busyTeacher(d.teacherId, day, period));
          if (isSharedRoom(room)) used.add(busyRoom(room, day, period));
          remaining.set(d.subjectId, (remaining.get(d.subjectId) ?? 0) - 1);
          today.set(d.subjectId, (today.get(d.subjectId) ?? 0) + 1);
          previous = d.subjectId;
        }
      }
      remaining.forEach((missing, subjectId) => {
        if (missing > 0) unplaced.push({ sectionId: plan.sectionId, subjectId, missing });
      });
    }
    return { entries, unplaced };
  };

  let best = run(1);
  const missingOf = (r: ScheduleResult) => r.unplaced.reduce((n, u) => n + u.missing, 0);
  for (let seed = 2; seed <= attempts && missingOf(best) > 0; seed++) {
    const candidate = run(seed);
    if (missingOf(candidate) < missingOf(best)) best = candidate;
  }
  return best;
}
