/** Rules of the admissions pipeline: document checks, fees, the stage timeline and turning an applicant into a student. */
import { repo, snapshot } from '@/core/store/store';
import { addDays, formatDate, todayISO } from '@/core/utils/date';
import { requiredDocs, type AdmissionDocRecord, type AdmissionRecord } from '@/data/seed/admissionsAlumni';
import type { SectionRecord, StudentRecord } from '@/data/seed/master';
import { logAudit } from '@/features/common/audit';
import { nextNo } from '@/features/common/refs';
import type { HealthRecord, StudentDocumentRecord } from '@/data/seed/studentLife';
import { classNoOf, freeSeats } from './promotionLogic';

export const OPEN_STATUSES: AdmissionRecord['status'][] = ['Pending', 'Under Review', 'Waitlisted'];

export const feeBalance = (a: Pick<AdmissionRecord, 'feeAmount' | 'feePaid'>) => Math.max(0, a.feeAmount - a.feePaid);
export const feeStatusOf = (a: Pick<AdmissionRecord, 'feeAmount' | 'feePaid'>): 'Paid' | 'Partial' | 'Unpaid' => (feeBalance(a) <= 0 ? 'Paid' : a.feePaid > 0 ? 'Partial' : 'Unpaid');

export const requiredFor = (a: Pick<AdmissionRecord, 'classId'>) => requiredDocs(classNoOf(a.classId));
export const docOf = (a: AdmissionRecord, type: string): AdmissionDocRecord | undefined => a.documents.find((d) => d.type === type);

/** Verified / required counts (the "2 / 3 Verified" tile). */
export function docProgress(a: AdmissionRecord): { verified: number; required: number; uploaded: number } {
  const req = requiredFor(a);
  return {
    verified: req.filter((t) => docOf(a, t)?.status === 'Verified').length,
    required: req.length,
    uploaded: a.documents.filter((d) => d.status !== 'Not Uploaded').length,
  };
}

/** The document list an application should carry for its class: existing statuses are kept, missing ones are added. */
export function documentsFor(classId: string, existing: AdmissionDocRecord[] = []): AdmissionDocRecord[] {
  const types = [...requiredDocs(classNoOf(classId)), 'Medical Certificate'];
  return types.map((type) => existing.find((d) => d.type === type) ?? { type, status: 'Not Uploaded' as const, uploadedOn: '' });
}

/** % of the application that is filled in and backed by documents. */
export function completeness(a: AdmissionRecord): number {
  const fields = [a.firstName, a.lastName, a.dob, a.address, a.parentName, a.parentPhone, a.parentEmail, a.emergencyPhone, a.previousSchool, a.bloodGroup];
  const filled = fields.filter((f) => String(f ?? '').trim()).length / fields.length;
  const docs = docProgress(a);
  return Math.round((filled * 0.6 + (docs.required ? docs.verified / docs.required : 1) * 0.4) * 100);
}

export const logOf = (title: string, by: string) => ({ title, by, at: new Date().toISOString() });

/* ----------------------------------- Timeline ----------------------------------- */

export interface Stage {
  title: string;
  state: 'done' | 'active' | 'pending' | 'stopped';
  meta: string;
}

/** The five-step journey of an application, worked out from its status, interview and fee. */
export function stagesOf(a: AdmissionRecord): Stage[] {
  const decided = a.status === 'Approved' || a.status === 'Enrolled';
  const stopped = a.status === 'Rejected';
  const interviewed = a.interviewStatus === 'Completed';
  return [
    { title: 'Application submitted', state: 'done', meta: formatDate(a.appliedOn) },
    { title: 'Documents', state: docProgress(a).verified >= docProgress(a).required ? 'done' : 'active', meta: `${docProgress(a).verified} of ${docProgress(a).required} required verified` },
    { title: 'Interview', state: interviewed ? 'done' : a.interviewStatus === 'Scheduled' ? 'active' : a.interviewStatus === 'Cancelled' ? 'stopped' : 'pending', meta: a.interviewStatus === 'Not Scheduled' ? 'Not scheduled' : `${a.interviewStatus}${a.interviewDate ? ` · ${formatDate(a.interviewDate)}` : ''}${a.interviewResult ? ` · ${a.interviewResult}` : ''}` },
    { title: stopped ? 'Rejected' : a.status === 'Waitlisted' ? 'Waitlisted' : 'Decision', state: stopped ? 'stopped' : decided ? 'done' : a.status === 'Waitlisted' ? 'active' : a.status === 'Under Review' ? 'active' : 'pending', meta: a.decisionNote || (decided ? 'Approved' : 'Awaiting decision') },
    { title: 'Enrolment', state: a.status === 'Enrolled' ? 'done' : a.status === 'Approved' ? 'active' : 'pending', meta: a.status === 'Enrolled' ? 'Student record created' : a.status === 'Approved' ? 'Ready to enrol once fees and documents are complete' : 'Pending' },
  ];
}

/* ------------------------------------ Enrolment ------------------------------------ */

/** Why this application cannot be enrolled yet, or null when it can. */
export function enrolBlocker(a: AdmissionRecord): string | null {
  if (a.status === 'Enrolled') return 'This applicant is already enrolled.';
  if (a.status !== 'Approved') return 'Only approved applications can be enrolled.';
  const d = docProgress(a);
  if (d.verified < d.required) return `Verify all required documents first (${d.verified} of ${d.required} verified).`;
  if (feeBalance(a) > 0) return `Collect the admission fee first ($${feeBalance(a).toLocaleString('en-US')} outstanding).`;
  return null;
}

/** Sections of the applied class that still have a seat. */
export const openSections = (classId: string) => snapshot<SectionRecord>('sections').filter((s) => s.classId === classId && s.status === 'Active' && freeSeats(s) > 0);

export function enrol(a: AdmissionRecord, opts: { sectionId: string; house: string; by: string }): StudentRecord | string {
  const blocker = enrolBlocker(a);
  if (blocker) return blocker;
  const section = openSections(a.classId).find((s) => s.id === opts.sectionId);
  if (!section) return 'That section is full or does not belong to the applied class.';
  const students = snapshot<StudentRecord>('students');
  const admissionNo = nextNo('AD', students.map((s) => s.admissionNo), 7);
  const created = repo<StudentRecord>('students').create({
    admissionNo,
    name: a.name,
    gender: a.gender,
    dob: a.dob,
    classId: a.classId,
    sectionId: section.id,
    rollNo: Math.max(35000, ...students.map((s) => s.rollNo)) + 3,
    house: opts.house,
    parentName: a.parentName,
    parentPhone: a.parentPhone,
    email: `${a.firstName}.${a.lastName}${students.length + 1}@student.karkaii.demo`.toLowerCase(),
    bloodGroup: a.bloodGroup,
    address: a.address,
    transport: a.transport,
    hostel: a.hostel,
    scholar: false,
    status: 'Active',
    joinedOn: todayISO(),
    motherName: a.relationship === 'Mother' ? a.parentName : '',
    religion: a.religion,
    nationality: a.nationality,
    phone: '',
    emergencyPhone: a.emergencyPhone,
    previousSchool: a.previousSchool,
    activities: [],
  });
  repo<HealthRecord>('healthRecords').create({ studentId: created.id, heightCm: 100 + (classNoOf(a.classId) - 1) * 6, weightKg: 18 + classNoOf(a.classId) * 3, vision: '6/6', dental: 'Good', allergies: a.allergies, conditions: a.conditions, vaccinations: ['BCG', 'Polio', 'MMR', 'DTP'], doctor: a.doctorContact.split(' · ')[0] || 'Family doctor', lastCheckup: todayISO(), nextCheckup: addDays(todayISO(), 365), note: '' });
  a.documents
    .filter((d) => d.status !== 'Not Uploaded')
    .forEach((d) => repo<StudentDocumentRecord>('studentDocuments').create({ studentId: created.id, name: `${created.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${d.type.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`, category: categoryOf(d.type), status: d.status === 'Not Uploaded' ? 'Pending' : d.status === 'Rejected' ? 'Rejected' : d.status, sizeKb: 600, uploadedOn: d.uploadedOn || todayISO(), uploadedBy: 'Admissions', favourite: false, shared: false, archived: false, version: 1, note: '', history: [`v1 carried over from application ${a.applicationNo}`] }));
  repo<AdmissionRecord>('admissions').update(a.id, { status: 'Enrolled', studentId: created.id, activity: [...a.activity, logOf(`Enrolled as ${admissionNo} in ${section.name}`, opts.by)] });
  logAudit({ entity: 'student', entityId: created.id, action: 'Created', summary: `${created.name} enrolled from application ${a.applicationNo}`, by: opts.by });
  return created;
}

function categoryOf(type: string): StudentDocumentRecord['category'] {
  switch (type) {
    case 'Birth Certificate': return 'Birth Certificate';
    case 'ID Proof': return 'Identity Proof';
    case 'Address Proof': return 'Address Proof';
    case 'Transfer Certificate': return 'Transfer Certificate';
    case 'Previous Mark Sheet': return 'Mark Sheets';
    case 'Medical Certificate': return 'Medical Records';
    default: return 'Other Documents';
  }
}

export const letterText = (a: AdmissionRecord, className: string): string =>
  [
    'KARKAII INTERNATIONAL SCHOOL',
    'ADMISSION LETTER',
    '',
    `Date: ${formatDate(todayISO())}`,
    `Application no: ${a.applicationNo}`,
    '',
    `Dear ${a.parentName},`,
    `We are pleased to confirm that ${a.name} has been offered admission to ${className} for the academic year ${a.academicYear}.`,
    `Admission fee: $${a.feeAmount.toLocaleString('en-US')} (${feeStatusOf(a).toLowerCase()}).`,
    'Please bring the original documents on the day of enrolment.',
    '',
    'Principal',
  ].join('\n');
