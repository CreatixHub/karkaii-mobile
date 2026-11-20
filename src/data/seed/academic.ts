/**
 * Academic seed data: subjects, class-subject mapping, classrooms, timetable, study materials, homework.
 * Everything links to the master classes / sections / students / teachers by id.
 */
import { gradeFor, latePenaltyMarks } from '@/core/academic';
import { busyRoom, busySection, busyTeacher, generateSchedule, isSharedRoom, type Day, type Demand, type SectionPlan } from '@/core/schedule/scheduler';
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildClasses, buildSections, buildStudents } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

/* ----------------------------------- Subjects ----------------------------------- */

export type SubjectCategory = 'Core' | 'Languages' | 'Science' | 'Humanities' | 'Technology' | 'Co-curricular';
export type SubjectStatus = 'Active' | 'Published' | 'Draft' | 'Archived';

export interface SubjectRecord extends Entity {
  code: string;
  name: string;
  category: SubjectCategory;
  department: string;
  type: 'Theory' | 'Practical' | 'Both';
  credits: number;
  /** Defaults used when the subject is assigned to a class; each class mapping can override them. */
  periodsPerWeek: number;
  examMarks: number;
  internalMarks: number;
  passMarks: number;
  units: number;
  lessons: number;
  assignments: number;
  exams: number;
  resources: number;
  teacherId: string;
  status: SubjectStatus;
  updatedOn: string;
  description: string;
}

/** code, name, category, department, type, credits, periods/week, units, lessons, assignments, exams, resources, lead teacher, status */
const SUBJECT_ROWS: [string, string, SubjectCategory, string, SubjectRecord['type'], number, number, number, number, number, number, number, string, SubjectStatus][] = [
  ['ENG-101', 'English', 'Languages', 'English', 'Theory', 4, 6, 6, 88, 12, 3, 24, 'tch-003', 'Active'],
  ['MAT-102', 'Mathematics', 'Core', 'Mathematics', 'Theory', 5, 7, 8, 110, 16, 4, 30, 'tch-001', 'Active'],
  ['SCI-103', 'Science', 'Science', 'Science', 'Both', 4, 6, 7, 96, 14, 3, 28, 'tch-002', 'Active'],
  ['PHY-104', 'Physics', 'Science', 'Science', 'Both', 4, 4, 7, 96, 14, 3, 28, 'tch-002', 'Active'],
  ['CHE-105', 'Chemistry', 'Science', 'Science', 'Both', 4, 4, 6, 84, 12, 3, 22, 'tch-007', 'Active'],
  ['BIO-106', 'Biology', 'Science', 'Science', 'Both', 3, 4, 7, 90, 10, 2, 26, 'tch-007', 'Active'],
  ['SOC-107', 'Social Studies', 'Humanities', 'Social Studies', 'Theory', 3, 5, 6, 76, 9, 2, 16, 'tch-004', 'Active'],
  ['HIS-108', 'History', 'Humanities', 'Social Studies', 'Theory', 3, 3, 7, 82, 10, 2, 22, 'tch-004', 'Active'],
  ['GEO-109', 'Geography', 'Humanities', 'Social Studies', 'Theory', 3, 3, 6, 76, 9, 2, 16, 'tch-012', 'Active'],
  ['HIN-110', 'Hindi', 'Languages', 'Languages', 'Theory', 3, 4, 5, 64, 8, 2, 14, 'tch-005', 'Active'],
  ['CSC-111', 'Computer Science', 'Technology', 'Computer Science', 'Both', 3, 3, 5, 70, 8, 2, 18, 'tch-006', 'Published'],
  ['PED-112', 'Physical Education', 'Co-curricular', 'Physical Education', 'Practical', 2, 3, 4, 40, 4, 1, 8, 'tch-008', 'Active'],
  ['ART-113', 'Art & Craft', 'Co-curricular', 'Arts', 'Practical', 2, 2, 4, 36, 6, 1, 12, 'tch-009', 'Published'],
  ['ECO-114', 'Economics', 'Humanities', 'Social Studies', 'Theory', 3, 4, 6, 72, 11, 3, 20, 'tch-012', 'Draft'],
  ['SAN-115', 'Sanskrit', 'Languages', 'Languages', 'Theory', 2, 3, 4, 48, 6, 2, 10, 'tch-005', 'Archived'],
];

export const subjects = defineCollection<SubjectRecord>('subjects', () =>
  SUBJECT_ROWS.map(([code, name, category, department, type, credits, periodsPerWeek, units, lessons, assignments, exams, resources, teacherId, status], i) => {
    const practical = type === 'Practical';
    return {
      id: `sub-${pad(i + 1, 2)}`,
      code,
      name,
      category,
      department,
      type,
      credits,
      periodsPerWeek,
      examMarks: practical ? 50 : 80,
      internalMarks: practical ? 50 : 20,
      passMarks: 33,
      units,
      lessons,
      assignments,
      exams,
      resources,
      teacherId,
      status,
      updatedOn: addDays(SEED_TODAY, -((i * 3) % 21) - 1),
      description: `${name} (${category}) for the 2026-27 session, ${units} units and ${lessons} lessons.`,
    };
  }),
);

const subjectIdOf = (code: string) => `sub-${pad(SUBJECT_ROWS.findIndex((r) => r[0] === code) + 1, 2)}`;

/* ----------------------------- Class ↔ subject mapping ----------------------------- */

export interface ClassSubjectRecord extends Entity {
  classId: string;
  subjectId: string;
  teacherId: string;
  periodsPerWeek: number;
  examMarks: number;
  internalMarks: number;
  passMarks: number;
  isElective: boolean;
  term: string;
}

/** [subject code, periods per week, teacher] for each grade band. */
type MapRow = [string, number, string];
function mappingFor(classNo: number): MapRow[] {
  if (classNo <= 2) return [['ENG-101', 6, 'tch-003'], ['MAT-102', 6, 'tch-001'], ['SCI-103', 5, 'tch-007'], ['SOC-107', 4, 'tch-004'], ['HIN-110', 5, 'tch-005'], ['PED-112', 3, 'tch-008'], ['ART-113', 2, 'tch-009']];
  if (classNo <= 5) return [['ENG-101', 6, 'tch-003'], ['MAT-102', 6, 'tch-001'], ['SCI-103', 5, 'tch-007'], ['SOC-107', 4, 'tch-004'], ['HIN-110', 5, 'tch-005'], ['CSC-111', 3, 'tch-006'], ['PED-112', 3, 'tch-008'], ['ART-113', 2, 'tch-009']];
  if (classNo <= 8) return [['ENG-101', 6, 'tch-003'], ['MAT-102', 6, 'tch-001'], ['SCI-103', 6, 'tch-002'], ['SOC-107', 5, 'tch-012'], ['HIN-110', 4, 'tch-005'], ['CSC-111', 3, 'tch-006'], ['PED-112', 3, 'tch-008'], ['ART-113', 2, 'tch-009']];
  return [['ENG-101', 6, 'tch-011'], ['MAT-102', 7, 'tch-010'], ['PHY-104', 4, 'tch-002'], ['CHE-105', 4, 'tch-007'], ['BIO-106', 4, 'tch-007'], ['HIS-108', 3, 'tch-004'], ['GEO-109', 3, 'tch-012'], ['HIN-110', 3, 'tch-005'], ['CSC-111', 3, 'tch-006'], ['PED-112', 2, 'tch-008']];
}

export const buildClassSubjects = (): ClassSubjectRecord[] =>
  buildClasses().flatMap((c, i) =>
    mappingFor(i + 1).map(([code, periodsPerWeek, teacherId]) => {
      const subject = SUBJECT_ROWS.find((r) => r[0] === code)!;
      const practical = subject[4] === 'Practical';
      return {
        id: `cs-${c.id}-${subjectIdOf(code)}`,
        classId: c.id,
        subjectId: subjectIdOf(code),
        teacherId,
        periodsPerWeek,
        examMarks: practical ? 50 : 80,
        internalMarks: practical ? 50 : 20,
        passMarks: 33,
        isElective: false,
        term: 'Annual',
      };
    }),
  );

export const classSubjects = defineCollection<ClassSubjectRecord>('classSubjects', buildClassSubjects);

/* ----------------------------------- Classrooms ----------------------------------- */

export type RoomStatus = 'Available' | 'Occupied' | 'Maintenance' | 'Reserved' | 'Inactive';

export interface ClassroomRecord extends Entity {
  code: string;
  name: string;
  roomNo: string;
  building: string;
  floor: string;
  type: string;
  capacity: number;
  status: RoomStatus;
  year: string;
  facilities: string[];
  equipment: string;
  lastService: string;
  note: string;
}

export const FACILITIES = ['Smart Board', 'Projector', 'Wi-Fi', 'Air Conditioning', 'Audio System', 'Science Lab', 'Computer Lab'];
const HALL_NAMES = ['Newton', 'Curie', 'Einstein', 'Tesla', 'Darwin', 'Faraday', 'Galileo', 'Kepler', 'Hawking', 'Bose', 'Ramanujan', 'Raman', 'Kalam', 'Sarabhai', 'Bhabha', 'Aryabhata', 'Turing', 'Lovelace', 'Pascal', 'Euler'];

/** Rooms that are not a section's own classroom. roomNo doubles as the timetable's room code. */
const SPECIAL_ROOMS: [string, string, string, string, string, number, RoomStatus, string[], string][] = [
  ['LAB-C1', 'Computer Lab 1', 'B', 'First', 'Computer Lab', 30, 'Available', ['Projector', 'Wi-Fi', 'Air Conditioning', 'Computer Lab'], '30 workstations, network switch, UPS'],
  ['LAB-C2', 'Computer Lab 2', 'B', 'First', 'Computer Lab', 30, 'Maintenance', ['Projector', 'Wi-Fi', 'Air Conditioning', 'Computer Lab'], '30 workstations, UPS (battery replacement due)'],
  ['LAB-P', 'Physics Lab', 'C', 'Second', 'Science Lab', 30, 'Available', ['Projector', 'Wi-Fi', 'Science Lab'], 'Optics bench, 15 experiment stations'],
  ['LAB-CH', 'Chemistry Lab', 'C', 'Second', 'Science Lab', 30, 'Available', ['Wi-Fi', 'Science Lab'], 'Fume hood, 20 lab stations, safety kit'],
  ['LAB-B', 'Biology Lab', 'C', 'Second', 'Science Lab', 30, 'Available', ['Projector', 'Wi-Fi', 'Science Lab'], 'Microscopes, specimen cabinet'],
  ['GRD-1', 'Playground', 'A', 'Ground', 'Sports Ground', 200, 'Available', [], 'Football pitch, 200 m track, cricket nets'],
  ['ART-1', 'Art Studio', 'A', 'Ground', 'Studio', 25, 'Available', ['Wi-Fi'], 'Easels, pottery wheel, display wall'],
  ['AUD-1', 'Auditorium', 'A', 'Ground', 'Auditorium', 300, 'Reserved', ['Projector', 'Wi-Fi', 'Air Conditioning', 'Audio System'], 'Stage, 300 seats, PA system'],
  ['LIB-1', 'Library Hall', 'B', 'First', 'Library', 60, 'Available', ['Wi-Fi', 'Air Conditioning'], 'Reading hall, 6,000 volumes'],
  ['ANX-1', 'Annex Room', 'A', 'Ground', 'Classroom', 20, 'Inactive', [], 'Storage; not in use this session'],
];

export const classrooms = defineCollection<ClassroomRecord>('classrooms', () => {
  const section = buildSections().map((s, i) => ({
    id: `room-${s.roomNo}`,
    code: `R${167600 + i}`,
    name: `${HALL_NAMES[i % HALL_NAMES.length]} Hall`,
    roomNo: s.roomNo,
    building: s.floor === 'Ground' ? 'A' : s.floor === 'First' ? 'B' : 'C',
    floor: s.floor,
    type: 'Classroom',
    capacity: 20,
    status: 'Occupied' as RoomStatus,
    year: '2026-27',
    facilities: i % 3 === 0 ? ['Smart Board', 'Projector', 'Wi-Fi', 'Air Conditioning'] : ['Projector', 'Wi-Fi'],
    equipment: '24 desks, whiteboard, podium',
    lastService: addDays(SEED_TODAY, -30 - i * 4),
    note: '',
  }));
  const special = SPECIAL_ROOMS.map(([roomNo, name, building, floor, type, capacity, status, facilities, equipment], i) => ({
    id: `room-${roomNo}`,
    code: `R${167700 + i}`,
    name,
    roomNo,
    building,
    floor,
    type,
    capacity,
    status,
    year: '2026-27',
    facilities,
    equipment,
    lastService: addDays(SEED_TODAY, -45 - i * 6),
    note: status === 'Maintenance' ? 'UPS battery replacement scheduled.' : '',
  }));
  return [...section, ...special];
});

/* ----------------------------------- Timetable ----------------------------------- */

export type EntryMode = 'Teaching' | 'Lab Session' | 'Exam Duty' | 'Staff Meeting';

export interface TimetableEntryRecord extends Entity {
  /** '' for entries that belong to no class (staff meetings). */
  sectionId: string;
  day: Day;
  period: number;
  subjectId: string;
  teacherId: string;
  room: string;
  mode: EntryMode;
  format: 'Offline' | 'Online';
  note: string;
  effectiveFrom: string;
  /** Set when the period is being taken by a substitute. */
  originalTeacherId: string;
}

/** Sections that have a seeded timetable (Grades VIII–X). Others are generated on demand from Classes. */
const SEEDED_CLASS_NUMBERS = [8, 9, 10];

export function buildPlans(sectionIds: string[]): SectionPlan[] {
  const sections = buildSections();
  const classes = buildClasses();
  return sectionIds.map((sectionId) => {
    const sec = sections.find((s) => s.id === sectionId)!;
    const classNo = classes.findIndex((c) => c.id === sec.classId) + 1;
    const demands: Demand[] = mappingFor(classNo).map(([code, periods, teacherId]) => ({
      subjectId: subjectIdOf(code),
      teacherId,
      periods,
      ...(code === 'CSC-111' ? { rooms: ['LAB-C1'], mode: 'Lab Session' as const } : {}),
      ...(code === 'PED-112' ? { rooms: ['GRD-1'] } : {}),
      ...(code === 'ART-113' ? { rooms: ['ART-1'] } : {}),
    }));
    return { sectionId, homeRoom: sec.roomNo, demands };
  });
}

/** One-off blocks that exist before any teaching is scheduled. */
function fixedEntries(): Omit<TimetableEntryRecord, 'id'>[] {
  const base = { format: 'Offline' as const, effectiveFrom: '2026-06-01', originalTeacherId: '', subjectId: '' };
  return [
    { ...base, sectionId: '', day: 'Fri', period: 7, teacherId: 'tch-001', room: 'AUD-1', mode: 'Staff Meeting', note: 'Department heads meeting' },
    { ...base, sectionId: '', day: 'Fri', period: 7, teacherId: 'tch-003', room: 'AUD-1', mode: 'Staff Meeting', note: 'Department heads meeting' },
    { ...base, sectionId: 'sec-10-A', day: 'Wed', period: 1, teacherId: 'tch-009', room: '320', mode: 'Exam Duty', note: 'Invigilation – Term test' },
    { ...base, sectionId: 'sec-10-A', day: 'Wed', period: 1, teacherId: 'tch-012', room: '319', mode: 'Exam Duty', note: 'Invigilation – Term test' },
  ];
}

export const timetableEntries = defineCollection<TimetableEntryRecord>('timetableEntries', () => {
  const fixed = fixedEntries();
  const busy = new Set<string>();
  for (const f of fixed) {
    busy.add(busyTeacher(f.teacherId, f.day, f.period));
    if (isSharedRoom(f.room)) busy.add(busyRoom(f.room, f.day, f.period));
    if (f.sectionId) busy.add(busySection(f.sectionId, f.day, f.period));
  }
  const ids = buildSections()
    .filter((s) => SEEDED_CLASS_NUMBERS.includes(Number(s.classId.slice(4))))
    .map((s) => s.id);
  const { entries } = generateSchedule({ plans: buildPlans(ids), busy });
  const rows: Omit<TimetableEntryRecord, 'id'>[] = [
    ...fixed,
    ...entries.map((e) => ({ sectionId: e.sectionId, day: e.day, period: e.period, subjectId: e.subjectId, teacherId: e.teacherId, room: e.room, mode: e.mode, format: 'Offline' as const, note: '', effectiveFrom: '2026-06-01', originalTeacherId: '' })),
  ];
  return rows.map((r, i) => ({ id: `tt-${pad(i + 1, 4)}`, ...r }));
});

/* --------------------------------- Study materials --------------------------------- */

export type MaterialType = 'PDF' | 'PPT' | 'DOC' | 'Video' | 'Link' | 'Audio';
export type MaterialStatus = 'Published' | 'Draft' | 'Archived';

export interface StudyMaterialRecord extends Entity {
  code: string;
  title: string;
  subjectId: string;
  type: MaterialType;
  classId: string;
  /** '' = all sections of the class. */
  sectionId: string;
  chapter: string;
  description: string;
  teacherId: string;
  uploadedOn: string;
  downloads: number;
  size: string;
  fileName: string;
  year: string;
  status: MaterialStatus;
}

/** title, subject code, type, class no, section, chapter, teacher, days ago, downloads, size, status */
const MATERIAL_ROWS: [string, string, MaterialType, number, string, string, string, number, number, string, MaterialStatus][] = [
  ['Algebra Fundamentals — Linear Equations', 'MAT-102', 'PDF', 10, 'A', 'Chapter 3 · Linear Equations in Two Variables', 'tch-010', 18, 186, '2.4 MB', 'Published'],
  ["Newton's Laws of Motion — Explained", 'PHY-104', 'PPT', 9, 'B', 'Unit 2 · Laws of Motion', 'tch-002', 12, 224, '6.8 MB', 'Published'],
  ['Grammar & Composition Workbook', 'ENG-101', 'DOC', 8, 'A', 'Unit 5 · Tenses & Sentence Structure', 'tch-003', 9, 42, '860 KB', 'Draft'],
  ['Periodic Table Explained — Trends & Groups', 'CHE-105', 'Video', 9, 'A', 'Chapter 4 · Periodic Classification', 'tch-007', 30, 301, '18 min · 142 MB', 'Published'],
  ['Human Digestive System — Structure & Function', 'BIO-106', 'PPT', 10, 'B', 'Chapter 6 · Life Processes', 'tch-007', 200, 57, '5.1 MB', 'Archived'],
  ['Introduction to Python Programming', 'CSC-111', 'PDF', 10, 'A', 'Module 1 · Python Basics', 'tch-006', 6, 412, '3.1 MB', 'Published'],
  ['World Map & Continents — Interactive Atlas', 'GEO-109', 'Link', 9, '', 'Chapter 2 · Continents & Oceans', 'tch-012', 4, 19, 'External resource', 'Draft'],
  ['World War II — A Visual Timeline', 'HIS-108', 'DOC', 10, 'B', 'Chapter 9 · The World at War', 'tch-004', 16, 133, '1.2 MB', 'Published'],
  ['Trigonometry Formula Sheet', 'MAT-102', 'PDF', 9, 'A', 'Chapter 8 · Trigonometric Identities', 'tch-010', 210, 268, '640 KB', 'Archived'],
  ['Listening Practice — Idioms & Phrases', 'ENG-101', 'Audio', 8, 'B', 'Unit 7 · Everyday Expressions', 'tch-003', 2, 34, '12 min · 9.6 MB', 'Draft'],
  ['Hindi Vyakaran — Sandhi Worksheet', 'HIN-110', 'PDF', 8, '', 'Unit 4 · Sandhi', 'tch-005', 11, 77, '1.1 MB', 'Published'],
  ['Fitness Drill Chart — Term 2', 'PED-112', 'PDF', 10, '', 'Term 2 · Conditioning', 'tch-008', 7, 21, '420 KB', 'Published'],
];

export const studyMaterials = defineCollection<StudyMaterialRecord>('studyMaterials', () =>
  MATERIAL_ROWS.map(([title, code, type, classNo, section, chapter, teacherId, daysAgo, downloads, size, status], i) => ({
    id: `sm-${pad(i + 1, 2)}`,
    code: `SM26${pad(i + 1, 4)}`,
    title,
    subjectId: subjectIdOf(code),
    type,
    classId: `cls-${pad(classNo, 2)}`,
    sectionId: section ? `sec-${pad(classNo, 2)}-${section}` : '',
    chapter,
    description: `${title}. ${chapter}.`,
    teacherId,
    uploadedOn: addDays(SEED_TODAY, -daysAgo),
    downloads,
    size,
    fileName: type === 'Link' ? 'https://atlas.example.org/world' : `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}.${type === 'Video' ? 'mp4' : type === 'Audio' ? 'mp3' : type.toLowerCase()}`,
    year: '2026-27',
    status,
  })),
);

/* ------------------------------- Homework & submissions ------------------------------- */

export type HomeworkStatus = 'Draft' | 'Assigned' | 'In Progress' | 'Completed' | 'Overdue' | 'Archived';

export interface HomeworkRecord extends Entity {
  code: string;
  title: string;
  description: string;
  subjectId: string;
  sectionId: string;
  teacherId: string;
  type: string;
  priority: 'High' | 'Medium' | 'Low';
  year: string;
  assignedOn: string;
  dueDate: string;
  durationMin: number;
  maxMarks: number;
  allowLate: boolean;
  latePenaltyPct: number;
  files: number;
  status: HomeworkStatus;
}

export interface SubmissionRecord extends Entity {
  homeworkId: string;
  studentId: string;
  submittedOn: string;
  submittedTime: string;
  type: 'File' | 'Text' | 'Both';
  late: boolean;
  lateReason: string;
  lateApproval: '' | 'Pending' | 'Approved' | 'Rejected';
  marksDeducted: number;
  finalStatus: '' | 'Accepted' | 'Penalized' | 'Under Review';
  graded: boolean;
  marks: number;
  outOf: number;
  grade: string;
  review: 'Reviewed' | 'Under Review' | 'Returned' | 'Not Reviewed';
  feedbackType: '' | 'Positive' | 'Constructive' | 'Needs Improvement' | 'Resubmit';
  feedbackMessage: string;
  remarks: string;
}

/** title, subject, section, type, priority, assigned (days from today), due (days from today), minutes, max marks, status, rate, description */
const HW_ROWS: [string, string, string, string, HomeworkRecord['priority'], number, number, number, number, HomeworkStatus, number, string][] = [
  ['Reading Comprehension — Unit 4', 'ENG-101', 'sec-08-A', 'Worksheet', 'High', -5, 2, 45, 20, 'Assigned', 0.6, 'Read the passage and answer the ten comprehension questions in full sentences.'],
  ['Algebra Practice Set B', 'MAT-102', 'sec-09-A', 'Problem Set', 'Medium', -6, 1, 60, 25, 'In Progress', 0.75, 'Solve problems 1–20 from Exercise 4.2. Show every step.'],
  ["Newton's Laws — Numerical Problems", 'PHY-104', 'sec-09-B', 'Problem Set', 'High', -12, -5, 60, 30, 'Overdue', 0.8, 'Numericals on force, mass and acceleration with units.'],
  ['Periodic Table Chart Project', 'CHE-105', 'sec-10-A', 'Project', 'Medium', -20, -8, 90, 40, 'Completed', 1, 'Prepare a labelled chart of the first 30 elements with group trends.'],
  ['Digestive System Diagram', 'BIO-106', 'sec-10-B', 'Assignment', 'Low', -15, -6, 45, 20, 'Completed', 1, 'Draw and label the human digestive system.'],
  ['Python: Loops Practice', 'CSC-111', 'sec-10-A', 'Practice', 'High', -4, 3, 60, 25, 'Assigned', 0.5, 'Write five programs using for and while loops.'],
  ['WWII Causes — Essay', 'HIS-108', 'sec-10-B', 'Assignment', 'Medium', -10, -3, 90, 30, 'Overdue', 0.7, 'Write a 400-word essay on the causes of the Second World War.'],
  ['Map Marking Worksheet', 'GEO-109', 'sec-09-A', 'Worksheet', 'Low', 0, 6, 30, 15, 'Draft', 0, 'Mark the major rivers and mountain ranges on the outline map.'],
  ['Sandhi Worksheet', 'HIN-110', 'sec-08-B', 'Worksheet', 'Medium', -3, 4, 30, 20, 'Assigned', 0.4, 'Identify and split the sandhi in the given words.'],
  ['Fractions Revision Set', 'MAT-102', 'sec-08-B', 'Problem Set', 'Medium', -25, -18, 45, 20, 'Archived', 1, 'Revision of addition and subtraction of fractions.'],
  ['Plant Cell Model', 'SCI-103', 'sec-08-A', 'Project', 'High', -8, 5, 120, 30, 'In Progress', 0.3, 'Build a labelled 3D model of a plant cell.'],
  ['Letter Writing Practice', 'ENG-101', 'sec-10-A', 'Assignment', 'Medium', -14, -9, 40, 20, 'Completed', 1, 'Write one formal and one informal letter.'],
];

const LATE_REASONS = ['Unwell, doctor visit', 'Family function', 'Internet outage', 'Misplaced notebook', 'Travelled for a competition'];
const FEEDBACK: [SubmissionRecord['feedbackType'], string][] = [
  ['Positive', 'Well done — clear working and neat presentation.'],
  ['Constructive', 'Good attempt. Revisit question 4 and show the intermediate steps.'],
  ['Needs Improvement', 'Several answers are incomplete. Please see me before the next class.'],
  ['Positive', 'Excellent effort, keep it up.'],
];

function buildHomework(): HomeworkRecord[] {
  const classes = buildClasses();
  const sections = buildSections();
  return HW_ROWS.map(([title, code, sectionId, type, priority, assigned, due, durationMin, maxMarks, status, , description], i) => {
    const sec = sections.find((s) => s.id === sectionId)!;
    const classNo = classes.findIndex((c) => c.id === sec.classId) + 1;
    const teacherId = mappingFor(classNo).find((m) => m[0] === code)![2];
    return {
      id: `hw-${pad(i + 1, 2)}`,
      code: `HW26${pad(i + 1, 5)}`,
      title,
      description,
      subjectId: subjectIdOf(code),
      sectionId,
      teacherId,
      type,
      priority,
      year: '2026-27',
      assignedOn: addDays(SEED_TODAY, assigned),
      dueDate: addDays(SEED_TODAY, due),
      durationMin,
      maxMarks,
      allowLate: true,
      latePenaltyPct: 10,
      files: i % 4,
      status,
    };
  });
}

export const homework = defineCollection<HomeworkRecord>('homework', buildHomework);

export const homeworkSubmissions = defineCollection<SubmissionRecord>('homeworkSubmissions', () => {
  const rng = makeRng(404);
  const students = buildStudents();
  const out: SubmissionRecord[] = [];
  buildHomework().forEach((hw, hi) => {
    const rate = HW_ROWS[hi][10];
    if (!rate) return;
    const finished = hw.status === 'Completed' || hw.status === 'Archived';
    const roster = students.filter((s) => s.sectionId === hw.sectionId && s.status === 'Active');
    roster.forEach((st, si) => {
      if (!(finished || rng.next() < rate)) return;
      const lastDay = hw.dueDate < SEED_TODAY ? addDays(hw.dueDate, 3) : SEED_TODAY;
      const span = Math.max(0, Math.round((new Date(lastDay).getTime() - new Date(hw.assignedOn).getTime()) / 86400000));
      const submittedOn = addDays(hw.assignedOn, rng.int(0, span));
      const late = submittedOn > hw.dueDate;
      const graded = finished || (!late && rng.chance(0.35));
      const marks = graded ? Math.round(hw.maxMarks * (0.55 + rng.next() * 0.45)) : 0;
      const approval: SubmissionRecord['lateApproval'] = !late ? '' : si % 3 === 0 ? 'Approved' : si % 3 === 1 ? 'Rejected' : 'Pending';
      const deducted = approval === 'Rejected' ? latePenaltyMarks(hw.maxMarks, hw.latePenaltyPct) : 0;
      const fb = FEEDBACK[(hi + si) % FEEDBACK.length];
      out.push({
        id: `sub-${hw.id}-${st.id}`,
        homeworkId: hw.id,
        studentId: st.id,
        submittedOn,
        submittedTime: `${pad(rng.int(15, 22), 2)}:${pad(rng.int(0, 59), 2)}`,
        type: hi % 3 === 0 ? 'Both' : hi % 3 === 1 ? 'File' : 'Text',
        late,
        lateReason: late ? LATE_REASONS[(si + hi) % LATE_REASONS.length] : '',
        lateApproval: approval,
        marksDeducted: deducted,
        finalStatus: !late ? '' : approval === 'Approved' ? 'Accepted' : approval === 'Rejected' ? 'Penalized' : 'Under Review',
        graded,
        marks,
        outOf: hw.maxMarks,
        grade: graded ? gradeFor((Math.max(0, marks - deducted) / hw.maxMarks) * 100) : '',
        review: graded ? 'Reviewed' : rng.chance(0.4) ? 'Under Review' : 'Not Reviewed',
        feedbackType: graded ? fb[0] : '',
        feedbackMessage: graded ? fb[1] : '',
        remarks: '',
      });
    });
  });
  return out;
});
