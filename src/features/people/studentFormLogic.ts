/**
 * The Add / Edit Student form logic wired to the real Karkaii Backend API.
 * Dynamic dropdowns (Classes, Sections, Student Houses, Transport Routes, Pickup Points, Students)
 * are populated from backend lookup endpoints while preserving all existing UI sections, validation,
 * drafts, and local store mirroring after successful API persistence.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { repo, snapshot } from '@/core/store/store';
import { diffDays, todayISO } from '@/core/utils/date';
import type { AcademicYearRecord } from '@/data/seed/administration';
import type { StudentRecord } from '@/data/seed/master';
import type { HealthRecord, StudentDocumentRecord } from '@/data/seed/studentLife';
import { changedKeys, describeChange, logAudit } from '@/features/common/audit';
import { classSection } from '@/features/common/refs';
import type { FieldDef, FormValues } from '@/features/engine/types';
import {
  EMPTY_STUDENT_LOOKUPS,
  studentsApi,
  type BackendStudent,
  type BackendStudentStatus,
  type CreateStudentPayload,
  type StudentFormLookups,
  type UpdateStudentPayload,
} from '@/services/api/studentsApi';
import type { Option } from '@/ui/Fields';
import { classNoOf } from './promotionLogic';
import { HOSTEL_BLOCKS } from './studentData';

/* ------------------------------------------ choices ------------------------------------------ */

const STATUSES = ['Active', 'On Leave', 'Inactive', 'Transfer', 'Graduated', 'Suspended'];
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const CATEGORIES = ['General', 'OBC', 'BC', 'SC', 'ST', 'Other'];
const MOTHER_TONGUES = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Urdu', 'Other'];
const LANGUAGES = ['English', 'Tamil', 'Hindi', 'Malayalam', 'Telugu', 'Kannada', 'Urdu', 'French', 'Spanish'];
const ACTIVITIES = ['Sports', 'NCC', 'Arts', 'Music', 'Robotics'];
export const GUARDIAN_TYPES = ['Parents', 'Guardian', 'Others'] as const;
export const CONDITIONS = ['Good', 'Bad', 'Others'] as const;

const students = () => snapshot<StudentRecord>('students');

/* ------------------------------------------ sections ------------------------------------------ */

export interface StudentSection {
  key: string;
  title: string;
  /** Short label for the section chips at the top. */
  nav: string;
  fields: FieldDef[];
}

/** Fields shown as a row of buttons instead of a drop-down (the web form uses radio buttons). */
export const CHOICE_FIELDS: Record<string, { label: string; options: readonly string[] }> = {
  guardianType: { label: 'If Guardian Is', options: GUARDIAN_TYPES },
  hasSibling: { label: 'Is Sibling studying in same school', options: ['Yes', 'No'] },
  conditionStatus: { label: 'Medical Condition of a Student', options: CONDITIONS },
};

export function vehicleForRoute(lookups: StudentFormLookups, routeId: string): string {
  if (!routeId) return '';
  const schedule = lookups.schedules.find((s) => String(s.routeId) === String(routeId));
  return schedule?.vehicleRegistrationNo ?? '';
}

export function buildStudentSections(lookups: StudentFormLookups, values: FormValues = {}): StudentSection[] {
  const classOptions: Option[] = lookups.classes.map((c) => ({
    label: c.name,
    value: String(c.id),
    hint: [c.code, c.stream].filter(Boolean).join(' · ') || undefined,
  }));

  const selectedClassId = String(values.classId ?? '').trim();
  const sectionOptions: Option[] = lookups.sections
    .filter((s) => !selectedClassId || String(s.classId) === selectedClassId)
    .map((s) => ({
      label: s.name,
      value: String(s.id),
      hint: `Capacity ${s.capacity}${s.shift ? ` · ${s.shift}` : ''}`,
    }));

  const houseOptions: Option[] = lookups.houses.map((h) => ({
    label: h.name,
    value: String(h.id),
    hint: h.motto || undefined,
  }));

  const routeOptions: Option[] = lookups.routes.map((r) => ({
    label: `${r.code} · ${r.name}`,
    value: String(r.id),
    hint: r.startLocation && r.endLocation ? `${r.startLocation} → ${r.endLocation}` : r.shift,
  }));

  const selectedRouteId = String(values.routeId ?? '').trim();
  const pickupOptions: Option[] = lookups.pickupPoints
    .filter((p) => !!selectedRouteId && String(p.routeId) === selectedRouteId)
    .sort((a, b) => a.sequence - b.sequence)
    .map((p) => ({
      label: p.name,
      value: String(p.id),
      hint: [p.pickupTime ? `Pickup ${p.pickupTime.slice(0, 5)}` : '', p.landmark ?? ''].filter(Boolean).join(' · ') || undefined,
    }));

  return [
    {
      key: 'personal',
      title: 'Personal Information',
      nav: 'Personal',
      fields: [
        { key: 'academicYear', label: 'Academic Year', type: 'select', options: () => snapshot<AcademicYearRecord>('academicYears').map((y) => ({ label: y.name, value: y.name })) },
        { key: 'admissionNo', label: 'Admission Number', type: 'text', required: true },
        { key: 'joinedOn', label: 'Admission Date', type: 'date', required: true },
        { key: 'rollNo', label: 'Roll Number', type: 'number', required: true, min: 1 },
        { key: 'status', label: 'Status', type: 'select', required: true, options: STATUSES, default: 'Active' },
        { key: 'firstName', label: 'First Name', type: 'text', required: true },
        { key: 'lastName', label: 'Last Name', type: 'text', required: true },
        {
          key: 'classId',
          label: 'Class',
          type: 'select',
          required: lookups.classes.length > 0,
          options: classOptions,
          placeholder: lookups.loaded && lookups.classes.length === 0 ? 'No classes configured' : undefined,
          onChange: () => ({ sectionId: '' }),
        },
        {
          key: 'sectionId',
          label: 'Section',
          type: 'select',
          required: !!selectedClassId && sectionOptions.length > 0,
          options: sectionOptions,
          placeholder:
            lookups.loaded && lookups.sections.length === 0
              ? 'No sections configured'
              : selectedClassId && sectionOptions.length === 0
                ? 'No sections for class'
                : undefined,
        },
        { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
        { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
        { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: BLOOD },
        {
          key: 'house',
          label: 'House',
          type: 'select',
          required: lookups.houses.length > 0,
          options: houseOptions,
          placeholder: lookups.loaded && lookups.houses.length === 0 ? 'No houses configured' : undefined,
        },
        { key: 'religion', label: 'Religion', type: 'text' },
        { key: 'category', label: 'Category', type: 'select', options: CATEGORIES },
        { key: 'phone', label: 'Primary Contact Number', type: 'phone' },
        { key: 'email', label: 'Email Address', type: 'email' },
        { key: 'caste', label: 'Caste', type: 'text' },
        { key: 'motherTongue', label: 'Mother Tongue', type: 'select', options: MOTHER_TONGUES },
        { key: 'languagesKnown', label: 'Language Known', type: 'multiselect', options: LANGUAGES },
      ],
    },
    {
      key: 'guardian',
      title: 'Parents & Guardian Information',
      nav: 'Parents & Guardian',
      fields: [
        { key: 'fatherName', label: 'Father Name', type: 'text', required: true, section: 'Father’s Info' },
        { key: 'fatherEmail', label: 'Email', type: 'email' },
        { key: 'fatherPhone', label: 'Phone Number', type: 'phone', required: true },
        { key: 'fatherOccupation', label: 'Father Occupation', type: 'text' },
        { key: 'motherName', label: 'Mother Name', type: 'text', section: 'Mother’s Info' },
        { key: 'motherEmail', label: 'Email', type: 'email' },
        { key: 'motherPhone', label: 'Phone Number', type: 'phone' },
        { key: 'motherOccupation', label: 'Mother Occupation', type: 'text' },
        { key: 'guardianType', label: 'If Guardian Is', type: 'select', options: [...GUARDIAN_TYPES], default: 'Parents', section: 'Guardian Details' },
        { key: 'guardianName', label: 'Guardian Name', type: 'text' },
        { key: 'guardianRelation', label: 'Guardian Relation', type: 'text' },
        { key: 'guardianPhone', label: 'Phone Number', type: 'phone' },
        { key: 'guardianEmail', label: 'Email', type: 'email' },
        { key: 'guardianOccupation', label: 'Occupation', type: 'text' },
        { key: 'guardianAddress', label: 'Address', type: 'text' },
      ],
    },
    {
      key: 'siblings',
      title: 'Sibilings',
      nav: 'Siblings',
      fields: [{ key: 'hasSibling', label: 'Is Sibling studying in same school', type: 'select', options: ['Yes', 'No'], default: 'No' }],
    },
    {
      key: 'address',
      title: 'Address',
      nav: 'Address',
      fields: [
        { key: 'address', label: 'Current Address', type: 'textarea', placeholder: 'Enter Current Address' },
        { key: 'permanentAddress', label: 'Permanent Address', type: 'textarea' },
      ],
    },
    {
      key: 'transport',
      title: 'Transport Information',
      nav: 'Transport',
      fields: [
        {
          key: 'routeId',
          label: 'Route',
          type: 'select',
          placeholder: lookups.loaded && lookups.routes.length === 0 ? 'Own transport (no routes)' : 'Own transport',
          options: routeOptions,
          onChange: (value) => ({ pickupPointId: '', vehicleNumber: vehicleForRoute(lookups, String(value)) }),
        },
        { key: 'vehicleNumber', label: 'Vehicle Number', type: 'text', readOnly: () => true, hint: 'Comes from the route you choose' },
        {
          key: 'pickupPointId',
          label: 'Pickup Point',
          type: 'select',
          placeholder: selectedRouteId && pickupOptions.length === 0 ? 'No stops on route' : 'Choose a stop on the route',
          options: pickupOptions,
        },
      ],
    },
    {
      key: 'hostel',
      title: 'Hostel Information',
      nav: 'Hostel',
      fields: [
        { key: 'hostelName', label: 'Hostel', type: 'select', placeholder: 'Day scholar (no hostel)', options: [{ label: 'Day scholar (no hostel)', value: '' }, ...HOSTEL_BLOCKS.map((b) => ({ label: b.name, value: b.name, hint: `${b.gender === 'Male' ? 'Boys' : 'Girls'} block` }))] },
        { key: 'hostelRoom', label: 'Room No', type: 'text', placeholder: 'e.g. H-205', hidden: (v) => !v.hostelName },
      ],
    },
    {
      key: 'documents',
      title: 'Documents',
      nav: 'Documents',
      fields: [
        { key: 'birthCertificate', label: 'Birth Certificate (file name)', type: 'text', placeholder: 'BirthCertificate.pdf', hint: 'File names are recorded on the Student Documents page for verification; no file is stored in this demo.' },
        { key: 'transferCertificate', label: 'Transfer Certificate (file name)', type: 'text', placeholder: 'TransferCertificate.pdf' },
      ],
    },
    {
      key: 'medical',
      title: 'Medical History',
      nav: 'Medical',
      fields: [
        { key: 'conditionStatus', label: 'Medical Condition of a Student', type: 'select', options: [...CONDITIONS], default: 'Good' },
        { key: 'allergies', label: 'Allergies', type: 'text', placeholder: 'Separate with commas, e.g. Dust, Peanuts' },
        { key: 'medications', label: 'Medications', type: 'text', placeholder: 'Separate with commas' },
      ],
    },
    {
      key: 'previous',
      title: 'Previous School Details',
      nav: 'Previous School',
      fields: [
        { key: 'previousSchool', label: 'School Name', type: 'text' },
        { key: 'previousSchoolAddress', label: 'Address', type: 'text' },
      ],
    },
    {
      key: 'other',
      title: 'Other Details',
      nav: 'Other',
      fields: [
        { key: 'bankName', label: 'Bank Name', type: 'text' },
        { key: 'bankBranch', label: 'Branch', type: 'text' },
        { key: 'ifscNumber', label: 'IFSC Number', type: 'text', placeholder: 'e.g. SBIN0001234' },
        { key: 'otherInformation', label: 'Other Information', type: 'textarea' },
        { key: 'nationality', label: 'Nationality', type: 'text', default: 'Indian', section: 'Also kept on the student record' },
        { key: 'emergencyPhone', label: 'Emergency Phone', type: 'phone' },
        { key: 'scholar', label: 'Scholarship holder', type: 'switch' },
        { key: 'activities', label: 'Clubs & Activities', type: 'multiselect', options: ACTIVITIES },
      ],
    },
  ];
}

export const STUDENT_SECTIONS: StudentSection[] = buildStudentSections(EMPTY_STUDENT_LOOKUPS);
export const ALL_STUDENT_FIELDS: FieldDef[] = STUDENT_SECTIONS.flatMap((s) => s.fields);

/* ------------------------------------------- values ------------------------------------------- */

const KEEP_DEFAULT = new Set(['guardianType', 'conditionStatus', 'nationality']);
const text = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const list = (s: string) => s.split(',').map((x) => x.trim()).filter((x) => x && x.toLowerCase() !== 'none');

const BACKEND_STATUS_TO_UI: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  alumni: 'Graduated',
  transferred_out: 'Transfer',
  expelled: 'Suspended',
};

const UI_STATUS_TO_BACKEND: Record<string, BackendStudentStatus> = {
  Active: 'active',
  'On Leave': 'active',
  Inactive: 'inactive',
  Transfer: 'transferred_out',
  Graduated: 'alumni',
  Suspended: 'expelled',
};

const LEFT_STATUSES = new Set<BackendStudentStatus>(['alumni', 'transferred_out', 'expelled']);

export function nextBackendAdmissionNo(existingStudents: BackendStudent[]): string {
  const year = todayISO().slice(0, 4);
  const prefix = `STU-${year}-`;
  let max = 0;
  for (const s of existingStudents) {
    const m = new RegExp(`^STU-${year}-(\\d+)$`).exec(s.admissionNo ?? '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`;
}

/** Form values for a student (local or backend), or the defaults for a new one. */
export function studentToValues(s?: StudentRecord, backend?: BackendStudent): FormValues {
  const out: FormValues = {};
  if (backend) {
    const g = backend.guardians?.find((item) => item.relation !== 'father' && item.relation !== 'mother') ?? backend.guardians?.[0];
    const genderLabel = backend.gender ? backend.gender.charAt(0).toUpperCase() + backend.gender.slice(1).toLowerCase() : '';
    const map: Record<string, unknown> = {
      admissionNo: backend.admissionNo,
      joinedOn: backend.admittedOn,
      rollNo: backend.rollNo ?? '1',
      status: BACKEND_STATUS_TO_UI[backend.status] ?? 'Active',
      firstName: backend.firstName,
      lastName: backend.lastName,
      gender: genderLabel,
      dob: backend.dob,
      bloodGroup: backend.bloodGroup ?? '',
      house: backend.studentHouseId ? String(backend.studentHouseId) : '',
      category: backend.socialCategory ?? '',
      fatherName: backend.fatherName ?? '',
      fatherEmail: backend.fatherEmail ?? '',
      fatherPhone: backend.fatherPhone ?? '',
      fatherOccupation: backend.fatherOccupation ?? '',
      motherName: backend.motherName ?? '',
      motherEmail: backend.motherEmail ?? '',
      motherPhone: backend.motherPhone ?? '',
      motherOccupation: backend.motherOccupation ?? '',
      guardianType: g && g.relation !== 'father' && g.relation !== 'mother' ? (g.relation === 'other' ? 'Others' : 'Guardian') : 'Parents',
      guardianName: g && g.relation !== 'father' && g.relation !== 'mother' ? g.fullName : '',
      guardianRelation: g && g.relation !== 'father' && g.relation !== 'mother' ? g.relation : '',
      guardianPhone: g && g.relation !== 'father' && g.relation !== 'mother' ? g.phone : '',
      guardianEmail: g && g.relation !== 'father' && g.relation !== 'mother' ? g.email ?? '' : '',
      guardianOccupation: g && g.relation !== 'father' && g.relation !== 'mother' ? g.occupation ?? '' : '',
      guardianAddress: g && g.relation !== 'father' && g.relation !== 'mother' ? g.addressLine1 ?? '' : '',
      address: backend.addressLine1 ?? '',
      permanentAddress: backend.addressLine2 ?? '',
      academicYear: snapshot<AcademicYearRecord>('academicYears').find((y) => y.current)?.name ?? '',
      nationality: 'Indian',
      conditionStatus: 'Good',
      hasSibling: 'No',
    };
    for (const f of ALL_STUDENT_FIELDS) {
      const raw = map[f.key];
      if (f.type === 'multiselect') out[f.key] = Array.isArray(raw) ? raw : [];
      else if (f.type === 'switch') out[f.key] = typeof raw === 'boolean' ? raw : false;
      else if (raw !== undefined && raw !== null && raw !== '') out[f.key] = String(raw);
      else out[f.key] = f.default !== undefined && KEEP_DEFAULT.has(f.key) ? String(f.default) : '';
    }
    out.siblingIds = [];
    return out;
  }

  const source = (s ?? {}) as unknown as Record<string, unknown>;
  const [firstName, ...rest] = (s?.name ?? '').split(' ');
  const health = s ? snapshot<HealthRecord>('healthRecords').find((h) => h.studentId === s.id) : undefined;
  const doc = (category: string) => (s ? snapshot<StudentDocumentRecord>('studentDocuments').filter((d) => d.studentId === s.id && d.category === category && !d.archived).sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))[0]?.name ?? '' : '');

  for (const f of ALL_STUDENT_FIELDS) {
    let raw: unknown = source[f.key];
    switch (f.key) {
      case 'firstName': raw = firstName; break;
      case 'lastName': raw = rest.join(' '); break;
      case 'fatherName': raw = s?.parentName; break;
      case 'fatherPhone': raw = s?.parentPhone; break;
      case 'hasSibling': raw = s ? ((s.siblingIds?.length ?? 0) > 0 ? 'Yes' : 'No') : 'No'; break;
      case 'birthCertificate': raw = doc('Birth Certificate'); break;
      case 'transferCertificate': raw = doc('Transfer Certificate'); break;
      case 'conditionStatus': raw = health?.conditionStatus; break;
      case 'allergies': raw = health ? list(health.allergies).join(', ') : ''; break;
      case 'medications': raw = health ? list(health.medications ?? '').join(', ') : ''; break;
      default: break;
    }
    if (f.type === 'multiselect') out[f.key] = Array.isArray(raw) ? raw : [];
    else if (f.type === 'switch') out[f.key] = typeof raw === 'boolean' ? raw : false;
    else if (raw !== undefined && raw !== null && raw !== '') out[f.key] = String(raw);
    else out[f.key] = f.default !== undefined && (!s || KEEP_DEFAULT.has(f.key)) ? String(f.default) : '';
  }
  out.siblingIds = [...(s?.siblingIds ?? [])];
  if (!s) {
    out.admissionNo = nextBackendAdmissionNo([]);
    out.rollNo = '1';
    out.joinedOn = todayISO();
    out.academicYear = snapshot<AcademicYearRecord>('academicYears').find((y) => y.current)?.name ?? '';
    out.languagesKnown = ['English'];
  }
  return out;
}

/* ------------------------------------------ validation ------------------------------------------ */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneOk = (p: string) => p.replace(/\D/g, '').length >= 10 && p.trim().length <= 20;
const IFSC = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
const FILE = /\.(pdf|jpe?g|png)$/i;

/** Rules on top of the required / type checks the form engine does. Returns { field: message }. */
export function validateStudent(
  v: FormValues,
  existing?: StudentRecord,
  lookups: StudentFormLookups = EMPTY_STUDENT_LOOKUPS,
): Record<string, string> {
  const e: Record<string, string> = {};
  const backendStudents = lookups.students;
  const others = backendStudents.filter((r) => String(r.id) !== String(existing?.id ?? ''));
  const t = (k: string) => text(v[k]).trim();

  if (t('admissionNo')) {
    if (t('admissionNo').length > 30) e.admissionNo = 'Admission number must be 30 characters or less';
    else if (others.some((r) => r.admissionNo.toLowerCase() === t('admissionNo').toLowerCase())) {
      e.admissionNo = 'This admission number is already used';
    }
  }
  if (t('firstName').length > 60) e.firstName = 'First name must be 60 characters or less';
  if (t('lastName').length > 60) e.lastName = 'Last name must be 60 characters or less';

  if (t('rollNo') && (!Number.isInteger(Number(t('rollNo'))) || Number(t('rollNo')) < 1)) {
    e.rollNo = 'Enter a whole number';
  }

  if (t('dob')) {
    if (t('dob') >= todayISO()) e.dob = 'Date of birth must be in the past';
    else if (diffDays(t('dob'), todayISO()) / 365.25 < 2) e.dob = 'A student must be at least 2 years old';
    else if (diffDays(t('dob'), todayISO()) / 365.25 > 25) e.dob = 'Check the date of birth: this makes the student over 25';
  }
  if (t('joinedOn') > todayISO()) e.joinedOn = 'Admission date cannot be in the future';
  if (t('joinedOn') && t('dob') && t('joinedOn') <= t('dob')) e.joinedOn = 'Admission date must be after the date of birth';

  if (t('sectionId')) {
    const section = lookups.sections.find((s) => String(s.id) === t('sectionId'));
    if (section && t('classId') && String(section.classId) !== t('classId')) {
      e.sectionId = 'This section belongs to a different class';
    }
  }

  if (!existing && t('firstName') && t('dob')) {
    const name = `${t('firstName')} ${t('lastName')}`.trim().toLowerCase();
    const twin = backendStudents.find(
      (r) => `${r.firstName} ${r.lastName}`.trim().toLowerCase() === name && r.dob === t('dob'),
    );
    if (twin) e.lastName = `${twin.firstName} ${twin.lastName} (${twin.admissionNo}) with this date of birth already exists`;
  }

  for (const [k, label] of [['phone', 'Primary contact number'], ['fatherPhone', 'Phone number'], ['motherPhone', 'Phone number'], ['guardianPhone', 'Phone number'], ['emergencyPhone', 'Emergency phone']] as const) {
    if (t(k) && !phoneOk(t(k))) e[k] = `${label} needs 10–20 digits/characters`;
  }
  for (const k of ['email', 'fatherEmail', 'motherEmail', 'guardianEmail']) {
    if (t(k) && !EMAIL.test(t(k))) e[k] = 'Enter a valid email address';
  }

  if (t('guardianType') && t('guardianType') !== 'Parents') {
    if (!t('guardianName')) e.guardianName = `Add the ${t('guardianType').toLowerCase()}’s name`;
    if (!t('guardianPhone')) e.guardianPhone = `Add the ${t('guardianType').toLowerCase()}’s phone number`;
  }

  if (t('address').length > 200) e.address = 'Current address must be 200 characters or less';
  if (t('permanentAddress').length > 200) e.permanentAddress = 'Permanent address must be 200 characters or less';

  const siblings: string[] = (Array.isArray(v.siblingIds) ? (v.siblingIds as string[]) : []).filter(Boolean);
  if (t('hasSibling') === 'Yes') {
    const validIds = new Set([...backendStudents.map((s) => String(s.id)), ...students().map((s) => String(s.id))]);
    if (!siblings.length) e.siblingIds = 'Choose the sibling, or select No';
    else if (siblings.some((id) => !validIds.has(String(id)))) e.siblingIds = 'A selected sibling is no longer on the roll';
    else if (existing && siblings.includes(existing.id)) e.siblingIds = 'A student cannot be their own sibling';
    else if (new Set(siblings).size !== siblings.length) e.siblingIds = 'The same sibling is listed twice';
  }

  if (t('routeId')) {
    const stopsForRoute = lookups.pickupPoints.filter((p) => String(p.routeId) === t('routeId'));
    if (stopsForRoute.length > 0 && !t('pickupPointId')) {
      e.pickupPointId = 'Choose a pickup point on the route';
    }
    if (t('pickupPointId') && !stopsForRoute.some((p) => String(p.id) === t('pickupPointId'))) {
      e.pickupPointId = 'This pickup point does not belong to the selected route';
    }
    if (!e.routeId && !['Active', 'On Leave'].includes(t('status'))) {
      e.routeId = `A student who is ${t('status').toLowerCase()} cannot have a school bus seat`;
    }
  } else if (t('pickupPointId')) {
    e.routeId = 'Choose the route for this pickup point';
  }

  if (t('hostelName')) {
    const block = HOSTEL_BLOCKS.find((b) => b.name === t('hostelName'));
    if (block && t('gender') && block.gender !== t('gender')) e.hostelName = `${block.name} is for ${block.gender === 'Male' ? 'boys' : 'girls'}`;
    if (!t('hostelRoom')) e.hostelRoom = 'Enter the room number';
  }

  for (const k of ['birthCertificate', 'transferCertificate']) if (t(k) && !FILE.test(t(k))) e[k] = 'Use a file name ending in .pdf, .jpg or .png';
  if (t('ifscNumber') && !IFSC.test(t('ifscNumber'))) e.ifscNumber = 'An IFSC has 4 letters, a 0, then 6 letters or digits';
  return e;
}

/* ------------------------------------------- payload mapping ------------------------------------------- */

const optText = (v: unknown): string | undefined => {
  const s = text(v).trim();
  return s ? s : undefined;
};

export function buildCreateStudentPayload(v: FormValues, lookups: StudentFormLookups): CreateStudentPayload {
  const t = (k: string) => text(v[k]).trim();
  const firstName = t('firstName');
  const lastName = t('lastName');
  const status = UI_STATUS_TO_BACKEND[t('status')] ?? 'active';
  const houseValue = t('house');
  const matchedHouse = lookups.houses.find((h) => String(h.id) === houseValue || h.name.toLowerCase() === houseValue.toLowerCase());

  const payload: CreateStudentPayload = {
    firstName,
    lastName,
    fullName: `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim(),
    dob: t('dob'),
    admittedOn: t('joinedOn') || todayISO(),
    status,
  };

  if (t('admissionNo')) payload.admissionNo = t('admissionNo');
  if (t('gender')) payload.gender = t('gender').toLowerCase();
  if (t('bloodGroup')) payload.bloodGroup = t('bloodGroup');
  if (t('category')) payload.socialCategory = t('category');
  if (matchedHouse) payload.studentHouseId = String(matchedHouse.id);
  else if (/^\d+$/.test(houseValue)) payload.studentHouseId = houseValue;

  if (optText(v.fatherName)) payload.fatherName = optText(v.fatherName);
  if (optText(v.fatherPhone)) payload.fatherPhone = optText(v.fatherPhone);
  if (optText(v.fatherEmail)) payload.fatherEmail = optText(v.fatherEmail);
  if (optText(v.fatherOccupation)) payload.fatherOccupation = optText(v.fatherOccupation);

  if (optText(v.motherName)) payload.motherName = optText(v.motherName);
  if (optText(v.motherPhone)) payload.motherPhone = optText(v.motherPhone);
  if (optText(v.motherEmail)) payload.motherEmail = optText(v.motherEmail);
  if (optText(v.motherOccupation)) payload.motherOccupation = optText(v.motherOccupation);

  if (optText(v.address)) payload.addressLine1 = optText(v.address)!.slice(0, 200);
  if (optText(v.permanentAddress)) payload.addressLine2 = optText(v.permanentAddress)!.slice(0, 200);

  if (LEFT_STATUSES.has(status)) {
    payload.leftOn = todayISO();
    payload.leftReason = t('status');
  }

  return payload;
}

export function buildUpdateStudentPayload(v: FormValues, lookups: StudentFormLookups): UpdateStudentPayload {
  const base = buildCreateStudentPayload(v, lookups);
  const t = (k: string) => text(v[k]).trim();
  const houseValue = t('house');
  const matchedHouse = lookups.houses.find((h) => String(h.id) === houseValue || h.name.toLowerCase() === houseValue.toLowerCase());
  return {
    ...base,
    bloodGroup: t('bloodGroup') || null,
    socialCategory: t('category') || null,
    studentHouseId: matchedHouse ? String(matchedHouse.id) : /^\d+$/.test(houseValue) ? houseValue : null,
    fatherEmail: optText(v.fatherEmail) ?? null,
    fatherOccupation: optText(v.fatherOccupation) ?? null,
    motherName: optText(v.motherName) ?? null,
    motherPhone: optText(v.motherPhone) ?? null,
    motherEmail: optText(v.motherEmail) ?? null,
    motherOccupation: optText(v.motherOccupation) ?? null,
    addressLine1: optText(v.address)?.slice(0, 200) ?? null,
    addressLine2: optText(v.permanentAddress)?.slice(0, 200) ?? null,
  };
}

/* --------------------------------------------- saving --------------------------------------------- */

export interface SaveStudentResult {
  student: StudentRecord;
  backendStudent: BackendStudent;
  created: boolean;
  notes: string[];
}

const fileKey = (name: string) => name.trim();

function syncHealth(student: StudentRecord, v: FormValues) {
  const store = repo<HealthRecord>('healthRecords');
  const mine = snapshot<HealthRecord>('healthRecords').find((h) => h.studentId === student.id);
  const patch = {
    allergies: list(text(v.allergies)).join(', ') || 'None',
    medications: list(text(v.medications)).join(', '),
    conditionStatus: (CONDITIONS as readonly string[]).includes(text(v.conditionStatus)) ? (text(v.conditionStatus) as HealthRecord['conditionStatus']) : 'Good',
  };
  if (mine) store.update(mine.id, patch);
  else {
    store.create({ studentId: student.id, heightCm: 100 + (classNoOf(student.classId) - 1) * 6, weightKg: 18 + classNoOf(student.classId) * 3, vision: '6/6', dental: 'Good', conditions: 'None', vaccinations: [], doctor: 'Family doctor', lastCheckup: todayISO(), nextCheckup: '', note: '', ...patch });
  }
}

function syncDocuments(student: StudentRecord, v: FormValues, by: string): string[] {
  const notes: string[] = [];
  const store = repo<StudentDocumentRecord>('studentDocuments');
  for (const [key, category] of [['birthCertificate', 'Birth Certificate'], ['transferCertificate', 'Transfer Certificate']] as const) {
    const name = fileKey(text(v[key]));
    if (!name) continue;
    const current = snapshot<StudentDocumentRecord>('studentDocuments').filter((d) => d.studentId === student.id && d.category === category && !d.archived).sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))[0];
    if (current && current.name === name) continue;
    if (current) {
      store.update(current.id, { name, status: 'Pending', version: current.version + 1, uploadedOn: todayISO(), uploadedBy: by, history: [...current.history, `v${current.version + 1} ${name} recorded from the student form`] });
      notes.push(`${category} updated`);
    } else {
      store.create({ studentId: student.id, name, category, status: 'Pending', sizeKb: 0, uploadedOn: todayISO(), uploadedBy: by, favourite: false, shared: false, archived: false, version: 1, note: '', history: [`v1 ${name} recorded from the student form`] });
      notes.push(`${category} logged for verification`);
    }
  }
  return notes;
}

function toLocalRecord(
  backendStudent: BackendStudent,
  v: FormValues,
  lookups: StudentFormLookups,
  existing?: StudentRecord,
): StudentRecord {
  const t = (k: string) => text(v[k]).trim();
  const houseObj = lookups.houses.find((h) => String(h.id) === String(backendStudent.studentHouseId ?? t('house')));
  const guardianOn = t('guardianType') && t('guardianType') !== 'Parents';
  const siblingIds = t('hasSibling') === 'Yes' ? [...new Set<string>((Array.isArray(v.siblingIds) ? (v.siblingIds as string[]) : []).filter(Boolean))] : [];

  return {
    id: String(backendStudent.id),
    admissionNo: backendStudent.admissionNo,
    name: backendStudent.fullName || `${backendStudent.firstName} ${backendStudent.lastName}`.trim(),
    gender: (t('gender') || 'Female') as StudentRecord['gender'],
    dob: backendStudent.dob,
    classId: t('classId') || existing?.classId || '',
    sectionId: t('sectionId') || existing?.sectionId || '',
    rollNo: Number(t('rollNo')) || Number(backendStudent.rollNo) || 1,
    house: houseObj?.name || backendStudent.houseName || existing?.house || 'Red',
    parentName: t('fatherName') || backendStudent.fatherName || '',
    parentPhone: t('fatherPhone') || backendStudent.fatherPhone || '',
    email: t('email'),
    bloodGroup: backendStudent.bloodGroup ?? t('bloodGroup'),
    address: backendStudent.addressLine1 ?? t('address'),
    transport: !!t('routeId') || (existing?.transport ?? false),
    hostel: !!t('hostelName'),
    scholar: !!v.scholar,
    status: (t('status') || BACKEND_STATUS_TO_UI[backendStudent.status] || 'Active') as StudentRecord['status'],
    joinedOn: backendStudent.admittedOn,
    motherName: backendStudent.motherName ?? t('motherName'),
    religion: t('religion'),
    nationality: t('nationality') || 'Indian',
    phone: t('phone'),
    emergencyPhone: t('emergencyPhone') || existing?.emergencyPhone || '',
    previousSchool: t('previousSchool'),
    activities: Array.isArray(v.activities) ? v.activities : [],
    academicYear: t('academicYear'),
    category: backendStudent.socialCategory ?? t('category'),
    caste: t('caste'),
    motherTongue: t('motherTongue'),
    languagesKnown: Array.isArray(v.languagesKnown) ? v.languagesKnown : [],
    fatherEmail: backendStudent.fatherEmail ?? t('fatherEmail'),
    fatherOccupation: backendStudent.fatherOccupation ?? t('fatherOccupation'),
    motherPhone: backendStudent.motherPhone ?? t('motherPhone'),
    motherEmail: backendStudent.motherEmail ?? t('motherEmail'),
    motherOccupation: backendStudent.motherOccupation ?? t('motherOccupation'),
    guardianType: (GUARDIAN_TYPES as readonly string[]).includes(t('guardianType')) ? (t('guardianType') as StudentRecord['guardianType']) : 'Parents',
    guardianName: guardianOn ? t('guardianName') : '',
    guardianRelation: guardianOn ? t('guardianRelation') : '',
    guardianPhone: guardianOn ? t('guardianPhone') : '',
    guardianEmail: guardianOn ? t('guardianEmail') : '',
    guardianOccupation: guardianOn ? t('guardianOccupation') : '',
    guardianAddress: guardianOn ? t('guardianAddress') : '',
    siblingIds,
    permanentAddress: backendStudent.addressLine2 ?? t('permanentAddress'),
    hostelName: t('hostelName'),
    hostelRoom: t('hostelName') ? t('hostelRoom') : '',
    previousSchoolAddress: t('previousSchoolAddress'),
    bankName: t('bankName'),
    bankBranch: t('bankBranch'),
    ifscNumber: t('ifscNumber').toUpperCase(),
    otherInformation: t('otherInformation'),
  };
}

/**
 * Create or update a student in the real Backend API, link guardian / transport when provided,
 * and mirror into the local store so StudentProfile & Students list stay consistent.
 */
export async function saveStudent(
  v: FormValues,
  existing: StudentRecord | undefined,
  by: string,
  lookups: StudentFormLookups = EMPTY_STUDENT_LOOKUPS,
): Promise<SaveStudentResult> {
  const t = (k: string) => text(v[k]).trim();
  const notes: string[] = [];
  if (existing && !/^\d+$/.test(String(existing.id))) {
    throw new Error('Sample demo students exist only locally. Create a real student via Add Student to sync with the server.');
  }
  const isBackendEdit = !!(existing && /^\d+$/.test(String(existing.id)));

  const backendStudent = isBackendEdit
    ? await studentsApi.updateStudent(String(existing!.id), buildUpdateStudentPayload(v, lookups))
    : await studentsApi.createStudent(buildCreateStudentPayload(v, lookups));

  if (!isBackendEdit) {
    const guardianOn = t('guardianType') && t('guardianType') !== 'Parents';
    const guardianPayload = guardianOn && t('guardianName') && t('guardianPhone')
      ? {
          guardian: {
            fullName: t('guardianName').slice(0, 120),
            relation: (t('guardianType') === 'Guardian' ? 'guardian' : 'other') as 'guardian' | 'other',
            phone: t('guardianPhone').slice(0, 20),
            email: optText(v.guardianEmail) ?? null,
            occupation: optText(v.guardianOccupation)?.slice(0, 100) ?? null,
            addressLine1: optText(v.guardianAddress)?.slice(0, 200) ?? null,
            isEmergencyContact: true,
          },
          isPrimary: true,
          canPickUp: true,
        }
      : t('fatherName') && t('fatherPhone')
        ? {
            guardian: {
              fullName: t('fatherName').slice(0, 120),
              relation: 'father' as const,
              phone: t('fatherPhone').slice(0, 20),
              email: optText(v.fatherEmail) ?? null,
              occupation: optText(v.fatherOccupation)?.slice(0, 100) ?? null,
              addressLine1: optText(v.address)?.slice(0, 200) ?? null,
              isEmergencyContact: true,
            },
            isPrimary: true,
            canPickUp: true,
          }
        : null;

    if (guardianPayload) {
      try {
        await studentsApi.linkStudentGuardian(String(backendStudent.id), guardianPayload);
      } catch {
        notes.push('Guardian link skipped');
      }
    }

    if (t('routeId') && t('pickupPointId')) {
      try {
        await studentsApi.createTransportAssignment({
          studentId: String(backendStudent.id),
          academicYearId: 1,
          routeId: t('routeId'),
          pickupPointId: t('pickupPointId'),
          direction: 'both',
        });
        const route = lookups.routes.find((r) => String(r.id) === t('routeId'));
        if (route) notes.push(`Route ${route.code}`);
      } catch {
        notes.push('Transport assignment skipped');
      }
    }
  }

  const localFields = toLocalRecord(backendStudent, v, lookups, existing);
  const store = repo<StudentRecord>('students');
  const existingLocal = store.get(localFields.id);
  const saved = existingLocal ? store.update(localFields.id, localFields)! : store.create(localFields);

  syncHealth(saved, v);
  notes.push(...syncDocuments(saved, v, by));

  if (existing) {
    const keys = changedKeys(existing as unknown as Record<string, unknown>, saved as unknown as Record<string, unknown>);
    logAudit({ entity: 'student', entityId: saved.id, action: 'Updated', summary: describeChange('Updated', saved.name, keys), by });
  } else {
    logAudit({ entity: 'student', entityId: saved.id, action: 'Created', summary: describeChange('Created', saved.name, []), by });
  }

  return { student: saved, backendStudent, created: !existing, notes };
}

/* ---------------------------------------------- draft ---------------------------------------------- */

const DRAFT_KEY = 'karkaii:studentDraft';

/** "Save Draft": keep a half-filled Add Student form so it can be finished later. */
export async function saveStudentDraft(values: FormValues): Promise<void> {
  await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify({ values, savedAt: new Date().toISOString() }));
}

export async function loadStudentDraft(): Promise<{ values: FormValues; savedAt: string } | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { values?: FormValues; savedAt?: string };
    return parsed.values ? { values: parsed.values, savedAt: parsed.savedAt ?? '' } : null;
  } catch {
    return null;
  }
}

export async function clearStudentDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {
    /* nothing saved */
  }
}

/** Does the form hold anything beyond what a blank form starts with? (A blank form is not worth saving as a draft.) */
export function hasTypedAnything(values: FormValues): boolean {
  const blank = studentToValues(undefined);
  return Object.keys(values).some((k) => JSON.stringify(values[k]) !== JSON.stringify(blank[k]) && !['admissionNo', 'rollNo'].includes(k));
}

export const studentFormTitle = (s?: StudentRecord) => (s ? `Edit ${s.name}` : 'Add Student');
export const studentSummaryLine = (s: StudentRecord) => `${s.name} · ${classSection(s)} · ${s.admissionNo}`;
