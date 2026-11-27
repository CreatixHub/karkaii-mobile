import type { FieldDef } from '@/features/engine/types';
import type { AdmissionClass, AdmissionAcademicYear } from '@/services/api/admissionMasterApi';


const SUPPORTED_FIELDS = new Set([
  'firstName',
  'lastName',
  'gender',
  'dob',
  'bloodGroup',
  'address',
  'classId',
  'academicYear',
  'source',
  'parentName',
  'relationship',
  'parentPhone',
  'parentEmail',
  'occupation',
  'transport',
  'hostel',
  'previousSchool',
  'lastClass',
]);

export function configureAdmissionFields(
  original: FieldDef[],
  classes: AdmissionClass[],
  academicYear: AdmissionAcademicYear
): FieldDef[] {
  const fields: FieldDef[] = original.some(
    (field) => field.key === 'academicYear'
  )
    ? original
    : [
        ...original,
        {
          key: 'academicYear',
          label: 'Academic Year',
          type: 'select',
          required: true,
          section: 'Admission Details',
        },
      ];

  return fields
    .filter((field) => SUPPORTED_FIELDS.has(field.key))
    .map((field): FieldDef => {
      switch (field.key) {
        case 'classId':
          return {
            ...field,
            optionsFrom: undefined,
            options: classes.map((c) => ({
              label: c.name,
              value: String(c.id),
            })),
          };

        case 'academicYear':
          return {
            ...field,
            type: 'select',
            required: true,
            optionsFrom: undefined,
            options: [{
              label: academicYear.name,
              value: String(academicYear.id),
            }],
            default: String(academicYear.id),
            readOnly: () => true,
            hint: 'Current academic year from the school server.',
          };

        case 'relationship':
          return {
            ...field,
            default: 'Guardian',
          };

        case 'occupation':
          return {
            ...field,
            hidden: (v) =>
              v.relationship !== 'Father' &&
              v.relationship !== 'Mother',
          };

        case 'parentName':
          return {
            ...field,
            section: 'Guardian Information',
          };

        case 'source':
          return {
            ...field,
            required: true,
            options: [
              'Walk-in',
              'Website',
              'Referral',
              'Agent',
              'Event',
              'Other',
            ],
          };

        default:
          return { ...field };
      }
    });
}

