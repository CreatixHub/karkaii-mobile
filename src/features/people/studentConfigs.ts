import { repo, snapshot } from '@/core/store/store';
import { diffDays, formatDate, todayISO } from '@/core/utils/date';
import { csvEscape, money, pct } from '@/core/utils/format';
import type { FeeInvoiceRecord } from '@/data/seed/finance';
import { LAST_SCHOOL_DAY, type StudentAttendanceRecord } from '@/data/seed/hrm';
import type { ClassRecord, SectionRecord, StudentRecord } from '@/data/seed/master';
import { DOC_CATEGORIES, type CommunicationRecord, type DocCategory, type ExamResultRecord, type StudentDocumentRecord, type StudentLeaveRecord } from '@/data/seed/studentLife';
import { opts, parseCsvRows } from '@/features/academic/helpers';
import { classSection, countBy, getSection, nextNo, studentOptions, sum } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import { balanceOf, collectPayment } from '@/features/finance/configs';
import { attendancePct } from '@/features/hrm/configs';
import type { Tone } from '@/ui/tone';
import { PAYMENT_METHODS } from '@/data/seed/finance';
import { classNoOf, inStrength } from './promotionLogic';
import { academicPercent, ageOf, behaviourLabel, behaviourScore, classTeacherOf, feeSummary, hostelOf, profileText, rankInSection, transportOf } from './studentData';

const students = () => snapshot<StudentRecord>('students');
const statusTone: Record<string, Tone> = { Active: 'success', 'On Leave': 'warning', Inactive: 'neutral', Transfer: 'info', Graduated: 'purple', Suspended: 'danger' };
const STATUSES = ['Active', 'On Leave', 'Inactive', 'Transfer', 'Graduated', 'Suspended'];
const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
const ACTIVITIES = ['Sports', 'NCC', 'Arts', 'Music', 'Robotics'];
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

let todayCache: { source: StudentAttendanceRecord[]; map: Map<string, string> } | null = null;
/** Status of each student on the latest register day. */
const statusOnLastDay = (studentId: string): string | undefined => {
  const source = snapshot<StudentAttendanceRecord>('studentAttendance');
  if (!todayCache || todayCache.source !== source) todayCache = { source, map: new Map(source.filter((a) => a.date === LAST_SCHOOL_DAY).map((a) => [a.studentId, a.status] as const)) };
  return todayCache.map.get(studentId);
};
const present = (s: StudentRecord) => ['Present', 'Late', 'Half Day'].includes(statusOnLastDay(s.id) ?? '');

export const classNumberLabel = (s: StudentRecord) => `Grade ${classNoOf(s.classId)}`;

/* ============================== Students roster ============================== */

export const studentsCfg: ResourceConfig<StudentRecord> = {
  entity: 'Student',
  collection: 'students',
  auditEntity: 'student',
  searchPlaceholder: 'Search name, admission no, class…',
  searchText: (r) => `${r.name} ${r.admissionNo} ${classSection(r)} ${r.parentName} ${r.house} ${r.rollNo} ${r.phone}`,
  code: (r) => r.admissionNo,
  title: (r) => r.name,
  subtitle: (r) => `${classSection(r)} · ${r.house} House`,
  status: (r) => ({ label: r.status, tone: statusTone[r.status] }),
  badges: (r) => {
    const fee = feeSummary(r.id);
    return [
      { label: fee.status === 'Paid' ? 'Fees Paid' : fee.status === 'Overdue' ? 'Fees Overdue' : 'Fees Due', tone: fee.status === 'Paid' ? 'success' : fee.status === 'Overdue' ? 'danger' : 'warning' },
      { label: r.transport ? 'Transport' : 'Own transport', tone: r.transport ? 'primary' : 'neutral' },
      ...(r.hostel ? [{ label: 'Hostel', tone: 'warning' as Tone }] : []),
      ...(r.scholar ? [{ label: 'Scholar', tone: 'purple' as Tone }] : []),
      ...r.activities.map((a) => ({ label: a, tone: 'info' as Tone })),
    ];
  },
  facts: [
    { label: 'Roll no', value: (r) => r.rollNo },
    { label: 'Age', value: (r) => `${ageOf(r.dob)} years` },
    { label: 'Guardian', value: (r) => `${r.parentName} · ${r.parentPhone}` },
    { label: 'Attendance', value: (r) => pct(attendancePct(r.id)) },
    { label: 'Academic', value: (r) => pct(academicPercent(r.id)) },
    { label: 'Class rank', value: (r) => { const k = rankInSection(r); return k.of ? `#${k.rank} of ${k.of}` : undefined; } },
  ],
  detail: [
    { title: 'Student', items: [{ label: 'Admission no', value: (r) => r.admissionNo }, { label: 'Name', value: (r) => r.name }, { label: 'Gender', value: (r) => r.gender }, { label: 'Date of birth', value: (r) => `${formatDate(r.dob)} (${ageOf(r.dob)} yrs)` }, { label: 'Blood group', value: (r) => r.bloodGroup }, { label: 'Religion', value: (r) => r.religion }, { label: 'Nationality', value: (r) => r.nationality }, { label: 'Status', value: (r) => r.status }] },
    { title: 'Class', items: [{ label: 'Class / section', value: (r) => classSection(r) }, { label: 'Roll no', value: (r) => r.rollNo }, { label: 'House', value: (r) => `${r.house} House` }, { label: 'Class teacher', value: (r) => classTeacherOf(r)?.name }, { label: 'Joined', value: (r) => formatDate(r.joinedOn) }, { label: 'Previous school', value: (r) => r.previousSchool || '—' }, { label: 'Activities', value: (r) => r.activities.join(', ') || '—' }] },
    { title: 'Family & contact', items: [{ label: 'Father / guardian', value: (r) => r.parentName }, { label: 'Mother', value: (r) => r.motherName }, { label: 'Guardian phone', value: (r) => r.parentPhone }, { label: 'Student phone', value: (r) => r.phone }, { label: 'Emergency phone', value: (r) => r.emergencyPhone }, { label: 'Email', value: (r) => r.email }, { label: 'Address', value: (r) => r.address }] },
    { title: 'Services', items: [{ label: 'Transport', value: (r) => { const t = transportOf(r); return t ? `${t.name} · ${t.bus}` : 'Own transport'; } }, { label: 'Hostel', value: (r) => { const h = hostelOf(r); return h ? `${h.block} · Room ${h.room}` : 'Day scholar'; } }, { label: 'Scholarship', value: (r) => (r.scholar ? 'Yes' : 'No') }] },
    { title: 'Performance', items: [{ label: 'Attendance', value: (r) => pct(attendancePct(r.id)) }, { label: 'Academic average', value: (r) => pct(academicPercent(r.id)) }, { label: 'Behaviour', value: (r) => `${behaviourScore(r.id)}/100 · ${behaviourLabel(behaviourScore(r.id))}` }, { label: 'Fees', value: (r) => { const f = feeSummary(r.id); return f.balance > 0 ? `${f.status} · ${money(f.balance)} outstanding` : 'Paid up'; } }] },
  ],
  stats: [
    { label: 'Total students', value: (rows) => rows.length, icon: 'users' },
    { label: 'Present today', value: (rows) => countBy(rows, present), tone: 'info', icon: 'user-check' },
    { label: 'Absent today', value: (rows) => countBy(rows, (r) => statusOnLastDay(r.id) === 'Absent'), tone: 'danger', icon: 'user-x' },
    { label: 'Fee pending', value: (rows) => { const n = rows.filter((r) => feeSummary(r.id).balance > 0); return `${n.length} · ${money(sum(n, (r) => feeSummary(r.id).balance))}`; }, tone: 'warning', icon: 'dollar-sign' },
    { label: 'Avg attendance', value: (rows) => pct(rows.length ? sum(rows, (r) => attendancePct(r.id)) / rows.length : 0, 1), tone: 'success', icon: 'calendar' },
    { label: 'Avg performance', value: (rows) => pct(rows.length ? sum(rows, (r) => academicPercent(r.id)) / rows.length : 0, 1), tone: 'primary', icon: 'trending-up' },
    { label: 'Transport', value: (rows) => countBy(rows, (r) => r.transport), tone: 'info', icon: 'truck' },
    { label: 'Hostel', value: (rows) => countBy(rows, (r) => r.hostel), tone: 'warning', icon: 'home' },
  ],
  views: [
    { key: 'all', label: 'All Students', match: () => true },
    { key: 'Active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'Inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
    { key: 'Graduated', label: 'Graduated', match: (r) => r.status === 'Graduated' },
    { key: 'Transfer', label: 'Transfer', match: (r) => r.status === 'Transfer' },
    { key: 'Leave', label: 'On Leave', match: (r) => r.status === 'On Leave' },
  ],
  filters: [
    { key: 'class', label: 'Class', options: () => snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => r.classId === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => getSection(r.sectionId)?.name === v },
    { key: 'gender', label: 'Gender', options: opts(['Male', 'Female']), match: (r, v) => r.gender === v },
    { key: 'status', label: 'Status', options: opts(STATUSES), match: (r, v) => r.status === v },
    { key: 'house', label: 'House', options: opts(HOUSES), match: (r, v) => r.house === v },
    { key: 'transport', label: 'Transport', single: true, options: opts(['Yes', 'No']), match: (r, v) => r.transport === (v === 'Yes') },
    { key: 'hostel', label: 'Hostel', single: true, options: opts(['Yes', 'No']), match: (r, v) => r.hostel === (v === 'Yes') },
    { key: 'scholar', label: 'Scholarship', single: true, options: opts(['Yes', 'No']), match: (r, v) => r.scholar === (v === 'Yes') },
    { key: 'fees', label: 'Fees', options: opts(['Paid', 'Due', 'Overdue']), match: (r, v) => feeSummary(r.id).status === v },
  ],
  sorts: [
    { key: 'name', label: 'Student name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) || a.name.localeCompare(b.name) },
    { key: 'class', label: 'Class', compare: (a, b) => classNoOf(a.classId) - classNoOf(b.classId) || a.sectionId.localeCompare(b.sectionId) || a.rollNo - b.rollNo },
    { key: 'join', label: 'Date of join', compare: (a, b) => a.joinedOn.localeCompare(b.joinedOn) },
    { key: 'recent', label: 'Recently added', compare: (a, b) => b.joinedOn.localeCompare(a.joinedOn) },
  ],
  form: [
    { key: 'name', label: 'Student Name', type: 'text', required: true, section: 'Student' },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'], default: 'Female' },
    { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: BLOOD, default: 'O+' },
    { key: 'religion', label: 'Religion', type: 'text' },
    { key: 'nationality', label: 'Nationality', type: 'text', default: 'Indian' },
    { key: 'phone', label: 'Student Phone', type: 'phone' },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'admissionNo', label: 'Admission No', type: 'text', required: true, section: 'Class' },
    { key: 'classId', label: 'Class', type: 'select', required: true, optionsFrom: { collection: 'classes', label: (c: ClassRecord) => c.name }, onChange: () => ({ sectionId: '' }) },
    { key: 'sectionId', label: 'Section', type: 'select', required: true, optionsFrom: { collection: 'sections', label: (s: SectionRecord) => s.name, hint: (s: SectionRecord) => `${Math.max(0, s.capacity - students().filter((x) => x.sectionId === s.id && inStrength(x)).length)} seats free`, filter: (s: SectionRecord, v) => s.classId === v.classId } },
    { key: 'rollNo', label: 'Roll No', type: 'number', required: true, min: 1 },
    { key: 'house', label: 'House', type: 'select', options: HOUSES, default: 'Red' },
    { key: 'joinedOn', label: 'Date of Joining', type: 'date', required: true },
    { key: 'previousSchool', label: 'Previous School', type: 'text' },
    { key: 'activities', label: 'Clubs & Activities', type: 'multiselect', options: ACTIVITIES },
    { key: 'parentName', label: 'Father / Guardian Name', type: 'text', required: true, section: 'Family' },
    { key: 'parentPhone', label: 'Guardian Phone', type: 'phone', required: true },
    { key: 'motherName', label: 'Mother Name', type: 'text' },
    { key: 'emergencyPhone', label: 'Emergency Phone', type: 'phone' },
    { key: 'transport', label: 'Uses school transport', type: 'switch', section: 'Services' },
    { key: 'hostel', label: 'Hostel resident', type: 'switch' },
    { key: 'scholar', label: 'Scholarship holder', type: 'switch' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: STATUSES, default: 'Active' },
  ],
  defaults: (rows) => ({ admissionNo: nextNo('AD', rows.map((r) => r.admissionNo), 7), rollNo: Math.max(35000, ...rows.map((r) => r.rollNo)) + 3, joinedOn: todayISO() }),
  validate: (v, { existing, rows }) => {
    const cap = snapshot<SectionRecord>('sections').find((s) => s.id === v.sectionId);
    const seated = rows.filter((r) => r.sectionId === v.sectionId && inStrength(r) && r.id !== existing?.id).length;
    return {
      ...(rows.some((r) => r.id !== existing?.id && r.admissionNo.toLowerCase() === String(v.admissionNo).trim().toLowerCase()) ? { admissionNo: 'This admission number is already used' } : {}),
      ...(rows.some((r) => r.id !== existing?.id && r.rollNo === Number(v.rollNo)) ? { rollNo: 'This roll number is already used' } : {}),
      ...(String(v.dob) >= todayISO() ? { dob: 'Date of birth must be in the past' } : {}),
      ...(String(v.joinedOn) > todayISO() ? { joinedOn: 'Joining date cannot be in the future' } : {}),
      ...(cap && cap.classId !== v.classId ? { sectionId: 'This section belongs to a different class' } : {}),
      ...(cap && ['Active', 'On Leave'].includes(String(v.status)) && seated >= cap.capacity ? { sectionId: `${cap.name} is full (${cap.capacity} seats)` } : {}),
    };
  },
  prepare: (v, { existing }) => ({ name: String(v.name).trim(), nationality: v.nationality || 'Indian', parentName: String(v.parentName).trim(), emergencyPhone: v.emergencyPhone || existing?.emergencyPhone || '', motherName: v.motherName || '' }),
  canDeleteRecord: (r) => {
    const records = countBy(snapshot<StudentAttendanceRecord>('studentAttendance'), (a) => a.studentId === r.id) + countBy(snapshot<FeeInvoiceRecord>('feeInvoices'), (i) => i.studentId === r.id) + countBy(snapshot<ExamResultRecord>('examResults'), (e) => e.studentId === r.id);
    return records ? `${r.name} has ${records} attendance, fee or exam record(s) that must be kept. Set the status to Inactive or Transfer instead.` : null;
  },
  actions: [
    { key: 'profile', label: 'Open full profile', icon: 'user', manage: false, run: (r, _v, ctx) => ctx.go(`/people/student-profile?id=${r.id}`) },
    {
      key: 'collect',
      label: 'Collect fees',
      icon: 'dollar-sign',
      visible: (r) => feeSummary(r.id).balance > 0,
      form: {
        title: 'Collect fees',
        submitLabel: 'Collect',
        fields: [
          { key: 'amount', label: 'Amount Received', type: 'money', required: true, min: 1, hint: 'Applied to the oldest unpaid invoice first.' },
          { key: 'method', label: 'Payment Method', type: 'select', required: true, options: opts(PAYMENT_METHODS), default: 'Cash' },
          { key: 'date', label: 'Collection Date', type: 'date', required: true },
          { key: 'reference', label: 'Reference / Transaction No', type: 'text', hidden: (v) => v.method === 'Cash' },
        ],
        initial: (r) => ({ amount: String(Math.round(feeSummary(r.id).balance)), date: todayISO() }),
        validate: (v, r) => (Number(v.amount) > feeSummary(r.id).balance + 0.001 ? { amount: `Cannot exceed the outstanding ${money(feeSummary(r.id).balance)}` } : {}),
      },
      run: (r, v, ctx) => {
        let left = Number(v.amount);
        const receipts: string[] = [];
        const unpaid = snapshot<FeeInvoiceRecord>('feeInvoices').filter((i) => i.studentId === r.id && balanceOf(i) > 0).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
        for (const inv of unpaid) {
          if (left <= 0) break;
          const pay = Math.min(left, balanceOf(inv));
          receipts.push(collectPayment(inv.id, { amount: pay, method: v.method, date: v.date, reference: v.reference }, 'Student Records'));
          left -= pay;
        }
        ctx.toast(`${money(Number(v.amount))} collected from ${r.name} · ${receipts.join(', ')}`);
      },
    },
    {
      key: 'message',
      label: 'Message guardian',
      icon: 'message-circle',
      form: { title: 'Message guardian', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: ['SMS', 'Email', 'Message'], default: 'SMS' }, { key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] },
      run: (r, v, ctx) => {
        repo<CommunicationRecord>('communications').create({ studentId: r.id, channel: v.channel, subject: v.subject, summary: v.message, date: todayISO(), by: 'Admin Office', direction: 'Outgoing' });
        ctx.toast(`Message to ${r.parentName} logged (mock: nothing is sent)`, 'info');
      },
    },
    {
      key: 'leave',
      label: 'Apply leave',
      icon: 'calendar',
      visible: (r) => inStrength(r),
      form: {
        title: 'Apply leave',
        submitLabel: 'Submit',
        fields: [
          { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: ['Sick Leave', 'Casual Leave', 'Medical', 'Other'] },
          { key: 'from', label: 'From', type: 'date', required: true },
          { key: 'to', label: 'To', type: 'date', required: true },
          { key: 'reason', label: 'Reason', type: 'textarea', required: true },
        ],
        initial: () => ({ from: todayISO(), to: todayISO() }),
        validate: (v, r) => ({
          ...(String(v.to) < String(v.from) ? { to: 'End date cannot be before the start date' } : {}),
          ...(snapshot<StudentLeaveRecord>('studentLeaves').some((l) => l.studentId === r.id && l.status !== 'Rejected' && l.from <= String(v.to) && l.to >= String(v.from)) ? { from: 'This overlaps an existing leave request' } : {}),
        }),
      },
      run: (r, v, ctx) => {
        repo<StudentLeaveRecord>('studentLeaves').create({ studentId: r.id, leaveType: v.leaveType, from: v.from, to: v.to, days: diffDays(v.from, v.to) + 1, status: 'Pending', reason: v.reason, appliedOn: todayISO(), decidedBy: '', decisionNote: '' });
        ctx.toast(`Leave request submitted for ${r.name}`);
      },
    },
    { key: 'attendance', label: 'Attendance history', icon: 'clock', manage: false, run: (r, _v, ctx) => ctx.go(`/people/student-attendance-history?id=${r.id}`) },
    { key: 'documents', label: 'Documents', icon: 'folder', manage: false, run: (r, _v, ctx) => ctx.go(`/people/student-documents?q=${r.admissionNo}`) },
    {
      key: 'status',
      label: 'Change status',
      icon: 'flag',
      form: { title: 'Change status', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: STATUSES }], initial: (r) => ({ status: r.status }) },
      run: (r, v, ctx) => {
        if (v.status === 'Active' || v.status === 'On Leave') {
          const sec = getSection(r.sectionId);
          const seated = students().filter((s) => s.sectionId === r.sectionId && inStrength(s) && s.id !== r.id).length;
          if (sec && !inStrength(r) && seated >= sec.capacity) { ctx.toast(`${classSection(r)} is full, so ${r.name} cannot be made ${v.status}`, 'error'); return; }
        }
        ctx.update({ status: v.status });
        ctx.toast(`${r.name} is now ${v.status}`);
      },
    },
    { key: 'print', label: 'Share profile', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(`${r.name} — profile`, profileText(r)) },
  ],
  bulk: [
    { key: 'status', label: 'Set status', icon: 'flag', form: { title: 'Set status for selected students', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: STATUSES }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ status: v.status })); ctx.toast(`${rows.length} students set to ${v.status}`); } },
    {
      key: 'message',
      label: 'Message guardians',
      icon: 'message-circle',
      form: { title: 'Message guardians of selected students', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] },
      run: (rows, v, ctx) => {
        for (const r of rows) repo<CommunicationRecord>('communications').create({ studentId: r.id, channel: 'SMS', subject: v.subject, summary: v.message, date: todayISO(), by: 'Admin Office', direction: 'Outgoing' });
        ctx.toast(`${rows.length} messages logged (mock: nothing is sent)`, 'info');
      },
    },
  ],
  pageActions: [
    { key: 'promotion', label: 'Promote students', icon: 'trending-up', manage: true, run: (_v, ctx) => ctx.go('/people/student-promotion') },
    {
      key: 'import',
      label: 'Import students',
      icon: 'upload',
      form: { title: 'Import students', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Asha Menon,Female,2016-04-12,Grade IV,A,Suresh Menon,+91 98400 11111', hint: 'name, gender, date of birth, class, section, guardian, guardian phone. Rows with a full section, unknown class or a bad date are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        const rows = parseCsvRows(String(v.csv));
        const existing = [...ctx.rows];
        const taken = new Map<string, number>();
        for (const [name, gender, dob, className, sectionName, guardian, phone] of rows) {
          const cls = snapshot<ClassRecord>('classes').find((c) => c.name.toLowerCase() === (className ?? '').toLowerCase());
          const sec = cls ? snapshot<SectionRecord>('sections').find((s) => s.classId === cls.id && s.name.toLowerCase() === (sectionName ?? '').toLowerCase()) : undefined;
          const seated = sec ? students().filter((s) => s.sectionId === sec.id && inStrength(s)).length + (taken.get(sec.id) ?? 0) : 0;
          if (!name || !['Male', 'Female'].includes(gender) || !/^\d{4}-\d{2}-\d{2}$/.test(dob ?? '') || dob >= todayISO() || !cls || !sec || seated >= sec.capacity || !guardian) { skipped += 1; continue; }
          taken.set(sec.id, (taken.get(sec.id) ?? 0) + 1);
          const admissionNo = nextNo('AD', [...existing.map((r) => r.admissionNo), ...snapshot<StudentRecord>('students').map((r) => r.admissionNo)], 7);
          const created = ctx.create({ admissionNo, name, gender: gender as StudentRecord['gender'], dob, classId: cls.id, sectionId: sec.id, rollNo: Math.max(35000, ...snapshot<StudentRecord>('students').map((r) => r.rollNo)) + 3, house: HOUSES[added % 4], parentName: guardian, parentPhone: phone || '', email: `${name.toLowerCase().replace(/\s+/g, '.')}@student.karkaii.demo`, bloodGroup: '', address: '', transport: false, hostel: false, scholar: false, status: 'Active', joinedOn: todayISO(), motherName: '', religion: '', nationality: 'Indian', phone: '', emergencyPhone: '', previousSchool: '', activities: [] });
          existing.push(created);
          added += 1;
        }
        ctx.toast(`${added} student${added === 1 ? '' : 's'} imported${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
  exportColumns: [
    { label: 'Admission No', value: (r) => r.admissionNo },
    { label: 'Name', value: (r) => r.name },
    { label: 'Class', value: (r) => classSection(r) },
    { label: 'Gender', value: (r) => r.gender },
    { label: 'Status', value: (r) => r.status },
    { label: 'Guardian', value: (r) => r.parentName },
    { label: 'Guardian phone', value: (r) => csvEscape(r.parentPhone) },
    { label: 'Attendance %', value: (r) => Math.round(attendancePct(r.id)) },
  ],
};

/* ============================== Student documents ============================== */

const docTone: Record<string, Tone> = { Verified: 'success', Pending: 'warning', Rejected: 'danger', Expired: 'danger' };
const sizeText = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
const extOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const typeOfFile = (name: string) => (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extOf(name)) ? 'Image' : ['doc', 'docx', 'txt'].includes(extOf(name)) ? 'Doc' : 'PDF');
const studentOf = (d: StudentDocumentRecord) => students().find((s) => s.id === d.studentId);
const FILE_NAME = /^[\w][\w .()-]*\.(pdf|jpg|jpeg|png|doc|docx)$/i;

export const documentsCfg: ResourceConfig<StudentDocumentRecord> = {
  entity: 'Document',
  collection: 'studentDocuments',
  auditEntity: 'document',
  searchPlaceholder: 'Search file, student, admission no…',
  searchText: (r) => `${r.name} ${studentOf(r)?.name ?? ''} ${studentOf(r)?.admissionNo ?? ''} ${r.category} ${r.uploadedBy}`,
  code: (r) => r.category,
  title: (r) => r.name,
  subtitle: (r) => `${studentOf(r)?.name ?? '—'} · ${studentOf(r)?.admissionNo ?? ''}`,
  status: (r) => ({ label: r.status, tone: docTone[r.status] }),
  badges: (r) => [...(r.favourite ? [{ label: 'Favourite', tone: 'warning' as Tone }] : []), ...(r.shared ? [{ label: 'Shared', tone: 'info' as Tone }] : []), ...(r.archived ? [{ label: 'Archived', tone: 'neutral' as Tone }] : []), ...(r.version > 1 ? [{ label: `v${r.version}`, tone: 'primary' as Tone }] : [])],
  facts: [
    { label: 'Class', value: (r) => classSection(studentOf(r)) },
    { label: 'Size', value: (r) => sizeText(r.sizeKb) },
    { label: 'Uploaded', value: (r) => formatDate(r.uploadedOn) },
    { label: 'By', value: (r) => r.uploadedBy },
  ],
  detail: [
    { title: 'File', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Type', value: (r) => typeOfFile(r.name) }, { label: 'Size', value: (r) => sizeText(r.sizeKb) }, { label: 'Version', value: (r) => `v${r.version}` }, { label: 'Uploaded', value: (r) => `${formatDate(r.uploadedOn)} by ${r.uploadedBy}` }] },
    { title: 'Student', items: [{ label: 'Name', value: (r) => studentOf(r)?.name }, { label: 'Admission no', value: (r) => studentOf(r)?.admissionNo }, { label: 'Class', value: (r) => classSection(studentOf(r)) }] },
    { title: 'Verification', items: [{ label: 'Status', value: (r) => r.status }, { label: 'Note', value: (r) => r.note || '—' }, { label: 'Shared with guardian', value: (r) => (r.shared ? 'Yes' : 'No') }, { label: 'History', value: (r) => r.history.join(' · ') }] },
  ],
  stats: [
    { label: 'Documents', value: (rows) => rows.length, icon: 'folder' },
    { label: 'Verified', value: (rows) => countBy(rows, (r) => r.status === 'Verified'), tone: 'success', icon: 'check-circle' },
    { label: 'Pending', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Expired / rejected', value: (rows) => countBy(rows, (r) => r.status === 'Expired' || r.status === 'Rejected'), tone: 'danger', icon: 'alert-triangle' },
  ],
  views: [
    { key: 'all', label: 'All Documents', match: (r) => !r.archived },
    { key: 'recent', label: 'Recent', match: (r) => !r.archived && diffDays(r.uploadedOn, todayISO()) <= 14 },
    { key: 'favourites', label: 'Favourites', match: (r) => r.favourite && !r.archived },
    { key: 'shared', label: 'Shared', match: (r) => r.shared && !r.archived },
    { key: 'verified', label: 'Verified', match: (r) => r.status === 'Verified' && !r.archived },
    { key: 'pending', label: 'Pending', match: (r) => r.status === 'Pending' && !r.archived },
    { key: 'expired', label: 'Expired', match: (r) => r.status === 'Expired' && !r.archived },
    { key: 'archived', label: 'Archived', match: (r) => r.archived },
  ],
  filters: [
    { key: 'category', label: 'Category', options: opts(DOC_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'status', label: 'Verification', options: opts(['Verified', 'Pending', 'Rejected', 'Expired']), match: (r, v) => r.status === v },
    { key: 'class', label: 'Class', options: () => snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => studentOf(r)?.classId === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => getSection(studentOf(r)?.sectionId)?.name === v },
    { key: 'type', label: 'File type', options: opts(['PDF', 'Image', 'Doc']), match: (r, v) => typeOfFile(r.name) === v },
  ],
  sorts: [
    { key: 'newest', label: 'Newest first', compare: (a, b) => b.uploadedOn.localeCompare(a.uploadedOn) },
    { key: 'oldest', label: 'Oldest first', compare: (a, b) => a.uploadedOn.localeCompare(b.uploadedOn) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'size', label: 'File size (largest)', compare: (a, b) => b.sizeKb - a.sizeKb },
  ],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: studentOptions, readOnly: (_v, isEdit) => isEdit },
    { key: 'category', label: 'Category', type: 'select', required: true, options: opts(DOC_CATEGORIES) },
    { key: 'name', label: 'File Name', type: 'text', required: true, placeholder: 'birth-certificate.pdf', hint: 'Include the extension: pdf, jpg, png, doc or docx.' },
    { key: 'sizeKb', label: 'File Size (KB)', type: 'number', required: true, min: 1, max: 20480, default: 500, hint: 'Documents are recorded as metadata in this demo; no file is stored.' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(!FILE_NAME.test(String(v.name).trim()) ? { name: 'Use a file name ending in .pdf, .jpg, .png, .doc or .docx' } : {}),
    ...(rows.some((r) => r.id !== existing?.id && r.studentId === v.studentId && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'This student already has a file with that name' } : {}),
  }),
  prepare: (v, { existing }) => ({
    name: String(v.name).trim(),
    status: existing?.status ?? 'Pending',
    uploadedOn: existing?.uploadedOn ?? todayISO(),
    uploadedBy: existing?.uploadedBy ?? 'Admin Office',
    favourite: existing?.favourite ?? false,
    shared: existing?.shared ?? false,
    archived: existing?.archived ?? false,
    version: existing?.version ?? 1,
    history: existing?.history ?? [`v1 uploaded on ${todayISO()}`],
  }),
  actions: [
    { key: 'verify', label: 'Verify', icon: 'check-circle', tone: 'success', visible: (r) => r.status !== 'Verified', run: (r, _v, ctx) => { ctx.update({ status: 'Verified', note: '' }); ctx.toast(`${r.name} verified`); } },
    { key: 'reject', label: 'Reject', icon: 'x-circle', tone: 'danger', visible: (r) => r.status !== 'Rejected', form: { title: 'Reject document', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] }, run: (r, v, ctx) => { ctx.update({ status: 'Rejected', note: v.reason }); ctx.toast(`${r.name} rejected`, 'info'); } },
    {
      key: 'replace',
      label: 'Replace file',
      icon: 'refresh-cw',
      form: { title: 'Replace file', submitLabel: 'Replace', fields: [{ key: 'name', label: 'New File Name', type: 'text', required: true }, { key: 'sizeKb', label: 'File Size (KB)', type: 'number', required: true, min: 1, max: 20480 }], initial: (r) => ({ name: r.name, sizeKb: String(r.sizeKb) }), validate: (v) => (FILE_NAME.test(String(v.name).trim()) ? {} : { name: 'Use a file name ending in .pdf, .jpg, .png, .doc or .docx' }) },
      run: (r, v, ctx) => { ctx.update({ name: String(v.name).trim(), sizeKb: Number(v.sizeKb), version: r.version + 1, status: 'Pending', uploadedOn: todayISO(), note: '', history: [...r.history, `v${r.version + 1} replaced on ${todayISO()}`] }); ctx.toast(`Replaced as v${r.version + 1}; it needs verifying again`); },
    },
    {
      key: 'rename',
      label: 'Rename',
      icon: 'edit-3',
      form: { title: 'Rename document', fields: [{ key: 'name', label: 'File Name', type: 'text', required: true }], initial: (r) => ({ name: r.name }), validate: (v, r) => ({ ...(FILE_NAME.test(String(v.name).trim()) ? {} : { name: 'Use a file name ending in .pdf, .jpg, .png, .doc or .docx' }), ...(snapshot<StudentDocumentRecord>('studentDocuments').some((d) => d.id !== r.id && d.studentId === r.studentId && d.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'This student already has a file with that name' } : {}) }) },
      run: (r, v, ctx) => { ctx.update({ name: String(v.name).trim() }); ctx.toast(`Renamed to ${String(v.name).trim()}`); },
    },
    { key: 'move', label: 'Move to category', icon: 'folder', form: { title: 'Move to category', fields: [{ key: 'category', label: 'Category', type: 'select', required: true, options: opts(DOC_CATEGORIES) }], initial: (r) => ({ category: r.category }) }, run: (r, v, ctx) => { ctx.update({ category: v.category as DocCategory }); ctx.toast(`Moved to ${v.category}`); } },
    { key: 'favourite', label: 'Toggle favourite', icon: 'star', manage: false, run: (r, _v, ctx) => { ctx.update({ favourite: !r.favourite }); ctx.toast(r.favourite ? 'Removed from favourites' : 'Added to favourites', 'info'); } },
    { key: 'share', label: 'Share with guardian', icon: 'share-2', visible: (r) => !r.shared, run: (r, _v, ctx) => { ctx.update({ shared: true }); ctx.toast(`${r.name} shared with the guardian (mock: nothing is sent)`, 'info'); } },
    { key: 'unshare', label: 'Stop sharing', icon: 'eye-off', visible: (r) => r.shared, run: (r, _v, ctx) => { ctx.update({ shared: false }); ctx.toast('Sharing stopped', 'info'); } },
    {
      key: 'duplicate',
      label: 'Duplicate',
      icon: 'copy',
      run: (r, _v, ctx) => {
        const base = r.name.replace(/(\.[a-z]+)$/i, '');
        const ext = r.name.slice(base.length);
        let n = 1;
        while (snapshot<StudentDocumentRecord>('studentDocuments').some((d) => d.studentId === r.studentId && d.name === `${base}-copy${n > 1 ? n : ''}${ext}`)) n += 1;
        repo<StudentDocumentRecord>('studentDocuments').create({ ...r, id: undefined, name: `${base}-copy${n > 1 ? n : ''}${ext}`, favourite: false, shared: false, version: 1, status: 'Pending', uploadedOn: todayISO(), history: [`v1 duplicated from ${r.name} on ${todayISO()}`] });
        ctx.toast('Duplicate created (pending verification)');
      },
    },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => !r.archived, confirm: 'Archive this document? It moves out of the main list.', run: (r, _v, ctx) => { ctx.update({ archived: true }); ctx.toast('Archived', 'info'); } },
    { key: 'restore', label: 'Restore', icon: 'rotate-ccw', visible: (r) => r.archived, run: (r, _v, ctx) => { ctx.update({ archived: false }); ctx.toast('Restored'); } },
    { key: 'history', label: 'Version history', icon: 'git-commit', manage: false, run: (r, _v, ctx) => ctx.alert(`${r.name} — history`, r.history.join('\n')) },
    { key: 'print', label: 'Share details', icon: 'printer', manage: false, run: (r, _v, ctx) => ctx.share(r.name, `${r.name}\n${r.category} · ${sizeText(r.sizeKb)} · v${r.version}\nStudent: ${studentOf(r)?.name} (${studentOf(r)?.admissionNo})\nStatus: ${r.status}\nUploaded ${formatDate(r.uploadedOn)} by ${r.uploadedBy}`) },
  ],
  bulk: [
    { key: 'verify', label: 'Verify', icon: 'check-circle', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ status: 'Verified' as const, note: '' })); ctx.toast(`${rows.length} documents verified`); } },
    { key: 'move', label: 'Move', icon: 'folder', form: { title: 'Move selected documents', fields: [{ key: 'category', label: 'Category', type: 'select', required: true, options: opts(DOC_CATEGORIES) }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ category: v.category as DocCategory })); ctx.toast(`${rows.length} documents moved to ${v.category}`); } },
    { key: 'archive', label: 'Archive', icon: 'archive', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ archived: true })); ctx.toast(`${rows.length} documents archived`, 'info'); } },
  ],
  pageActions: [
    {
      key: 'bulkUpload',
      label: 'Bulk upload',
      icon: 'upload-cloud',
      form: { title: 'Bulk upload', submitLabel: 'Upload', fields: [{ key: 'category', label: 'Category', type: 'select', required: true, options: opts(DOC_CATEGORIES) }, { key: 'csv', label: 'One per line: admission no, file name, size in KB', type: 'textarea', required: true, placeholder: 'AD1256507,birth-certificate.pdf,640', hint: 'Rows with an unknown admission number, a bad file name or a name the student already has are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        for (const [adm, file, kb] of parseCsvRows(String(v.csv))) {
          const st = students().find((s) => s.admissionNo.toLowerCase() === (adm ?? '').toLowerCase());
          const size = Number(kb || 500);
          if (!st || !FILE_NAME.test(file ?? '') || !(size > 0) || snapshot<StudentDocumentRecord>('studentDocuments').some((d) => d.studentId === st.id && d.name.toLowerCase() === file.toLowerCase())) { skipped += 1; continue; }
          ctx.create({ studentId: st.id, name: file, category: v.category, status: 'Pending', sizeKb: Math.round(size), uploadedOn: todayISO(), uploadedBy: 'Admin Office', favourite: false, shared: false, archived: false, version: 1, note: '', history: [`v1 uploaded on ${todayISO()}`] });
          added += 1;
        }
        ctx.toast(`${added} document${added === 1 ? '' : 's'} uploaded${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

