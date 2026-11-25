/**
 * The Add / Edit Student form, following the web app's updated form: ten sections (Personal Information, Parents &
 * Guardian, Siblings, Address, Transport, Hostel, Documents, Medical History, Previous School, Other Details) with
 * the same fields and wording. Saving writes the student and keeps the records that depend on them in step:
 * the school-transport seat, the health record and the document list.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { repo, snapshot } from '@/core/store/store';
import { diffDays, todayISO } from '@/core/utils/date';
import type { AcademicYearRecord } from '@/data/seed/administration';
import type { ClassRecord, SectionRecord, StudentRecord } from '@/data/seed/master';
import type { HealthRecord, StudentDocumentRecord } from '@/data/seed/studentLife';
import type { PickupPointRecord, StudentTransportRecord, TransportRouteRecord } from '@/data/seed/transport';
import { NEW_STUDENT, checkStudentSeat, routeLabel, seatsFree } from '@/features/campus/transportLogic';
import { changedKeys, describeChange, logAudit } from '@/features/common/audit';
import { classSection, nextNo } from '@/features/common/refs';
import type { FieldDef, FormValues } from '@/features/engine/types';
import { classNoOf, inStrength } from './promotionLogic';
import { HOSTEL_BLOCKS } from './studentData';

/* ------------------------------------------ choices ------------------------------------------ */

const STATUSES = ['Active', 'On Leave', 'Inactive', 'Transfer', 'Graduated', 'Suspended'];
const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
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

const seatsHint = (s: SectionRecord) => `${Math.max(0, s.capacity - students().filter((x) => x.sectionId === s.id && inStrength(x)).length)} seats free`;

export const STUDENT_SECTIONS: StudentSection[] = [
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
      { key: 'classId', label: 'Class', type: 'select', required: true, optionsFrom: { collection: 'classes', label: (c: ClassRecord) => c.name }, onChange: () => ({ sectionId: '' }) },
      { key: 'sectionId', label: 'Section', type: 'select', required: true, optionsFrom: { collection: 'sections', label: (s: SectionRecord) => s.name, hint: seatsHint, filter: (s: SectionRecord, v) => s.classId === v.classId } },
      { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
      { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
      { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: BLOOD },
      { key: 'house', label: 'House', type: 'select', required: true, options: HOUSES, default: 'Red' },
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
      { key: 'routeId', label: 'Route', type: 'select', placeholder: 'Own transport', optionsFrom: { collection: 'transportRoutes', label: (r: TransportRouteRecord) => routeLabel(r), hint: (r: TransportRouteRecord) => `${seatsFree(r)} seats free`, filter: (r: TransportRouteRecord) => r.status !== 'Archived' && r.status !== 'Suspended' }, onChange: (value, _v, lookup) => ({ pickupPointId: '', vehicleNumber: vehicleOfRoute(lookup('transportRoutes', String(value)) as TransportRouteRecord | undefined) }) },
      { key: 'vehicleNumber', label: 'Vehicle Number', type: 'text', readOnly: () => true, hint: 'Comes from the route you choose' },
      { key: 'pickupPointId', label: 'Pickup Point', type: 'select', placeholder: 'Choose a stop on the route', optionsFrom: { collection: 'pickupPoints', label: (p: PickupPointRecord) => p.name, hint: (p: PickupPointRecord) => `${p.boarding} · ${p.status}`, filter: (p: PickupPointRecord, v) => !!v.routeId && p.routeId === v.routeId && p.status === 'Active' } },
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

export const ALL_STUDENT_FIELDS: FieldDef[] = STUDENT_SECTIONS.flatMap((s) => s.fields);

function vehicleOfRoute(route?: TransportRouteRecord): string {
  if (!route) return '';
  const vehicle = snapshot<{ id: string; number: string; model: string }>('vehicles').find((v) => v.id === route.vehicleId);
  return vehicle ? `${vehicle.number} · ${vehicle.model}` : 'No vehicle yet';
}

/* ------------------------------------------- values ------------------------------------------- */

/** Fields that fall back to their default even for an existing student (older records have no value saved). */
const KEEP_DEFAULT = new Set(['guardianType', 'conditionStatus', 'house', 'nationality']);
const text = (v: unknown) => (v === undefined || v === null ? '' : String(v));
const list = (s: string) => s.split(',').map((x) => x.trim()).filter((x) => x && x.toLowerCase() !== 'none');

/** Form values for a student (everything as the form holds it), or the defaults for a new one. */
export function studentToValues(s?: StudentRecord): FormValues {
  const out: FormValues = {};
  const source = (s ?? {}) as unknown as Record<string, unknown>;
  const [firstName, ...rest] = (s?.name ?? '').split(' ');
  const assignment = s ? snapshot<StudentTransportRecord>('studentTransport').find((a) => a.studentId === s.id) : undefined;
  const health = s ? snapshot<HealthRecord>('healthRecords').find((h) => h.studentId === s.id) : undefined;
  const doc = (category: string) => (s ? snapshot<StudentDocumentRecord>('studentDocuments').filter((d) => d.studentId === s.id && d.category === category && !d.archived).sort((a, b) => b.uploadedOn.localeCompare(a.uploadedOn))[0]?.name ?? '' : '');
  const route = assignment?.routeId ? snapshot<TransportRouteRecord>('transportRoutes').find((r) => r.id === assignment.routeId) : undefined;

  for (const f of ALL_STUDENT_FIELDS) {
    let raw: unknown = source[f.key];
    switch (f.key) {
      case 'firstName': raw = firstName; break;
      case 'lastName': raw = rest.join(' '); break;
      case 'fatherName': raw = s?.parentName; break;
      case 'fatherPhone': raw = s?.parentPhone; break;
      case 'routeId': raw = assignment?.routeId; break;
      case 'pickupPointId': raw = assignment?.routeId ? assignment.pickupPointId : ''; break;
      case 'vehicleNumber': raw = vehicleOfRoute(route); break;
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
    const all = students();
    out.admissionNo = nextNo('AD', all.map((r) => r.admissionNo), 7);
    out.rollNo = String(Math.max(35000, ...all.map((r) => r.rollNo)) + 3);
    out.joinedOn = todayISO();
    out.academicYear = snapshot<AcademicYearRecord>('academicYears').find((y) => y.current)?.name ?? '';
    out.languagesKnown = ['English'];
  }
  return out;
}

/* ------------------------------------------ validation ------------------------------------------ */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneOk = (p: string) => p.replace(/\D/g, '').length >= 10;
const IFSC = /^[A-Za-z]{4}0[A-Za-z0-9]{6}$/;
const FILE = /\.(pdf|jpe?g|png)$/i;

/** Rules on top of the required / type checks the form engine does. Returns { field: message }. */
export function validateStudent(v: FormValues, existing?: StudentRecord): Record<string, string> {
  const e: Record<string, string> = {};
  const all = students();
  const others = all.filter((r) => r.id !== existing?.id);
  const t = (k: string) => text(v[k]).trim();

  if (t('admissionNo') && others.some((r) => r.admissionNo.toLowerCase() === t('admissionNo').toLowerCase())) e.admissionNo = 'This admission number is already used';
  if (t('rollNo') && (!Number.isInteger(Number(t('rollNo'))) || Number(t('rollNo')) < 1)) e.rollNo = 'Enter a whole number';
  else if (t('rollNo') && others.some((r) => r.rollNo === Number(t('rollNo')))) e.rollNo = 'This roll number is already used';

  if (t('dob')) {
    if (t('dob') >= todayISO()) e.dob = 'Date of birth must be in the past';
    else if (diffDays(t('dob'), todayISO()) / 365.25 < 2) e.dob = 'A student must be at least 2 years old';
    else if (diffDays(t('dob'), todayISO()) / 365.25 > 25) e.dob = 'Check the date of birth: this makes the student over 25';
  }
  if (t('joinedOn') > todayISO()) e.joinedOn = 'Admission date cannot be in the future';
  if (t('joinedOn') && t('dob') && t('joinedOn') <= t('dob')) e.joinedOn = 'Admission date must be after the date of birth';

  const section = snapshot<SectionRecord>('sections').find((s) => s.id === t('sectionId'));
  if (section && section.classId !== t('classId')) e.sectionId = 'This section belongs to a different class';
  else if (section) {
    const seated = all.filter((r) => r.sectionId === section.id && inStrength(r) && r.id !== existing?.id).length;
    if (['Active', 'On Leave'].includes(t('status')) && seated >= section.capacity) e.sectionId = `${section.name} is full (${section.capacity} seats)`;
  }

  // The same child entered twice.
  if (!existing && t('firstName') && t('dob')) {
    const name = `${t('firstName')} ${t('lastName')}`.trim().toLowerCase();
    const twin = all.find((r) => r.name.toLowerCase() === name && r.dob === t('dob'));
    if (twin) e.lastName = `${twin.name} (${twin.admissionNo}) with this date of birth is already on the roll`;
  }

  for (const [k, label] of [['phone', 'Primary contact number'], ['fatherPhone', 'Phone number'], ['motherPhone', 'Phone number'], ['guardianPhone', 'Phone number'], ['emergencyPhone', 'Emergency phone']] as const) {
    if (t(k) && !phoneOk(t(k))) e[k] = `${label} needs at least 10 digits`;
  }
  for (const k of ['email', 'fatherEmail', 'motherEmail', 'guardianEmail']) if (t(k) && !EMAIL.test(t(k))) e[k] = 'Enter a valid email address';

  if (t('guardianType') && t('guardianType') !== 'Parents') {
    if (!t('guardianName')) e.guardianName = `Add the ${t('guardianType').toLowerCase()}’s name`;
    if (!t('guardianPhone')) e.guardianPhone = `Add the ${t('guardianType').toLowerCase()}’s phone number`;
  }

  const siblings: string[] = (Array.isArray(v.siblingIds) ? (v.siblingIds as string[]) : []).filter(Boolean);
  if (t('hasSibling') === 'Yes') {
    if (!siblings.length) e.siblingIds = 'Choose the sibling, or select No';
    else if (siblings.some((id) => !all.some((r) => r.id === id))) e.siblingIds = 'A selected sibling is no longer on the roll';
    else if (existing && siblings.includes(existing.id)) e.siblingIds = 'A student cannot be their own sibling';
    else if (new Set(siblings).size !== siblings.length) e.siblingIds = 'The same sibling is listed twice';
  }

  if (t('routeId')) {
    const real = checkStudentSeat({ studentId: existing?.id ?? NEW_STUDENT, routeId: t('routeId'), pickupPointId: t('pickupPointId'), assignmentId: snapshot<StudentTransportRecord>('studentTransport').find((a) => a.studentId === existing?.id)?.id });
    const pick = (re: RegExp) => real.find((p) => re.test(p));
    if (pick(/full|no vehicle|takes no students|not found|^Route/)) e.routeId = pick(/full|no vehicle|takes no students|not found|^Route/)!;
    else if (pick(/stop|pickup point|inactive|temporar|closed|maintenance/i)) e.pickupPointId = pick(/stop|pickup point|inactive|temporar|closed|maintenance|Choose/i)!;
    else if (real.length) e.routeId = real[0];
    if (!e.routeId && !['Active', 'On Leave'].includes(t('status'))) e.routeId = `A student who is ${t('status').toLowerCase()} cannot have a school bus seat`;
  } else if (t('pickupPointId')) e.routeId = 'Choose the route for this pickup point';

  if (t('hostelName')) {
    const block = HOSTEL_BLOCKS.find((b) => b.name === t('hostelName'));
    if (block && t('gender') && block.gender !== t('gender')) e.hostelName = `${block.name} is for ${block.gender === 'Male' ? 'boys' : 'girls'}`;
    if (!t('hostelRoom')) e.hostelRoom = 'Enter the room number';
  }

  for (const k of ['birthCertificate', 'transferCertificate']) if (t(k) && !FILE.test(t(k))) e[k] = 'Use a file name ending in .pdf, .jpg or .png';
  if (t('ifscNumber') && !IFSC.test(t('ifscNumber'))) e.ifscNumber = 'An IFSC has 4 letters, a 0, then 6 letters or digits';
  return e;
}

/* --------------------------------------------- saving --------------------------------------------- */

export interface SaveStudentResult {
  student: StudentRecord;
  created: boolean;
  /** Things worth telling the person, e.g. a document that was logged. */
  notes: string[];
}

const fileKey = (name: string) => name.trim();

function syncTransport(student: StudentRecord, v: FormValues): string | null {
  const assignments = snapshot<StudentTransportRecord>('studentTransport');
  const mine = assignments.find((a) => a.studentId === student.id);
  const routeId = text(v.routeId).trim();
  const stopId = text(v.pickupPointId).trim();
  const store = repo<StudentTransportRecord>('studentTransport');
  if (routeId) {
    const route = snapshot<TransportRouteRecord>('transportRoutes').find((r) => r.id === routeId);
    if (!route) return null;
    if (mine && mine.routeId === routeId) {
      if (mine.pickupPointId !== stopId || mine.status === 'Awaiting Assignment') store.update(mine.id, { pickupPointId: stopId, status: mine.status === 'Suspended' ? 'Suspended' : 'Assigned', requestedPickupPointId: '' });
      return null;
    }
    const used = new Set(assignments.filter((a) => a.routeId === routeId && a.id !== mine?.id).map((a) => a.seatNo));
    let seat = 1;
    while (used.has(seat)) seat += 1;
    const base = { routeId, pickupPointId: stopId, seatNo: seat, fee: Math.round(route.fee * (1 - (mine?.concessionPct ?? 0) / 100)), status: 'Assigned' as const, requestedPickupPointId: '' };
    if (mine) store.update(mine.id, base);
    else store.create({ studentId: student.id, dropPoint: 'School Main Gate', concessionPct: 0, effectiveFrom: todayISO(), notes: '', ...base });
    return `Seat ${seat} on ${route.code}`;
  }
  // No route chosen: a student who had a seat gives it up; one who was only waiting for a seat keeps waiting.
  if (mine && mine.routeId) store.remove(mine.id);
  return null;
}

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

/** Create or update the student from the form and bring their transport seat, health record and documents into line. Call only after validation. */
export function saveStudent(v: FormValues, existing: StudentRecord | undefined, by: string): SaveStudentResult {
  const t = (k: string) => text(v[k]).trim();
  const name = `${t('firstName')} ${t('lastName')}`.replace(/\s+/g, ' ').trim();
  const guardianOn = t('guardianType') && t('guardianType') !== 'Parents';
  const siblingIds = t('hasSibling') === 'Yes' ? [...new Set<string>((Array.isArray(v.siblingIds) ? (v.siblingIds as string[]) : []).filter(Boolean))] : [];
  const fields: Omit<StudentRecord, 'id'> = {
    admissionNo: t('admissionNo'),
    name,
    gender: t('gender') as StudentRecord['gender'],
    dob: t('dob'),
    classId: t('classId'),
    sectionId: t('sectionId'),
    rollNo: Number(t('rollNo')),
    house: t('house') || 'Red',
    parentName: t('fatherName'),
    parentPhone: t('fatherPhone'),
    email: t('email'),
    bloodGroup: t('bloodGroup'),
    address: t('address'),
    transport: existing?.transport ?? false, // settled below from the transport seat
    hostel: !!t('hostelName'),
    scholar: !!v.scholar,
    status: t('status') as StudentRecord['status'],
    joinedOn: t('joinedOn'),
    motherName: t('motherName'),
    religion: t('religion'),
    nationality: t('nationality') || 'Indian',
    phone: t('phone'),
    emergencyPhone: t('emergencyPhone') || existing?.emergencyPhone || '',
    previousSchool: t('previousSchool'),
    activities: Array.isArray(v.activities) ? v.activities : [],
    academicYear: t('academicYear'),
    category: t('category'),
    caste: t('caste'),
    motherTongue: t('motherTongue'),
    languagesKnown: Array.isArray(v.languagesKnown) ? v.languagesKnown : [],
    fatherEmail: t('fatherEmail'),
    fatherOccupation: t('fatherOccupation'),
    motherPhone: t('motherPhone'),
    motherEmail: t('motherEmail'),
    motherOccupation: t('motherOccupation'),
    guardianType: (GUARDIAN_TYPES as readonly string[]).includes(t('guardianType')) ? (t('guardianType') as StudentRecord['guardianType']) : 'Parents',
    guardianName: guardianOn ? t('guardianName') : '',
    guardianRelation: guardianOn ? t('guardianRelation') : '',
    guardianPhone: guardianOn ? t('guardianPhone') : '',
    guardianEmail: guardianOn ? t('guardianEmail') : '',
    guardianOccupation: guardianOn ? t('guardianOccupation') : '',
    guardianAddress: guardianOn ? t('guardianAddress') : '',
    siblingIds,
    permanentAddress: t('permanentAddress'),
    hostelName: t('hostelName'),
    hostelRoom: t('hostelName') ? t('hostelRoom') : '',
    previousSchoolAddress: t('previousSchoolAddress'),
    bankName: t('bankName'),
    bankBranch: t('bankBranch'),
    ifscNumber: t('ifscNumber').toUpperCase(),
    otherInformation: t('otherInformation'),
  };

  const notes: string[] = [];
  const store = repo<StudentRecord>('students');
  const student = existing ? store.update(existing.id, fields)! : store.create(fields);

  const seat = syncTransport(student, v);
  if (seat) notes.push(seat);
  const uses = snapshot<StudentTransportRecord>('studentTransport').some((a) => a.studentId === student.id);
  const saved = student.transport === uses ? student : store.update(student.id, { transport: uses })!;

  syncHealth(saved, v);
  notes.push(...syncDocuments(saved, v, by));

  // Brothers and sisters are mutual: list this student on each sibling too, and take them off anyone no longer chosen.
  for (const other of students()) {
    if (other.id === saved.id) continue;
    const has = (other.siblingIds ?? []).includes(saved.id);
    const should = siblingIds.includes(other.id);
    if (should && !has) store.update(other.id, { siblingIds: [...(other.siblingIds ?? []), saved.id] });
    else if (!should && has) store.update(other.id, { siblingIds: (other.siblingIds ?? []).filter((id) => id !== saved.id) });
  }

  if (existing) {
    const keys = changedKeys(existing as unknown as Record<string, unknown>, saved as unknown as Record<string, unknown>);
    logAudit({ entity: 'student', entityId: saved.id, action: 'Updated', summary: describeChange('Updated', saved.name, keys), by });
  } else {
    logAudit({ entity: 'student', entityId: saved.id, action: 'Created', summary: describeChange('Created', saved.name, []), by });
  }
  return { student: saved, created: !existing, notes };
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
