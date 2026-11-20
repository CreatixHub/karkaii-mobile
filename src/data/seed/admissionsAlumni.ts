/** People & Admission seed data, part 3: admissions pipeline, promotion history and the alumni network. */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildClasses, buildStudents, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

/* ------------------------------------ Admissions ------------------------------------ */

export type AdmissionStatus = 'Pending' | 'Under Review' | 'Approved' | 'Waitlisted' | 'Rejected' | 'Enrolled';
export type AdmissionDocStatus = 'Verified' | 'Pending' | 'Rejected' | 'Not Uploaded';
export type InterviewStatus = 'Not Scheduled' | 'Scheduled' | 'Completed' | 'Cancelled';

export interface AdmissionDocRecord {
  type: string;
  status: AdmissionDocStatus;
  uploadedOn: string;
}

export interface AdmissionLogEntry {
  title: string;
  by: string;
  at: string;
}

export interface AdmissionNote {
  text: string;
  by: string;
  at: string;
}

export interface AdmissionRecord extends Entity {
  applicationNo: string;
  // personal
  firstName: string;
  lastName: string;
  name: string;
  gender: 'Male' | 'Female';
  dob: string;
  bloodGroup: string;
  religion: string;
  nationality: string;
  motherTongue: string;
  address: string;
  // academic
  classId: string;
  sectionPref: string;
  academicYear: string;
  admissionType: 'New Admission' | 'Transfer';
  secondLanguage: string;
  source: 'Walk-in' | 'Website' | 'Referral' | 'Event' | 'Other';
  // guardian & emergency
  parentName: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  parentPhone: string;
  parentEmail: string;
  occupation: string;
  annualIncome: string;
  emergencyName: string;
  emergencyRelation: string;
  emergencyPhone: string;
  // medical
  allergies: string;
  conditions: string;
  medications: string;
  doctorContact: string;
  // transport & hostel
  transport: boolean;
  route: string;
  pickup: string;
  hostel: boolean;
  // previous school
  previousSchool: string;
  board: string;
  lastClass: string;
  tcNo: string;
  // workflow
  status: AdmissionStatus;
  appliedOn: string;
  counselor: string;
  interviewStatus: InterviewStatus;
  interviewDate: string;
  interviewTime: string;
  interviewMode: 'In person' | 'Online';
  interviewResult: '' | 'Recommended' | 'On hold' | 'Not recommended';
  interviewNotes: string;
  feeAmount: number;
  feePaid: number;
  decisionNote: string;
  documents: AdmissionDocRecord[];
  activity: AdmissionLogEntry[];
  notes: AdmissionNote[];
  archived: boolean;
  /** Set when the applicant is enrolled: the student record created for them. */
  studentId: string;
}

export const ADMISSION_DOC_TYPES = ['Birth Certificate', 'ID Proof', 'Address Proof', 'Transfer Certificate', 'Previous Mark Sheet', 'Medical Certificate'] as const;
/** Documents an application needs before enrolment (a Grade 1 child has no earlier school to transfer from). */
export const requiredDocs = (classNo: number): string[] => (classNo <= 1 ? ['Birth Certificate', 'ID Proof', 'Address Proof'] : ['Birth Certificate', 'ID Proof', 'Address Proof', 'Transfer Certificate', 'Previous Mark Sheet']);
export const admissionFeeFor = (classNo: number) => 1000 + classNo * 100;

const FIRST_M = ['Aditya', 'Vihaan', 'Reyansh', 'Ayaan', 'Krish', 'Dev', 'Samar', 'Nikhil'];
const FIRST_F = ['Aaralyn', 'Myra', 'Anika', 'Ira', 'Navya', 'Tara', 'Riya', 'Saanvi'];
const LAST = ['Maria', 'Thomas', 'Iyer', 'Nair', 'Gupta', 'Joseph', 'Rao', 'Pillai', 'Khan', 'Mathew'];
const PARENTS_M = ['Antony', 'Suresh', 'Vikram', 'Rahul', 'Imran', 'Joseph'];
const PARENTS_F = ['Sara', 'Latha', 'Deepa', 'Nisha', 'Fatima', 'Mary'];
const SCHOOLS = ['Little Angels Pre-School', 'St. Mary’s Nursery', 'Sunrise Public School', 'Holy Cross School', 'Greenfield Matriculation'];

export const buildAdmissions = (): AdmissionRecord[] => {
  const rng = makeRng(61000);
  const teachers = buildTeachers();
  const classes = buildClasses();
  const counselors = [...teachers.slice(0, 5).map((t) => t.name), 'Unassigned'];
  // [status, interview, docs-verified count] in application order.
  const plan: [AdmissionStatus, InterviewStatus, number][] = [
    ['Pending', 'Not Scheduled', 1], ['Pending', 'Not Scheduled', 0], ['Pending', 'Not Scheduled', 2], ['Pending', 'Not Scheduled', 1], ['Pending', 'Not Scheduled', 0], ['Pending', 'Not Scheduled', 1], ['Pending', 'Not Scheduled', 0],
    ['Under Review', 'Scheduled', 3], ['Under Review', 'Scheduled', 2], ['Under Review', 'Completed', 4], ['Under Review', 'Not Scheduled', 2], ['Under Review', 'Completed', 3], ['Under Review', 'Scheduled', 1],
    ['Approved', 'Completed', 9], ['Approved', 'Completed', 9], ['Approved', 'Completed', 9], ['Approved', 'Completed', 4],
    ['Waitlisted', 'Completed', 5], ['Waitlisted', 'Completed', 5], ['Waitlisted', 'Completed', 4],
    ['Rejected', 'Completed', 3], ['Rejected', 'Cancelled', 1],
  ];
  return plan.map(([status, interviewStatus, verified], i) => {
    const female = rng.chance(0.5);
    const firstName = rng.pick(female ? FIRST_F : FIRST_M);
    const lastName = rng.pick(LAST);
    const classNo = i === 0 ? 1 : rng.int(1, 10);
    const cls = classes[classNo - 1];
    const appliedOn = addDays(SEED_TODAY, -rng.int(2, 60));
    const age = 5 + classNo;
    const parentIsFather = rng.chance(0.6);
    const parent = `${rng.pick(parentIsFather ? PARENTS_M : PARENTS_F)} ${lastName}`;
    const needed = requiredDocs(classNo);
    const all = [...needed, 'Medical Certificate'];
    // 9 means "everything verified"; otherwise the first `verified` documents are verified and the next two are waiting.
    const documents: AdmissionDocRecord[] = all.map((type, k) => {
      const optional = type === 'Medical Certificate';
      const status: AdmissionDocStatus = verified >= 9 ? 'Verified' : optional ? 'Not Uploaded' : k < verified ? 'Verified' : k < verified + 2 ? 'Pending' : 'Not Uploaded';
      return { type, status, uploadedOn: status === 'Not Uploaded' ? '' : addDays(appliedOn, rng.int(0, 3)) };
    });
    if (status === 'Rejected' && documents[3]) documents[3] = { ...documents[3], status: 'Rejected' };
    const paid = status === 'Approved' && i % 2 === 0 ? admissionFeeFor(classNo) : 0;
    const interviewDate = interviewStatus === 'Not Scheduled' ? '' : addDays(SEED_TODAY, interviewStatus === 'Scheduled' ? rng.int(1, 9) : -rng.int(1, 14));
    const counselor = status === 'Pending' && rng.chance(0.4) ? 'Unassigned' : rng.pick(counselors);
    const activity: AdmissionLogEntry[] = [
      { title: 'Application submitted', by: 'Admin Office', at: `${appliedOn}T10:24:00` },
      { title: 'Documents uploaded', by: 'Parent', at: `${appliedOn}T11:05:00` },
    ];
    if (status !== 'Pending') activity.push({ title: `Assigned to ${counselor}`, by: 'Admin Office', at: `${addDays(appliedOn, 1)}T09:30:00` });
    if (interviewStatus === 'Scheduled' || interviewStatus === 'Completed') activity.push({ title: `Interview ${interviewStatus === 'Completed' ? 'held' : 'scheduled'} for ${interviewDate}`, by: counselor, at: `${addDays(appliedOn, 3)}T12:10:00` });
    if (status === 'Approved') activity.push({ title: 'Application approved', by: 'Principal', at: `${addDays(SEED_TODAY, -rng.int(1, 5))}T15:00:00` });
    if (status === 'Waitlisted') activity.push({ title: 'Moved to waitlist', by: 'Principal', at: `${addDays(SEED_TODAY, -rng.int(1, 5))}T15:00:00` });
    if (status === 'Rejected') activity.push({ title: 'Application rejected', by: 'Principal', at: `${addDays(SEED_TODAY, -rng.int(1, 5))}T15:00:00` });
    return {
      id: `adm-${pad(i + 1)}`,
      applicationNo: `ADM2026${pad(i + 1)}`,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`,
      gender: female ? 'Female' : 'Male',
      dob: `${2026 - age}-${pad(rng.int(1, 12), 2)}-${pad(rng.int(1, 28), 2)}`,
      bloodGroup: rng.pick(['A+', 'B+', 'O+', 'AB+']),
      religion: rng.pick(['Christian', 'Hindu', 'Muslim']),
      nationality: 'Indian',
      motherTongue: rng.pick(['Tamil', 'Malayalam', 'English', 'Hindi']),
      address: `${rng.int(4, 220)}, ${rng.pick(['Franklin Street', 'Lake View Road', 'Temple Street', 'Rose Garden Lane'])}, Chennai`,
      classId: cls.id,
      sectionPref: rng.pick(['A', 'B']),
      academicYear: '2026-27',
      admissionType: classNo > 1 && rng.chance(0.5) ? 'Transfer' : 'New Admission',
      secondLanguage: rng.pick(['Hindi', 'Tamil', 'Spanish']),
      source: rng.pick(['Walk-in', 'Website', 'Referral', 'Event', 'Other'] as const),
      parentName: parent,
      relationship: parentIsFather ? 'Father' : 'Mother',
      parentPhone: `+91 98${rng.int(10000000, 99999999)}`,
      parentEmail: `${parent.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      occupation: rng.pick(['Business Owner', 'Engineer', 'Teacher', 'Doctor', 'Accountant']),
      annualIncome: rng.pick(['$20,000', '$35,000', '$60,000', '$90,000']),
      emergencyName: `${rng.pick(PARENTS_M)} ${lastName}`,
      emergencyRelation: rng.pick(['Uncle', 'Grandfather', 'Aunt']),
      emergencyPhone: `+91 97${rng.int(10000000, 99999999)}`,
      allergies: rng.pick(['None', 'None', 'Dust', 'Peanuts']),
      conditions: rng.pick(['None', 'None', 'None', 'Mild asthma']),
      medications: 'N/A',
      doctorContact: `Dr. ${rng.pick(['Smith', 'Rao', 'Kumar'])} · +91 98${rng.int(10000000, 99999999)}`,
      transport: rng.chance(0.5),
      route: rng.pick(['Route 12 - Downtown', 'Route 4 - Lakeside', 'Route 7 - Airport Road']),
      pickup: rng.pick(['Franklin Street', 'Lake View Corner', 'Temple Junction']),
      hostel: rng.chance(0.1),
      previousSchool: classNo > 1 ? rng.pick(SCHOOLS) : 'Little Angels Pre-School',
      board: rng.pick(['State Board', 'CBSE', 'ICSE']),
      lastClass: classNo > 1 ? `Grade ${classNo - 1}` : 'UKG',
      tcNo: classNo > 1 ? `TC-2026-${pad(rng.int(1, 999))}` : '',
      status,
      appliedOn,
      counselor,
      interviewStatus,
      interviewDate,
      interviewTime: interviewStatus === 'Not Scheduled' ? '' : rng.pick(['10:00', '11:30', '14:00', '15:30']),
      interviewMode: rng.pick(['In person', 'In person', 'Online']),
      interviewResult: interviewStatus === 'Completed' ? (status === 'Rejected' ? 'Not recommended' : status === 'Waitlisted' ? 'On hold' : 'Recommended') : '',
      interviewNotes: interviewStatus === 'Completed' ? 'Confident and well prepared; parents supportive.' : '',
      feeAmount: admissionFeeFor(classNo),
      feePaid: paid,
      decisionNote: status === 'Rejected' ? 'Documents could not be verified within the deadline.' : status === 'Waitlisted' ? 'No seat in the requested section; will be reviewed when a seat opens.' : '',
      documents,
      activity,
      notes: i % 3 === 0 ? [{ text: 'Followed up with the parent about the pending ID proof.', by: counselor === 'Unassigned' ? 'Admin Office' : counselor, at: `${addDays(SEED_TODAY, -1)}T11:00:00` }] : [],
      archived: false,
      studentId: '',
    };
  });
};
export const admissions = defineCollection<AdmissionRecord>('admissions', buildAdmissions);

/* ----------------------------------- Promotion history ----------------------------------- */

export interface PromotionRecord extends Entity {
  batchNo: string;
  academicYear: string;
  kind: 'Promoted' | 'Graduated' | 'Detained';
  fromClassId: string;
  /** '' for graduation and detention (the student stays or leaves). */
  toClassId: string;
  count: number;
  /** Students moved by a batch run in this app; older archived batches only carry a count. */
  studentIds: string[];
  approvedBy: string;
  date: string;
  note: string;
}

export const buildPromotions = (): PromotionRecord[] => {
  const rng = makeRng(62000);
  const out: PromotionRecord[] = [];
  let n = 0;
  for (let c = 1; c <= 9; c++) {
    n += 1;
    out.push({ id: `prm-${pad(n)}`, batchNo: `PB-2025-${pad(n)}`, academicYear: '2025-26', kind: 'Promoted', fromClassId: `cls-${pad(c, 2)}`, toClassId: `cls-${pad(c + 1, 2)}`, count: rng.int(21, 24), studentIds: [], approvedBy: 'Dr. Meera Krishnan', date: addDays(SEED_TODAY, -rng.int(200, 230)), note: 'Term-end promotion.' });
  }
  n += 1;
  out.push({ id: `prm-${pad(n)}`, batchNo: `PB-2025-${pad(n)}`, academicYear: '2025-26', kind: 'Graduated', fromClassId: 'cls-10', toClassId: '', count: 23, studentIds: [], approvedBy: 'Dr. Meera Krishnan', date: addDays(SEED_TODAY, -215), note: 'Grade X graduation.' });
  for (const c of [3, 6, 8]) {
    n += 1;
    out.push({ id: `prm-${pad(n)}`, batchNo: `PB-2025-${pad(n)}`, academicYear: '2025-26', kind: 'Detained', fromClassId: `cls-${pad(c, 2)}`, toClassId: `cls-${pad(c, 2)}`, count: rng.int(1, 3), studentIds: [], approvedBy: 'Dr. Meera Krishnan', date: addDays(SEED_TODAY, -rng.int(200, 230)), note: 'Retained after parent consultation.' });
  }
  return out;
};
export const promotions = defineCollection<PromotionRecord>('promotions', buildPromotions);

/* ---------------------------------------- Alumni ---------------------------------------- */

export interface AlumniChapterRecord extends Entity {
  name: string;
  location: string;
  type: 'Regional' | 'Interest group' | 'Batch group';
  coordinatorId: string;
  status: 'Open' | 'Opening soon';
  meetupTitle: string;
  meetupDate: string;
  description: string;
}

export interface AlumniRecord extends Entity {
  name: string;
  batchYear: number;
  department: string;
  profession: string;
  industry: string;
  company: string;
  role: string;
  country: string;
  city: string;
  chapterId: string;
  email: string;
  phone: string;
  memberSince: string;
  status: 'Active' | 'Pending Verification';
  bio: string;
  skills: string[];
  mentor: boolean;
  recruit: boolean;
  speak: boolean;
  connections: number;
  achievements: string[];
  notes: string[];
  /** Student record this alumnus was created from (graduated through the promotion wizard). */
  studentId: string;
}

export interface AlumniEventRecord extends Entity {
  title: string;
  type: string;
  date: string;
  time: string;
  location: string;
  organizer: string;
  capacity: number;
  registered: number;
  attendeeIds: string[];
  description: string;
}

export interface AlumniOpportunityRecord extends Entity {
  title: string;
  org: string;
  category: string;
  location: string;
  deadline: string;
  postedBy: string;
  openTo: 'Students' | 'Alumni' | 'Students & alumni';
  description: string;
  closed: boolean;
}

export interface AlumniStoryRecord extends Entity {
  headline: string;
  award: string;
  body: string;
  alumnusId: string;
  published: boolean;
}

export interface MentorRequestRecord extends Entity {
  studentId: string;
  /** '' = any available mentor. */
  alumnusId: string;
  focus: string;
  format: string;
  duration: string;
  note: string;
  status: 'Pending' | 'Matched' | 'Completed' | 'Declined';
  requestedOn: string;
}

export const CHAPTER_SEED: [string, string, 'Open' | 'Opening soon', string][] = [
  ['Chennai Chapter', 'Chennai, India', 'Open', 'Annual Alumni Reunion planning'],
  ['Bangalore Chapter', 'Bengaluru, India', 'Open', 'Networking meetup'],
  ['Dubai Chapter', 'Dubai, UAE', 'Open', 'Gulf alumni get-together'],
  ['Singapore Chapter', 'Singapore', 'Open', 'Startup founders’ breakfast'],
  ['USA Chapter', 'New York, USA', 'Open', 'East-coast mentoring circle'],
  ['UK Chapter', 'London, UK', 'Opening soon', 'Launch evening'],
];

const A_FIRST = ['Arun', 'Divya', 'Rahul', 'Sneha', 'Nithya', 'Mohammed', 'Kavin', 'Lakshmi', 'Vivek', 'Anjali', 'Rohit', 'Meena', 'Sanjay', 'Pooja', 'Imran', 'Revathi', 'Naveen', 'Shalini', 'Karthik', 'Aisha'];
const A_LAST = ['Krishnan', 'Menon', 'Sharma', 'Iyer', 'Prakash', 'Faisal', 'Raj', 'Narayan', 'Reddy', 'Nair', 'Thomas', 'Bose', 'George', 'Pillai', 'Khan'];
const PROFESSIONS: [string, string, string, string[]][] = [
  ['Engineering', 'Software & IT', 'Software Engineer', ['Google', 'Microsoft', 'Zoho', 'Infosys', 'Freshworks']],
  ['Medicine', 'Healthcare', 'Consultant Physician', ['Apollo Hospitals', 'Fortis', 'Manipal Hospitals']],
  ['Finance', 'Banking', 'Investment Analyst', ['HSBC', 'Standard Chartered', 'ICICI Bank']],
  ['Design', 'Media', 'Product Designer', ['Adobe', 'Canva', 'Ogilvy']],
  ['Academia', 'Education', 'Assistant Professor', ['IIT Madras', 'NUS', 'University of Edinburgh']],
  ['Entrepreneurship', 'Software & IT', 'Founder & CEO', ['Nexlab Ventures', 'Loopcart', 'Kaiseki Foods']],
];
const LOCATIONS: [string, string, number][] = [['India', 'Chennai', 0], ['India', 'Bengaluru', 1], ['United Arab Emirates', 'Dubai', 2], ['Singapore', 'Singapore', 3], ['United States', 'New York', 4], ['United Kingdom', 'London', 5]];
const DEPARTMENTS = ['Computer Science', 'Commerce', 'Biology', 'Mathematics', 'Arts & Humanities'];
const SKILLS = ['Leadership', 'Public speaking', 'Data analysis', 'Mentoring', 'Product strategy', 'Research', 'Fundraising', 'Design thinking', 'Cloud computing', 'Clinical care'];

export const buildAlumni = (): AlumniRecord[] => {
  const rng = makeRng(63000);
  const out: AlumniRecord[] = [];
  const taken = new Set<string>();
  const named: [string, number, number, number][] = [['Arun Krishnan', 2011, 0, 1], ['Divya Menon', 2016, 1, 0], ['Rahul Sharma', 2008, 5, 3], ['Sneha Iyer', 2014, 3, 4], ['Nithya Prakash', 2019, 2, 0], ['Mohammed Faisal', 2012, 2, 2]];
  for (let i = 0; i < 36; i++) {
    const [fixedName, fixedYear, pi, li] = named[i] ?? ['', 0, -1, -1];
    let name = fixedName;
    while (!name || (!fixedName && taken.has(name))) name = `${rng.pick(A_FIRST)} ${rng.pick(A_LAST)}`;
    taken.add(name);
    const [profession, industry, role, companies] = PROFESSIONS[pi >= 0 ? pi : rng.int(0, PROFESSIONS.length - 1)];
    const [country, city, chapter] = LOCATIONS[li >= 0 ? li : rng.int(0, LOCATIONS.length - 1)];
    const batchYear = fixedYear || rng.int(2005, 2025);
    const company = i < 3 ? ['Google', 'Apollo Hospitals', 'Nexlab Ventures'][i] : rng.pick(companies);
    out.push({
      id: `alu-${pad(i + 1)}`,
      name,
      batchYear,
      department: rng.pick(DEPARTMENTS),
      profession,
      industry,
      company,
      role,
      country,
      city,
      chapterId: `chp-${pad(chapter + 1, 2)}`,
      email: `${name.toLowerCase().replace(/\s+/g, '.')}@alumni.karkaii.demo`,
      phone: `+91 99${rng.int(10000000, 99999999)}`,
      memberSince: addDays(SEED_TODAY, -rng.int(30, 1200)),
      status: i % 11 === 10 ? 'Pending Verification' : 'Active',
      bio: `${role} at ${company}; Batch of ${batchYear}. Happy to help students with career choices.`,
      skills: [rng.pick(SKILLS), rng.pick(SKILLS), rng.pick(SKILLS)].filter((v, k, a) => a.indexOf(v) === k),
      mentor: rng.chance(0.4),
      recruit: rng.chance(0.25),
      speak: rng.chance(0.3),
      connections: rng.int(12, 480),
      achievements: i < 3 ? [['Distinguished Alumnus 2026', 'State Healthcare Excellence Award', 'Young Entrepreneur of the Year'][i]] : [],
      notes: [],
      studentId: '',
    });
  }
  return out;
};
export const alumni = defineCollection<AlumniRecord>('alumni', buildAlumni);

export const alumniChapters = defineCollection<AlumniChapterRecord>('alumniChapters', () =>
  CHAPTER_SEED.map(([name, location, status, meetupTitle], i) => ({
    id: `chp-${pad(i + 1, 2)}`,
    name,
    location,
    type: 'Regional' as const,
    coordinatorId: `alu-${pad([1, 2, 6, 3, 4, 5][i], 3)}`,
    status,
    meetupTitle,
    meetupDate: addDays(SEED_TODAY, 12 + i * 9),
    description: `Alumni living in or near ${location.split(',')[0]} meet, mentor current students and organise local events.`,
  })),
);

export const alumniEvents = defineCollection<AlumniEventRecord>('alumniEvents', () =>
  (
    [
      ['Annual Alumni Reunion', 'Reunion', 22, '18:30', 'Taj Coromandel, Chennai', 'Chennai Chapter', 500, 386],
      ['Silver Jubilee — Batch of 2001', 'Reunion', 40, '10:00', 'School Campus', 'Alumni Office', 180, 142],
      ['Bangalore Networking Meetup', 'Networking Meetup', 55, '19:00', 'Church Street Social', 'Bangalore Chapter', 100, 94],
      ['Alumni Career Fair', 'Career Fair', 70, '09:00', 'Main Sports Complex', 'Alumni Office', 800, 412],
      ['Alumni Startup Summit', 'Startup Summit', 90, '16:00', 'Online · Zoom', 'Entrepreneurs Circle', 400, 231],
      ['Webinar: Studying Abroad', 'Webinar', 105, '18:00', 'Online · Teams', 'UK Chapter', 600, 168],
      ['Alumni vs Students Sports Meet', 'Sports Meet', 125, '08:00', 'School Grounds', 'Alumni Office', 250, 76],
      ['Founders’ Breakfast (past)', 'Networking Meetup', -20, '08:30', 'Marina Bay, Singapore', 'Singapore Chapter', 60, 58],
    ] as const
  ).map(([title, type, inDays, time, location, organizer, capacity, registered], i) => ({
    id: `aev-${pad(i + 1)}`,
    title,
    type,
    date: addDays(SEED_TODAY, inDays),
    time,
    location,
    organizer,
    capacity,
    registered,
    attendeeIds: [],
    description: `${type} hosted by ${organizer}.`,
  })),
);

export const alumniOpportunities = defineCollection<AlumniOpportunityRecord>('alumniOpportunities', () =>
  (
    [
      ['Graduate Software Engineer', 'Google', 'Job', 'Bengaluru, India', 18, 'Arun Krishnan', 'Students & alumni'],
      ['Summer Design Internship', 'Adobe', 'Internship', 'Remote', 9, 'Sneha Iyer', 'Students'],
      ['Alumni Merit Scholarship', 'Nexlab Ventures', 'Scholarship', 'Open to all campuses', 40, 'Rahul Sharma', 'Students'],
      ['Mentorship Cohort — Autumn', 'USA Chapter', 'Mentorship', 'Online', 25, 'Sneha Iyer', 'Students & alumni'],
      ['Supplier Partnership Programme', 'Siemens', 'Business Collaboration', 'Chennai, India', 3, 'Rahul Sharma', 'Alumni'],
      ['Seed Investment — EdTech', 'Loopcart', 'Investment', 'Singapore', 33, 'Rahul Sharma', 'Alumni'],
      ['Weekend Literacy Volunteers', 'Chennai Chapter', 'Volunteer Programme', 'Chennai, India', 14, 'Nithya Prakash', 'Students & alumni'],
      ['Careers in Medicine — Campus Talk', 'Apollo Hospitals', 'Campus Talk', 'School Auditorium', -5, 'Divya Menon', 'Students'],
    ] as const
  ).map(([title, org, category, location, deadlineIn, postedBy, openTo], i) => ({
    id: `aop-${pad(i + 1)}`,
    title,
    org,
    category,
    location,
    deadline: addDays(SEED_TODAY, deadlineIn),
    postedBy,
    openTo,
    description: `${category} offered by ${org}.`,
    closed: false,
  })),
);

export const alumniStories = defineCollection<AlumniStoryRecord>('alumniStories', () => [
  { id: 'ast-001', headline: 'From the school computer lab to leading a platform team', award: 'Distinguished Alumnus 2026', body: 'Arun credits the robotics club for his first line of code. Fifteen years on, he runs the campus hiring drive that has placed 34 students since 2022.', alumnusId: 'alu-001', published: true },
  { id: 'ast-002', headline: 'Building a rural cardiac screening programme across three districts', award: 'State Healthcare Excellence Award', body: 'Divya’s mobile screening units have examined more than 11,000 patients. She returns each Science Day to talk to Grade 10 about medicine as a public service.', alumnusId: 'alu-002', published: true },
  { id: 'ast-003', headline: 'Two scholarships a year, funded by a company started in a hostel room', award: 'Young Entrepreneur of the Year', body: 'Nexlab now employs 240 people across three countries. Rahul endows two full scholarships every year and mentors the Entrepreneurs Circle pitch clinic.', alumnusId: 'alu-003', published: true },
]);

export const mentorRequests = defineCollection<MentorRequestRecord>('mentorRequests', () => {
  const students = buildStudents();
  return [
    { id: 'mnt-001', studentId: students[0].id, alumnusId: 'alu-001', focus: 'Career guidance', format: '1:1 video', duration: '3 months', note: 'Interested in computer science after Grade 12.', status: 'Matched' as const, requestedOn: addDays(SEED_TODAY, -14) },
    { id: 'mnt-002', studentId: students[3].id, alumnusId: '', focus: 'Higher studies', format: 'Email only', duration: 'One session', note: '', status: 'Pending' as const, requestedOn: addDays(SEED_TODAY, -3) },
    { id: 'mnt-003', studentId: students[7].id, alumnusId: 'alu-002', focus: 'Interview preparation', format: 'In person', duration: '6 months', note: 'Medical entrance preparation.', status: 'Pending' as const, requestedOn: addDays(SEED_TODAY, -6) },
    { id: 'mnt-004', studentId: students[11].id, alumnusId: 'alu-003', focus: 'Entrepreneurship', format: '1:1 video', duration: 'One session', note: '', status: 'Completed' as const, requestedOn: addDays(SEED_TODAY, -45) },
  ];
});
