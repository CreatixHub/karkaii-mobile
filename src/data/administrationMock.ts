import type {
  AuditLogItem,
  BranchItem,
  RolePermissionItem,
  SchoolSetting,
} from '@/types/modules';

export const INITIAL_ROLES: RolePermissionItem[] = [
  {
    id: 'rol-1',
    role: 'Superadmin',
    description: 'Unrestricted full access across all schools and tenant operations.',
    usersCount: 2,
    permissions: {
      students: { view: true, create: true, edit: true, delete: true },
      academics: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, create: true, edit: true, delete: true },
      staff: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: 'rol-2',
    role: 'Administrator',
    description: 'School principal and senior leadership operational access.',
    usersCount: 5,
    permissions: {
      students: { view: true, create: true, edit: true, delete: false },
      academics: { view: true, create: true, edit: true, delete: true },
      finance: { view: true, create: true, edit: true, delete: false },
      staff: { view: true, create: true, edit: true, delete: true },
    },
  },
  {
    id: 'rol-3',
    role: 'Teacher',
    description: 'Class, attendance, homework, exams, and student grading privileges.',
    usersCount: 48,
    permissions: {
      students: { view: true, create: false, edit: false, delete: false },
      academics: { view: true, create: true, edit: true, delete: false },
      finance: { view: false, create: false, edit: false, delete: false },
      staff: { view: false, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'rol-4',
    role: 'Accountant',
    description: 'Fee collection, invoices, receipts, and operational expenses.',
    usersCount: 4,
    permissions: {
      students: { view: true, create: false, edit: false, delete: false },
      academics: { view: false, create: false, edit: false, delete: false },
      finance: { view: true, create: true, edit: true, delete: false },
      staff: { view: false, create: false, edit: false, delete: false },
    },
  },
];

export const INITIAL_SCHOOL_SETTING: SchoolSetting = {
  schoolName: 'Oxford International School',
  schoolCode: 'OXF-2026-UK',
  email: 'contact@oxfordschool.edu',
  phone: '+44 1865 270000',
  address: 'Wellington Square, Oxford, OX1 2JD, United Kingdom',
  currentAcademicYear: 'AY 2026-27',
  currency: 'USD ($)',
  timezone: 'Europe/London (GMT+0)',
};

export const INITIAL_BRANCHES: BranchItem[] = [
  {
    id: 'br-1',
    name: 'Oxford International (Main Campus)',
    campusCode: 'OXF-MAIN',
    address: 'Wellington Square, Oxford, UK',
    principal: 'Arthur Wright',
    totalStudents: 1450,
    phone: '+44 1865 270000',
    email: 'main@oxfordschool.edu',
    isMain: true,
  },
  {
    id: 'br-2',
    name: 'Sunrise Public Campus (North Branch)',
    campusCode: 'OXF-NORTH',
    address: '24 Banbury Road, Summertown, Oxford',
    principal: 'Dr. Helen Harper',
    totalStudents: 820,
    phone: '+44 1865 270110',
    email: 'north@oxfordschool.edu',
    isMain: false,
  },
  {
    id: 'br-3',
    name: 'Riverside Academy (West Branch)',
    campusCode: 'OXF-WEST',
    address: '15 Botley Road, Oxford',
    principal: 'Marcus Thornton',
    totalStudents: 640,
    phone: '+44 1865 270220',
    email: 'west@oxfordschool.edu',
    isMain: false,
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    timestamp: 'Today, 10:14 AM',
    user: 'Arthur Pendelton',
    action: 'Issued Fee Receipt #RCP-2026-501 ($1,450)',
    module: 'Finance & Accounts',
    ipAddress: '192.168.1.42',
    status: 'Success',
  },
  {
    id: 'aud-2',
    timestamp: 'Today, 09:30 AM',
    user: 'Sarah Mitchell',
    action: 'Marked Class Attendance for Grade XII-A',
    module: 'Academic',
    ipAddress: '192.168.1.18',
    status: 'Success',
  },
  {
    id: 'aud-3',
    timestamp: 'Today, 08:45 AM',
    user: 'Jane Cooper',
    action: 'Created Admission File APP-2026-128',
    module: 'People & Admission',
    ipAddress: '192.168.1.12',
    status: 'Success',
  },
  {
    id: 'aud-4',
    timestamp: 'Yesterday, 05:20 PM',
    user: 'Security Gate 1',
    action: 'Exited Visitor Pass #GP-2026-904',
    module: 'Campus Operations',
    ipAddress: '192.168.1.99',
    status: 'Success',
  },
];

