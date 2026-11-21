/** Administration seed data: school profile, campuses, academic years and events. */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildStaff, buildStudents, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

/* ------------------------------------- School profile ------------------------------------- */

export interface SchoolProfileRecord extends Entity {
  name: string;
  code: string;
  tagline: string;
  affiliation: string;
  established: number;
  principal: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  currency: string;
  timezone: string;
  language: string;
}

export const buildSchoolProfile = (): SchoolProfileRecord[] => [
  {
    id: 'school-1',
    name: 'Karkaii International School',
    code: 'KIS-2026',
    tagline: 'Learning that lasts',
    affiliation: 'CBSE · Affiliation 1930123',
    established: 2004,
    principal: 'Dr. Meera Krishnan',
    email: 'office@karkaii.demo',
    phone: '+91 98400 10000',
    website: 'https://www.karkaii.demo',
    address: '12 Gandhi Road, Anna Nagar, Chennai 600040',
    currency: 'USD ($)',
    timezone: 'Asia/Kolkata (GMT+5:30)',
    language: 'English',
  },
];
export const schoolProfile = defineCollection<SchoolProfileRecord>('schoolProfile', buildSchoolProfile);

/* ---------------------------------------- Campuses ---------------------------------------- */

export interface CampusRecord extends Entity {
  /** Teachers and staff store this name as their campus, so renaming a campus renames it for them. */
  name: string;
  code: string;
  address: string;
  principal: string;
  phone: string;
  email: string;
  isMain: boolean;
}

const CAMPUS_ROWS: [string, string, string, string, boolean][] = [
  ['Main Campus', 'KIS-MAIN', '12 Gandhi Road, Anna Nagar, Chennai 600040', 'Dr. Meera Krishnan', true],
  ['North Campus', 'KIS-NORTH', '24 Lake View Road, Ambattur, Chennai 600053', 'Rebecca Hall', false],
  ['North Wing', 'KIS-NWING', 'North Block, 12 Gandhi Road, Anna Nagar', 'Emily Clark', false],
  ['South Wing', 'KIS-SWING', 'South Block, 12 Gandhi Road, Anna Nagar', 'Olivia Turner', false],
];
export const buildCampuses = (): CampusRecord[] =>
  CAMPUS_ROWS.map(([name, code, address, principal, isMain], i) => ({
    id: `cmp-${pad(i + 1)}`,
    name,
    code,
    address,
    principal,
    phone: `+91 98400 10${pad(i + 1, 3)}`,
    email: `${code.toLowerCase().replace('kis-', '')}@karkaii.demo`,
    isMain,
  }));
export const campuses = defineCollection<CampusRecord>('campuses', buildCampuses);

/* -------------------------------------- Academic years -------------------------------------- */

export interface AcademicYearRecord extends Entity {
  /** "2026-27". */
  name: string;
  startDate: string;
  endDate: string;
  /** Exactly one year is current. */
  current: boolean;
  note: string;
}

export const buildAcademicYears = (): AcademicYearRecord[] => [
  { id: 'ay-2025', name: '2025-26', startDate: '2025-04-01', endDate: '2026-03-31', current: false, note: 'Closed. Results and promotions finalised.' },
  { id: 'ay-2026', name: '2026-27', startDate: '2026-04-01', endDate: '2027-03-31', current: true, note: 'Running year.' },
  { id: 'ay-2027', name: '2027-28', startDate: '2027-04-01', endDate: '2028-03-31', current: false, note: 'Fee structure and calendar being prepared.' },
];
export const academicYears = defineCollection<AcademicYearRecord>('academicYears', buildAcademicYears);

/* ------------------------------------------ Events ------------------------------------------ */

export type EventCategory = 'Academic' | 'Cultural' | 'Sports' | 'Meeting' | 'Workshop' | 'Celebration';
export const EVENT_CATEGORIES: EventCategory[] = ['Academic', 'Cultural', 'Sports', 'Meeting', 'Workshop', 'Celebration'];
export type EventAudience = 'All' | 'Students' | 'Parents' | 'Teachers' | 'Staff';
export const EVENT_AUDIENCES: EventAudience[] = ['All', 'Students', 'Parents', 'Teachers', 'Staff'];

export interface Registration {
  /** A student, teacher or staff record id, `par:<name>` for a parent, or the signed-in user's id. */
  key: string;
  name: string;
  role: string;
  at: string;
}

export interface EventRecord extends Entity {
  title: string;
  category: EventCategory;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venue: string;
  organizer: string;
  audience: EventAudience;
  /** 0 = unlimited. */
  capacity: number;
  /** Last day to register. */
  deadline: string;
  /** Only the office can add attendees. */
  inviteOnly: boolean;
  cancelled: boolean;
  registrations: Registration[];
}

export const VENUES = ['Main Auditorium', 'Sports Ground', 'Seminar Hall', 'Science Block', 'Library Hall', 'Open Air Theatre'];

type Person = Registration;
const pools = () => {
  const students: Person[] = buildStudents().filter((s) => s.status === 'Active' || s.status === 'On Leave').map((s) => ({ key: s.id, name: s.name, role: 'Student', at: '' }));
  const parents: Person[] = [...new Set(buildStudents().filter((s) => s.status === 'Active' || s.status === 'On Leave').map((s) => s.parentName))].map((n) => ({ key: `par:${n}`, name: n, role: 'Parent', at: '' }));
  const teachers: Person[] = buildTeachers().map((t) => ({ key: t.id, name: t.name, role: 'Teacher', at: '' }));
  const staff: Person[] = buildStaff().map((s) => ({ key: s.id, name: s.name, role: 'Staff', at: '' }));
  return { Students: students, Parents: parents, Teachers: teachers, Staff: staff, All: [...students, ...parents, ...teachers, ...staff] } as Record<EventAudience, Person[]>;
};

// title, category, days from today, start, end, venue, organizer, audience, capacity, deadline (days before), invite only, registered, description
const EVENT_ROWS: [string, EventCategory, number, string, string, string, string, EventAudience, number, number, boolean, number, string][] = [
  ['Annual Day', 'Cultural', 30, '17:00', '20:30', 'Main Auditorium', 'Cultural Committee', 'All', 0, 5, false, 120, 'Performances by every grade, prize distribution and the principal’s address.'],
  ['Parent–Teacher Meeting', 'Meeting', 9, '09:00', '13:00', 'Seminar Hall', 'Academic Coordinator', 'Parents', 200, 2, false, 150, 'Term 2 progress discussion. Choose a slot with your child’s class teacher.'],
  ['Inter-house Football Finals', 'Sports', 3, '15:30', '17:30', 'Sports Ground', 'Sports Department', 'Students', 0, 1, false, 60, 'Final between the two top houses. All students are welcome to cheer.'],
  ['Science Exhibition', 'Academic', 16, '10:00', '15:00', 'Science Block', 'Science Department', 'All', 90, 4, false, 90, 'Working models and experiments by Grades VI to X.'],
  ['Assessment Methods Workshop', 'Workshop', 12, '14:00', '16:30', 'Library Hall', 'Academic Coordinator', 'Teachers', 40, 3, false, 18, 'Designing balanced question papers and rubrics for Term 3.'],
  ['Career Guidance Seminar', 'Academic', 5, '11:00', '12:30', 'Seminar Hall', 'Counselling Cell', 'Students', 30, 3, true, 30, 'Invited Grade X students meet industry speakers. Seats are by invitation.'],
  ['Staff Day Picnic', 'Celebration', 22, '08:00', '17:00', 'Open Air Theatre', 'HR Department', 'Staff', 0, 7, false, 14, 'A day out for the support and administrative team.'],
  ['Sports Day', 'Sports', -12, '08:30', '15:00', 'Sports Ground', 'Sports Department', 'All', 0, 5, false, 200, 'Track and field events, house relay and the march past.'],
];

export const buildEvents = (): EventRecord[] => {
  const all = pools();
  const rng = makeRng(77000);
  return EVENT_ROWS.map(([title, category, daysFrom, startTime, endTime, venue, organizer, audience, capacity, before, inviteOnly, count, description], i) => {
    const date = addDays(SEED_TODAY, daysFrom);
    const pool = [...all[audience]];
    const take = Math.min(count, capacity || count, pool.length);
    const registrations: Registration[] = [];
    for (let n = 0; n < take; n += 1) {
      const idx = rng.int(0, pool.length - 1);
      const p = pool.splice(idx, 1)[0];
      registrations.push({ ...p, at: addDays(date, -(before + rng.int(1, 10))) });
    }
    return { id: `evt-${pad(i + 1)}`, title, category, description, date, startTime, endTime, venue, organizer, audience, capacity, deadline: addDays(date, -before), inviteOnly, cancelled: false, registrations };
  });
};
export const events = defineCollection<EventRecord>('events', buildEvents);
