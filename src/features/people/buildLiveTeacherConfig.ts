import React from 'react';
import { TeacherStatusPanel } from './TeacherStatusPanel';
import type { ResourceConfig } from '@/features/engine/types';
import { staffApi } from '@/services/api/staffApi';
import type { BackendStaff } from '@/services/api/staffApi';

interface LiveTeacher {
  id: string;
  employeeNo: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  bloodGroup: string;
  status: string;
  employmentType: string;
  qualification: string;
  experience: string;
  joinedOn: string;
  address: string;
  classes: string[];
  sections: string[];
  subjects: string[];
  photoFileId: string | null;
}

const label = (value: string) =>
  value.replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const names = (value: unknown): string[] =>
  Array.isArray(value)
    ? [...new Set(value.filter(
        (item): item is string =>
          typeof item === 'string' && !!item.trim()
      ))]
    : [];

const display = (value: string) => value || '-';

const assigned = (values: string[]) =>
  values.length ? values.join(', ') : 'Not assigned';

function mapTeacher(s: BackendStaff): LiveTeacher {
  return {
    id: String(s.id),
    employeeNo: s.employeeNo ?? '',
    name: s.fullName?.trim() ||
      [s.firstName, s.lastName].filter(Boolean).join(' ') ||
      'Name unavailable',

    email: s.email ?? '',
    phone: s.phone ?? '',
    gender: s.gender ?? '',
    dob: s.dob ?? '',
    bloodGroup: s.bloodGroup ?? '',
    status: s.status ?? 'unknown',
    employmentType: s.employmentType ?? '',
    qualification: s.qualification ?? '',

    experience:
      s.experienceYears == null || s.experienceYears === ''
        ? ''
        : `${s.experienceYears} years`,

    joinedOn: s.joinedOn ?? '',

    address: [
      s.addressLine1,
      s.addressLine2,
      s.postalCode,
    ].filter(Boolean).join(', '),

    classes: names(s.teaching?.classes),
    sections: names(s.teaching?.sections),
    subjects: names(s.teaching?.subjects),

    photoFileId:
      s.photoFileId == null
        ? null
        : String(s.photoFileId),
  };
}

export const liveTeachersCfg: ResourceConfig<LiveTeacher> = {
  entity: 'Teacher',
  collection: 'teachers',

  api: {
    async list() {
      const records = await staffApi.fetchTeachers();
      return records.map(mapTeacher);
    },

    async create() {
      throw new Error('Live teacher creation is not enabled yet');
    },

    async update() {
      throw new Error('Live teacher editing is not enabled yet');
    },
  },

  searchPlaceholder: 'Search teacher, ID, subject or email',

  searchText: (r) =>
    [
      r.name,
      r.employeeNo,
      r.email,
      r.phone,
      ...r.classes,
      ...r.subjects,
    ].join(' '),

  code: (r) => r.employeeNo,
  title: (r) => r.name,
  subtitle: (r) => label(r.employmentType),

  status: (r) => ({
    label: label(r.status),
    tone:
      r.status === 'active'
        ? 'success'
        : r.status === 'on_leave'
          ? 'warning'
          : r.status === 'suspended'
            ? 'danger'
            : 'neutral',
  }),

  badges: () => [],

  facts: [
    { label: 'Subjects', value: (r) => assigned(r.subjects) },
    { label: 'Classes', value: (r) => assigned(r.classes) },
    { label: 'Phone', value: (r) => display(r.phone) },
    { label: 'Email', value: (r) => display(r.email) },
    { label: 'Qualification', value: (r) => display(r.qualification) },
    { label: 'Experience', value: (r) => display(r.experience) },
  ],

  detail: [
    {
      title: 'Teacher Information',
      items: [
        { label: 'Employee ID', value: (r) => r.employeeNo },
        { label: 'Name', value: (r) => r.name },
        { label: 'Gender', value: (r) => display(r.gender) },
        { label: 'Date of birth', value: (r) => display(r.dob) },
        { label: 'Blood group', value: (r) => display(r.bloodGroup) },
        { label: 'Status', value: (r) => label(r.status) },
      ],
    },
    {
      title: 'Professional Information',
      items: [
        { label: 'Employment', value: (r) => label(r.employmentType) },
        { label: 'Qualification', value: (r) => display(r.qualification) },
        { label: 'Experience', value: (r) => display(r.experience) },
        { label: 'Joined on', value: (r) => display(r.joinedOn) },
      ],
    },
    {
      title: 'Classes and Subjects',
      items: [
        { label: 'Classes', value: (r) => assigned(r.classes) },
        { label: 'Sections', value: (r) => assigned(r.sections) },
        { label: 'Subjects', value: (r) => assigned(r.subjects) },
      ],
    },
    {
      title: 'Contact Information',
      items: [
        { label: 'Phone', value: (r) => display(r.phone) },
        { label: 'Email', value: (r) => display(r.email) },
        { label: 'Address', value: (r) => display(r.address) },
      ],
    },
  ],

  stats: [
    {
      label: 'Teachers',
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
    {
      label: 'On leave',
      value: (rows) =>
        rows.filter((r) => r.status === 'on_leave').length,
      icon: 'calendar',
      tone: 'warning',
    },
    {
      label: 'Inactive',
      value: (rows) =>
        rows.filter((r) =>
          r.status === 'inactive' || r.status === 'suspended' || r.status === 'left'
        ).length,
      icon: 'user-x',
      tone: 'neutral',
    },
  ],

  views: [
    { key: 'all', label: 'All Teachers', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'active' },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'inactive' },
    { key: 'leave', label: 'On Leave', match: (r) => r.status === 'on_leave' },
    { key: 'suspended', label: 'Suspended', match: (r) => r.status === 'suspended' },
    { key: 'left', label: 'Left', match: (r) => r.status === 'left' },
  ],

  filters: [
    {
      key: 'class',
      label: 'Class',
      options: (rows) =>
        [...new Set(rows.flatMap((r) => r.classes))]
          .sort()
          .map((name) => ({ label: name, value: name })),
      match: (r, v) => r.classes.includes(v),
    },
    {
      key: 'subject',
      label: 'Subject',
      options: (rows) =>
        [...new Set(rows.flatMap((r) => r.subjects))]
          .sort()
          .map((name) => ({ label: name, value: name })),
      match: (r, v) => r.subjects.includes(v),
    },
  ],

  sorts: [
    {
      key: 'name',
      label: 'Teacher name (A-Z)',
      compare: (a, b) => a.name.localeCompare(b.name),
    },
    {
      key: 'recent',
      label: 'Recently joined',
      compare: (a, b) => b.joinedOn.localeCompare(a.joinedOn),
    },
  ],

  liveExtra: (r, ctx) =>
    React.createElement(TeacherStatusPanel, {
      key: r.id,
      teacherId: r.id,
      teacherName: r.name,
      currentStatus: r.status,
      canManage: ctx.canManage && ctx.role === 'admin',
      refresh: ctx.refresh,
    }),

  form: [],
  actions: [],
  bulk: [],
  pageActions: [],

  canCreate: false,
  canEdit: false,
  canDelete: false,
};