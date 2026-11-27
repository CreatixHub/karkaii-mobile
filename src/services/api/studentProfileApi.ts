/**
 * Backend API client for the Student Profile module.
 * Connects both authenticated student self-view (`/api/students/me`, `/api/students/me/timetable`,
 * `/api/fee-collection/me`, `/api/library-issues/my`, `/api/leave/student/me`, `/api/homework-plus/my`)
 * and staff/scoped student inspection (`/api/students`, `/api/students/:id`, plus optional related endpoints).
 */
import { ApiError, apiRequest } from './authApi';
import type { BackendGuardianRelation, BackendStudentStatus } from './studentsApi';

export interface SelectorOption {
  label: string;
  value: string;
  hint?: string;
}

export interface ProfileGuardian {
  id: string;
  fullName: string;
  relation: BackendGuardianRelation | string;
  phone: string;
  email: string;
  occupation: string;
  isPrimary: boolean;
  canPickUp: boolean;
}

export interface ProfileDocument {
  id: string;
  documentType: string;
  documentNo: string;
  issuedOn: string;
  expiresOn: string;
  verifiedStatus: string;
  verifiedByName: string;
  remarks: string;
}

export interface StudentProfileSummary {
  id: string;
  admissionNo: string;
  rollNo: string;
  firstName: string;
  lastName: string;
  fullName: string;
  name: string;
  dob: string;
  ageYears: number | null;
  gender: string;
  bloodGroup: string;
  socialCategory: string;
  photoFileId: string;
  houseName: string;
  houseColor: string;
  className: string;
  sectionName: string;
  classLabel: string;
  gradeLevel: number | null;
  previousSchool: string;
  status: BackendStudentStatus | string;
  statusLabel: string;
  admittedOn: string;
  leftOn: string;
  leftReason: string;
  address: string;
  fatherName: string;
  fatherPhone: string;
  fatherEmail: string;
  fatherOccupation: string;
  motherName: string;
  motherPhone: string;
  motherEmail: string;
  motherOccupation: string;
  guardians: ProfileGuardian[];
  primaryGuardianName: string;
  primaryGuardianPhone: string;
  primaryGuardianEmail: string;
  admission: {
    id: string;
    applicationNo: string;
    status: string;
    appliedOn: string;
  } | null;
  documents: ProfileDocument[];
  completion: number;
}

export interface PeriodAttendanceSubjectStat {
  subjectId: string;
  subjectName: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  periods: number;
  percent: number | null;
}

export interface PeriodAttendanceSummary {
  periods: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  percent: number | null;
  bySubject: PeriodAttendanceSubjectStat[];
}

export interface PeriodAttendanceEntry {
  id: string;
  attendanceDate: string;
  status: string;
  remarks: string;
  subjectName: string;
  slotName: string;
  startsAt: string;
  endsAt: string;
  teacherName: string;
}

export interface StudentLeaveType {
  id: string;
  name: string;
  maxConsecutiveDays: number | null;
}

export interface StudentLeaveRequestItem {
  id: string;
  studentId: string;
  typeName: string;
  fromDate: string;
  toDate: string;
  days: number;
  durationType: string;
  reason: string;
  status: string;
  decisionNotes: string;
}

export interface StudentFeeInvoiceItem {
  id: string;
  number: string;
  dueOn: string;
  status: string;
  total: number;
  paid: number;
  balance: number;
}

export interface StudentFeePaymentItem {
  id: string;
  receiptNo: string;
  amount: number;
  method: string;
  status: string;
  referenceNo: string;
  receivedAt: string;
}

export interface StudentFeeLedger {
  available: boolean;
  billed: number;
  paid: number;
  pending: number;
  balance: number;
  overdueCount: number;
  status: 'Paid' | 'Due' | 'Overdue' | 'Unavailable';
  invoices: StudentFeeInvoiceItem[];
  payments: StudentFeePaymentItem[];
}

export interface StudentTimetableEntry {
  id: string;
  dayOfWeek: number;
  slotName: string;
  slotSequence: number;
  startsAt: string;
  endsAt: string;
  subjectName: string;
  teacherName: string;
  classroomCode: string;
}

export interface StudentTimetableBundle {
  className: string;
  sectionName: string;
  message: string;
  entries: StudentTimetableEntry[];
}

export interface StudentLibraryLoan {
  id: string;
  bookTitle: string;
  issuedOn: string;
  dueOn: string;
  returnedOn: string;
  fine: number;
  status: string;
  overdue: boolean;
  remarks: string;
}

export interface StudentHomeworkItem {
  id: string;
  title: string;
  subjectName: string;
  dueAt: string;
  status: string;
  subStatus: string;
  maxMarks: number | null;
  score: number | null;
  gradeLabel: string;
  feedback: string;
}

export interface StudentTransportItem {
  id: string;
  routeCode: string;
  routeName: string;
  pickupPointName: string;
  direction: string;
  status: string;
  effectiveFrom: string;
  effectiveTo: string;
}

export interface StudentProfileBundle {
  student: StudentProfileSummary;
  attendanceSummary: PeriodAttendanceSummary;
  attendanceRecords: PeriodAttendanceEntry[];
  leaveTypes: StudentLeaveType[];
  leaveRequests: StudentLeaveRequestItem[];
  fees: StudentFeeLedger;
  timetable: StudentTimetableBundle;
  library: StudentLibraryLoan[];
  homework: StudentHomeworkItem[];
  transport: StudentTransportItem[];
}

type Loose = Record<string, unknown>;

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v).trim());
const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  inactive: 'Inactive',
  alumni: 'Graduated',
  transferred_out: 'Transferred',
  expelled: 'Expelled',
};

export function formatStudentStatus(raw?: unknown): string {
  const code = str(raw).toLowerCase();
  if (!code) return 'Active';
  return STATUS_LABELS[code] ?? code.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatGender(raw?: unknown): string {
  const g = str(raw).toLowerCase();
  if (!g) return '';
  if (g === 'male' || g === 'm') return 'Male';
  if (g === 'female' || g === 'f') return 'Female';
  return g.charAt(0).toUpperCase() + g.slice(1);
}

export function computeAgeYears(iso?: string | null): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(str(iso));
  if (!m) return null;
  const born = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const gap = now.getMonth() - born.getMonth();
  if (gap < 0 || (gap === 0 && now.getDate() < born.getDate())) age -= 1;
  return Math.max(age, 0);
}

async function safeOptional<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ApiError && err.status === 0) throw err;
    return fallback;
  }
}

function normalizeGuardians(raw: unknown): ProfileGuardian[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, idx): ProfileGuardian => {
      const g = (item ?? {}) as Loose;
      return {
        id: str(g.id) || `guardian-${idx}`,
        fullName: str(g.fullName) || str(g.name) || 'Guardian',
        relation: str(g.relation) || str(g.relationship) || 'guardian',
        phone: str(g.phone),
        email: str(g.email),
        occupation: str(g.occupation),
        isPrimary: Boolean(g.isPrimary),
        canPickUp: Boolean(g.canPickUp),
      };
    })
    .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
}

function normalizeDocuments(raw: unknown): ProfileDocument[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, idx): ProfileDocument => {
    const d = (item ?? {}) as Loose;
    return {
      id: str(d.id) || `doc-${idx}`,
      documentType: str(d.documentType) || 'Document',
      documentNo: str(d.documentNo),
      issuedOn: str(d.issuedOn).slice(0, 10),
      expiresOn: str(d.expiresOn).slice(0, 10),
      verifiedStatus: str(d.verifiedStatus) || 'pending',
      verifiedByName: str(d.verifiedByName),
      remarks: str(d.remarks),
    };
  });
}

function buildStudentSummary(
  raw: Loose,
  extras?: { className?: string; sectionName?: string; previousSchool?: string; applicationNo?: string },
): StudentProfileSummary {
  const firstName = str(raw.firstName);
  const lastName = str(raw.lastName);
  const fullName = str(raw.fullName) || [firstName, lastName].filter(Boolean).join(' ') || 'Student';
  const guardians = normalizeGuardians(raw.guardians);
  const primary = guardians[0];

  const fatherName = str(raw.fatherName);
  const fatherPhone = str(raw.fatherPhone);
  const fatherEmail = str(raw.fatherEmail);
  const fatherOccupation = str(raw.fatherOccupation);
  const motherName = str(raw.motherName);
  const motherPhone = str(raw.motherPhone);
  const motherEmail = str(raw.motherEmail);
  const motherOccupation = str(raw.motherOccupation);

  const primaryGuardianName =
    primary?.fullName || str(raw.primaryGuardianName) || fatherName || motherName || '';
  const primaryGuardianPhone =
    primary?.phone || str(raw.primaryGuardianPhone) || fatherPhone || motherPhone || '';
  const primaryGuardianEmail =
    primary?.email || fatherEmail || motherEmail || '';

  const className = str(raw.className) || str(extras?.className);
  const sectionName = str(raw.sectionName) || str(extras?.sectionName);
  const classLabel = [className, sectionName].filter(Boolean).join(' · ');
  const houseName = str(raw.houseName);
  const dob = str(raw.dob).slice(0, 10);
  const gender = formatGender(raw.gender);
  const bloodGroup = str(raw.bloodGroup);
  const addressLine1 = str(raw.addressLine1);
  const address = [addressLine1, str(raw.addressLine2), str(raw.postalCode)].filter(Boolean).join(', ');
  const admRaw = raw.admission && typeof raw.admission === 'object' ? (raw.admission as Loose) : null;

  const filledChecks = [
    fullName !== 'Student' ? fullName : '',
    dob,
    gender,
    bloodGroup,
    className,
    houseName,
    addressLine1 || address,
    primaryGuardianPhone,
  ];
  const completion = Math.round((filledChecks.filter((v) => !!str(v)).length / filledChecks.length) * 100);

  return {
    id: str(raw.id),
    admissionNo: str(raw.admissionNo),
    rollNo: str(raw.rollNo),
    firstName,
    lastName,
    fullName,
    name: fullName,
    dob,
    ageYears: computeAgeYears(dob),
    gender,
    bloodGroup,
    socialCategory: str(raw.socialCategory),
    photoFileId: str(raw.photoFileId),
    houseName,
    houseColor: str(raw.houseColor),
    className,
    sectionName,
    classLabel,
    gradeLevel: raw.gradeLevel !== null && raw.gradeLevel !== undefined ? num(raw.gradeLevel) : null,
    previousSchool: str(raw.previousSchool) || str(extras?.previousSchool),
    status: str(raw.status) || 'active',
    statusLabel: formatStudentStatus(raw.status),
    admittedOn: str(raw.admittedOn).slice(0, 10),
    leftOn: str(raw.leftOn).slice(0, 10),
    leftReason: str(raw.leftReason),
    address,
    fatherName,
    fatherPhone,
    fatherEmail,
    fatherOccupation,
    motherName,
    motherPhone,
    motherEmail,
    motherOccupation,
    guardians,
    primaryGuardianName,
    primaryGuardianPhone,
    primaryGuardianEmail,
    admission: admRaw
      ? {
          id: str(admRaw.id),
          applicationNo: str(admRaw.applicationNo) || str(extras?.applicationNo),
          status: str(admRaw.status),
          appliedOn: str(admRaw.appliedOn).slice(0, 10),
        }
      : null,
    documents: normalizeDocuments(raw.documents),
    completion,
  };
}

export interface SelectorLoadResult {
  options: SelectorOption[];
  defaultId: string;
  emptyReason?: string;
}

export async function fetchStudentSelectorOptions(
  role: string | null | undefined,
  preferredId?: string,
): Promise<SelectorLoadResult> {
  if (role === 'student') {
    try {
      const me = await apiRequest<Loose>('/api/students/me');
      const id = str(me.id);
      if (!id) return { options: [], defaultId: '', emptyReason: 'No student record is linked to this login.' };
      const name = str(me.fullName) || [str(me.firstName), str(me.lastName)].filter(Boolean).join(' ') || 'My Profile';
      const admNo = str(me.admissionNo);
      const cls = str(me.className);
      return {
        options: [{ label: name, value: id, hint: [admNo, cls].filter(Boolean).join(' · ') || undefined }],
        defaultId: id,
      };
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return { options: [], defaultId: '', emptyReason: err.message || 'No student record is linked to this login.' };
      }
      throw err;
    }
  }

  if (role === 'parent') {
    const res = await safeOptional(() => apiRequest<Loose>('/api/leave/student/me'), { children: [] });
    const kids = Array.isArray(res.children) ? (res.children as Loose[]) : [];
    const options: SelectorOption[] = kids.map((k) => ({
      label: str(k.name) || 'Student',
      value: str(k.id),
      hint: [str(k.admissionNo), str(k.className)].filter(Boolean).join(' · ') || undefined,
    }));
    const defaultId =
      preferredId && options.some((o) => o.value === preferredId) ? preferredId : options[0]?.value ?? '';
    return {
      options,
      defaultId,
      emptyReason: options.length === 0 ? 'No linked students found for this parent account.' : undefined,
    };
  }

  const rows = await apiRequest<Loose[]>('/api/students?limit=100');
  const list = Array.isArray(rows) ? rows : [];
  const options: SelectorOption[] = list.map((s) => {
    const name = str(s.fullName) || [str(s.firstName), str(s.lastName)].filter(Boolean).join(' ') || 'Student';
    const hint = [str(s.admissionNo), str(s.className)].filter(Boolean).join(' · ') || undefined;
    return { label: name, value: str(s.id), hint };
  });

  if (preferredId && !options.some((o) => o.value === preferredId)) {
    const single = await safeOptional<Loose | null>(
      () => apiRequest<Loose>(`/api/students/${encodeURIComponent(preferredId)}`),
      null,
    );
    if (single && str(single.id)) {
      const name =
        str(single.fullName) || [str(single.firstName), str(single.lastName)].filter(Boolean).join(' ') || 'Student';
      options.unshift({
        label: name,
        value: str(single.id),
        hint: [str(single.admissionNo), str(single.className)].filter(Boolean).join(' · ') || undefined,
      });
    }
  }

  const defaultId =
    preferredId && options.some((o) => o.value === preferredId) ? preferredId : options[0]?.value ?? '';
  return {
    options,
    defaultId,
    emptyReason: options.length === 0 ? 'No students found in this school yet.' : undefined,
  };
}

function emptyAttendanceSummary(): PeriodAttendanceSummary {
  return { periods: 0, present: 0, absent: 0, late: 0, excused: 0, percent: null, bySubject: [] };
}

function emptyFeeLedger(): StudentFeeLedger {
  return { available: false, billed: 0, paid: 0, pending: 0, balance: 0, overdueCount: 0, status: 'Unavailable', invoices: [], payments: [] };
}

function normalizeAttendanceSummary(raw: Loose | null): PeriodAttendanceSummary {
  if (!raw) return emptyAttendanceSummary();
  const bySubject = Array.isArray(raw.bySubject)
    ? (raw.bySubject as Loose[]).map((s) => ({
        subjectId: str(s.subjectId),
        subjectName: str(s.subjectName),
        present: num(s.present),
        absent: num(s.absent),
        late: num(s.late),
        excused: num(s.excused),
        periods: num(s.periods),
        percent: s.percent !== null && s.percent !== undefined ? num(s.percent) : null,
      }))
    : [];
  return {
    periods: num(raw.periods),
    present: num(raw.present),
    absent: num(raw.absent),
    late: num(raw.late),
    excused: num(raw.excused),
    percent: raw.percent !== null && raw.percent !== undefined ? num(raw.percent) : null,
    bySubject,
  };
}

function normalizeAttendanceRecords(raw: unknown): PeriodAttendanceEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((r, idx) => {
    const item = (r ?? {}) as Loose;
    return {
      id: str(item.id) || `pa-${idx}`,
      attendanceDate: str(item.attendanceDate).slice(0, 10),
      status: str(item.status) || 'present',
      remarks: str(item.remarks),
      subjectName: str(item.subjectName),
      slotName: str(item.slotName),
      startsAt: str(item.startsAt).slice(0, 5),
      endsAt: str(item.endsAt).slice(0, 5),
      teacherName: str(item.teacherName),
    };
  });
}

function normalizeFeeCollectionMe(raw: Loose | null): StudentFeeLedger {
  if (!raw) return emptyFeeLedger();
  const sum = (raw.summary ?? {}) as Loose;
  const billed = num(sum.billed);
  const paid = num(sum.paid);
  const pending = num(sum.pending);
  const balance = num(sum.balance);
  const invoices: StudentFeeInvoiceItem[] = Array.isArray(raw.invoices)
    ? (raw.invoices as Loose[]).map((i) => ({
        id: str(i.id),
        number: str(i.number),
        dueOn: str(i.dueOn).slice(0, 10),
        status: str(i.status) || 'issued',
        total: num(i.total),
        paid: num(i.paid),
        balance: num(i.balance),
      }))
    : [];
  const payments: StudentFeePaymentItem[] = Array.isArray(raw.payments)
    ? (raw.payments as Loose[]).map((p) => ({
        id: str(p.id),
        receiptNo: str(p.receiptNo),
        amount: num(p.amount),
        method: str(p.method),
        status: str(p.status),
        referenceNo: str(p.referenceNo),
        receivedAt: str(p.receivedAt).slice(0, 10),
      }))
    : [];
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;
  return {
    available: true,
    billed,
    paid,
    pending,
    balance,
    overdueCount,
    status: balance <= 0 ? 'Paid' : overdueCount > 0 ? 'Overdue' : 'Due',
    invoices,
    payments,
  };
}

function normalizeStaffFeeLedger(rawInvoices: Loose[] | null, rawPayments: Loose[] | null): StudentFeeLedger {
  if (rawInvoices === null && rawPayments === null) return emptyFeeLedger();
  const invList = Array.isArray(rawInvoices) ? rawInvoices.filter((i) => str(i.status) !== 'void') : [];
  const payList = Array.isArray(rawPayments) ? rawPayments : [];
  const cleared = payList.filter((p) => str(p.status) === 'cleared').reduce((acc, p) => acc + num(p.amount), 0);
  const pending = payList.filter((p) => str(p.status) === 'pending').reduce((acc, p) => acc + num(p.amount), 0);

  let remaining = cleared;
  const today = new Date().toISOString().slice(0, 10);
  const invoices: StudentFeeInvoiceItem[] = [...invList]
    .sort((a, b) => str(a.dueOn).localeCompare(str(b.dueOn)))
    .map((inv) => {
      const total = num(inv.totalAmount ?? inv.total);
      const paid = Math.min(total, Math.max(remaining, 0));
      remaining -= paid;
      const balance = Math.max(0, Number((total - paid).toFixed(2)));
      const st = balance <= 0 ? 'paid' : paid > 0 ? 'partially_paid' : str(inv.dueOn) < today ? 'overdue' : str(inv.status) || 'issued';
      return {
        id: str(inv.id),
        number: str(inv.number),
        dueOn: str(inv.dueOn).slice(0, 10),
        status: st,
        total,
        paid,
        balance,
      };
    });

  const payments: StudentFeePaymentItem[] = payList.map((p) => ({
    id: str(p.id),
    receiptNo: str(p.receiptNo),
    amount: num(p.amount),
    method: str(p.method),
    status: str(p.status),
    referenceNo: str(p.referenceNo),
    receivedAt: str(p.receivedAt).slice(0, 10),
  }));

  const billed = Number(invoices.reduce((acc, i) => acc + i.total, 0).toFixed(2));
  const balance = Number(invoices.reduce((acc, i) => acc + i.balance, 0).toFixed(2));
  const overdueCount = invoices.filter((i) => i.status === 'overdue').length;

  return {
    available: true,
    billed,
    paid: Number(cleared.toFixed(2)),
    pending: Number(pending.toFixed(2)),
    balance,
    overdueCount,
    status: balance <= 0 ? 'Paid' : overdueCount > 0 ? 'Overdue' : 'Due',
    invoices,
    payments,
  };
}

function normalizeTimetable(raw: Loose | null): StudentTimetableBundle {
  if (!raw) return { className: '', sectionName: '', message: '', entries: [] };
  const entries = Array.isArray(raw.entries)
    ? (raw.entries as Loose[]).map((e, idx) => ({
        id: str(e.id) || `tt-${idx}`,
        dayOfWeek: num(e.dayOfWeek),
        slotName: str(e.slotName) || `Period ${num(e.slotSequence) || idx + 1}`,
        slotSequence: num(e.slotSequence),
        startsAt: str(e.startsAt).slice(0, 5),
        endsAt: str(e.endsAt).slice(0, 5),
        subjectName: str(e.subjectName) || str(e.title) || 'Period',
        teacherName: str(e.teacherName),
        classroomCode: str(e.classroomCode),
      }))
    : [];
  return {
    className: str(raw.className),
    sectionName: str(raw.sectionName),
    message: str(raw.message),
    entries,
  };
}

function normalizeLibrary(raw: unknown, filterStudentId?: string): StudentLibraryLoan[] {
  if (!Array.isArray(raw)) return [];
  return (raw as Loose[])
    .filter((item) => !filterStudentId || str(item.studentId) === filterStudentId)
    .map((item, idx) => ({
      id: str(item.id) || `lib-${idx}`,
      bookTitle: str(item.bookTitle) || str(item.title) || 'Book',
      issuedOn: str(item.issuedOn).slice(0, 10),
      dueOn: str(item.dueOn).slice(0, 10),
      returnedOn: str(item.returnedOn).slice(0, 10),
      fine: num(item.fine),
      status: item.overdue ? 'overdue' : str(item.status) || 'issued',
      overdue: Boolean(item.overdue),
      remarks: str(item.remarks),
    }));
}

export async function fetchStudentProfileBundle(
  studentId: string,
  role: string | null | undefined,
): Promise<StudentProfileBundle> {
  if (role === 'student') {
    const [me, ttRaw, feeRaw, paSummaryRaw, paRowsRaw, libRaw, leaveRaw, hwRaw] = await Promise.all([
      apiRequest<Loose>('/api/students/me'),
      safeOptional<Loose | null>(() => apiRequest<Loose>('/api/students/me/timetable'), null),
      safeOptional<Loose | null>(() => apiRequest<Loose>('/api/fee-collection/me'), null),
      safeOptional<Loose | null>(
        () => apiRequest<Loose>(`/api/period-attendance/summary?studentId=${encodeURIComponent(studentId)}`),
        null,
      ),
      safeOptional<Loose[]>(
        () => apiRequest<Loose[]>(`/api/period-attendance?studentId=${encodeURIComponent(studentId)}&limit=50`),
        [],
      ),
      safeOptional<Loose[]>(() => apiRequest<Loose[]>('/api/library-issues/my'), []),
      safeOptional<Loose | null>(() => apiRequest<Loose>('/api/leave/student/me'), null),
      safeOptional<Loose[]>(() => apiRequest<Loose[]>('/api/homework-plus/my'), []),
    ]);

    const timetable = normalizeTimetable(ttRaw);
    const student = buildStudentSummary(me, {
      className: timetable.className,
      sectionName: timetable.sectionName,
    });

    const leaveTypes: StudentLeaveType[] = Array.isArray(leaveRaw?.leaveTypes)
      ? (leaveRaw.leaveTypes as Loose[]).map((lt) => ({
          id: str(lt.id),
          name: str(lt.name),
          maxConsecutiveDays: lt.maxConsecutiveDays !== null && lt.maxConsecutiveDays !== undefined ? num(lt.maxConsecutiveDays) : null,
        }))
      : [];
    const leaveRequests: StudentLeaveRequestItem[] = Array.isArray(leaveRaw?.requests)
      ? (leaveRaw.requests as Loose[])
          .filter((r) => str(r.studentId) === student.id)
          .map((r) => ({
            id: str(r.id),
            studentId: str(r.studentId),
            typeName: str(r.typeName) || 'Leave',
            fromDate: str(r.fromDate).slice(0, 10),
            toDate: str(r.toDate).slice(0, 10),
            days: num(r.days),
            durationType: str(r.durationType) || 'full_day',
            reason: str(r.reason),
            status: str(r.status) || 'pending',
            decisionNotes: str(r.decisionNotes),
          }))
      : [];

    const homework: StudentHomeworkItem[] = Array.isArray(hwRaw)
      ? hwRaw.map((h) => ({
          id: str(h.id),
          title: str(h.title),
          subjectName: str(h.subjectName),
          dueAt: str(h.dueAt).slice(0, 10),
          status: str(h.status),
          subStatus: str(h.subStatus) || 'not_submitted',
          maxMarks: h.maxMarks !== null && h.maxMarks !== undefined ? num(h.maxMarks) : null,
          score: h.score !== null && h.score !== undefined ? num(h.score) : null,
          gradeLabel: str(h.gradeLabel),
          feedback: str(h.feedback),
        }))
      : [];

    return {
      student,
      attendanceSummary: normalizeAttendanceSummary(paSummaryRaw),
      attendanceRecords: normalizeAttendanceRecords(paRowsRaw),
      leaveTypes,
      leaveRequests,
      fees: normalizeFeeCollectionMe(feeRaw),
      timetable,
      library: normalizeLibrary(libRaw),
      homework,
      transport: [],
    };
  }

  if (role === 'parent') {
    const [leaveRaw, paSummaryRaw, paRowsRaw, invRaw, payRaw, libRaw, hwRaw] = await Promise.all([
      safeOptional<Loose | null>(() => apiRequest<Loose>('/api/leave/student/me'), null),
      safeOptional<Loose | null>(
        () => apiRequest<Loose>(`/api/period-attendance/summary?studentId=${encodeURIComponent(studentId)}`),
        null,
      ),
      safeOptional<Loose[]>(
        () => apiRequest<Loose[]>(`/api/period-attendance?studentId=${encodeURIComponent(studentId)}&limit=50`),
        [],
      ),
      safeOptional<Loose[] | null>(
        () => apiRequest<Loose[]>(`/api/invoices?studentId=${encodeURIComponent(studentId)}&limit=50`),
        null,
      ),
      safeOptional<Loose[] | null>(
        () => apiRequest<Loose[]>(`/api/payments?studentId=${encodeURIComponent(studentId)}&limit=50`),
        null,
      ),
      safeOptional<Loose[]>(() => apiRequest<Loose[]>('/api/library-issues/my'), []),
      safeOptional<Loose[]>(() => apiRequest<Loose[]>('/api/homework-plus/my'), []),
    ]);

    const kids = Array.isArray(leaveRaw?.children) ? (leaveRaw.children as Loose[]) : [];
    const kid = kids.find((k) => str(k.id) === studentId);
    if (!kid) {
      throw new ApiError('Student details are not accessible for this account.', 403);
    }

    const student = buildStudentSummary({
      id: kid.id,
      fullName: kid.name,
      admissionNo: kid.admissionNo,
      className: kid.className,
      status: 'active',
    });

    const leaveTypes: StudentLeaveType[] = Array.isArray(leaveRaw?.leaveTypes)
      ? (leaveRaw.leaveTypes as Loose[]).map((lt) => ({
          id: str(lt.id),
          name: str(lt.name),
          maxConsecutiveDays: lt.maxConsecutiveDays !== null && lt.maxConsecutiveDays !== undefined ? num(lt.maxConsecutiveDays) : null,
        }))
      : [];
    const leaveRequests: StudentLeaveRequestItem[] = Array.isArray(leaveRaw?.requests)
      ? (leaveRaw.requests as Loose[])
          .filter((r) => str(r.studentId) === studentId)
          .map((r) => ({
            id: str(r.id),
            studentId: str(r.studentId),
            typeName: str(r.typeName) || 'Leave',
            fromDate: str(r.fromDate).slice(0, 10),
            toDate: str(r.toDate).slice(0, 10),
            days: num(r.days),
            durationType: str(r.durationType) || 'full_day',
            reason: str(r.reason),
            status: str(r.status) || 'pending',
            decisionNotes: str(r.decisionNotes),
          }))
      : [];

    const homework: StudentHomeworkItem[] = Array.isArray(hwRaw)
      ? hwRaw
          .filter((h) => !str(h.studentId) || str(h.studentId) === studentId)
          .map((h) => ({
            id: str(h.id),
            title: str(h.title),
            subjectName: str(h.subjectName),
            dueAt: str(h.dueAt).slice(0, 10),
            status: str(h.status),
            subStatus: str(h.subStatus) || 'not_submitted',
            maxMarks: h.maxMarks !== null && h.maxMarks !== undefined ? num(h.maxMarks) : null,
            score: h.score !== null && h.score !== undefined ? num(h.score) : null,
            gradeLabel: str(h.gradeLabel),
            feedback: str(h.feedback),
          }))
      : [];

    return {
      student,
      attendanceSummary: normalizeAttendanceSummary(paSummaryRaw),
      attendanceRecords: normalizeAttendanceRecords(paRowsRaw),
      leaveTypes,
      leaveRequests,
      fees: normalizeStaffFeeLedger(invRaw, payRaw),
      timetable: { className: student.className, sectionName: '', message: '', entries: [] },
      library: normalizeLibrary(libRaw, studentId),
      homework,
      transport: [],
    };
  }

  // Staff (admin, teacher, receptionist, accountant, librarian, etc.)
  const [detail, paSummaryRaw, paRowsRaw, invRaw, payRaw, transportRaw, libRaw, hwRaw] = await Promise.all([
    apiRequest<Loose>(`/api/students/${encodeURIComponent(studentId)}`),
    safeOptional<Loose | null>(
      () => apiRequest<Loose>(`/api/period-attendance/summary?studentId=${encodeURIComponent(studentId)}`),
      null,
    ),
    safeOptional<Loose[]>(
      () => apiRequest<Loose[]>(`/api/period-attendance?studentId=${encodeURIComponent(studentId)}&limit=50`),
      [],
    ),
    safeOptional<Loose[] | null>(
      () => apiRequest<Loose[]>(`/api/invoices?studentId=${encodeURIComponent(studentId)}&limit=50`),
      null,
    ),
    safeOptional<Loose[] | null>(
      () => apiRequest<Loose[]>(`/api/payments?studentId=${encodeURIComponent(studentId)}&limit=50`),
      null,
    ),
    safeOptional<Loose[]>(
      () => apiRequest<Loose[]>(`/api/transport-assignments?studentId=${encodeURIComponent(studentId)}&limit=20`),
      [],
    ),
    safeOptional<Loose[]>(() => apiRequest<Loose[]>('/api/library-issues'), []),
    safeOptional<Loose[]>(() => apiRequest<Loose[]>('/api/homework?limit=50'), []),
  ]);

  let admExtras: { className?: string; previousSchool?: string; applicationNo?: string } | undefined;
  const admId =
    detail.admission && typeof detail.admission === 'object'
      ? str((detail.admission as Loose).id)
      : str(detail.admissionId);

  if (admId && (!str(detail.className) || !str(detail.previousSchool))) {
    const adm = await safeOptional<Loose | null>(
      () => apiRequest<Loose>(`/api/admissions/${encodeURIComponent(admId)}`),
      null,
    );
    if (adm) {
      admExtras = {
        className: str(adm.className),
        previousSchool: str(adm.previousSchool),
        applicationNo: str(adm.applicationNo),
      };
    }
  }

  const student = buildStudentSummary(detail, admExtras);

  const transport: StudentTransportItem[] = Array.isArray(transportRaw)
    ? transportRaw.map((t) => ({
        id: str(t.id),
        routeCode: str(t.routeCode),
        routeName: str(t.routeName),
        pickupPointName: str(t.pickupPointName),
        direction: str(t.direction) || 'both',
        status: str(t.status) || 'active',
        effectiveFrom: str(t.effectiveFrom).slice(0, 10),
        effectiveTo: str(t.effectiveTo).slice(0, 10),
      }))
    : [];

  const homework: StudentHomeworkItem[] = Array.isArray(hwRaw)
    ? hwRaw
        .filter((h) => !student.className || !str(h.className) || str(h.className) === student.className)
        .map((h) => ({
          id: str(h.id),
          title: str(h.title),
          subjectName: str(h.subjectName),
          dueAt: str(h.dueAt).slice(0, 10),
          status: str(h.status),
          subStatus: str(h.status) || 'published',
          maxMarks: h.maxMarks !== null && h.maxMarks !== undefined ? num(h.maxMarks) : null,
          score: null,
          gradeLabel: '',
          feedback: '',
        }))
    : [];

  return {
    student,
    attendanceSummary: normalizeAttendanceSummary(paSummaryRaw),
    attendanceRecords: normalizeAttendanceRecords(paRowsRaw),
    leaveTypes: [],
    leaveRequests: [],
    fees: normalizeStaffFeeLedger(invRaw, payRaw),
    timetable: { className: student.className, sectionName: student.sectionName, message: '', entries: [] },
    library: normalizeLibrary(libRaw, student.id),
    homework,
    transport,
  };
}

export async function applyStudentLeave(payload: {
  studentId?: string;
  leaveTypeId: string;
  fromDate: string;
  toDate: string;
  durationType?: 'full_day' | 'half_day';
  reason: string;
}): Promise<unknown> {
  return apiRequest<unknown>('/api/leave/student/apply', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
