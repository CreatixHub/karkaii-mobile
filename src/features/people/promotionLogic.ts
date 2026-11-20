/** Rules for moving students up a class (or out of the school), shared by the roster action and the Student Promotion wizard. */
import { repo, snapshot } from '@/core/store/store';
import { todayISO } from '@/core/utils/date';
import type { AlumniRecord, PromotionRecord } from '@/data/seed/admissionsAlumni';
import type { ClassRecord, SectionRecord, StudentRecord } from '@/data/seed/master';
import { logAudit } from '@/features/common/audit';
import { attendancePct } from '@/features/hrm/configs';
import type { Tone } from '@/ui/tone';
import { academicPercent, feeSummary } from './studentData';

export const AT_RISK_ATTENDANCE = 75;
export const ACADEMIC_RISK_BELOW = 40;

export type RecKind = 'eligible' | 'graduate' | 'fee' | 'risk' | 'lowatt' | 'graduated' | 'transfer';

export interface Recommendation {
  kind: RecKind;
  label: string;
  tone: Tone;
  /** True when the student should move up (or graduate) without further review. */
  clear: boolean;
}

export const classNoOf = (classId: string) => Number(classId.slice(4));
export const classIdOf = (n: number) => `cls-${String(n).padStart(2, '0')}`;
export const inStrength = (s: Pick<StudentRecord, 'status'>) => s.status === 'Active' || s.status === 'On Leave';
export const classesAll = () => snapshot<ClassRecord>('classes');
/** 'Grade X' for a class id (the school writes grades in Roman numerals). */
export const classNameOf = (classId: string) => classesAll().find((c) => c.id === classId)?.name ?? `Grade ${classNoOf(classId)}`;
export const sectionsOfClass = (classId: string) => snapshot<SectionRecord>('sections').filter((s) => s.classId === classId && s.status === 'Active');
export const nextClassId = (classId: string): string => {
  const id = classIdOf(classNoOf(classId) + 1);
  return classesAll().some((c) => c.id === id) ? id : '';
};
export const isFinalClass = (classId: string) => !nextClassId(classId);

/** Rule-based recommendation (the source's "AI" panel): attendance, marks and fees decide it. */
export function recommendationOf(s: StudentRecord): Recommendation {
  if (s.status === 'Transfer') return { kind: 'transfer', label: 'Transferred', tone: 'neutral', clear: false };
  if (s.status === 'Graduated') return { kind: 'graduated', label: 'Graduated', tone: 'purple', clear: false };
  if (attendancePct(s.id) < AT_RISK_ATTENDANCE) return { kind: 'lowatt', label: 'Low attendance', tone: 'warning', clear: false };
  if (academicPercent(s.id) < ACADEMIC_RISK_BELOW) return { kind: 'risk', label: 'Academic risk', tone: 'danger', clear: false };
  if (feeSummary(s.id).balance > 0) return { kind: 'fee', label: 'Fee pending', tone: 'info', clear: false };
  return isFinalClass(s.classId) ? { kind: 'graduate', label: 'Graduate', tone: 'purple', clear: true } : { kind: 'eligible', label: 'Promote', tone: 'success', clear: true };
}

/* ------------------------------------- Seats ------------------------------------- */

export const strengthOf = (sectionId: string, leaving: ReadonlySet<string> = new Set()) => snapshot<StudentRecord>('students').filter((s) => s.sectionId === sectionId && inStrength(s) && !leaving.has(s.id)).length;
export const freeSeats = (section: SectionRecord, leaving: ReadonlySet<string> = new Set()) => Math.max(0, section.capacity - strengthOf(section.id, leaving));

export interface SectionPlan {
  assignments: Record<string, string>;
  /** Students who could not be given a seat. */
  short: string[];
}

/** Gives each student a section of `classId`: the chosen one, or (auto) whichever active section has the most seats free. */
export function planSections(classId: string, studentIds: string[], preferred: string | 'auto', leaving: ReadonlySet<string> = new Set()): SectionPlan {
  const candidates = sectionsOfClass(classId).filter((s) => preferred === 'auto' || s.id === preferred);
  const left = new Map(candidates.map((s) => [s.id, freeSeats(s, leaving)] as const));
  const assignments: Record<string, string> = {};
  const short: string[] = [];
  for (const id of studentIds) {
    let best: SectionRecord | undefined;
    for (const sec of candidates) if ((left.get(sec.id) ?? 0) > 0 && (!best || (left.get(sec.id) ?? 0) > (left.get(best.id) ?? 0))) best = sec;
    if (!best) {
      short.push(id);
      continue;
    }
    assignments[id] = best.id;
    left.set(best.id, (left.get(best.id) ?? 0) - 1);
  }
  return { assignments, short };
}

/* ----------------------------------- Applying a plan ----------------------------------- */

export type PromotionAction = 'promote' | 'retain' | 'graduate';

export interface PromotionItem {
  studentId: string;
  action: PromotionAction;
  /** Section the student moves to (promote only). */
  sectionId?: string;
}

export interface PromotionSummary {
  promoted: number;
  retained: number;
  graduated: number;
  batchNos: string[];
}

const nextBatchNo = (year: string) => {
  const used = snapshot<PromotionRecord>('promotions').map((p) => Number(/(\d+)$/.exec(p.batchNo)?.[1] ?? 0));
  return `PB-${year.slice(0, 4)}-${String((used.length ? Math.max(...used) : 0) + 1).padStart(3, '0')}`;
};

const STREAMS = ['Computer Science', 'Commerce', 'Biology', 'Mathematics', 'Arts & Humanities'];

/** Moves students, records the batches in promotion history and turns graduates into alumni. */
export function applyPromotion(items: PromotionItem[], meta: { fromClassId: string; toClassId: string; academicYear: string; approvedBy: string; note?: string }): PromotionSummary {
  const students = repo<StudentRecord>('students');
  const byAction = (a: PromotionAction) => items.filter((i) => i.action === a);
  const batchNos: string[] = [];
  const date = todayISO();
  const record = (kind: PromotionRecord['kind'], rows: PromotionItem[], toClassId: string) => {
    if (!rows.length) return;
    const batchNo = nextBatchNo(meta.academicYear);
    repo<PromotionRecord>('promotions').create({ batchNo, academicYear: meta.academicYear, kind, fromClassId: meta.fromClassId, toClassId, count: rows.length, studentIds: rows.map((r) => r.studentId), approvedBy: meta.approvedBy, date, note: meta.note ?? '' });
    batchNos.push(batchNo);
  };

  const promoted = byAction('promote');
  for (const it of promoted) {
    const before = students.get(it.studentId);
    if (!before) continue;
    students.update(it.studentId, { classId: meta.toClassId, sectionId: it.sectionId ?? before.sectionId, status: 'Active' });
    logAudit({ entity: 'student', entityId: it.studentId, action: 'Action', summary: `${before.name}: promoted to ${classNameOf(meta.toClassId)}`, by: meta.approvedBy });
  }
  record('Promoted', promoted, meta.toClassId);

  const graduates = byAction('graduate');
  const year = Number(meta.academicYear.slice(0, 4)) + 1;
  for (const it of graduates) {
    const before = students.get(it.studentId);
    if (!before) continue;
    students.update(it.studentId, { status: 'Graduated' });
    const n = Number(before.id.replace(/\D/g, '')) || 0;
    repo<AlumniRecord>('alumni').create({
      name: before.name,
      batchYear: year,
      department: STREAMS[n % STREAMS.length],
      profession: 'Higher studies',
      industry: 'Education',
      company: '',
      role: 'Student',
      country: 'India',
      city: 'Chennai',
      chapterId: 'chp-01',
      email: before.email.replace('@student.', '@alumni.'),
      phone: before.phone,
      memberSince: date,
      status: 'Pending Verification',
      bio: `Graduated from Grade X in ${year}.`,
      skills: [],
      mentor: false,
      recruit: false,
      speak: false,
      connections: 0,
      achievements: [],
      notes: [],
      studentId: before.id,
    });
    logAudit({ entity: 'student', entityId: it.studentId, action: 'Action', summary: `${before.name}: graduated (Batch of ${year})`, by: meta.approvedBy });
  }
  record('Graduated', graduates, '');

  const retained = byAction('retain');
  for (const it of retained) {
    const before = students.get(it.studentId);
    if (before) logAudit({ entity: 'student', entityId: it.studentId, action: 'Action', summary: `${before.name}: retained in ${classNameOf(meta.fromClassId)}`, by: meta.approvedBy });
  }
  record('Detained', retained, meta.fromClassId);

  return { promoted: promoted.length, retained: retained.length, graduated: graduates.length, batchNos };
}

export const sessionAfter = (year: string): string => {
  const start = Number(year.slice(0, 4)) + 1;
  return `${start}-${String(start + 1).slice(2)}`;
};


/* --------------------------------- Wizard decisions --------------------------------- */

export type Decision = 'promote' | 'retain' | 'skip';

/** What the wizard pre-selects: students with a clear record move up, weak ones are retained, fee cases wait for a human. */
export function defaultDecision(s: StudentRecord): Decision {
  const r = recommendationOf(s);
  return r.clear ? 'promote' : r.kind === 'lowatt' || r.kind === 'risk' ? 'retain' : 'skip';
}

export interface PlanCheck {
  promote: string[];
  retain: string[];
  skip: string[];
  /** Section for each student who moves; empty when the class is the final one (they graduate). */
  assignments: Record<string, string>;
  /** Students who would have no seat. */
  short: string[];
  graduating: boolean;
}

/** Turns the wizard's decisions into a concrete plan and checks the target class has the seats. */
export function checkPlan(fromClassId: string, decisions: Record<string, Decision>, toSection: string | 'auto'): PlanCheck {
  const ids = Object.keys(decisions);
  const pick = (d: Decision) => ids.filter((id) => decisions[id] === d);
  const promote = pick('promote');
  const graduating = isFinalClass(fromClassId);
  const toClassId = nextClassId(fromClassId);
  const plan = graduating ? { assignments: {}, short: [] } : planSections(toClassId, promote, toSection);
  return { promote, retain: pick('retain'), skip: pick('skip'), assignments: plan.assignments, short: plan.short, graduating };
}

/** Items for applyPromotion from a checked plan. */
export function itemsOf(check: PlanCheck): PromotionItem[] {
  return [
    ...check.promote.map((studentId) => ({ studentId, action: check.graduating ? ('graduate' as const) : ('promote' as const), sectionId: check.assignments[studentId] })),
    ...check.retain.map((studentId) => ({ studentId, action: 'retain' as const })),
  ];
}
