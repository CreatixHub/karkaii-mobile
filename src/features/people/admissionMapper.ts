import type { FormValues } from '@/features/engine/types';
import type { AdmissionInput } from '@/services/api/admissionApi';

const SOURCE_MAP: Record<string, AdmissionInput['source']> = {
  'Walk-in': 'walk_in',
  Website: 'website',
  Referral: 'referral',
  Agent: 'agent',
  Event: 'event',
  Other: 'other',
};

const clean = (value: unknown): string =>
  String(value ?? '').trim();

const optional = (value: unknown): string | undefined =>
  clean(value) || undefined;

export function toApiAdmission(
  values: FormValues,
  academicYearId: string
): AdmissionInput {
  const source = SOURCE_MAP[clean(values.source)];

  if (!source) {
    throw new Error('Select a valid application source');
  }

  if (!/^[1-9]\d*$/.test(academicYearId)) {
    throw new Error('Select a valid academic year');
  }

  if (!/^[1-9]\d*$/.test(clean(values.classId))) {
    throw new Error('Select a valid school class');
  }

  const input: AdmissionInput = {
    academicYearId,
    classId: clean(values.classId),

    firstName: clean(values.firstName),
    lastName: clean(values.lastName),
    dob: clean(values.dob),
    gender: optional(values.gender),
    bloodGroup: optional(values.bloodGroup),

    guardianName: clean(values.parentName),
    guardianPhone: clean(values.parentPhone),
    guardianEmail: optional(values.parentEmail),

    addressLine1: optional(values.address),

    previousSchool: optional(values.previousSchool),
    previousClass: optional(values.lastClass),

    needsTransport: values.transport === true,
    needsHostel: values.hostel === true,

    source,
  };

  if (values.relationship === 'Father') {
    input.fatherName = input.guardianName;
    input.fatherPhone = input.guardianPhone;
    input.fatherOccupation = optional(values.occupation);
  }

  if (values.relationship === 'Mother') {
    input.motherName = input.guardianName;
    input.motherPhone = input.guardianPhone;
    input.motherOccupation = optional(values.occupation);
  }

  if (!input.firstName || !input.lastName ||
      !input.guardianName || !input.guardianPhone) {
    throw new Error('Complete all required admission fields');
  }

  if ((input.addressLine1?.length ?? 0) > 200) {
    throw new Error('Address must not exceed 200 characters');
  }

  return input;
}
