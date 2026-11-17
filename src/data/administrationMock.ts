import type {
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
