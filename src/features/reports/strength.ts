/** School Strength Report: the figures, the section list and the CSV / text versions, all worked out from the live records. */
import { snapshot } from '@/core/store/store';
import { formatDate } from '@/core/utils/date';
import type { ClassRecord, StaffRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';

export type Gender = 'male' | 'female';
export interface GenderCount {
  male: number;
  female: number;
}

export interface FacultyMember {
  employeeNo: string;
  name: string;
  staffType: 'teaching' | 'non-teaching';
  employmentType: string;
  gender: Gender;
}

export interface StudentMember {
  admissionNo: string;
  name: string;
  classId: string | null;
  gender: Gender;
}

export interface ClassRow extends GenderCount {
  classId: string;
  name: string;
  total: number;
}

export interface SchoolStrength {
  generatedAt: string;
  faculty: {
    total: number;
    teaching: number;
    nonTeaching: number;
    byGender: GenderCount;
    teachingByGender: GenderCount;
    nonTeachingByGender: GenderCount;
    byEmploymentType: Record<string, number>;
    byStatus: Record<string, number>;
    list: FacultyMember[];
  };
  students: {
    total: number;
    byGender: GenderCount;
    byStatus: Record<string, number>;
    classes: ClassRow[];
    unassigned: GenderCount & { total: number };
    list: StudentMember[];
  };
}

export type SectionKey = 'summary' | 'faculty' | 'facultyList' | 'studentsGender' | 'classWise' | 'studentList';

export const SECTIONS: [SectionKey, string][] = [
  ['summary', 'Summary (key figures)'],
  ['faculty', 'Faculty — counts by gender, type, status'],
  ['facultyList', 'Faculty list — names'],
  ['studentsGender', 'Students — gender-wise'],
  ['classWise', 'Students — class-wise & gender-wise'],
  ['studentList', 'Student list — names, class-wise'],
];

export interface ReportOptions extends Record<SectionKey, boolean> {
  schoolName: string;
  preparedBy: string;
  /** 'all' or a class id. */
  classId: string;
}

export const DEFAULT_OPTIONS: ReportOptions = { schoolName: 'Karkaii International School', preparedBy: '', summary: true, faculty: true, facultyList: true, studentsGender: true, classWise: true, studentList: true, classId: 'all' };

const count = (g: GenderCount) => g.male + g.female;
const tally = (rows: { gender: Gender }[]): GenderCount => ({ male: rows.filter((r) => r.gender === 'male').length, female: rows.filter((r) => r.gender === 'female').length });
const bump = (m: Record<string, number>, key: string) => { m[key] = (m[key] ?? 0) + 1; };
const lower = (g: 'Male' | 'Female'): Gender => (g === 'Male' ? 'male' : 'female');

/** Students counted in the strength are Active or On Leave, the same rule the class and section pages use. */
export function computeSchoolStrength(now: Date = new Date()): SchoolStrength {
  const teachers = snapshot<TeacherRecord>('teachers');
  const staff = snapshot<StaffRecord>('staff');
  const classes = snapshot<ClassRecord>('classes');
  const all = snapshot<StudentRecord>('students');
  const active = all.filter((s) => s.status === 'Active' || s.status === 'On Leave');

  const list: FacultyMember[] = [
    ...teachers.map((t) => ({ employeeNo: t.employeeId, name: t.name, staffType: 'teaching' as const, employmentType: t.contractType === 'Permanent' ? 'full_time' : 'contract', gender: lower(t.gender) })),
    ...staff.map((s) => ({ employeeNo: s.employeeId, name: s.name, staffType: 'non-teaching' as const, employmentType: s.employmentType === 'Full-time' ? 'full_time' : 'contract', gender: lower(s.gender) })),
  ];
  const teaching = list.filter((m) => m.staffType === 'teaching');
  const nonTeaching = list.filter((m) => m.staffType === 'non-teaching');
  const byEmploymentType: Record<string, number> = {};
  list.forEach((m) => bump(byEmploymentType, m.employmentType));
  const byStatus: Record<string, number> = {};
  [...teachers, ...staff].forEach((p) => bump(byStatus, p.status.toLowerCase().replace(/ /g, '_')));

  const members: StudentMember[] = active.map((s) => ({ admissionNo: s.admissionNo, name: s.name, classId: classes.some((c) => c.id === s.classId) ? s.classId : null, gender: lower(s.gender) }));
  const studentStatus: Record<string, number> = {};
  all.forEach((s) => bump(studentStatus, s.status.toLowerCase().replace(/ /g, '_')));
  const classRows: ClassRow[] = classes.map((c) => {
    const g = tally(members.filter((m) => m.classId === c.id));
    return { classId: c.id, name: c.name, ...g, total: count(g) };
  });
  const orphan = tally(members.filter((m) => m.classId === null));

  return {
    generatedAt: now.toISOString(),
    faculty: { total: list.length, teaching: teaching.length, nonTeaching: nonTeaching.length, byGender: tally(list), teachingByGender: tally(teaching), nonTeachingByGender: tally(nonTeaching), byEmploymentType, byStatus, list },
    students: { total: members.length, byGender: tally(members), byStatus: studentStatus, classes: classRows, unassigned: { ...orphan, total: count(orphan) }, list: members },
  };
}

export const ratioText = (d: SchoolStrength) => (d.faculty.teaching > 0 ? `${(d.students.total / d.faculty.teaching).toFixed(1)} : 1` : '—');
export const pctText = (part: number, total: number) => (total > 0 ? `${((part / total) * 100).toFixed(1)}%` : '—');
export const nice = (key: string) => { const t = key.replace(/_/g, ' '); return t.charAt(0).toUpperCase() + t.slice(1); };
export const genderLabel = (g: Gender) => (g === 'male' ? 'Male' : 'Female');
export const roleLabel = (t: FacultyMember['staffType']) => (t === 'teaching' ? 'Teaching' : 'Non-teaching');
export const anySection = (o: ReportOptions) => SECTIONS.some(([k]) => o[k]);

/** The classes the report covers, and the students of each in class order. */
export function classRowsFor(data: SchoolStrength, classId: string): ClassRow[] {
  return classId === 'all' ? data.students.classes : data.students.classes.filter((c) => c.classId === classId);
}
export function studentGroups(data: SchoolStrength, classId: string): { title: string; members: StudentMember[] }[] {
  const out: { title: string; members: StudentMember[] }[] = [];
  for (const c of classRowsFor(data, classId)) {
    const members = data.students.list.filter((m) => m.classId === c.classId);
    if (members.length) out.push({ title: c.name, members });
  }
  if (classId === 'all') {
    const none = data.students.list.filter((m) => m.classId === null);
    if (none.length) out.push({ title: 'Not assigned to a class', members: none });
  }
  return out;
}

const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
const line = (...cells: (string | number)[]) => cells.map(cell).join(',');
const stamp = (iso: string) => formatDate(iso.slice(0, 10));

/** The report as CSV (what "Download Excel" shares). */
export function buildCsv(data: SchoolStrength, o: ReportOptions): string {
  const f = data.faculty;
  const s = data.students;
  const rows: string[] = [line(o.schoolName || 'School', 'School Strength Report'), line('Generated on', stamp(data.generatedAt))];
  if (o.preparedBy) rows.push(line('Prepared by', o.preparedBy));
  if (o.summary) {
    rows.push('', line('SUMMARY'), line('Total faculty', f.total), line('Teaching staff', f.teaching), line('Non-teaching staff', f.nonTeaching), line('Total students', s.total), line('Boys', s.byGender.male), line('Girls', s.byGender.female), line('Student : Teacher', ratioText(data)));
  }
  if (o.faculty) {
    rows.push('', line('FACULTY'), line('Category', 'Male', 'Female', 'Total'), line('Teaching', f.teachingByGender.male, f.teachingByGender.female, f.teaching), line('Non-teaching', f.nonTeachingByGender.male, f.nonTeachingByGender.female, f.nonTeaching), line('All faculty', f.byGender.male, f.byGender.female, f.total));
    rows.push('', line('Employment type', 'Faculty'));
    for (const [k, v] of Object.entries(f.byEmploymentType)) rows.push(line(nice(k), v));
    rows.push('', line('Staff status', 'Staff'));
    for (const [k, v] of Object.entries(f.byStatus)) rows.push(line(nice(k), v));
  }
  if (o.facultyList) {
    rows.push('', line('FACULTY LIST'), line('#', 'Emp. no', 'Name', 'Role', 'Employment', 'Gender'));
    f.list.forEach((m, i) => rows.push(line(i + 1, m.employeeNo, m.name, roleLabel(m.staffType), nice(m.employmentType), genderLabel(m.gender))));
  }
  if (o.studentsGender) rows.push('', line('STUDENTS - GENDER-WISE'), line('Gender', 'Students'), line('Boys', s.byGender.male), line('Girls', s.byGender.female));
  if (o.classWise) {
    rows.push('', line('STUDENTS - CLASS-WISE'), line('Class', 'Boys', 'Girls', 'Total'));
    let m = 0;
    let fe = 0;
    for (const c of classRowsFor(data, o.classId)) { rows.push(line(c.name, c.male, c.female, c.total)); m += c.male; fe += c.female; }
    if (o.classId === 'all' && s.unassigned.total > 0) { rows.push(line('Not assigned to a class', s.unassigned.male, s.unassigned.female, s.unassigned.total)); m += s.unassigned.male; fe += s.unassigned.female; }
    rows.push(line('Total', m, fe, m + fe));
  }
  if (o.studentList) {
    rows.push('', line('STUDENT LIST'), line('Class', '#', 'Adm. no', 'Name', 'Gender'));
    for (const g of studentGroups(data, o.classId)) g.members.forEach((m, i) => rows.push(line(g.title, i + 1, m.admissionNo, m.name, genderLabel(m.gender))));
  }
  return rows.join('\r\n');
}

/** The report as plain text (what "Share report" sends). */
export function buildText(data: SchoolStrength, o: ReportOptions): string {
  const f = data.faculty;
  const s = data.students;
  const cls = o.classId === 'all' ? null : s.classes.find((c) => c.classId === o.classId);
  const out: string[] = [(o.schoolName || 'School').toUpperCase(), `School Strength Report${cls ? ` — ${cls.name}` : ''}`, `Generated on ${stamp(data.generatedAt)}${o.preparedBy ? ` · Prepared by ${o.preparedBy}` : ''}`];
  let n = 0;
  const head = (t: string) => out.push('', `${(n += 1)}. ${t.toUpperCase()}`);
  if (o.summary) {
    head('Summary');
    out.push(`Faculty ${f.total} (teaching ${f.teaching}, non-teaching ${f.nonTeaching})`, `Students ${s.total} (boys ${s.byGender.male}, girls ${s.byGender.female})`, `Student : teacher ${ratioText(data)}`);
  }
  if (o.faculty) {
    head('Faculty');
    out.push(`Teaching: ${f.teachingByGender.male} male, ${f.teachingByGender.female} female`, `Non-teaching: ${f.nonTeachingByGender.male} male, ${f.nonTeachingByGender.female} female`, ...Object.entries(f.byEmploymentType).map(([k, v]) => `${nice(k)}: ${v} (${pctText(v, f.total)})`), ...Object.entries(f.byStatus).map(([k, v]) => `Status ${nice(k)}: ${v}`));
  }
  if (o.facultyList) { head('Faculty list'); f.list.forEach((m, i) => out.push(`${i + 1}. ${m.employeeNo}  ${m.name} — ${roleLabel(m.staffType)}, ${nice(m.employmentType)}, ${genderLabel(m.gender)}`)); }
  if (o.studentsGender) { head('Students — gender-wise'); out.push(`Boys ${s.byGender.male} (${pctText(s.byGender.male, s.total)})`, `Girls ${s.byGender.female} (${pctText(s.byGender.female, s.total)})`); }
  if (o.classWise) {
    head('Students — class-wise');
    for (const c of classRowsFor(data, o.classId)) out.push(`${c.name}: ${c.male} boys, ${c.female} girls = ${c.total} (girls ${pctText(c.female, c.total)})`);
    if (o.classId === 'all' && s.unassigned.total > 0) out.push(`Not assigned to a class: ${s.unassigned.total}`);
  }
  if (o.studentList) {
    head('Student list');
    for (const g of studentGroups(data, o.classId)) { out.push('', `${g.title} — ${g.members.length} students`); g.members.forEach((m, i) => out.push(`${i + 1}. ${m.admissionNo}  ${m.name} (${genderLabel(m.gender)})`)); }
  }
  return out.join('\n');
}
