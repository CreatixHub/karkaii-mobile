/**
 * Master data that other modules point at by id: classes, sections, students, teachers.
 * Fees, attendance, transport etc. reference these ids so related screens stay consistent.
 */
import { defineCollection, type Entity } from '@/core/store/store';
import { makeRng, pad } from './rng';

export interface ClassRecord extends Entity {
  name: string;
  numeral: string;
  category: 'Primary' | 'Middle' | 'Secondary';
  classTeacherId: string;
  roomNo: string;
  status: 'Active' | 'Inactive';
}

export interface SectionRecord extends Entity {
  classId: string;
  name: string;
  classTeacherId: string;
  roomNo: string;
  floor: string;
  shift: 'Morning' | 'Afternoon';
  medium: string;
  capacity: number;
  status: 'Active' | 'Inactive';
}

export interface StudentRecord extends Entity {
  admissionNo: string;
  name: string;
  gender: 'Male' | 'Female';
  dob: string;
  classId: string;
  sectionId: string;
  rollNo: number;
  house: string;
  parentName: string;
  parentPhone: string;
  email: string;
  bloodGroup: string;
  address: string;
  transport: boolean;
  hostel: boolean;
  scholar: boolean;
  status: 'Active' | 'Inactive' | 'Graduated' | 'Transfer' | 'On Leave';
  joinedOn: string;
}

export interface TeacherRecord extends Entity {
  employeeId: string;
  name: string;
  department: string;
  subjects: string[];
  qualification: string;
  phone: string;
  email: string;
  gender: 'Male' | 'Female';
  experienceYears: number;
  designation: 'Senior Teacher' | 'Assistant Teacher';
  campus: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  joinedOn: string;
}

export interface StaffRecord extends Entity {
  employeeId: string;
  name: string;
  department: string;
  designation: string;
  staffType: 'Administrative' | 'Support';
  campus: string;
  shift: 'Morning' | 'General';
  email: string;
  phone: string;
  employmentType: 'Full-time' | 'Contract';
  joinedOn: string;
  reportsTo: string;
  qualification: string;
  experienceYears: number;
  status: 'Active' | 'On Leave' | 'Probation' | 'Suspended' | 'Inactive';
}

const NUMERALS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

const TEACHERS: [string, string, string[], string, 'Male' | 'Female', number][] = [
  ['Sarah Mitchell', 'Mathematics', ['Mathematics'], 'M.Sc., B.Ed.', 'Female', 12],
  ['Aaron Fox', 'Science', ['Physics', 'Science'], 'M.Sc. Physics', 'Male', 9],
  ['Maria Lopez', 'English', ['English'], 'M.A. English', 'Female', 11],
  ['Jon Park', 'Social Studies', ['History', 'Civics'], 'M.A. History', 'Male', 7],
  ['Neha Rao', 'Languages', ['Hindi', 'Sanskrit'], 'M.A. Hindi', 'Female', 8],
  ['Sam Cole', 'Computer Science', ['Computer Science'], 'MCA', 'Male', 6],
  ['Teresa Bru', 'Science', ['Biology', 'Chemistry'], 'M.Sc. Botany', 'Female', 10],
  ['Rahul Menon', 'Physical Education', ['Physical Education'], 'M.P.Ed.', 'Male', 5],
  ['Anita Desai', 'Arts', ['Art', 'Craft'], 'B.F.A.', 'Female', 4],
  ['Vikram Singh', 'Mathematics', ['Mathematics', 'Statistics'], 'M.Sc. Mathematics', 'Male', 14],
  ['Lakshmi Iyer', 'English', ['English', 'Literature'], 'M.A., B.Ed.', 'Female', 13],
  ['David Kim', 'Social Studies', ['Geography', 'Economics'], 'M.A. Geography', 'Male', 8],
];

const STAFF_ROWS: [string, string, string, StaffRecord['staffType'], string, string, string, number][] = [
  ['Priya Venkatesh', 'Accounts', 'Bursar', 'Administrative', 'Main Campus', 'MBA Finance', 'Principal Office', 11],
  ['Daniel Josua', 'Accounts', 'Accountant', 'Administrative', 'Main Campus', 'B.Com', 'Priya Venkatesh', 6],
  ['William Adams', 'Accounts', 'Cashier', 'Administrative', 'Main Campus', 'B.Com', 'Priya Venkatesh', 4],
  ['Arun Pillai', 'Front Office', 'Front Desk Executive', 'Administrative', 'Main Campus', 'BBA', 'Principal Office', 5],
  ['Sophia Miller', 'Front Office', 'Receptionist', 'Administrative', 'Main Campus', 'B.A.', 'Arun Pillai', 3],
  ['Nandini Rao', 'Library', 'Head Librarian', 'Support', 'Main Campus', 'M.Lib.Sc.', 'Principal Office', 9],
  ['Emily Clark', 'Library', 'Librarian', 'Support', 'North Wing', 'B.Lib.Sc.', 'Nandini Rao', 4],
  ['Imran Sheikh', 'Transport', 'Transport Director', 'Support', 'Main Campus', 'B.E. Mechanical', 'Principal Office', 12],
  ['Jacob Ryan', 'Transport', 'Transport Coordinator', 'Support', 'Main Campus', 'Diploma', 'Imran Sheikh', 5],
  ['Michael Scott', 'IT Support', 'System Administrator', 'Support', 'North Wing', 'B.Sc. IT', 'Principal Office', 7],
  ['Olivia Turner', 'Housekeeping', 'Supervisor', 'Support', 'South Wing', 'High School', 'Imran Sheikh', 8],
  ['Grace Thomas', 'Health', 'School Nurse', 'Support', 'Main Campus', 'B.Sc. Nursing', 'Principal Office', 6],
  ['Mohan Das', 'Security', 'Security Supervisor', 'Support', 'Main Campus', 'High School', 'Principal Office', 10],
  ['Ethan Wright', 'Security', 'Security Head', 'Support', 'South Wing', 'High School', 'Mohan Das', 9],
  ['Ava Robinson', 'Administration', 'Clerk', 'Administrative', 'Main Campus', 'B.A.', 'Rebecca Hall', 2],
  ['Rebecca Hall', 'Administration', 'Admin Officer', 'Administrative', 'Main Campus', 'MBA', 'Principal Office', 8],
  ['Kavitha Suresh', 'Hostel', 'Hostel Warden', 'Support', 'North Wing', 'B.Ed.', 'Principal Office', 7],
];

export const buildStaff = (): StaffRecord[] =>
  STAFF_ROWS.map(([name, department, designation, staffType, campus, qualification, reportsTo, exp], i) => ({
    id: `stf-${pad(i + 1)}`,
    employeeId: `EMP-S${pad(i + 1)}`,
    name,
    department,
    designation,
    staffType,
    campus,
    shift: department === 'Administration' || department === 'Accounts' ? 'General' : 'Morning',
    email: `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[1].toLowerCase()}@karkaii.demo`,
    phone: `+91 98400 3${pad(i + 1, 4)}`,
    employmentType: i % 6 === 5 ? 'Contract' : 'Full-time',
    joinedOn: `${2026 - exp}-0${(i % 8) + 1}-1${i % 9}`,
    reportsTo,
    qualification,
    experienceYears: exp,
    status: i === 14 ? 'Probation' : 'Active',
  }));

export const staff = defineCollection<StaffRecord>('staff', buildStaff);

export const buildTeachers = (): TeacherRecord[] =>
  TEACHERS.map(([name, department, subjects, qualification, gender, exp], i) => ({
    id: `tch-${pad(i + 1)}`,
    employeeId: `EMP-T${pad(i + 1, 2)}`,
    name,
    department,
    subjects,
    qualification,
    phone: `+91 98400 2${pad(i + 1, 4)}`,
    email: `${name.split(' ')[0].toLowerCase()}.${name.split(' ')[1].toLowerCase()}@karkaii.demo`,
    gender,
    experienceYears: exp,
    designation: exp >= 8 ? 'Senior Teacher' : 'Assistant Teacher',
    campus: i === 5 || i === 8 ? 'North Campus' : 'Main Campus',
    status: i === 7 ? 'On Leave' : 'Active',
    joinedOn: `${2026 - exp}-06-${pad(1 + (i % 20), 2)}`,
  }));

export const teachers = defineCollection<TeacherRecord>('teachers', buildTeachers);

export const classes = defineCollection<ClassRecord>('classes', () =>
  NUMERALS.map((n, i) => ({
    id: `cls-${pad(i + 1, 2)}`,
    name: `Grade ${n}`,
    numeral: n,
    category: i < 5 ? 'Primary' : i < 8 ? 'Middle' : 'Secondary',
    classTeacherId: `tch-${pad((i % TEACHERS.length) + 1)}`,
    roomNo: `${i < 5 ? 1 : i < 8 ? 2 : 3}${pad(i + 1, 2)}`,
    status: 'Active',
  })),
);

export const sections = defineCollection<SectionRecord>('sections', () => {
  const out: SectionRecord[] = [];
  NUMERALS.forEach((_, ci) => {
    ['A', 'B'].forEach((name, si) => {
      out.push({
        id: `sec-${pad(ci + 1, 2)}-${name}`,
        classId: `cls-${pad(ci + 1, 2)}`,
        name,
        classTeacherId: `tch-${pad(((ci * 2 + si) % TEACHERS.length) + 1)}`,
        roomNo: `${ci < 5 ? 1 : ci < 8 ? 2 : 3}${pad(ci * 2 + si + 1, 2)}`,
        floor: ci < 5 ? 'Ground' : ci < 8 ? 'First' : 'Second',
        shift: si === 0 ? 'Morning' : 'Afternoon',
        medium: 'English',
        capacity: 40,
        status: 'Active',
      });
    });
  });
  return out;
});

const FIRST_M = ['Aarav', 'Lucas', 'Marcus', 'Ethan', 'Rohan', 'Daniel', 'Arjun', 'Noah', 'Kabir', 'Owen', 'Ishaan', 'Leo'];
const FIRST_F = ['Janet', 'Emma', 'Priya', 'Sophia', 'Ananya', 'Olivia', 'Diya', 'Mia', 'Kavya', 'Ava', 'Meera', 'Zara'];
const LAST = ['Daniel', 'Watson', 'Vance', 'Sharma', 'Nair', 'Fernandes', 'Reddy', 'Khan', 'Thomas', 'Iyer', 'Menon', 'George', 'Patel', 'Joseph'];
const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'O-', 'A-'];
const PARENT_FIRST = ['Robert', 'Michael', 'Suresh', 'Anil', 'Thomas', 'Irfan', 'Naveen', 'Paul', 'Rajesh', 'Giles'];

/** Exported so other seed files can derive records from the *seed* students, not from user-edited ones. */
export function buildStudents(): StudentRecord[] {
  const rng = makeRng(2026);
  const out: StudentRecord[] = [];
  let n = 0;
  // 40 students: two per section, Grade X-A first so the demo student/parent accounts line up.
  for (let ci = 9; ci >= 0; ci--) {
    for (const sec of ['A', 'B']) {
      for (let k = 0; k < 2; k++) {
        n += 1;
        const female = n === 1 ? true : n === 2 ? false : rng.chance(0.5);
        const first = n === 1 ? 'Janet' : n === 2 ? 'Lucas' : rng.pick(female ? FIRST_F : FIRST_M);
        const last = n <= 2 ? 'Daniel' : rng.pick(LAST);
        const parent = n <= 2 ? 'Robert Daniel' : `${rng.pick(PARENT_FIRST)} ${last}`;
        const classNo = ci + 1;
        const year = 2026 - (classNo + 5);
        out.push({
          id: `stu-${pad(n)}`,
          admissionNo: `AD${1256500 + n * 7}`,
          name: `${first} ${last}`,
          gender: female ? 'Female' : 'Male',
          dob: `${year}-${pad(rng.int(1, 12), 2)}-${pad(rng.int(1, 28), 2)}`,
          classId: `cls-${pad(classNo, 2)}`,
          sectionId: `sec-${pad(classNo, 2)}-${sec}`,
          rollNo: 35000 + n * 3,
          house: rng.pick(HOUSES),
          parentName: parent,
          parentPhone: `+91 97${rng.int(10000000, 99999999)}`,
          email: `${first.toLowerCase()}.${last.toLowerCase()}${n}@student.karkaii.demo`,
          bloodGroup: rng.pick(BLOOD),
          address: `${rng.int(4, 220)}, ${rng.pick(['Lake View Road', 'Green Park', 'MG Road', 'Temple Street', 'Rose Garden Lane'])}, Chennai`,
          transport: rng.chance(0.5),
          hostel: rng.chance(0.12),
          scholar: rng.chance(0.2),
          status: n === 17 ? 'On Leave' : n === 31 ? 'Transfer' : 'Active',
          joinedOn: `${year + 5}-06-${pad(rng.int(1, 20), 2)}`,
        });
      }
    }
  }
  return out;
}

export const students = defineCollection<StudentRecord>('students', buildStudents);
