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
  assistantTeacherId: string;
  /** Date the current class / assistant teacher took over (set by "Assign teacher"). */
  teachersEffectiveFrom?: string;
  roomNo: string;
  year: string;
  note: string;
  status: 'Active' | 'New' | 'Inactive' | 'Archived';
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
  year: string;
  note: string;
  /** "Full" is not stored: it is shown when an Active section's students reach its capacity. */
  status: 'Active' | 'Inactive' | 'Archived';
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
  status: 'Active' | 'Inactive' | 'Graduated' | 'Transfer' | 'On Leave' | 'Suspended';
  joinedOn: string;
  motherName: string;
  religion: string;
  nationality: string;
  phone: string;
  emergencyPhone: string;
  previousSchool: string;
  /** Clubs and activities shown as chips: Sports, NCC, Arts… */
  activities: string[];

  // Filled by the Add / Edit Student form (the web app's updated form). Optional, so older records are unaffected.
  academicYear?: string;
  category?: string;
  caste?: string;
  motherTongue?: string;
  languagesKnown?: string[];
  fatherEmail?: string;
  fatherOccupation?: string;
  motherPhone?: string;
  motherEmail?: string;
  motherOccupation?: string;
  /** Who acts as the guardian: the parents, or someone else. */
  guardianType?: 'Parents' | 'Guardian' | 'Others';
  guardianName?: string;
  guardianRelation?: string;
  guardianPhone?: string;
  guardianEmail?: string;
  guardianOccupation?: string;
  guardianAddress?: string;
  /** Brothers and sisters who study at this school (student ids). */
  siblingIds?: string[];
  permanentAddress?: string;
  /** Hostel block and room when the student boards. */
  hostelName?: string;
  hostelRoom?: string;
  previousSchoolAddress?: string;
  bankName?: string;
  bankBranch?: string;
  ifscNumber?: string;
  otherInformation?: string;
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
  designation: string;
  campus: string;
  status: 'Active' | 'Inactive' | 'On Leave';
  joinedOn: string;
  // personal
  dob: string;
  maritalStatus: 'Single' | 'Married';
  languages: string[];
  fatherName: string;
  motherName: string;
  bloodGroup: string;
  address: string;
  permanentAddress: string;
  panId: string;
  notes: string;
  previousSchool: string;
  previousSchoolAddress: string;
  previousSchoolPhone: string;
  // payroll
  epfNo: string;
  basicSalary: number;
  contractType: 'Permanent' | 'Temporary';
  workShift: 'Morning' | 'Afternoon';
  workLocation: string;
  dateOfLeaving: string;
  // yearly leave allowance
  medicalLeaves: number;
  casualLeaves: number;
  maternityLeaves: number;
  sickLeaves: number;
  // bank
  accountName: string;
  accountNumber: string;
  bankName: string;
  ifscCode: string;
  branchName: string;
  // transport / hostel
  route: string;
  vehicleNumber: string;
  pickupPoint: string;
  hostel: string;
  roomNo: string;
  // social + documents
  facebook: string;
  instagram: string;
  linkedin: string;
  youtube: string;
  twitter: string;
  resume: string;
  joiningLetter: string;
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
  gender: 'Male' | 'Female';
  emergencyContact: string;
  emergencyPhone: string;
  performanceNote: string;
  remarks: string;
  lastLogin: string;
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

const FEMALE_STAFF = ['Priya', 'Sophia', 'Nandini', 'Emily', 'Olivia', 'Grace', 'Ava', 'Rebecca', 'Kavitha'];

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
    gender: FEMALE_STAFF.includes(name.split(' ')[0]) ? 'Female' : 'Male',
    emergencyContact: `${['Spouse', 'Parent', 'Sibling'][i % 3]} of ${name.split(' ')[0]}`,
    emergencyPhone: `+91 98410 4${pad(i + 1, 4)}`,
    performanceNote: i % 4 === 0 ? 'Consistently exceeds expectations.' : i % 4 === 1 ? 'Reliable and punctual.' : i % 4 === 2 ? 'Meets expectations; training planned.' : 'Strong team player.',
    remarks: i === 14 ? 'Probation review due this term.' : '',
    lastLogin: ['2h ago', 'Yesterday', '3h ago', 'Today 08:10', '2 days ago'][i % 5],
  }));

export const staff = defineCollection<StaffRecord>('staff', buildStaff);

export const buildTeachers = (): TeacherRecord[] => {
  const rt = makeRng(31337);
  return TEACHERS.map(([name, department, subjects, qualification, gender, exp], i) => ({
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
    dob: `${2026 - 24 - exp - rt.int(0, 6)}-${pad(rt.int(1, 12), 2)}-${pad(rt.int(1, 28), 2)}`,
    maritalStatus: rt.chance(0.7) ? 'Married' : 'Single',
    languages: ['English', ...(rt.chance(0.8) ? ['Tamil'] : []), ...(rt.chance(0.5) ? ['Hindi'] : [])],
    fatherName: `${rt.pick(PARENT_FIRST)} ${name.split(' ')[1]}`,
    motherName: `${rt.pick(['Lakshmi', 'Mary', 'Radha', 'Susan', 'Fatima', 'Geeta'])} ${name.split(' ')[1]}`,
    bloodGroup: rt.pick(BLOOD),
    address: `${rt.int(4, 180)}, ${rt.pick(['Anna Nagar', 'Adyar', 'T. Nagar', 'Velachery', 'Mylapore'])}, Chennai`,
    permanentAddress: `${rt.int(4, 90)}, ${rt.pick(['Gandhi Road', 'Nehru Street', 'Park Lane'])}, ${rt.pick(['Madurai', 'Coimbatore', 'Trichy', 'Chennai'])}`,
    panId: `ABCDE${1000 + i * 37}${String.fromCharCode(65 + (i % 26))}`,
    notes: '',
    previousSchool: exp > 5 ? `${rt.pick(['St. Mary', 'Lakshmi', 'National', 'Sunrise'])} Matriculation School` : '',
    previousSchoolAddress: exp > 5 ? `${rt.pick(['Salem', 'Erode', 'Chennai', 'Vellore'])}, Tamil Nadu` : '',
    previousSchoolPhone: exp > 5 ? `+91 44 2${rt.int(1000000, 9999999)}` : '',
    epfNo: `EPF-TN-${40000 + i * 13}`,
    basicSalary: 2800 + exp * 120,
    contractType: i === 8 ? 'Temporary' : 'Permanent',
    workShift: 'Morning',
    workLocation: i === 5 || i === 8 ? 'North Campus' : 'Main Campus',
    dateOfLeaving: '',
    medicalLeaves: 8,
    casualLeaves: 12,
    maternityLeaves: gender === 'Female' ? 90 : 0,
    sickLeaves: 10,
    accountName: name,
    accountNumber: `${rt.int(10000000, 99999999)}${rt.int(1000, 9999)}`,
    bankName: rt.pick(['State Bank of India', 'HDFC Bank', 'Indian Bank', 'ICICI Bank']),
    ifscCode: `${rt.pick(['SBIN', 'HDFC', 'IDIB', 'ICIC'])}0${rt.int(100000, 999999)}`,
    branchName: rt.pick(['Anna Nagar', 'Adyar', 'T. Nagar', 'Mylapore']),
    route: '',
    vehicleNumber: '',
    pickupPoint: '',
    hostel: '',
    roomNo: '',
    facebook: '',
    instagram: '',
    linkedin: `linkedin.com/in/${name.toLowerCase().replace(' ', '-')}`,
    youtube: '',
    twitter: '',
    resume: `${name.replace(' ', '_')}_Resume.pdf`,
    joiningLetter: `${name.replace(' ', '_')}_Joining_Letter.pdf`,
  }));
};

export const teachers = defineCollection<TeacherRecord>('teachers', buildTeachers);

export const buildClasses = (): ClassRecord[] =>
  NUMERALS.map((n, i) => ({
    id: `cls-${pad(i + 1, 2)}`,
    name: `Grade ${n}`,
    numeral: n,
    category: i < 5 ? 'Primary' : i < 8 ? 'Middle' : 'Secondary',
    classTeacherId: `tch-${pad((i % TEACHERS.length) + 1)}`,
    assistantTeacherId: `tch-${pad(((i + 5) % TEACHERS.length) + 1)}`,
    roomNo: `${i < 5 ? 1 : i < 8 ? 2 : 3}${pad(i + 1, 2)}`,
    year: '2026-27',
    note: i === 7 ? 'Newly introduced this academic year.' : '',
    status: i === 7 ? 'New' : 'Active',
  }));

export const classes = defineCollection<ClassRecord>('classes', buildClasses);

export function buildSections(): SectionRecord[] {
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
        // A few sections are deliberately at capacity so the "Full" state is real.
        capacity: ['9A', '6B', '4A'].includes(`${ci}${name}`) ? 12 : 15,
        year: '2026-27',
        note: '',
        status: 'Active',
      });
    });
  });
  return out;
}

export const sections = defineCollection<SectionRecord>('sections', buildSections);

const FIRST_M =['Aarav', 'Lucas', 'Marcus', 'Ethan', 'Rohan', 'Daniel', 'Arjun', 'Noah', 'Kabir', 'Owen', 'Ishaan', 'Leo'];
const FIRST_F = ['Janet', 'Emma', 'Priya', 'Sophia', 'Ananya', 'Olivia', 'Diya', 'Mia', 'Kavya', 'Ava', 'Meera', 'Zara'];
const LAST = ['Daniel', 'Watson', 'Vance', 'Sharma', 'Nair', 'Fernandes', 'Reddy', 'Khan', 'Thomas', 'Iyer', 'Menon', 'George', 'Patel', 'Joseph'];
const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
const BLOOD = ['A+', 'B+', 'O+', 'AB+', 'O-', 'A-'];
const PARENT_FIRST = ['Robert', 'Michael', 'Suresh', 'Anil', 'Thomas', 'Irfan', 'Naveen', 'Paul', 'Rajesh', 'Giles'];

/** Exported so other seed files can derive records from the *seed* students, not from user-edited ones. */
export function buildStudents(): StudentRecord[] {
  const rng = makeRng(2026);
  // New descriptive fields use their own generator so the original student values never change.
  const rx = makeRng(9001);
  const out: StudentRecord[] = [];
  let n = 0;
  // 240 students: twelve per section, Grade X-A first so the demo student/parent accounts line up.
  for (let ci = 9; ci >= 0; ci--) {
    for (const sec of ['A', 'B']) {
      for (let k = 0; k < 12; k++) {
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
          motherName: `${rx.pick(FIRST_F)} ${last}`,
          religion: rx.pick(['Christian', 'Hindu', 'Muslim', 'Hindu', 'Sikh']),
          nationality: 'Indian',
          phone: `+91 96${rx.int(10000000, 99999999)}`,
          emergencyPhone: `+91 95${rx.int(10000000, 99999999)}`,
          previousSchool: classNo > 1 && rx.chance(0.6) ? `${rx.pick(['St. Joseph', 'Little Flower', 'Greenfield', 'Holy Cross'])} School, ${rx.pick(['Chennai', 'Madurai', 'Coimbatore'])}` : '',
          activities: [...(rx.chance(0.3) ? ['Sports'] : []), ...(rx.chance(0.12) ? ['NCC'] : []), ...(rx.chance(0.18) ? ['Arts'] : [])],
        });
      }
    }
  }
  return out;
}

export const students = defineCollection<StudentRecord>('students', buildStudents);
