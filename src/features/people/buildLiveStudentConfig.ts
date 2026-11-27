import type { ResourceConfig } from '@/features/engine/types';
import type { BackendStudent } from '@/services/api/studentsApi';
import { studentsApi } from '@/services/api/studentsApi';

interface LiveStudent {
  id: string;
  name: string;
  admissionNo: string;
  className: string;
  rollNo: string;
  gender: string;
  dob: string;
  status: string;
  guardianName: string;
  guardianPhone: string;
  bloodGroup: string;
  houseName: string;
  joinedOn: string;
  address: string;
}

function mapStudent(s: BackendStudent): LiveStudent {
  return {
    id: String(s.id),
    name: s.fullName?.trim() ||
      `${s.firstName ?? ''} ${s.lastName ?? ''}`.trim(),
    admissionNo: s.admissionNo ?? '',
    className: s.className ?? 'Not assigned',
    rollNo: String(s.rollNo ?? ''),
    gender: s.gender ?? '',
    dob: s.dob ?? '',
    status: String(s.status ?? 'unknown'),
    guardianName: s.fatherName || s.motherName || '',
    guardianPhone: s.fatherPhone || s.motherPhone || '',
    bloodGroup: s.bloodGroup ?? '',
    houseName: s.houseName ?? '',
    joinedOn: s.admittedOn ?? '',
    address: [s.addressLine1, s.addressLine2, s.postalCode]
      .filter(Boolean)
      .join(', '),
  };
}

const label = (value: string) =>
  value.replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

export const liveStudentsCfg: ResourceConfig<LiveStudent> = {
  entity: 'Student',
  collection: 'students',

  api: {
    async list() {
      const records = await studentsApi.fetchStudents();

      if (!Array.isArray(records)) {
        throw new Error('Invalid student API response');
      }

      return records.map(mapStudent);
    },

    async create() {
      throw new Error('Use the dedicated Add Student form');
    },

    async update() {
      throw new Error('Use the dedicated Edit Student form');
    },
  },

  searchPlaceholder: 'Search name, admission no, class',

  searchText: (r) =>
    `${r.name} ${r.admissionNo} ${r.className} ${r.guardianName}`,

  code: (r) => r.admissionNo,
  title: (r) => r.name,
  subtitle: (r) => r.className,

  status: (r) => ({
    label: label(r.status),
    tone: r.status === 'active' ? 'success' : 'neutral',
  }),

  badges: () => [],

  facts: [
    { label: 'Class', value: (r) => r.className },
    { label: 'Roll no', value: (r) => r.rollNo || '-' },
    { label: 'Guardian', value: (r) => r.guardianName || '-' },
    { label: 'Phone', value: (r) => r.guardianPhone || '-' },
  ],

  detail: [
    {
      title: 'Student Information',
      items: [
        { label: 'Name', value: (r) => r.name },
        { label: 'Admission no', value: (r) => r.admissionNo },
        { label: 'Class', value: (r) => r.className },
        { label: 'Roll no', value: (r) => r.rollNo },
        { label: 'Gender', value: (r) => r.gender },
        { label: 'Date of birth', value: (r) => r.dob },
        { label: 'Blood group', value: (r) => r.bloodGroup },
        { label: 'House', value: (r) => r.houseName },
        { label: 'Joined on', value: (r) => r.joinedOn },
        { label: 'Status', value: (r) => label(r.status) },
      ],
    },
    {
      title: 'Family and Contact',
      items: [
        { label: 'Guardian', value: (r) => r.guardianName },
        { label: 'Phone', value: (r) => r.guardianPhone },
        { label: 'Address', value: (r) => r.address },
      ],
    },
  ],

  stats: [
    {
      label: 'Students loaded',
      value: (rows) => rows.length,
      icon: 'users',
    },
    {
      label: 'Active',
      value: (rows) =>
        rows.filter((r) => r.status === 'active').length,
      icon: 'user-check',
      tone: 'success',
    },
  ],

  views: [
    {
      key: 'all',
      label: 'All Students',
      match: () => true,
    },
    {
      key: 'active',
      label: 'Active',
      match: (r) => r.status === 'active',
    },
    {
      key: 'inactive',
      label: 'Inactive',
      match: (r) => r.status === 'inactive',
    },
  ],

  filters: [],

  sorts: [
    {
      key: 'name',
      label: 'Student name (A-Z)',
      compare: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'recent',
      label: 'Recently added',
      compare: (a, b) => b.joinedOn.localeCompare(a.joinedOn),
    },
  ],

  form: [],
  actions: [],
  bulk: [],
  pageActions: [],

  canCreate: false,
  canEdit: false,
  canDelete: false,
};
