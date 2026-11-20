/** People & Admission seed data, part 2: everything that hangs off a student (exams, health, library, awards, conduct, messages, notes, documents, leave). */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildClassSubjects } from './academic';
import { buildStudentAttendance, schoolDays } from './hrm';
import { buildSections, buildStudents, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const classNoOf = (classId: string) => Number(classId.slice(4));
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* ------------------------------------ Exams ------------------------------------ */

export const EXAMS = [
  { id: 'ut1', name: 'Unit Test 1', daysAgo: 140, max: 50 },
  { id: 'mid', name: 'Mid Term', daysAgo: 105, max: 100 },
  { id: 'ut2', name: 'Unit Test 2', daysAgo: 70, max: 50 },
  { id: 'term1', name: 'Term 1 Examination', daysAgo: 35, max: 100 },
] as const;

export interface ExamResultRecord extends Entity {
  studentId: string;
  examId: string;
  examName: string;
  date: string;
  /** Maximum marks per subject. */
  max: number;
  /** subject id -> marks obtained */
  marks: Record<string, number>;
}

/** Underlying ability (0-100) of a student; fixed so every install tells the same story. */
const ability = (n: number, r: ReturnType<typeof makeRng>) => (n === 1 ? 91 : n === 5 || n === 12 || n === 27 ? r.int(42, 55) : r.int(52, 94));

export const buildExamResults = (): ExamResultRecord[] => {
  const byClass = new Map<string, string[]>();
  for (const m of buildClassSubjects()) byClass.set(m.classId, [...(byClass.get(m.classId) ?? []), m.subjectId]);
  const out: ExamResultRecord[] = [];
  buildStudents().forEach((s, i) => {
    const r = makeRng(41000 + i);
    const base = ability(i + 1, r);
    const subjects = byClass.get(s.classId) ?? [];
    const bias = subjects.map(() => r.int(-8, 8));
    EXAMS.forEach((e, ei) => {
      const marks: Record<string, number> = {};
      subjects.forEach((sub, k) => {
        const pctv = clamp(base + bias[k] + r.int(-5, 5) + ei, 20, 99);
        marks[sub] = Math.round((e.max * pctv) / 100);
      });
      out.push({ id: `exr-${s.id}-${e.id}`, studentId: s.id, examId: e.id, examName: e.name, date: addDays(SEED_TODAY, -e.daysAgo), max: e.max, marks });
    });
  });
  return out;
};
export const examResults = defineCollection<ExamResultRecord>('examResults', buildExamResults);

/* ------------------------------------ Health ------------------------------------ */

export interface HealthRecord extends Entity {
  studentId: string;
  heightCm: number;
  weightKg: number;
  vision: string;
  dental: 'Good' | 'Fair' | 'Needs care';
  allergies: string;
  conditions: string;
  vaccinations: string[];
  doctor: string;
  lastCheckup: string;
  nextCheckup: string;
  note: string;
}

export const buildHealth = (): HealthRecord[] =>
  buildStudents().map((s, i) => {
    const r = makeRng(42000 + i);
    const age = 5 + classNoOf(s.classId);
    const heightCm = Math.round(100 + (age - 5) * 6 + r.int(-5, 6));
    const bmi = r.int(145, 205) / 10;
    const last = addDays(SEED_TODAY, -r.int(20, 200));
    const janet = i === 0;
    return {
      id: `hl-${s.id}`,
      studentId: s.id,
      heightCm,
      weightKg: Math.round(bmi * (heightCm / 100) ** 2),
      vision: r.pick(['6/6', '6/6', '6/6', '6/9', '6/12']),
      dental: r.pick(['Good', 'Good', 'Fair', 'Needs care'] as const),
      allergies: janet ? 'Peanuts, Dust' : r.pick(['None', 'None', 'None', 'Dust', 'Pollen', 'Penicillin']),
      conditions: janet ? 'Mild asthma' : r.pick(['None', 'None', 'None', 'None', 'Myopia', 'Mild asthma']),
      vaccinations: ['BCG', 'Polio', 'MMR', 'DTP', ...r.pick([[], ['Typhoid'], ['Typhoid', 'Influenza'], ['Hepatitis B', 'Typhoid', 'Influenza']])],
      doctor: r.pick(['Dr. Emily Clark', 'Dr. Ravi Kumar']),
      lastCheckup: last,
      nextCheckup: addDays(last, 365),
      note: janet ? 'Carries an inhaler. Notify the nurse during sports.' : '',
    };
  });
export const healthRecords = defineCollection<HealthRecord>('healthRecords', buildHealth);

/* ------------------------------------ Library ------------------------------------ */

export type LoanStatus = 'Issued' | 'Returned' | 'Overdue' | 'Reserved';

export interface LoanRecord extends Entity {
  studentId: string;
  title: string;
  author: string;
  /** '' while only reserved. */
  issued: string;
  due: string;
  returned: string;
  status: LoanStatus;
}

export const BOOKS: [string, string][] = [
  ['Atomic Habits', 'James Clear'],
  ['The Jungle Book', 'Rudyard Kipling'],
  ['Wings of Fire', 'A. P. J. Abdul Kalam'],
  ['Harry Potter and the Sorcerer’s Stone', 'J. K. Rowling'],
  ['The Diary of a Young Girl', 'Anne Frank'],
  ['A Brief History of Time', 'Stephen Hawking'],
  ['Charlotte’s Web', 'E. B. White'],
  ['Malgudi Days', 'R. K. Narayan'],
  ['The Alchemist', 'Paulo Coelho'],
  ['Matilda', 'Roald Dahl'],
  ['Treasure Island', 'R. L. Stevenson'],
  ['The Story of My Experiments with Truth', 'M. K. Gandhi'],
  ['Little Women', 'Louisa May Alcott'],
  ['The Hobbit', 'J. R. R. Tolkien'],
  ['Gulliver’s Travels', 'Jonathan Swift'],
  ['Discovery of India', 'Jawaharlal Nehru'],
  ['The Wonder That Was India', 'A. L. Basham'],
  ['Panchatantra Tales', 'Vishnu Sharma'],
  ['Introduction to Algorithms for Kids', 'T. Cormen'],
  ['The Selfish Gene', 'Richard Dawkins'],
];

export const buildLoans = (): LoanRecord[] => {
  const out: LoanRecord[] = [];
  buildStudents().forEach((s, i) => {
    const r = makeRng(43000 + i);
    const add = (status: LoanStatus, issuedAgo: number, loanDays: number) => {
      const [title, author] = r.pick(BOOKS);
      const issued = status === 'Reserved' ? '' : addDays(SEED_TODAY, -issuedAgo);
      const due = status === 'Reserved' ? '' : addDays(SEED_TODAY, -issuedAgo + loanDays);
      out.push({ id: `ln-${s.id}-${out.length}`, studentId: s.id, title, author, issued, due, returned: status === 'Returned' ? addDays(issued, r.int(5, loanDays)) : '', status });
    };
    for (let k = r.int(0, 3); k > 0; k--) add('Returned', r.int(30, 220), 14);
    if (r.chance(0.5)) add('Issued', r.int(1, 12), 14);
    if (r.chance(0.12)) add('Overdue', r.int(20, 34), 14);
    if (r.chance(0.1)) add('Reserved', 0, 0);
  });
  return out;
};
export const libraryLoans = defineCollection<LoanRecord>('libraryLoans', buildLoans);

/* --------------------------------- Achievements --------------------------------- */

export interface AchievementRecord extends Entity {
  studentId: string;
  title: string;
  category: 'Academic' | 'Sports' | 'Arts' | 'Leadership' | 'Community';
  level: 'School' | 'District' | 'State' | 'National';
  award: 'Gold' | 'Silver' | 'Bronze' | 'Certificate' | 'Badge';
  date: string;
  description: string;
}

const ACHIEVEMENTS: Omit<AchievementRecord, 'id' | 'studentId' | 'date'>[] = [
  { title: 'Inter-school Mathematics Olympiad', category: 'Academic', level: 'District', award: 'Gold', description: 'First place in the district round.' },
  { title: 'Science Exhibition', category: 'Academic', level: 'School', award: 'Silver', description: 'Working model of a water purifier.' },
  { title: 'Annual Sports Day — 100 m', category: 'Sports', level: 'School', award: 'Gold', description: 'Fastest in the age group.' },
  { title: 'Football — Zonal Tournament', category: 'Sports', level: 'State', award: 'Bronze', description: 'Member of the school team.' },
  { title: 'Inter-house Drama', category: 'Arts', level: 'School', award: 'Certificate', description: 'Best supporting actor.' },
  { title: 'Painting Competition', category: 'Arts', level: 'District', award: 'Silver', description: 'Theme: Our Environment.' },
  { title: 'Student Council — Head Boy / Girl', category: 'Leadership', level: 'School', award: 'Badge', description: 'Elected by the student body.' },
  { title: 'Perfect Attendance — Term 1', category: 'Academic', level: 'School', award: 'Badge', description: 'No absence or late arrival.' },
  { title: 'Clean Campus Drive', category: 'Community', level: 'School', award: 'Certificate', description: 'Volunteered across eight weekends.' },
  { title: 'Spelling Bee', category: 'Academic', level: 'State', award: 'Certificate', description: 'Reached the state finals.' },
];

export const buildAchievements = (): AchievementRecord[] => {
  const out: AchievementRecord[] = [];
  buildStudents().forEach((s, i) => {
    const r = makeRng(44000 + i);
    const count = i === 0 ? 6 : r.chance(0.35) ? r.int(1, 3) : 0;
    const used = new Set<number>();
    for (let k = 0; k < count; k++) {
      let idx = r.int(0, ACHIEVEMENTS.length - 1);
      while (used.has(idx)) idx = (idx + 1) % ACHIEVEMENTS.length;
      used.add(idx);
      out.push({ id: `ach-${s.id}-${k}`, studentId: s.id, date: addDays(SEED_TODAY, -r.int(10, 300)), ...ACHIEVEMENTS[idx] });
    }
  });
  return out;
};
export const achievements = defineCollection<AchievementRecord>('achievements', buildAchievements);

/* --------------------------------- Discipline --------------------------------- */

export type ConductKind = 'Positive' | 'Warning' | 'Suspension' | 'Counselling';

export interface DisciplineRecord extends Entity {
  studentId: string;
  kind: ConductKind;
  title: string;
  /** Signed points: positive entries add, warnings and suspensions subtract, counselling is neutral. */
  points: number;
  date: string;
  by: string;
  detail: string;
}

const POSITIVE: [string, string][] = [
  ['Excellent conduct in assembly', 'Recognised by staff.'],
  ['Helped a classmate with studies', 'Peer tutoring after school.'],
  ['Returned a lost item', 'Handed a wallet to the front office.'],
  ['Led the morning prayer', 'Volunteered at short notice.'],
  ['Kept the classroom tidy', 'Housekeeping monitor for the week.'],
];

export const buildDiscipline = (): DisciplineRecord[] => {
  const sections = buildSections();
  const teachers = buildTeachers();
  const out: DisciplineRecord[] = [];
  buildStudents().forEach((s, i) => {
    const r = makeRng(45000 + i);
    const by = teachers.find((t) => t.id === sections.find((x) => x.id === s.sectionId)?.classTeacherId)?.name ?? 'Class teacher';
    const add = (kind: ConductKind, title: string, points: number, daysAgo: number, detail: string) =>
      out.push({ id: `dis-${s.id}-${out.length}`, studentId: s.id, kind, title, points, date: addDays(SEED_TODAY, -daysAgo), by, detail });
    for (let k = i === 0 ? 6 : r.int(1, 2); k > 0; k--) {
      const [t, d] = r.pick(POSITIVE);
      add('Positive', t, r.int(5, 10), r.int(3, 200), d);
    }
    if (r.chance(0.08)) add('Warning', 'Late to class repeatedly', -5, r.int(5, 90), 'Three late arrivals in one week; guardian informed.');
    if (r.chance(0.06) || i === 0) add('Counselling', i === 0 ? 'Exam stress check-in' : 'Peer relationship counselling', 0, r.int(10, 120), 'Short session with the school counsellor; no concerns.');
    if (i === 44) add('Suspension', 'Fight in the playground', -20, 40, 'One-day suspension; parents met the principal.');
  });
  return out;
};
export const disciplineRecords = defineCollection<DisciplineRecord>('disciplineRecords', buildDiscipline);

/* ------------------------------- Communication log ------------------------------- */

export type Channel = 'Email' | 'Message' | 'SMS' | 'Call';

export interface CommunicationRecord extends Entity {
  studentId: string;
  channel: Channel;
  subject: string;
  summary: string;
  date: string;
  by: string;
  direction: 'Outgoing' | 'Incoming';
}

const COMMS: [Channel, string, string, 'Outgoing' | 'Incoming'][] = [
  ['Email', 'Parent–teacher meeting invitation', 'Invited the guardian to the term review meeting.', 'Outgoing'],
  ['SMS', 'Fee reminder', 'Reminder that the next instalment is due this month.', 'Outgoing'],
  ['Call', 'Attendance check-in', 'Spoke to the guardian about recent absences.', 'Outgoing'],
  ['Message', 'Homework clarification', 'Guardian asked about the science project deadline.', 'Incoming'],
  ['Email', 'Appreciation', 'Shared good news about the student’s progress.', 'Outgoing'],
  ['Message', 'Leave intimation', 'Guardian informed the school about a planned absence.', 'Incoming'],
];

export const buildCommunications = (): CommunicationRecord[] => {
  const sections = buildSections();
  const teachers = buildTeachers();
  const out: CommunicationRecord[] = [];
  buildStudents().forEach((s, i) => {
    const r = makeRng(46000 + i);
    const teacher = teachers.find((t) => t.id === sections.find((x) => x.id === s.sectionId)?.classTeacherId)?.name ?? 'Class teacher';
    const n = i === 0 ? 5 : r.chance(0.4) ? r.int(1, 3) : 0;
    for (let k = 0; k < n; k++) {
      const [channel, subject, summary, direction] = COMMS[(i + k) % COMMS.length];
      out.push({ id: `com-${s.id}-${k}`, studentId: s.id, channel, subject, summary, date: addDays(SEED_TODAY, -r.int(1, 120)), by: direction === 'Incoming' ? s.parentName : teacher, direction });
    }
  });
  return out;
};
export const communications = defineCollection<CommunicationRecord>('communications', buildCommunications);

/* ------------------------------------- Notes ------------------------------------- */

export interface StudentNoteRecord extends Entity {
  studentId: string;
  category: 'Counselling' | 'Academic' | 'Behaviour' | 'Health';
  text: string;
  by: string;
  at: string;
}

const NOTES: [StudentNoteRecord['category'], string][] = [
  ['Counselling', 'Settled well after the change of section; check in again next term.'],
  ['Academic', 'Strong in mathematics; needs reading support for English comprehension.'],
  ['Behaviour', 'Positive influence on peers; participates actively in group work.'],
  ['Health', 'Parent reports mild seasonal allergies; nurse informed.'],
  ['Academic', 'Missed two class tests because of illness; retests scheduled.'],
];

export const buildNotes = (): StudentNoteRecord[] => {
  const out: StudentNoteRecord[] = [];
  const sections = buildSections();
  const teachers = buildTeachers();
  buildStudents().forEach((s, i) => {
    const r = makeRng(47000 + i);
    if (!(i === 0 || r.chance(0.2))) return;
    const by = teachers.find((t) => t.id === sections.find((x) => x.id === s.sectionId)?.classTeacherId)?.name ?? 'Class teacher';
    for (let k = i === 0 ? 3 : 1; k > 0; k--) {
      const [category, text] = NOTES[(i + k) % NOTES.length];
      out.push({ id: `note-${s.id}-${k}`, studentId: s.id, category, text, by, at: `${addDays(SEED_TODAY, -r.int(2, 90))}T1${r.int(0, 7)}:${pad(r.int(0, 59), 2)}:00` });
    }
  });
  return out;
};
export const studentNotes = defineCollection<StudentNoteRecord>('studentNotes', buildNotes);

/* ----------------------------------- Documents ----------------------------------- */

export const DOC_CATEGORIES = ['Admission Documents', 'Birth Certificate', 'Transfer Certificate', 'Mark Sheets', 'Identity Proof', 'Address Proof', 'Passport', 'Medical Records', 'Bonafide Certificate', 'Character Certificate', 'Other Documents'] as const;
export type DocCategory = (typeof DOC_CATEGORIES)[number];
export type DocStatus = 'Verified' | 'Pending' | 'Rejected' | 'Expired';

export interface StudentDocumentRecord extends Entity {
  studentId: string;
  name: string;
  category: DocCategory;
  status: DocStatus;
  sizeKb: number;
  uploadedOn: string;
  uploadedBy: string;
  favourite: boolean;
  shared: boolean;
  archived: boolean;
  version: number;
  note: string;
  /** Plain-text version history, newest last. */
  history: string[];
}

export const buildDocuments = (): StudentDocumentRecord[] => {
  const sections = buildSections();
  const teachers = buildTeachers();
  const out: StudentDocumentRecord[] = [];
  buildStudents().forEach((s, i) => {
    const r = makeRng(48000 + i);
    const teacher = teachers.find((t) => t.id === sections.find((x) => x.id === s.sectionId)?.classTeacherId)?.name ?? 'Class teacher';
    const wanted: [DocCategory, string][] = [['Birth Certificate', 'pdf'], ['Identity Proof', 'jpg'], ['Address Proof', 'pdf'], ['Medical Records', 'pdf']];
    if (classNoOf(s.classId) > 1) wanted.push(['Mark Sheets', 'pdf']);
    if (s.previousSchool) wanted.push(['Transfer Certificate', 'pdf']);
    wanted.forEach(([category, ext], k) => {
      const roll = r.next();
      const status: DocStatus = i === 0 ? 'Verified' : category === 'Medical Records' && roll < 0.08 ? 'Expired' : roll < 0.72 ? 'Verified' : roll < 0.95 ? 'Pending' : 'Rejected';
      const uploadedOn = addDays(SEED_TODAY, -r.int(3, 400));
      out.push({
        id: `doc-${s.id}-${k}`,
        studentId: s.id,
        name: `${slug(s.name)}-${slug(category)}.${ext}`,
        category,
        status,
        sizeKb: r.int(180, 2400),
        uploadedOn,
        uploadedBy: r.pick(['Parent', 'Admin Office', teacher]),
        favourite: r.chance(0.06),
        shared: r.chance(0.06),
        archived: false,
        version: 1,
        note: status === 'Rejected' ? 'Image is blurred; please upload a clear scan.' : '',
        history: [`v1 uploaded on ${uploadedOn}`],
      });
    });
  });
  return out;
};
export const studentDocuments = defineCollection<StudentDocumentRecord>('studentDocuments', buildDocuments);

/* -------------------------------------- Leave -------------------------------------- */

export type StudentLeaveType = 'Sick Leave' | 'Casual Leave' | 'Medical' | 'Other';

export interface StudentLeaveRecord extends Entity {
  studentId: string;
  leaveType: StudentLeaveType;
  from: string;
  to: string;
  days: number;
  status: 'Approved' | 'Pending' | 'Rejected';
  reason: string;
  appliedOn: string;
  decidedBy: string;
  decisionNote: string;
}

const leaveTypeOf = (note: string): StudentLeaveType => (/fever|sick|cold|flu|health|unwell|stomach/i.test(note) ? 'Sick Leave' : /doctor|hospital|medical|dental|surgery/i.test(note) ? 'Medical' : 'Casual Leave');

/** Approved leave is rebuilt from the attendance register's "On Leave" runs, so the two always agree. */
export const buildStudentLeaves = (): StudentLeaveRecord[] => {
  const days = schoolDays(10);
  const attendance = buildStudentAttendance();
  const out: StudentLeaveRecord[] = [];
  for (const s of buildStudents()) {
    const mine = attendance.filter((a) => a.studentId === s.id).sort((a, b) => a.date.localeCompare(b.date));
    let run: string[] = [];
    let note = '';
    const flush = () => {
      if (!run.length) return;
      out.push({
        id: `lv-${s.id}-${run[0]}`,
        studentId: s.id,
        leaveType: leaveTypeOf(note),
        from: run[0],
        to: run[run.length - 1],
        days: run.length,
        status: 'Approved',
        reason: note || 'Family reasons',
        appliedOn: addDays(run[0], -2),
        decidedBy: 'Class teacher',
        decisionNote: '',
      });
      run = [];
    };
    for (const a of mine) {
      if (a.status === 'On Leave') {
        run.push(a.date);
        note = a.leaveNote || note;
      } else flush();
    }
    flush();
  }
  // Requests still waiting for a decision, and one that was declined.
  const first = days[days.length - 1];
  const extra: [string, StudentLeaveType, number, number, StudentLeaveRecord['status'], string, string][] = [
    ['stu-002', 'Medical', 3, 2, 'Pending', 'Dental surgery', ''],
    ['stu-009', 'Casual Leave', 5, 1, 'Pending', 'Family function out of town', ''],
    ['stu-014', 'Sick Leave', 1, 1, 'Pending', 'Viral fever', ''],
    ['stu-021', 'Casual Leave', 8, 3, 'Rejected', 'Holiday trip during unit tests', 'Unit tests are scheduled on those days.'],
  ];
  for (const [id, leaveType, startIn, len, status, reason, decisionNote] of extra) {
    const from = addDays(first, startIn);
    out.push({ id: `lv-${id}-x`, studentId: id, leaveType, from, to: addDays(from, len - 1), days: len, status, reason, appliedOn: addDays(first, -1), decidedBy: status === 'Pending' ? '' : 'Class teacher', decisionNote });
  }
  return out;
};
export const studentLeaves = defineCollection<StudentLeaveRecord>('studentLeaves', buildStudentLeaves);

