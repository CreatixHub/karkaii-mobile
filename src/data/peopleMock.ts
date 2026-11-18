import type {
  AdmissionRecord,
  AlumniRecord,
  DeleteAccountRequestItem,
  DepartmentItem,
  DesignationItem,
  StaffRecord,
  StudentAttendanceHistoryItem,
  StudentDocumentItem,
  StudentPromotionItem,
  StudentRecord,
  TeacherRecord,
  TeacherRoutineSlot,
  UserAccount,
} from '@/types/modules';

/* =========================================================================
   1. STUDENTS ROSTER (PDF Page 20, §7.1.1)
   ========================================================================= */

export const INITIAL_STUDENTS: StudentRecord[] = [
  {
    id: 'std-1',
    admissionNo: 'AD1256589',
    rollNo: '35013',
    name: 'Janet Daniel',
    grade: 'Grade X',
    section: 'A',
    gender: 'Female',
    dob: '2010-06-15',
    parentName: 'David Daniel',
    phone: '+1 555-0192',
    email: 'janet.daniel@karkaii.edu',
    address: '42 Meadow Lane, Oxford',
    status: 'Active',
    attendancePercent: 99,
  },
  {
    id: 'std-2',
    admissionNo: 'ADM-2026-002',
    rollNo: '102',
    name: 'Ethan Davis',
    grade: 'Grade X',
    section: 'B',
    gender: 'Male',
    dob: '2010-09-24',
    parentName: 'Michael Davis',
    phone: '+1 555-0284',
    email: 'ethan.davis@karkaii.edu',
    address: '15 Highfield Road, Oxford',
    status: 'Active',
    attendancePercent: 95,
  },
  {
    id: 'std-3',
    admissionNo: 'ADM-2026-003',
    rollNo: '103',
    name: 'Sophia Williams',
    grade: 'Grade VII',
    section: 'A',
    gender: 'Female',
    dob: '2013-02-18',
    parentName: 'David Williams',
    phone: '+1 555-0371',
    email: 'sophia.w@karkaii.edu',
    address: '88 Rosebury Close, Oxford',
    status: 'Active',
    attendancePercent: 92,
  },
  {
    id: 'std-4',
    admissionNo: 'ADM-2026-004',
    rollNo: '104',
    name: 'Oliver Brown',
    grade: 'Grade IX',
    section: 'C',
    gender: 'Male',
    dob: '2011-11-05',
    parentName: 'James Brown',
    phone: '+1 555-0466',
    email: 'oliver.brown@karkaii.edu',
    address: '23 Willow Way, Oxford',
    status: 'Active',
    attendancePercent: 88,
  },
  {
    id: 'std-5',
    admissionNo: 'ADM-2026-005',
    rollNo: '105',
    name: 'Isabella Johnson',
    grade: 'Grade XI',
    section: 'A',
    gender: 'Female',
    dob: '2009-07-30',
    parentName: 'Thomas Johnson',
    phone: '+1 555-0559',
    email: 'isabella.j@karkaii.edu',
    address: '71 Oakridge Crescent, Oxford',
    status: 'Active',
    attendancePercent: 97,
  },
  {
    id: 'std-6',
    admissionNo: 'ADM-2026-006',
    rollNo: '106',
    name: 'Marcus Vance',
    grade: 'Grade XI',
    section: 'B',
    gender: 'Male',
    dob: '2009-03-12',
    parentName: 'Eleanor Vance',
    phone: '+1 555-0678',
    email: 'marcus.vance@karkaii.edu',
    address: '10 Kingsway Boulevard',
    status: 'Active',
    attendancePercent: 96,
  },
  {
    id: 'std-7',
    admissionNo: 'ADM-2025-098',
    rollNo: '107',
    name: 'Leo Green',
    grade: 'Grade X',
    section: 'A',
    gender: 'Male',
    dob: '2010-08-20',
    parentName: 'Rachel Green',
    phone: '+1 555-0789',
    email: 'leo.green@karkaii.edu',
    address: '5 West End Park',
    status: 'Active',
    attendancePercent: 91,
  },
  {
    id: 'std-8',
    admissionNo: 'ADM-2024-042',
    rollNo: '108',
    name: 'Chloe Bennett',
    grade: 'Grade VIII',
    section: 'B',
    gender: 'Female',
    dob: '2012-05-14',
    parentName: 'George Bennett',
    phone: '+1 555-0890',
    email: 'chloe.bennett@karkaii.edu',
    address: '14 Elm Tree Grove',
    status: 'Transferred',
    attendancePercent: 84,
  },
];

/* =========================================================================
   2. STUDENT 360 PROFILE DETAILS (PDF Page 21, §7.1.2)
   ========================================================================= */

export const MOCK_STUDENT_360 = {
  id: 'std-1',
  admissionNo: 'AD1256589',
  rollNo: '35013',
  name: 'Janet Daniel',
  grade: 'Grade X - A',
  house: 'Emerald Green',
  dob: '15 Jun 2010',
  gender: 'Female',
  bloodGroup: 'O+ Positive',
  religion: 'Christianity',
  father: 'David Daniel (Architect, +1 555-0192)',
  mother: 'Sarah Daniel (Professor, +1 555-0193)',
  email: 'janet.daniel@karkaii.edu',
  phone: '+1 555-0192',
  address: '42 Meadow Lane, Oxford',
  status: 'Active',
  badges: ['Transport Route #4', 'Scholarship Holder', 'Class Prefect'],

  // Tab Stats & Data
  statCards: {
    feesTotal: '$8,400',
    feesPaid: '$6,200',
    feesPending: '$2,200',
    overdueInstallments: 1,
    attendanceRate: '98.5%',
    leavesApproved: 2,
    gpa: '3.98',
    classRank: 'Rank #1',
    booksIssued: 2,
    awardsCount: 4,
  },

  feeInstallments: [
    { group: 'Tuition Fee', code: 'TUI-TRM1', dueDate: '15 Jul 2026', amount: '$3,100', status: 'Paid', refId: 'REC-2026-1042', mode: 'Online Card', paidDate: '10 Jul 2026' },
    { group: 'Tuition Fee', code: 'TUI-TRM2', dueDate: '15 Nov 2026', amount: '$3,100', status: 'Paid', refId: 'REC-2026-8821', mode: 'Net Banking', paidDate: '05 Nov 2026' },
    { group: 'Transport Fee', code: 'TRN-ANN1', dueDate: '01 Aug 2026', amount: '$1,200', status: 'Paid', refId: 'REC-2026-2104', mode: 'UPI Transfer', paidDate: '28 Jul 2026' },
    { group: 'Science & Lab Fee', code: 'LAB-TRM3', dueDate: '15 Dec 2026', amount: '$1,000', status: 'Due', refId: 'INV-2026-4029', mode: 'Pending', paidDate: '-' },
  ],

  examResults: [
    { subject: 'Advanced Mathematics', maxMarks: 100, minMarks: 35, marksObtained: 98, result: 'Pass (A+)' },
    { subject: 'Physics & Optics', maxMarks: 100, minMarks: 35, marksObtained: 96, result: 'Pass (A+)' },
    { subject: 'Chemistry (Organic)', maxMarks: 100, minMarks: 35, marksObtained: 92, result: 'Pass (A)' },
    { subject: 'English Literature', maxMarks: 100, minMarks: 35, marksObtained: 94, result: 'Pass (A)' },
    { subject: 'Computer Science', maxMarks: 100, minMarks: 35, marksObtained: 99, result: 'Pass (A+)' },
  ],

  leaveHistory: [
    { type: 'Medical Sick Leave', from: '12 Oct 2026', to: '13 Oct 2026', days: 2, appliedOn: '11 Oct 2026', status: 'Approved' },
    { type: 'Olympiad Travel Leave', from: '04 Nov 2026', to: '05 Nov 2026', days: 2, appliedOn: '01 Nov 2026', status: 'Approved' },
  ],

  timelineLogs: [
    { date: '17 Nov 2026', event: 'Awarded First Place in Inter-School Science Quiz' },
    { date: '05 Nov 2026', event: 'Term 2 Fee Receipt #REC-2026-8821 generated ($3,100)' },
    { date: '14 Oct 2026', event: 'Appointed as Grade X-A Class Prefect' },
  ],
};

/* =========================================================================
   3. ADMISSIONS PIPELINE (PDF Page 21, §7.1.3)
   ========================================================================= */

export const INITIAL_ADMISSIONS: AdmissionRecord[] = [
  {
    id: 'adm-101',
    applicationNo: 'APP-2026-128',
    studentName: 'Lucas Miller',
    appliedGrade: 'Grade VI',
    guardianName: 'Arthur Miller',
    phone: '+1 555-0921',
    email: 'arthur.miller@gmail.com',
    submissionDate: '15 Nov 2026',
    status: 'Under Review',
    feesPaid: true,
  },
  {
    id: 'adm-102',
    applicationNo: 'APP-2026-129',
    studentName: 'Ava Taylor',
    appliedGrade: 'Grade I',
    guardianName: 'Jessica Taylor',
    phone: '+1 555-0814',
    email: 'jess.taylor@gmail.com',
    submissionDate: '16 Nov 2026',
    status: 'Interview Scheduled',
    feesPaid: true,
  },
  {
    id: 'adm-103',
    applicationNo: 'APP-2026-130',
    studentName: 'Noah Martinez',
    appliedGrade: 'Grade IX',
    guardianName: 'Carlos Martinez',
    phone: '+1 555-0745',
    email: 'carlos.m@gmail.com',
    submissionDate: '17 Nov 2026',
    status: 'Accepted',
    feesPaid: true,
  },
  {
    id: 'adm-104',
    applicationNo: 'APP-2026-131',
    studentName: 'Mia Anderson',
    appliedGrade: 'Pre-Primary (KG)',
    guardianName: 'Sarah Anderson',
    phone: '+1 555-0632',
    email: 'sarah.anderson@gmail.com',
    submissionDate: '17 Nov 2026',
    status: 'Waitlisted',
    feesPaid: false,
  },
  {
    id: 'adm-105',
    applicationNo: 'APP-2026-132',
    studentName: 'Daniel Roberts',
    appliedGrade: 'Grade XI (Science)',
    guardianName: 'Michael Roberts',
    phone: '+1 555-0523',
    email: 'm.roberts@gmail.com',
    submissionDate: '18 Nov 2026',
    status: 'Under Review',
    feesPaid: true,
  },
];

/* =========================================================================
   4. STUDENT PROMOTIONS (PDF Page 22, §7.1.4)
   ========================================================================= */

export const INITIAL_PROMOTIONS: StudentPromotionItem[] = [
  {
    id: 'prm-1',
    studentName: 'Janet Daniel',
    currentGrade: 'Grade IX',
    promotedGrade: 'Grade X',
    gpa: '3.98 / 4.0',
    promotionStatus: 'Promoted',
    academicYear: 'AY 2026-27',
  },
  {
    id: 'prm-2',
    studentName: 'Ethan Davis',
    currentGrade: 'Grade IX',
    promotedGrade: 'Grade X',
    gpa: '3.80 / 4.0',
    promotionStatus: 'Promoted',
    academicYear: 'AY 2026-27',
  },
  {
    id: 'prm-3',
    studentName: 'Oliver Brown',
    currentGrade: 'Grade VIII',
    promotedGrade: 'Grade IX',
    gpa: '3.10 / 4.0',
    promotionStatus: 'Promoted',
    academicYear: 'AY 2026-27',
  },
  {
    id: 'prm-4',
    studentName: 'Sophia Williams',
    currentGrade: 'Grade VI',
    promotedGrade: 'Grade VII',
    gpa: '3.75 / 4.0',
    promotionStatus: 'Promoted',
    academicYear: 'AY 2026-27',
  },
];

/* =========================================================================
   5. ALUMNI DIRECTORY (PDF Page 22, §7.1.5)
   ========================================================================= */

export const INITIAL_ALUMNI: AlumniRecord[] = [
  {
    id: 'alm-1',
    admissionNo: 'ADM-2022-045',
    name: 'Alexander Hayes',
    graduatingBatch: 'Class of 2024',
    higherEducation: 'University of Cambridge, B.A. Law',
    currentProfession: 'Trainee Solicitor at Clifford Chance',
    contactEmail: 'alex.hayes@alumni.karkaii.edu',
    phone: '+44 7700 900123',
  },
  {
    id: 'alm-2',
    admissionNo: 'ADM-2021-018',
    name: 'Jessica Chen',
    graduatingBatch: 'Class of 2023',
    higherEducation: 'Imperial College London, B.Eng Computing',
    currentProfession: 'Machine Learning Engineer at Google',
    contactEmail: 'jess.chen@alumni.karkaii.edu',
    phone: '+44 7700 900456',
  },
  {
    id: 'alm-3',
    admissionNo: 'ADM-2020-092',
    name: 'Benjamin Ross',
    graduatingBatch: 'Class of 2022',
    higherEducation: 'University of Edinburgh, MBChB Medicine',
    currentProfession: 'Resident Physician at Royal Infirmary',
    contactEmail: 'ben.ross@alumni.karkaii.edu',
    phone: '+44 7700 900789',
  },
  {
    id: 'alm-4',
    admissionNo: 'ADM-2019-014',
    name: 'Maya Patel',
    graduatingBatch: 'Class of 2021',
    higherEducation: 'London School of Economics, B.Sc Economics',
    currentProfession: 'Investment Banking Analyst at Goldman Sachs',
    contactEmail: 'maya.patel@alumni.karkaii.edu',
    phone: '+44 7700 900991',
  },
];

/* =========================================================================
   6. STUDENT ATTENDANCE HISTORY (PDF Page 22, §7.1.6)
   ========================================================================= */

export const INITIAL_STUDENT_ATTENDANCE_HISTORY: StudentAttendanceHistoryItem[] = [
  { id: 'sah-1', date: '18 Nov 2026', section: 'Grade X-A', subject: 'Morning Assembly & Homeroom', status: 'Present', timeIn: '08:14 AM', timeOut: '03:30 PM', teacher: 'Aaron Fox', remarks: 'On time, active participation' },
  { id: 'sah-2', date: '17 Nov 2026', section: 'Grade X-A', subject: 'Advanced Mathematics', status: 'Present', timeIn: '08:16 AM', timeOut: '03:30 PM', teacher: 'Aaron Fox', remarks: 'Present all periods' },
  { id: 'sah-3', date: '16 Nov 2026', section: 'Grade X-A', subject: 'Physics Lab', status: 'Present', timeIn: '08:12 AM', timeOut: '03:30 PM', teacher: 'Sarah Mitchell', remarks: 'Present all periods' },
  { id: 'sah-4', date: '15 Nov 2026', section: 'Grade X-A', subject: 'Chemistry Theory', status: 'Present', timeIn: '08:15 AM', timeOut: '03:30 PM', teacher: 'Dr. Bruce Banner', remarks: 'Present all periods' },
  { id: 'sah-5', date: '14 Nov 2026', section: 'Grade X-A', subject: 'English Literature', status: 'Present', timeIn: '08:18 AM', timeOut: '03:30 PM', teacher: 'Clara Oswald', remarks: 'Punctual' },
  { id: 'sah-6', date: '13 Nov 2026', section: 'Grade X-A', subject: 'Computer Science', status: 'Late', timeIn: '08:35 AM', timeOut: '03:30 PM', teacher: 'Amanda Ross', remarks: 'Bus Route 4 traffic delay (Excused)' },
  { id: 'sah-7', date: '04 Nov 2026', section: 'Grade X-A', subject: 'State Olympiad Trials', status: 'Leave', timeIn: '-', timeOut: '-', teacher: 'Aaron Fox', remarks: 'Official school representation leave' },
];

/* =========================================================================
   7. STUDENT DOCUMENTS (PDF Page 23, §7.1.7)
   ========================================================================= */

export const INITIAL_STUDENT_DOCUMENTS: StudentDocumentItem[] = [
  { id: 'doc-1', name: 'Birth_Certificate_Janet_Daniel.pdf', category: 'Identity', verificationStatus: 'Verified', isFavourite: true, studentName: 'Janet Daniel', admissionNo: 'AD1256589', size: '1.4 MB', date: '12 Jul 2024', uploadedBy: 'Admin Office' },
  { id: 'doc-2', name: 'National_Olympiad_Gold_Certificate.pdf', category: 'Academic', verificationStatus: 'Verified', isFavourite: true, studentName: 'Janet Daniel', admissionNo: 'AD1256589', size: '2.1 MB', date: '20 Oct 2026', uploadedBy: 'Dept of Math' },
  { id: 'doc-3', name: 'Immunization_Record_Card.pdf', category: 'Medical', verificationStatus: 'Verified', isFavourite: false, studentName: 'Janet Daniel', admissionNo: 'AD1256589', size: '850 KB', date: '15 Jun 2024', uploadedBy: 'Campus Clinic' },
  { id: 'doc-4', name: 'Previous_School_Transfer_Cert.pdf', category: 'Transfer', verificationStatus: 'Verified', isFavourite: false, studentName: 'Janet Daniel', admissionNo: 'AD1256589', size: '1.1 MB', date: '01 Jul 2024', uploadedBy: 'Front Desk' },
  { id: 'doc-5', name: 'Annual_Sports_Physical_Fit_Cert.pdf', category: 'Medical', verificationStatus: 'Pending', isFavourite: false, studentName: 'Janet Daniel', admissionNo: 'AD1256589', size: '640 KB', date: '10 Nov 2026', uploadedBy: 'Parent Upload' },
];

/* =========================================================================
   8. TEACHERS DIRECTORY (PDF Page 23, §7.2.1)
   ========================================================================= */

export const INITIAL_TEACHERS: TeacherRecord[] = [
  {
    id: 'tch-1',
    employeeId: 'TCH-2024-042',
    name: 'Aaron Fox',
    department: 'Mathematics',
    subjects: ['Advanced Mathematics', 'Calculus', 'Geometry'],
    designation: 'Senior Faculty & Homeroom Head',
    qualification: 'Ph.D. in Pure Mathematics, B.Ed.',
    phone: '+1 (555) 234-8901',
    email: 'aaron.fox@karkaii.edu',
    rating: 4.9,
    passPercentage: 99,
    totalStudents: 142,
    status: 'Active',
    award: 'Teacher of the Year 2026',
  },
  {
    id: 'tch-2',
    employeeId: 'TCH-2024-018',
    name: 'Sarah Mitchell',
    department: 'Physics & Science',
    subjects: ['Physics', 'Optics', 'Astrophysics'],
    designation: 'HOD of Sciences',
    qualification: 'M.Sc. Physics, M.Ed.',
    phone: '+1 (555) 345-6789',
    email: 'sarah.mitchell@karkaii.edu',
    rating: 4.9,
    passPercentage: 98,
    totalStudents: 186,
    status: 'Active',
    award: 'Distinguished Science Mentor',
  },
  {
    id: 'tch-3',
    employeeId: 'TCH-2024-025',
    name: 'Dr. Bruce Banner',
    department: 'Chemistry',
    subjects: ['Organic Chemistry', 'Inorganic Chemistry'],
    designation: 'Senior Chemistry Faculty',
    qualification: 'Ph.D. in Organic Synthesis',
    phone: '+1 (555) 456-7890',
    email: 'bruce.banner@karkaii.edu',
    rating: 4.8,
    passPercentage: 97,
    totalStudents: 160,
    status: 'Active',
  },
  {
    id: 'tch-4',
    employeeId: 'TCH-2024-031',
    name: 'Clara Oswald',
    department: 'Languages & Literature',
    subjects: ['English Literature', 'Creative Writing'],
    designation: 'Head of Humanities',
    qualification: 'M.A. English, B.Ed.',
    phone: '+1 (555) 567-8901',
    email: 'clara.oswald@karkaii.edu',
    rating: 4.8,
    passPercentage: 96,
    totalStudents: 210,
    status: 'Active',
  },
  {
    id: 'tch-5',
    employeeId: 'TCH-2024-055',
    name: 'Amanda Ross',
    department: 'Computer Science',
    subjects: ['Computer Science', 'Python', 'AI Systems'],
    designation: 'Lead STEM Instructor',
    qualification: 'M.S. in Computer Science',
    phone: '+1 (555) 678-9012',
    email: 'amanda.ross@karkaii.edu',
    rating: 4.9,
    passPercentage: 100,
    totalStudents: 175,
    status: 'Active',
  },
];

/* =========================================================================
   9. TEACHER ROUTINE (PDF Page 24, §7.2.4)
   ========================================================================= */

export const INITIAL_TEACHER_ROUTINES: TeacherRoutineSlot[] = [
  { id: 'rout-1', day: 'Monday', time: '09:00 - 09:45 AM', period: 'Period 1', subject: 'Advanced Mathematics', grade: 'Grade X-A', room: 'Room 204', duration: '45m' },
  { id: 'rout-2', day: 'Monday', time: '10:00 - 10:45 AM', period: 'Period 2', subject: 'Calculus & Geometry', grade: 'Grade IX-B', room: 'Room 108', duration: '45m' },
  { id: 'rout-3', day: 'Monday', time: '11:45 - 12:30 PM', period: 'Period 4', subject: 'Linear Algebra Lab', grade: 'Grade XI-A', room: 'Math Lab 1', duration: '45m' },
  { id: 'rout-4', day: 'Tuesday', time: '09:00 - 09:45 AM', period: 'Period 1', subject: 'Advanced Mathematics', grade: 'Grade X-A', room: 'Room 204', duration: '45m' },
  { id: 'rout-5', day: 'Tuesday', time: '10:55 - 11:40 AM', period: 'Period 3', subject: 'Remedial Math Clinic', grade: 'Grade X-B', room: 'Room 204', duration: '45m' },
  { id: 'rout-6', day: 'Wednesday', time: '09:00 - 09:45 AM', period: 'Period 1', subject: 'Trigonometry Deep Dive', grade: 'Grade X-A', room: 'Room 204', duration: '45m' },
  { id: 'rout-7', day: 'Thursday', time: '11:45 - 12:30 PM', period: 'Period 4', subject: 'Math Olympiad Special Session', grade: 'Grade XI-A', room: 'Math Lab 1', duration: '45m' },
  { id: 'rout-8', day: 'Friday', time: '09:00 - 09:45 AM', period: 'Period 1', subject: 'Weekly Quiz & Review', grade: 'Grade X-A', room: 'Room 204', duration: '45m' },
];

/* =========================================================================
   10. STAFF REGISTER (PDF Page 24, §7.3.1)
   ========================================================================= */

export const INITIAL_STAFF: StaffRecord[] = [
  {
    id: 'stf-1',
    staffId: 'EMP-S-001',
    name: 'Arthur Pendelton',
    role: 'Senior Bursar & Accountant',
    department: 'Finance & Accounts',
    phone: '+1 (555) 789-0123',
    email: 'arthur.p@karkaii.edu',
    joinDate: '15 Mar 2021',
    status: 'Active',
  },
  {
    id: 'stf-2',
    staffId: 'EMP-S-002',
    name: 'Eleanor Sterling',
    role: 'Chief Librarian',
    department: 'Library Services',
    phone: '+1 (555) 890-1234',
    email: 'eleanor.s@karkaii.edu',
    joinDate: '01 Aug 2022',
    status: 'Active',
  },
  {
    id: 'stf-3',
    staffId: 'EMP-S-003',
    name: 'George Henderson',
    role: 'Transport Fleet Director',
    department: 'Campus Logistics',
    phone: '+1 (555) 901-2345',
    email: 'george.h@karkaii.edu',
    joinDate: '10 Jan 2020',
    status: 'Active',
  },
  {
    id: 'stf-4',
    staffId: 'EMP-S-004',
    name: 'Rachel Zane',
    role: 'Senior Admissions Officer',
    department: 'Front Desk Administration',
    phone: '+1 (555) 012-3456',
    email: 'rachel.z@karkaii.edu',
    joinDate: '20 May 2023',
    status: 'Active',
  },
  {
    id: 'stf-5',
    staffId: 'EMP-S-005',
    name: 'Nurse Mary Watson',
    role: 'Head of Campus Health & Infirmary',
    department: 'Health Services',
    phone: '+1 (555) 123-4567',
    email: 'mary.watson@karkaii.edu',
    joinDate: '01 Feb 2021',
    status: 'Active',
  },
];

/* =========================================================================
   11. DEPARTMENTS MASTER (PDF Page 25, §7.3.2)
   ========================================================================= */

export const INITIAL_DEPARTMENTS: DepartmentItem[] = [
  { id: 'dept-1', name: 'Mathematics & Computing', headOfDept: 'Aaron Fox', staffCount: 14, budgetAllocated: '$48,000' },
  { id: 'dept-2', name: 'Physics & Natural Sciences', headOfDept: 'Sarah Mitchell', staffCount: 18, budgetAllocated: '$65,000' },
  { id: 'dept-3', name: 'Humanities & Social Sciences', headOfDept: 'Clara Oswald', staffCount: 12, budgetAllocated: '$36,000' },
  { id: 'dept-4', name: 'Physical Education & Athletics', headOfDept: 'Coach David Miller', staffCount: 8, budgetAllocated: '$42,000' },
  { id: 'dept-5', name: 'Finance & Administration', headOfDept: 'Arthur Pendelton', staffCount: 10, budgetAllocated: '$120,000' },
];

/* =========================================================================
   12. DESIGNATIONS MASTER (PDF Page 25, §7.3.3)
   ========================================================================= */

export const INITIAL_DESIGNATIONS: DesignationItem[] = [
  { id: 'des-1', title: 'Senior PGT Faculty', department: 'Academics', totalHolders: 28, level: 'Level 1' },
  { id: 'des-2', title: 'Head of Department (HOD)', department: 'Academics', totalHolders: 8, level: 'Level 2' },
  { id: 'des-3', title: 'Assistant Teacher / TGT', department: 'Academics', totalHolders: 34, level: 'Level 1' },
  { id: 'des-4', title: 'Senior Bursar / Accountant', department: 'Finance & Accounts', totalHolders: 3, level: 'Level 2' },
  { id: 'des-5', title: 'Chief Librarian', department: 'Library', totalHolders: 2, level: 'Level 1' },
  { id: 'des-6', title: 'Transport Logistics Officer', department: 'Operations', totalHolders: 4, level: 'Level 1' },
];

/* =========================================================================
   13. USERS MANAGEMENT (PDF Page 25, §7.4.1)
   ========================================================================= */

export const INITIAL_USERS: UserAccount[] = [
  { id: 'usr-1', username: 'admin', name: 'Super Administrator', email: 'admin@karkaii.edu', role: 'Superadmin', lastLogin: 'Today, 10:45 AM', status: 'Active' },
  { id: 'usr-2', username: 'aaron.fox', name: 'Aaron Fox', email: 'aaron.fox@karkaii.edu', role: 'Teacher', lastLogin: 'Today, 08:30 AM', status: 'Active' },
  { id: 'usr-3', username: 'sarah.m', name: 'Sarah Mitchell', email: 'sarah.mitchell@karkaii.edu', role: 'Teacher', lastLogin: 'Today, 09:10 AM', status: 'Active' },
  { id: 'usr-4', username: 'david.daniel', name: 'David Daniel', email: 'david.daniel@gmail.com', role: 'Parent', lastLogin: 'Yesterday, 06:12 PM', status: 'Active' },
  { id: 'usr-5', username: 'janet.daniel', name: 'Janet Daniel', email: 'janet.daniel@karkaii.edu', role: 'Student', lastLogin: 'Today, 09:15 AM', status: 'Active' },
  { id: 'usr-6', username: 'arthur.p', name: 'Arthur Pendelton', email: 'arthur.p@karkaii.edu', role: 'Accountant', lastLogin: 'Today, 08:00 AM', status: 'Active' },
  { id: 'usr-7', username: 'george.h', name: 'George Henderson', email: 'george.h@karkaii.edu', role: 'Transport Manager', lastLogin: 'Today, 07:15 AM', status: 'Active' },
];

/* =========================================================================
   14. ROLES & PERMISSIONS MATRIX (PDF Page 25, §7.4.2)
   ========================================================================= */

export const INITIAL_ROLES_PERMISSIONS = [
  { id: 'role-1', name: 'Super Admin', usersCount: 3, permissionsCount: 64, type: 'System', status: 'Active', categories: ['Full Access'] },
  { id: 'role-2', name: 'Senior Faculty / Teacher', usersCount: 42, permissionsCount: 28, type: 'Academic', status: 'Active', categories: ['Dashboard', 'Academics', 'Attendance', 'Examinations'] },
  { id: 'role-3', name: 'Accountant / Bursar', usersCount: 4, permissionsCount: 24, type: 'Administrative', status: 'Active', categories: ['Dashboard', 'Finance', 'Invoices', 'Receipts'] },
  { id: 'role-4', name: 'Student Portal User', usersCount: 1250, permissionsCount: 12, type: 'Portal', status: 'Active', categories: ['Timetable', 'Homework', 'Marks', 'Library'] },
  { id: 'role-5', name: 'Parent Portal User', usersCount: 980, permissionsCount: 14, type: 'Portal', status: 'Active', categories: ['Ward Vitals', 'Fees', 'Attendance', 'Live Bus'] },
];

/* =========================================================================
   15. DELETE ACCOUNT REQUESTS (PDF Page 26, §7.4.3)
   ========================================================================= */

export const INITIAL_DELETE_REQUESTS: DeleteAccountRequestItem[] = [
  { id: 'del-1', name: 'Chloe Bennett', userId: 'USR-2024-042', email: 'chloe.bennett@karkaii.edu', userType: 'Student', department: 'Grade VIII-B', reason: 'Student transferred to international school abroad.', requestedDate: '14 Nov 2026', status: 'Pending', reviewer: 'Super Admin' },
  { id: 'del-2', name: 'Marcus Sterling', userId: 'USR-2022-118', email: 'marcus.s@alumni.karkaii.edu', userType: 'Employee', department: 'Campus Logistics', reason: 'Resigned and settled full final clearance.', requestedDate: '10 Nov 2026', status: 'Approved', reviewer: 'Super Admin' },
  { id: 'del-3', name: 'Jessica Vance', userId: 'USR-2023-890', email: 'jessica.v@gmail.com', userType: 'Parent', department: 'Parent Portal', reason: 'Ward completed Grade XII graduation.', requestedDate: '02 Nov 2026', status: 'Approved', reviewer: 'Super Admin' },
];
