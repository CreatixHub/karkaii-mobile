/**
 * Timetable operations with clash detection. Pure functions over the store (no UI).
 *
 * Rules:
 *  - a class has at most one lesson per (day, period);
 *  - a teacher is never in two places in the same (day, period);
 *  - a room hosts at most one class lesson at a time (meetings and exam invigilation are group events and may share a room).
 */
import { repo, snapshot } from '@/core/store/store';
import { busyRoom, busySection, busyTeacher, DAY_NAMES, generateSchedule, isSharedRoom, slotLabel, type Day, type Demand } from '@/core/schedule/scheduler';
import type { ClassroomRecord, ClassSubjectRecord, EntryMode, SubjectRecord, TimetableEntryRecord } from '@/data/seed/academic';
import type { SectionRecord } from '@/data/seed/master';
import { classSection, getClass, getSection, getTeacher } from '@/features/common/refs';

export const CLASS_MODES: EntryMode[] = ['Teaching', 'Lab Session'];
export const isClassMode = (m: EntryMode) => CLASS_MODES.includes(m);

const entriesRepo = () => repo<TimetableEntryRecord>('timetableEntries');
const all = () => snapshot<TimetableEntryRecord>('timetableEntries');

export interface Candidate {
  sectionId: string;
  day: Day;
  period: number;
  teacherId: string;
  room: string;
  mode: EntryMode;
}

const where = (e: Pick<TimetableEntryRecord, 'day' | 'period'>) => `${DAY_NAMES[e.day]} ${slotLabel(e.period)}`;
const sectionLabel = (sectionId: string) => {
  const s = getSection(sectionId);
  return s ? classSection({ classId: s.classId, sectionId: s.id }) : 'a class';
};

/** The first rule a placement would break, or null when it is fine. `ignore` lets an entry move without clashing with itself. */
export function checkPlacement(c: Candidate, ignore: string[] = []): string | null {
  const others = all().filter((e) => !ignore.includes(e.id) && e.day === c.day && e.period === c.period);

  if (c.sectionId && isClassMode(c.mode)) {
    const taken = others.find((e) => e.sectionId === c.sectionId);
    if (taken) return `${sectionLabel(c.sectionId)} already has ${taken.mode === 'Exam Duty' ? 'an exam' : 'a lesson'} on ${where(c)}.`;
  }
  if (c.teacherId) {
    const busy = others.find((e) => e.teacherId === c.teacherId);
    if (busy) {
      const what = busy.mode === 'Staff Meeting' ? 'in a staff meeting' : busy.mode === 'Exam Duty' ? 'on exam duty' : `teaching ${sectionLabel(busy.sectionId)}`;
      return `${getTeacher(c.teacherId)?.name ?? 'The teacher'} is already ${what} on ${where(c)}.`;
    }
  }
  if (c.room && isClassMode(c.mode)) {
    const used = others.find((e) => e.room === c.room && isClassMode(e.mode));
    if (used) return `Room ${c.room} is already used by ${sectionLabel(used.sectionId)} on ${where(c)}.`;
  }
  return null;
}

export function addEntry(c: Candidate & { subjectId: string; note?: string; effectiveFrom: string; format?: 'Offline' | 'Online' }): TimetableEntryRecord {
  return entriesRepo().create({
    sectionId: c.sectionId,
    day: c.day,
    period: c.period,
    subjectId: c.subjectId,
    teacherId: c.teacherId,
    room: c.room,
    mode: c.mode,
    format: c.format ?? 'Offline',
    note: c.note ?? '',
    effectiveFrom: c.effectiveFrom,
    originalTeacherId: '',
  });
}

export function updateEntry(id: string, c: Candidate & { subjectId: string; note?: string }): string | null {
  const err = checkPlacement(c, [id]);
  if (err) return err;
  entriesRepo().update(id, { sectionId: c.sectionId, day: c.day, period: c.period, subjectId: c.subjectId, teacherId: c.teacherId, room: c.room, mode: c.mode, note: c.note ?? '' });
  return null;
}

/** Another teacher takes this period; the original is remembered so the card can show "Substitute for …". */
export function substituteTeacher(id: string, newTeacherId: string, reason: string): string | null {
  const e = entriesRepo().get(id);
  if (!e) return 'That period no longer exists.';
  if (newTeacherId === e.teacherId) return 'Choose a different teacher.';
  const err = checkPlacement({ sectionId: e.sectionId, day: e.day, period: e.period, teacherId: newTeacherId, room: e.room, mode: e.mode }, [id]);
  if (err) return err;
  entriesRepo().update(id, {
    teacherId: newTeacherId,
    originalTeacherId: e.originalTeacherId || e.teacherId,
    note: reason ? `Substitution: ${reason}` : e.note,
  });
  return null;
}

/** Move a class lesson to another day/period; if a lesson is already there the two trade places. */
export function swapOrMove(id: string, day: Day, period: number): string | null {
  const a = entriesRepo().get(id);
  if (!a) return 'That period no longer exists.';
  if (a.day === day && a.period === period) return 'Pick a different day or period.';
  const b = all().find((e) => e.id !== id && e.sectionId === a.sectionId && e.day === day && e.period === period && isClassMode(e.mode));
  const blocker = all().find((e) => e.id !== id && e.sectionId === a.sectionId && e.day === day && e.period === period && !isClassMode(e.mode));
  if (blocker) return `${sectionLabel(a.sectionId)} has ${blocker.mode === 'Exam Duty' ? 'an exam' : 'another event'} then.`;
  const ignore = b ? [a.id, b.id] : [a.id];
  const e1 = checkPlacement({ sectionId: a.sectionId, day, period, teacherId: a.teacherId, room: a.room, mode: a.mode }, ignore);
  if (e1) return e1;
  if (b) {
    const e2 = checkPlacement({ sectionId: b.sectionId, day: a.day, period: a.period, teacherId: b.teacherId, room: b.room, mode: b.mode }, ignore);
    if (e2) return e2;
    entriesRepo().update(b.id, { day: a.day, period: a.period });
  }
  entriesRepo().update(a.id, { day, period });
  return null;
}

export function assignRoom(id: string, room: string): string | null {
  const e = entriesRepo().get(id);
  if (!e) return 'That period no longer exists.';
  const err = checkPlacement({ sectionId: e.sectionId, day: e.day, period: e.period, teacherId: '', room, mode: e.mode }, [id]);
  if (err) return err;
  entriesRepo().update(id, { room });
  return null;
}

export function removeEntry(id: string) {
  entriesRepo().remove(id);
}

/** Subjects a section's class studies (from the class-subject mapping), excluding archived/draft subjects. */
export function subjectsForSection(sectionId: string): { subject: SubjectRecord; mapping: ClassSubjectRecord }[] {
  const sec = getSection(sectionId);
  if (!sec) return [];
  const subjects = snapshot<SubjectRecord>('subjects');
  return snapshot<ClassSubjectRecord>('classSubjects')
    .filter((m) => m.classId === sec.classId)
    .flatMap((m) => {
      const subject = subjects.find((s) => s.id === m.subjectId);
      return subject && subject.status !== 'Archived' && subject.status !== 'Draft' ? [{ subject, mapping: m }] : [];
    });
}

export interface GenerateResult {
  placed: number;
  unplaced: { subjectId: string; missing: number }[];
}

/**
 * Rebuild one section's timetable from its class-subject mapping. Existing lessons for the section are replaced;
 * everyone else's timetable is left alone and treated as busy, so no teacher or lab is double-booked.
 */
export function generateForSection(sectionId: string, opts: { days: readonly Day[]; effectiveFrom: string; avoidClashes?: boolean }): GenerateResult {
  const section = getSection(sectionId) as SectionRecord | undefined;
  if (!section) return { placed: 0, unplaced: [] };
  const rooms = snapshot<ClassroomRecord>('classrooms');
  const roomsFor = (type: string) => rooms.filter((r) => r.type === type && r.status === 'Available').map((r) => r.roomNo);

  const demands: Demand[] = subjectsForSection(sectionId).map(({ subject, mapping }) => {
    const shared = subject.department === 'Computer Science' ? roomsFor('Computer Lab') : subject.department === 'Physical Education' ? roomsFor('Sports Ground') : subject.department === 'Arts' ? roomsFor('Studio') : [];
    return {
      subjectId: subject.id,
      teacherId: mapping.teacherId || subject.teacherId,
      periods: mapping.periodsPerWeek,
      ...(shared.length ? { rooms: shared } : {}),
      ...(subject.department === 'Computer Science' ? { mode: 'Lab Session' as const } : {}),
    };
  });

  const current = all();
  const removed = current.filter((e) => e.sectionId === sectionId && isClassMode(e.mode));
  const keep = current.filter((e) => !removed.includes(e));
  const busy = new Set<string>();
  for (const e of keep) {
    // With "avoid teacher clashes" off, teachers booked in other classes are not treated as busy.
    if (opts.avoidClashes !== false || e.sectionId === sectionId) busy.add(busyTeacher(e.teacherId, e.day, e.period));
    if (isSharedRoom(e.room) && isClassMode(e.mode)) busy.add(busyRoom(e.room, e.day, e.period));
    if (e.sectionId === sectionId) busy.add(busySection(sectionId, e.day, e.period));
  }

  const result = generateSchedule({ plans: [{ sectionId, homeRoom: section.roomNo, demands }], busy, days: opts.days });
  entriesRepo().removeMany(removed.map((e) => e.id));
  for (const e of result.entries) {
    entriesRepo().create({ sectionId, day: e.day, period: e.period, subjectId: e.subjectId, teacherId: e.teacherId, room: e.room, mode: e.mode, format: 'Offline', note: '', effectiveFrom: opts.effectiveFrom, originalTeacherId: '' });
  }
  return { placed: result.entries.length, unplaced: result.unplaced.map(({ subjectId, missing }) => ({ subjectId, missing })) };
}

/** Weekly teaching minutes / distinct classes for a teacher, for the teacher timetable summary. */
export function teacherLoad(teacherId: string): { teachingPeriods: number; classes: number; freePeriods: number; totalSlots: number } {
  const mine = all().filter((e) => e.teacherId === teacherId);
  const teaching = mine.filter((e) => isClassMode(e.mode));
  const totalSlots = 6 * 7;
  return {
    teachingPeriods: teaching.length,
    classes: new Set(teaching.map((e) => e.sectionId)).size,
    freePeriods: totalSlots - mine.length,
    totalSlots,
  };
}

export const roomLabel = (roomNo: string): string => {
  const r = snapshot<ClassroomRecord>('classrooms').find((x) => x.roomNo === roomNo);
  return r ? (r.type === 'Classroom' ? `Room ${r.roomNo}` : r.name) : roomNo ? `Room ${roomNo}` : '—';
};

export const sectionName = (sectionId: string) => {
  const s = getSection(sectionId);
  const c = getClass(s?.classId);
  return s && c ? `${c.name}-${s.name}` : '—';
};
