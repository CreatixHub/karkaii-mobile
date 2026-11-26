import type { ApiAdmission } from '@/services/api/admissionApi';
import type { AdmissionRecord } from '@/data/seed/admissionsAlumni';

const STATUS_MAP: Record<string, AdmissionRecord['status']> = {
  enquiry: 'Pending',
  applied: 'Pending',
  document_review: 'Under Review',
  shortlisted: 'Under Review',
  waitlisted: 'Waitlisted',
  offered: 'Approved',
  accepted: 'Enrolled',
  rejected: 'Rejected',
};

const SOURCE_MAP: Record<string, AdmissionRecord['source']> = {
  walk_in: 'Walk-in',
  website: 'Website',
  referral: 'Referral',
  event: 'Event',
  other: 'Other',
};

export type LiveAdmissionRecord = AdmissionRecord & {
  backendStatus: string;
  backendSource: string;
  className: string;
};

type BackendRecord = ApiAdmission & {
  className?: string;
  applicationFee?: string | number | null;
  feePaid?: boolean;
  studentId?: string | null;
  decisionNotes?: string | null;
};

export function toAdmissionRecord(
  record: BackendRecord,
  classes: { id: string; name: string }[]
): LiveAdmissionRecord {
  const fee = Number(record.applicationFee ?? 0);

  return {
    id: String(record.id),
    applicationNo: record.applicationNo,

    firstName: record.firstName,
    lastName: record.lastName,
    name: `${record.firstName} ${record.lastName}`,

    gender: record.gender as AdmissionRecord['gender'],
    dob: record.dob,
    bloodGroup: record.bloodGroup ?? '',
    religion: '',
    nationality: '',
    motherTongue: '',
    address: [
      record.addressLine1,
      record.addressLine2,
    ].filter(Boolean).join(', '),

    classId: String(record.classId),
    className:
      record.className ??
      classes.find(
        (c) => String(c.id) === String(record.classId)
      )?.name ??
      `Class ${record.classId}`,

    sectionPref: '',
    academicYear: String(record.academicYearId),
    admissionType: 'New Admission',
    secondLanguage: '',

    source: SOURCE_MAP[record.source] ?? 'Other',
    backendSource: record.source,

    parentName: record.guardianName,
    parentPhone: record.guardianPhone,
    parentEmail: record.guardianEmail ?? '',

    relationship:
      record.fatherName === record.guardianName
        ? 'Father'
        : record.motherName === record.guardianName
          ? 'Mother'
          : 'Guardian',

    occupation:
      record.fatherName === record.guardianName
        ? record.fatherOccupation ?? ''
        : record.motherName === record.guardianName
          ? record.motherOccupation ?? ''
          : '',

    annualIncome: '',
    emergencyName: '',
    emergencyRelation: '',
    emergencyPhone: '',

    allergies: '',
    conditions: '',
    medications: '',
    doctorContact: '',

    transport: record.needsTransport === true,
    route: '',
    pickup: '',
    hostel: record.needsHostel === true,

    previousSchool: record.previousSchool ?? '',
    board: '',
    lastClass: record.previousClass ?? '',
    tcNo: '',

    status: STATUS_MAP[record.status] ?? 'Pending',
    backendStatus: record.status,
    appliedOn: record.appliedOn,

    counselor: '',
    interviewStatus: 'Not Scheduled',
    interviewDate: '',
    interviewTime: '',
    interviewMode: 'In person',
    interviewResult: '',
    interviewNotes: '',

    feeAmount: Number.isFinite(fee) ? fee : 0,
    feePaid: record.feePaid === true &&
      Number.isFinite(fee) ? fee : 0,

    decisionNote: record.decisionNotes ?? '',

    documents: [],
    activity: [],
    notes: [],

    archived: false,
    studentId: record.studentId
      ? String(record.studentId)
      : '',
  };
}
