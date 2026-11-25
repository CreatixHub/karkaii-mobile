/** Demo accounts for mock mode (one per role). Plain data so seeds and screens can use it without React. */
import type { RoleKey } from './access';

export const DEMO_PASSWORD = 'Karkaii@123';

export interface MockUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: RoleKey;
  title: string;
  /** Shown instead of the built-in role label when the account's role has no profile of its own (Staff, custom roles). */
  roleName?: string;
  /** Students/parents/teachers are tied to records in the seed data. */
  studentId?: string;
  childIds?: string[];
  teacherId?: string;
  school: string;
}

const SCHOOL = 'Karkaii International School';

export const MOCK_USERS: MockUser[] = [
  { id: 'usr-admin', name: 'Dr. Meera Krishnan', email: 'admin@karkaii.demo', phone: '+91 98400 11001', role: 'admin', title: 'Principal', school: SCHOOL },
  { id: 'usr-teacher', name: 'Sarah Mitchell', email: 'teacher@karkaii.demo', phone: '+91 98400 11002', role: 'teacher', title: 'Senior Mathematics Faculty', teacherId: 'tch-001', school: SCHOOL },
  { id: 'usr-student', name: 'Janet Daniel', email: 'student@karkaii.demo', phone: '+91 98400 11003', role: 'student', title: 'Class X-A', studentId: 'stu-001', school: SCHOOL },
  { id: 'usr-parent', name: 'Robert Daniel', email: 'parent@karkaii.demo', phone: '+91 98400 11004', role: 'parent', title: 'Parent of 2 students', childIds: ['stu-001', 'stu-002'], school: SCHOOL },
  { id: 'usr-accounts', name: 'Priya Venkatesh', email: 'accounts@karkaii.demo', phone: '+91 98400 11005', role: 'accountant', title: 'Bursar', school: SCHOOL },
  { id: 'usr-frontdesk', name: 'Arun Pillai', email: 'frontdesk@karkaii.demo', phone: '+91 98400 11006', role: 'receptionist', title: 'Front Desk Executive', school: SCHOOL },
  { id: 'usr-librarian', name: 'Nandini Rao', email: 'librarian@karkaii.demo', phone: '+91 98400 11007', role: 'librarian', title: 'Head Librarian', school: SCHOOL },
  { id: 'usr-warden', name: 'Kavitha Suresh', email: 'warden@karkaii.demo', phone: '+91 98400 11008', role: 'warden', title: 'Hostel Warden', school: SCHOOL },
  { id: 'usr-transport', name: 'Imran Sheikh', email: 'transport@karkaii.demo', phone: '+91 98400 11009', role: 'transport_manager', title: 'Transport Director', school: SCHOOL },
  { id: 'usr-nurse', name: 'Grace Thomas', email: 'nurse@karkaii.demo', phone: '+91 98400 11010', role: 'nurse', title: 'School Nurse', school: SCHOOL },
  { id: 'usr-security', name: 'Mohan Das', email: 'security@karkaii.demo', phone: '+91 98400 11011', role: 'security', title: 'Security Supervisor', school: SCHOOL },
];
