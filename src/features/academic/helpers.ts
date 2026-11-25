/** Derived academic facts (strength, seats, relationships), computed from the collections so they never go stale. */
import { snapshot } from '@/core/store/store';
import type { ClassroomRecord, ClassSubjectRecord, HomeworkRecord, SubjectRecord, SubmissionRecord, TimetableEntryRecord } from '@/data/seed/academic';
import type { ClassRecord, SectionRecord, StudentRecord } from '@/data/seed/master';
import { getClass, getSection, getTeacher } from '@/features/common/refs';
import type { Option } from '@/ui/Fields';
import type { Tone } from '@/ui/tone';

export const opts = (list: readonly string[]): Option[] => list.map((v) => ({ label: v, value: v }));

/** Students who count towards a class's strength (not transferred, graduated or inactive). */
export const inStrength = (s: StudentRecord) => s.status === 'Active' || s.status === 'On Leave';

export const allStudents = () => snapshot<StudentRecord>('students');
export const sectionsOfClass = (classId: string) => snapshot<SectionRecord>('sections').filter((s) => s.classId === classId);
export const studentsInSection = (sectionId: string) => allStudents().filter((s) => s.sectionId === sectionId && inStrength(s));
export const studentsInClass = (classId: string) => allStudents().filter((s) => s.classId === classId && inStrength(s));
export const classCapacity = (classId: string) => sectionsOfClass(classId).reduce((n, s) => n + s.capacity, 0);
export const gender = (rows: StudentRecord[], g: 'Male' | 'Female') => rows.filter((s) => s.gender === g).length;

export const isFull = (s: SectionRecord) => s.status === 'Active' && studentsInSection(s.id).length >= s.capacity;
export const sectionState = (s: SectionRecord): 'Active' | 'Full' | 'Inactive' | 'Archived' => (isFull(s) ? 'Full' : s.status);

export const sectionLabel = (sectionId: string) => {
  const sec = getSection(sectionId);
  const cls = getClass(sec?.classId);
  return sec && cls ? `${cls.name}-${sec.name}` : '—';
};

export const sectionOptions = (): Option[] =>
  snapshot<SectionRecord>('sections').map((s) => ({ label: sectionLabel(s.id), value: s.id, hint: `Teacher: ${getTeacher(s.classTeacherId)?.name ?? '—'}` }));

export const classOptionList = (): Option[] => snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id }));
export const teacherOptionList = (): Option[] => snapshot<{ id: string; name: string; department: string }>('teachers').map((t) => ({ label: t.name, value: t.id, hint: t.department }));

export const subjects = () => snapshot<SubjectRecord>('subjects');
export const subjectOf = (id?: string) => subjects().find((s) => s.id === id);
export const subjectName = (id?: string) => subjectOf(id)?.name ?? '—';
export const mappingsOfClass = (classId: string) => snapshot<ClassSubjectRecord>('classSubjects').filter((m) => m.classId === classId);
export const mappingsOfSubject = (subjectId: string) => snapshot<ClassSubjectRecord>('classSubjects').filter((m) => m.subjectId === subjectId);

export const roomOf = (roomNo: string) => snapshot<ClassroomRecord>('classrooms').find((r) => r.roomNo === roomNo);
export const sectionInRoom = (roomNo: string) => snapshot<SectionRecord>('sections').find((s) => s.roomNo === roomNo);
export const timetableOfSection = (sectionId: string) => snapshot<TimetableEntryRecord>('timetableEntries').filter((e) => e.sectionId === sectionId);

export const seatTone = (used: number, capacity: number): Tone => (capacity > 0 && used >= capacity ? 'danger' : used / Math.max(1, capacity) >= 0.9 ? 'warning' : 'success');

/** Parse pasted CSV rows (no quoted-comma support; the import hints say so). */
export function parseCsvRows(text: string): string[][] {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.split(',').map((c) => c.trim()));
}

/* ---- homework ---- */

export const allHomework = () => snapshot<HomeworkRecord>('homework');
export const submissionsOf = (homeworkId: string) => snapshot<SubmissionRecord>('homeworkSubmissions').filter((s) => s.homeworkId === homeworkId);
export const homeworkOf = (id: string) => allHomework().find((h) => h.id === id);

export interface HomeworkStats {
  total: number;
  submitted: number;
  pending: number;
  late: number;
  graded: number;
  pct: number;
}
export function homeworkStats(hw: HomeworkRecord): HomeworkStats {
  const total = studentsInSection(hw.sectionId).length;
  const subs = submissionsOf(hw.id);
  return {
    total,
    submitted: subs.length,
    pending: Math.max(0, total - subs.length),
    late: subs.filter((s) => s.late).length,
    graded: subs.filter((s) => s.graded).length,
    pct: total ? Math.round((subs.length / total) * 100) : 0,
  };
}
export const netMarks = (s: SubmissionRecord) => Math.max(0, s.marks - s.marksDeducted);
