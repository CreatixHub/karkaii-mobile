import type {
  FieldDef,
  FieldErrors,
  FormValues,
} from '../engine/types';

import type {
  AdmissionClass,
} from '@/services/api/admissionMasterApi';

import type {
  AdmissionInput,
} from '@/services/api/admissionApi';

import { ACADEMIC_YEAR_ID } from '@/config/admission';

export function buildAdmissionFields(
  classes: AdmissionClass[]
): FieldDef[] {
  return [
    {
      key: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      section: 'Student Information',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
    },
    {
      key: 'gender',
      label: 'Gender',
      type: 'select',
      options: ['Male', 'Female'],
      required: true,
    },
    {
      key: 'dob',
      label: 'Date of Birth',
      type: 'date',
      required: true,
    },
    {
      key: 'bloodGroup',
      label: 'Blood Group',
      type: 'select',
      options: [
        'A+', 'A-', 'B+', 'B-',
        'AB+', 'AB-', 'O+', 'O-',
      ],
    },
    {
      key: 'classId',
      label: 'Applying for Class',
      type: 'select',
      required: true,
      section: 'Admission Details',
      options: classes.map(c => ({
        label: c.name,
        value: String(c.id),
      })),
    },
    {
      key: 'source',
      label: 'Application Source',
      type: 'select',
      required: true,
      default: 'walk_in',
      options: [
        { label: 'Walk-in', value: 'walk_in' },
        { label: 'Website', value: 'website' },
        { label: 'Referral', value: 'referral' },
        { label: 'Agent', value: 'agent' },
        { label: 'Event', value: 'event' },
        { label: 'Other', value: 'other' },
      ],
    },
    {
      key: 'guardianName',
      label: 'Parent / Guardian Name',
      type: 'text',
      required: true,
      section: 'Parent Information',
    },
    {
      key: 'guardianPhone',
      label: 'Mobile Number',
      type: 'phone',
      required: true,
    },
    {
      key: 'guardianEmail',
      label: 'Email',
      type: 'email',
    },
    {
      key: 'addressLine1',
      label: 'Address',
      type: 'textarea',
    },
    {
      key: 'addressLine2',
      label: 'Additional Address',
      type: 'textarea',
    },
    {
      key: 'previousSchool',
      label: 'Previous School',
      type: 'text',
      section: 'Previous Education',
    },
    {
      key: 'previousClass',
      label: 'Previous Class',
      type: 'text',
    },
    {
      key: 'needsTransport',
      label: 'School Transport Required',
      type: 'switch',
      default: false,
      section: 'Additional Facilities',
    },
    {
      key: 'needsHostel',
      label: 'Hostel Required',
      type: 'switch',
      default: false,
    },
  ];
}

export function validateAdmission(
  values: FormValues,
  classes: AdmissionClass[]
): FieldErrors {
  const errors: FieldErrors = {};

  if (!classes.some(c => String(c.id) === values.classId)) {
    errors.classId = 'Select a valid active class';
  }

  const dob = String(values.dob ?? '');
  const date = new Date(`${dob}T00:00:00Z`);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(dob) ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== dob ||
    date.getTime() >= Date.now()
  ) {
    errors.dob = 'Enter a valid past date of birth';
  }

  const limits: Record<string, number> = {
    firstName: 60,
    lastName: 60,
    guardianName: 120,
    guardianPhone: 20,
    guardianEmail: 254,
    addressLine1: 200,
    addressLine2: 200,
    previousSchool: 200,
    previousClass: 60,
  };

  for (const [key, max] of Object.entries(limits)) {
    if (String(values[key] ?? '').trim().length > max) {
      errors[key] = `Maximum ${max} characters allowed`;
    }
  }

  return errors;
}

export function toAdmissionInput(
  values: FormValues
): AdmissionInput {
  const text = (key: string) =>
    String(values[key] ?? '').trim();

  const optional = (key: string) =>
    text(key) || undefined;

  return {
    academicYearId: ACADEMIC_YEAR_ID,
    classId: text('classId'),
    firstName: text('firstName'),
    lastName: text('lastName'),
    dob: text('dob'),
    gender: optional('gender'),
    bloodGroup: optional('bloodGroup'),
    guardianName: text('guardianName'),
    guardianPhone: text('guardianPhone'),
    guardianEmail: optional('guardianEmail'),
    addressLine1: optional('addressLine1'),
    addressLine2: optional('addressLine2'),
    previousSchool: optional('previousSchool'),
    previousClass: optional('previousClass'),
    needsTransport: values.needsTransport === true,
    needsHostel: values.needsHostel === true,
    source: values.source as AdmissionInput['source'],
  };
}
