import { repo, snapshot } from '@/core/store/store';
import { addDays, diffDays, formatDate, formatTime, todayISO } from '@/core/utils/date';
import { money } from '@/core/utils/format';
import { admissionFeeFor, type AdmissionRecord } from '@/data/seed/admissionsAlumni';
import { PAYMENT_METHODS } from '@/data/seed/finance';
import type { ClassRecord, SectionRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';
import { opts, parseCsvRows } from '@/features/academic/helpers';
import { countBy, getClass, nextNo } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import { OPEN_STATUSES, completeness, docProgress, documentsFor, enrol, enrolBlocker, feeBalance, feeStatusOf, letterText, logOf, openSections } from './admissionLogic';
import { classNoOf, freeSeats } from './promotionLogic';

const statusTone: Record<string, Tone> = { Pending: 'warning', 'Under Review': 'info', Approved: 'success', Waitlisted: 'purple', Rejected: 'danger', Enrolled: 'teal' };
const interviewTone: Record<string, Tone> = { 'Not Scheduled': 'neutral', Scheduled: 'info', Completed: 'success', Cancelled: 'danger' };
const STATUSES = ['Pending', 'Under Review', 'Approved', 'Waitlisted', 'Rejected', 'Enrolled'];
const SOURCES = ['Walk-in', 'Website', 'Referral', 'Event', 'Other'];
const HOUSES = ['Red', 'Blue', 'Green', 'Yellow'];
const BLOOD = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
const BY = 'Admissions Office';

const counselorOptions = () => [{ label: 'Unassigned', value: 'Unassigned' }, ...snapshot<TeacherRecord>('teachers').map((t) => ({ label: t.name, value: t.name, hint: t.department }))];
const classLabel = (a: AdmissionRecord) => getClass(a.classId)?.name ?? '—';
const touch = (a: AdmissionRecord, title: string, patch: Partial<AdmissionRecord> = {}): Partial<AdmissionRecord> => ({ ...patch, activity: [...a.activity, logOf(title, BY)] });

export const admissionsCfg: ResourceConfig<AdmissionRecord> = {
  entity: 'Application',
  collection: 'admissions',
  auditEntity: 'admission',
  searchPlaceholder: 'Search applicant, parent, application no…',
  searchText: (r) => `${r.name} ${r.applicationNo} ${classLabel(r)} ${r.parentName} ${r.parentPhone} ${r.status} ${r.source}`,
  code: (r) => r.applicationNo,
  title: (r) => r.name,
  subtitle: (r) => `${classLabel(r)} · ${r.parentName}`,
  status: (r) => ({ label: r.status, tone: statusTone[r.status] }),
  badges: (r) => [
    { label: `Fee ${feeStatusOf(r)}`, tone: feeStatusOf(r) === 'Paid' ? 'success' : feeStatusOf(r) === 'Partial' ? 'warning' : 'danger' },
    { label: `Interview: ${r.interviewStatus}`, tone: interviewTone[r.interviewStatus] },
    { label: `Docs ${docProgress(r).verified}/${docProgress(r).required}`, tone: docProgress(r).verified >= docProgress(r).required ? 'success' : 'warning' },
    ...(r.archived ? [{ label: 'Archived', tone: 'neutral' as Tone }] : []),
  ],
  facts: [
    { label: 'Applied', value: (r) => formatDate(r.appliedOn) },
    { label: 'Guardian phone', value: (r) => r.parentPhone },
    { label: 'Source', value: (r) => r.source },
    { label: 'Counsellor', value: (r) => r.counselor },
  ],
  detail: [
    { title: 'Application', items: [{ label: 'Application no', value: (r) => r.applicationNo }, { label: 'Applicant', value: (r) => r.name }, { label: 'Status', value: (r) => r.status }, { label: 'Class applied', value: (r) => classLabel(r) }, { label: 'Academic year', value: (r) => r.academicYear }, { label: 'Admission type', value: (r) => r.admissionType }, { label: 'Section preference', value: (r) => r.sectionPref }, { label: 'Second language', value: (r) => r.secondLanguage }, { label: 'Source', value: (r) => r.source }, { label: 'Applied on', value: (r) => formatDate(r.appliedOn) }, { label: 'Counsellor', value: (r) => r.counselor }, { label: 'Completeness', value: (r) => `${completeness(r)}%` }] },
    { title: 'Personal', items: [{ label: 'Gender', value: (r) => r.gender }, { label: 'Date of birth', value: (r) => formatDate(r.dob) }, { label: 'Blood group', value: (r) => r.bloodGroup }, { label: 'Religion', value: (r) => r.religion }, { label: 'Nationality', value: (r) => r.nationality }, { label: 'Mother tongue', value: (r) => r.motherTongue }, { label: 'Address', value: (r) => r.address }] },
    { title: 'Guardian & emergency', items: [{ label: 'Guardian', value: (r) => `${r.parentName} (${r.relationship})` }, { label: 'Phone', value: (r) => r.parentPhone }, { label: 'Email', value: (r) => r.parentEmail }, { label: 'Occupation', value: (r) => r.occupation }, { label: 'Annual income', value: (r) => r.annualIncome }, { label: 'Emergency contact', value: (r) => `${r.emergencyName} (${r.emergencyRelation})` }, { label: 'Emergency phone', value: (r) => r.emergencyPhone }] },
    { title: 'Medical', items: [{ label: 'Allergies', value: (r) => r.allergies }, { label: 'Conditions', value: (r) => r.conditions }, { label: 'Medications', value: (r) => r.medications }, { label: 'Doctor', value: (r) => r.doctorContact }] },
    { title: 'Transport, hostel & previous school', items: [{ label: 'Transport', value: (r) => (r.transport ? `${r.route} · ${r.pickup}` : 'Not required') }, { label: 'Hostel', value: (r) => (r.hostel ? 'Required' : 'Not required') }, { label: 'Previous school', value: (r) => r.previousSchool }, { label: 'Board', value: (r) => r.board }, { label: 'Last class', value: (r) => r.lastClass }, { label: 'TC number', value: (r) => r.tcNo || '—' }] },
    { title: 'Interview', items: [{ label: 'Status', value: (r) => r.interviewStatus }, { label: 'When', value: (r) => (r.interviewDate ? `${formatDate(r.interviewDate)} · ${formatTime(r.interviewTime)} · ${r.interviewMode}` : '—') }, { label: 'Result', value: (r) => r.interviewResult || '—' }, { label: 'Notes', value: (r) => r.interviewNotes || '—' }] },
    { title: 'Fees', items: [{ label: 'Admission fee', value: (r) => money(r.feeAmount) }, { label: 'Paid', value: (r) => money(r.feePaid) }, { label: 'Balance', value: (r) => money(feeBalance(r)) }, { label: 'Status', value: (r) => feeStatusOf(r) }] },
    { title: 'Decision', items: [{ label: 'Decision note', value: (r) => r.decisionNote || '—' }, { label: 'Enrolled as student', value: (r) => (r.studentId ? snapshot<StudentRecord>('students').find((s) => s.id === r.studentId)?.admissionNo ?? 'Yes' : 'Not yet') }] },
  ],
  stats: [
    { label: 'Applications', value: (rows) => rows.length, icon: 'file-text' },
    { label: 'Pending review', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Under review', value: (rows) => countBy(rows, (r) => r.status === 'Under Review'), tone: 'info', icon: 'search' },
    { label: 'Interviews', value: (rows) => countBy(rows, (r) => r.interviewStatus === 'Scheduled'), tone: 'purple', icon: 'calendar' },
    { label: 'Fee pending', value: (rows) => countBy(rows, (r) => feeBalance(r) > 0 && OPEN_STATUSES.concat('Approved').includes(r.status)), tone: 'danger', icon: 'dollar-sign' },
    { label: 'Approved', value: (rows) => countBy(rows, (r) => r.status === 'Approved'), tone: 'success', icon: 'check-circle' },
    { label: 'Enrolled', value: (rows) => countBy(rows, (r) => r.status === 'Enrolled'), tone: 'teal', icon: 'user-check' },
  ],
  views: [
    { key: 'all', label: 'All Applications', match: (r) => !r.archived },
    { key: 'pending', label: 'Pending Review', match: (r) => r.status === 'Pending' && !r.archived },
    { key: 'review', label: 'Under Review', match: (r) => r.status === 'Under Review' && !r.archived },
    { key: 'approved', label: 'Approved', match: (r) => r.status === 'Approved' && !r.archived },
    { key: 'waitlisted', label: 'Waitlisted', match: (r) => r.status === 'Waitlisted' && !r.archived },
    { key: 'rejected', label: 'Rejected', match: (r) => r.status === 'Rejected' && !r.archived },
    { key: 'enrolled', label: 'Enrolled', match: (r) => r.status === 'Enrolled' && !r.archived },
    { key: 'archived', label: 'Archived', match: (r) => r.archived },
  ],
  filters: [
    { key: 'status', label: 'Admission status', options: opts(STATUSES), match: (r, v) => r.status === v },
    { key: 'class', label: 'Class applied', options: () => snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => r.classId === v },
    { key: 'year', label: 'Academic year', options: opts(['2026-27', '2027-28']), match: (r, v) => r.academicYear === v },
    { key: 'interview', label: 'Interview', options: opts(['Not Scheduled', 'Scheduled', 'Completed', 'Cancelled']), match: (r, v) => r.interviewStatus === v },
    { key: 'payment', label: 'Payment', options: opts(['Paid', 'Partial', 'Unpaid']), match: (r, v) => feeStatusOf(r) === v },
    { key: 'source', label: 'Source', options: opts(SOURCES), match: (r, v) => r.source === v },
    { key: 'counselor', label: 'Counsellor', options: counselorOptions, match: (r, v) => r.counselor === v },
    { key: 'gender', label: 'Gender', options: opts(['Male', 'Female']), match: (r, v) => r.gender === v },
  ],
  sorts: [
    { key: 'recent', label: 'Recently applied', compare: (a, b) => b.appliedOn.localeCompare(a.appliedOn) },
    { key: 'name', label: 'Applicant (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'status', label: 'Status', compare: (a, b) => STATUSES.indexOf(a.status) - STATUSES.indexOf(b.status) },
    { key: 'class', label: 'Class', compare: (a, b) => classNoOf(a.classId) - classNoOf(b.classId) },
    { key: 'parent', label: 'Parent (A–Z)', compare: (a, b) => a.parentName.localeCompare(b.parentName) },
  ],
  form: [
    { key: 'firstName', label: 'First Name', type: 'text', required: true, section: 'Personal' },
    { key: 'lastName', label: 'Last Name', type: 'text', required: true },
    { key: 'gender', label: 'Gender', type: 'select', required: true, options: ['Male', 'Female'] },
    { key: 'dob', label: 'Date of Birth', type: 'date', required: true },
    { key: 'bloodGroup', label: 'Blood Group', type: 'select', options: BLOOD },
    { key: 'religion', label: 'Religion', type: 'text' },
    { key: 'nationality', label: 'Nationality', type: 'text', default: 'Indian' },
    { key: 'motherTongue', label: 'Mother Tongue', type: 'text' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'classId', label: 'Class Applied', type: 'select', required: true, optionsFrom: { collection: 'classes', label: (c: ClassRecord) => c.name }, section: 'Academic' },
    { key: 'sectionPref', label: 'Section Preference', type: 'select', options: ['A', 'B'], default: 'A' },
    { key: 'academicYear', label: 'Academic Year', type: 'select', required: true, options: ['2026-27', '2027-28'], default: '2026-27' },
    { key: 'admissionType', label: 'Admission Type', type: 'select', options: ['New Admission', 'Transfer'], default: 'New Admission' },
    { key: 'secondLanguage', label: 'Second Language', type: 'text' },
    { key: 'source', label: 'Application Source', type: 'select', options: SOURCES, default: 'Walk-in' },
    { key: 'parentName', label: 'Parent / Guardian Name', type: 'text', required: true, section: 'Guardian & emergency' },
    { key: 'relationship', label: 'Relationship', type: 'select', options: ['Father', 'Mother', 'Guardian'], default: 'Father' },
    { key: 'parentPhone', label: 'Phone', type: 'phone', required: true },
    { key: 'parentEmail', label: 'Email', type: 'email' },
    { key: 'occupation', label: 'Occupation', type: 'text' },
    { key: 'annualIncome', label: 'Annual Income', type: 'text' },
    { key: 'emergencyName', label: 'Emergency Contact Name', type: 'text' },
    { key: 'emergencyRelation', label: 'Relationship', type: 'text' },
    { key: 'emergencyPhone', label: 'Emergency Phone', type: 'phone' },
    { key: 'allergies', label: 'Allergies', type: 'text', placeholder: 'If any', section: 'Medical' },
    { key: 'conditions', label: 'Medical Conditions', type: 'text', placeholder: 'If any' },
    { key: 'medications', label: 'Medications', type: 'text' },
    { key: 'doctorContact', label: 'Family Doctor Contact', type: 'text' },
    { key: 'transport', label: 'Transport required', type: 'switch', section: 'Transport & hostel' },
    { key: 'route', label: 'Route', type: 'text', hidden: (v) => !v.transport },
    { key: 'pickup', label: 'Pick-up Point', type: 'text', hidden: (v) => !v.transport },
    { key: 'hostel', label: 'Hostel required', type: 'switch' },
    { key: 'previousSchool', label: 'Previous School', type: 'text', section: 'Previous school' },
    { key: 'board', label: 'Board', type: 'text' },
    { key: 'lastClass', label: 'Last Class Attended', type: 'text' },
    { key: 'tcNo', label: 'TC Number', type: 'text' },
  ],
  validate: (v, { existing, rows }) => {
    const age = diffDays(String(v.dob), todayISO()) / 365.25;
    const expected = 5 + classNoOf(String(v.classId));
    return {
      ...(String(v.dob) >= todayISO() ? { dob: 'Date of birth must be in the past' } : {}),
      ...(v.classId && age > 0 && Math.abs(age - expected) > 3 ? { dob: `Age ${Math.floor(age)} does not suit ${getClass(String(v.classId))?.name ?? 'this class'} (usually about ${expected})` } : {}),
      ...(rows.some((r) => r.id !== existing?.id && !r.archived && r.dob === v.dob && r.parentPhone === v.parentPhone && r.firstName.toLowerCase() === String(v.firstName).trim().toLowerCase()) ? { firstName: 'An application for this child and guardian already exists' } : {}),
    };
  },
  defaults: () => ({ academicYear: '2026-27' }),
  prepare: (v, { existing, rows }) => {
    const firstName = String(v.firstName).trim();
    const lastName = String(v.lastName).trim();
    const classId = String(v.classId);
    const base = {
      name: `${firstName} ${lastName}`,
      firstName,
      lastName,
      documents: documentsFor(classId, existing?.documents),
      feeAmount: existing?.feePaid ? existing.feeAmount : admissionFeeFor(classNoOf(classId)),
    };
    if (existing) return base;
    return {
      ...base,
      applicationNo: nextNo('ADM2026', rows.map((r) => r.applicationNo), 3),
      status: 'Pending' as const,
      appliedOn: todayISO(),
      counselor: 'Unassigned',
      interviewStatus: 'Not Scheduled' as const,
      interviewDate: '',
      interviewTime: '',
      interviewMode: 'In person' as const,
      interviewResult: '' as const,
      interviewNotes: '',
      feePaid: 0,
      decisionNote: '',
      activity: [logOf('Application submitted', BY)],
      notes: [],
      archived: false,
      studentId: '',
    };
  },
  editable: (r) => r.status !== 'Enrolled',
  canDeleteRecord: (r) => (r.studentId ? `${r.name} has been enrolled as a student, so this application must be kept.` : null),
  actions: [
    {
      key: 'counselor',
      label: 'Assign counsellor',
      icon: 'user-plus',
      visible: (r) => r.status !== 'Enrolled',
      form: { title: 'Assign counsellor', fields: [{ key: 'counselor', label: 'Counsellor', type: 'select', required: true, options: counselorOptions }], initial: (r) => ({ counselor: r.counselor }) },
      run: (r, v, ctx) => { ctx.update(touch(r, `Assigned to ${v.counselor}`, { counselor: v.counselor })); ctx.toast(`${r.name} assigned to ${v.counselor}`); },
    },
    {
      key: 'interview',
      label: 'Schedule interview',
      icon: 'calendar',
      visible: (r) => OPEN_STATUSES.includes(r.status) || r.status === 'Approved',
      form: {
        title: 'Schedule interview',
        submitLabel: 'Schedule',
        fields: [{ key: 'date', label: 'Date', type: 'date', required: true }, { key: 'time', label: 'Time', type: 'time', required: true }, { key: 'mode', label: 'Mode', type: 'select', required: true, options: ['In person', 'Online'], default: 'In person' }],
        initial: (r) => ({ date: r.interviewDate && r.interviewDate >= todayISO() ? r.interviewDate : addDays(todayISO(), 3), time: r.interviewTime || '10:00', mode: r.interviewMode }),
        validate: (v) => (String(v.date) < todayISO() ? { date: 'Choose today or a later date' } : {}),
      },
      run: (r, v, ctx) => { ctx.update(touch(r, `Interview scheduled for ${v.date} at ${v.time}`, { interviewStatus: 'Scheduled', interviewDate: v.date, interviewTime: v.time, interviewMode: v.mode, interviewResult: '', status: r.status === 'Pending' ? 'Under Review' : r.status })); ctx.toast(`Interview set for ${formatDate(v.date)}`); },
    },
    {
      key: 'interviewResult',
      label: 'Record interview result',
      icon: 'check-square',
      visible: (r) => r.interviewStatus === 'Scheduled',
      form: { title: 'Interview result', submitLabel: 'Save', fields: [{ key: 'result', label: 'Result', type: 'select', required: true, options: ['Recommended', 'On hold', 'Not recommended'] }, { key: 'notes', label: 'Notes', type: 'textarea' }] },
      run: (r, v, ctx) => { ctx.update(touch(r, `Interview completed: ${v.result}`, { interviewStatus: 'Completed', interviewResult: v.result, interviewNotes: v.notes || '', status: r.status === 'Pending' ? 'Under Review' : r.status })); ctx.toast(`Interview recorded: ${v.result}`); },
    },
    { key: 'cancelInterview', label: 'Cancel interview', icon: 'x-square', visible: (r) => r.interviewStatus === 'Scheduled', confirm: 'Cancel the scheduled interview?', run: (r, _v, ctx) => { ctx.update(touch(r, 'Interview cancelled', { interviewStatus: 'Cancelled' })); ctx.toast('Interview cancelled', 'info'); } },
    {
      key: 'verifyAll',
      label: 'Verify uploaded documents',
      icon: 'file-text',
      visible: (r) => r.status !== 'Enrolled' && r.documents.some((d) => d.status === 'Pending'),
      confirm: 'Mark every uploaded (pending) document as verified?',
      run: (r, _v, ctx) => { const n = r.documents.filter((d) => d.status === 'Pending').length; ctx.update(touch(r, `${n} document${n > 1 ? 's' : ''} verified`, { documents: r.documents.map((d) => (d.status === 'Pending' ? { ...d, status: 'Verified' as const } : d)) })); ctx.toast(`${n} document${n > 1 ? 's' : ''} verified`); },
    },
    {
      key: 'approve',
      label: 'Approve admission',
      icon: 'check',
      tone: 'success',
      visible: (r) => OPEN_STATUSES.includes(r.status),
      form: { title: 'Approve admission', submitLabel: 'Approve', fields: [{ key: 'note', label: 'Note', type: 'textarea' }] },
      run: (r, v, ctx) => { ctx.update(touch(r, 'Application approved', { status: 'Approved', decisionNote: v.note || '' })); ctx.toast(`${r.name} approved`); },
    },
    {
      key: 'waitlist',
      label: 'Move to waitlist',
      icon: 'clock',
      visible: (r) => r.status === 'Pending' || r.status === 'Under Review',
      form: { title: 'Move to waitlist', submitLabel: 'Waitlist', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update(touch(r, 'Moved to waitlist', { status: 'Waitlisted', decisionNote: v.reason })); ctx.toast(`${r.name} waitlisted`, 'info'); },
    },
    {
      key: 'reject',
      label: 'Reject application',
      icon: 'x',
      tone: 'danger',
      visible: (r) => OPEN_STATUSES.includes(r.status) || r.status === 'Approved',
      form: { title: 'Reject application', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update(touch(r, 'Application rejected', { status: 'Rejected', decisionNote: v.reason })); ctx.toast(`${r.name} rejected`, 'info'); },
    },
    { key: 'reopen', label: 'Reopen application', icon: 'rotate-ccw', visible: (r) => r.status === 'Rejected' || r.status === 'Waitlisted', run: (r, _v, ctx) => { ctx.update(touch(r, 'Application reopened', { status: 'Under Review', decisionNote: '' })); ctx.toast('Reopened for review'); } },
    {
      key: 'fee',
      label: 'Collect admission fee',
      icon: 'dollar-sign',
      visible: (r) => r.status !== 'Rejected' && r.status !== 'Enrolled' && feeBalance(r) > 0,
      form: {
        title: 'Collect admission fee',
        submitLabel: 'Collect',
        fields: [{ key: 'amount', label: 'Amount Received', type: 'money', required: true, min: 1 }, { key: 'method', label: 'Payment Method', type: 'select', required: true, options: opts(PAYMENT_METHODS), default: 'Cash' }],
        initial: (r) => ({ amount: String(feeBalance(r)) }),
        validate: (v, r) => (Number(v.amount) > feeBalance(r) ? { amount: `Cannot exceed the balance of ${money(feeBalance(r))}` } : {}),
      },
      run: (r, v, ctx) => { ctx.update(touch(r, `Admission fee ${money(Number(v.amount))} received (${v.method})`, { feePaid: r.feePaid + Number(v.amount) })); ctx.toast(`${money(Number(v.amount))} received from ${r.parentName}`); },
    },
    {
      key: 'enrol',
      label: 'Enrol as student',
      icon: 'user-check',
      tone: 'success',
      visible: (r) => r.status === 'Approved',
      form: {
        title: 'Enrol as student',
        submitLabel: 'Enrol',
        fields: [
          { key: 'sectionId', label: 'Section', type: 'select', required: true, optionsFrom: { collection: 'sections', label: (s: SectionRecord) => s.name, hint: (s: SectionRecord) => `${freeSeats(s)} of ${s.capacity} seats free`, filter: (s: SectionRecord, v) => s.status === 'Active' && s.classId === v.classId && freeSeats(s) > 0 } },
          { key: 'house', label: 'House', type: 'select', required: true, options: HOUSES, default: 'Red' },
        ],
        initial: (r) => ({ classId: r.classId, sectionId: openSections(r.classId)[0]?.id ?? '', house: HOUSES[r.applicationNo.length % 4] }),
        validate: (v, r) => { const b = enrolBlocker(r); return b ? { sectionId: b } : !openSections(r.classId).some((s) => s.id === v.sectionId) ? { sectionId: 'That section is full' } : {}; },
      },
      run: (r, v, ctx) => {
        const out = enrol(r, { sectionId: v.sectionId, house: v.house, by: BY });
        if (typeof out === 'string') { ctx.toast(out, 'error'); return; }
        ctx.toast(`${out.name} enrolled as ${out.admissionNo}`);
      },
    },
    { key: 'profile', label: 'Open student profile', icon: 'user', manage: false, visible: (r) => !!r.studentId, run: (r, _v, ctx) => ctx.go(`/people/student-profile?id=${r.studentId}`) },
    { key: 'letter', label: 'Admission letter', icon: 'file-text', manage: false, visible: (r) => r.status === 'Approved' || r.status === 'Enrolled', run: (r, _v, ctx) => ctx.share(`Admission letter — ${r.name}`, letterText(r, classLabel(r))) },
    {
      key: 'email',
      label: 'Email / SMS guardian',
      icon: 'mail',
      form: { title: 'Contact guardian', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: ['Email', 'SMS'], default: 'Email' }, { key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update(touch(r, `${v.channel} sent: ${v.subject}`)); ctx.toast(`${v.channel} to ${r.parentName} logged (mock: nothing is sent)`, 'info'); },
    },
    { key: 'duplicate', label: 'Duplicate as draft', icon: 'copy', run: (r, _v, ctx) => { const rows = snapshot<AdmissionRecord>('admissions'); repo<AdmissionRecord>('admissions').create({ ...r, id: undefined, applicationNo: nextNo('ADM2026', rows.map((x) => x.applicationNo), 3), status: 'Pending', appliedOn: todayISO(), counselor: 'Unassigned', interviewStatus: 'Not Scheduled', interviewDate: '', interviewTime: '', interviewResult: '', interviewNotes: '', feePaid: 0, decisionNote: '', activity: [logOf(`Duplicated from ${r.applicationNo}`, BY)], notes: [], documents: documentsFor(r.classId), studentId: '' }); ctx.toast('Draft application created'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => !r.archived, confirm: 'Archive this application?', run: (r, _v, ctx) => { ctx.update({ archived: true }); ctx.toast('Archived', 'info'); } },
    { key: 'restore', label: 'Restore', icon: 'rotate-ccw', visible: (r) => r.archived, run: (r, _v, ctx) => { ctx.update({ archived: false }); ctx.toast('Restored'); } },
    { key: 'print', label: 'Share application', icon: 'printer', manage: false, run: (r, _v, ctx) => ctx.share(`${r.applicationNo} — ${r.name}`, `APPLICATION ${r.applicationNo}\n${r.name} · ${classLabel(r)} · ${r.academicYear}\nStatus: ${r.status}\nGuardian: ${r.parentName} (${r.parentPhone})\nInterview: ${r.interviewStatus}${r.interviewDate ? ` ${formatDate(r.interviewDate)}` : ''}\nFee: ${money(r.feePaid)} of ${money(r.feeAmount)}\nDocuments: ${docProgress(r).verified}/${docProgress(r).required} verified\nCompleteness: ${completeness(r)}%`) },
  ],
  bulk: [
    { key: 'approve', label: 'Approve', icon: 'check', run: (rows, _v, ctx) => { const n = rows.filter((r) => OPEN_STATUSES.includes(r.status)).length; if (!n) { ctx.toast('No open applications in the selection', 'info'); return; } ctx.updateMany((r) => (OPEN_STATUSES.includes(r.status) ? touch(r, 'Application approved', { status: 'Approved' }) : {})); ctx.toast(`${n} application${n > 1 ? 's' : ''} approved`); } },
    { key: 'counselor', label: 'Assign counsellor', icon: 'user-plus', form: { title: 'Assign counsellor', fields: [{ key: 'counselor', label: 'Counsellor', type: 'select', required: true, options: counselorOptions }] }, run: (rows, v, ctx) => { const n = rows.filter((r) => r.status !== 'Enrolled').length; ctx.updateMany((r) => (r.status !== 'Enrolled' ? touch(r, `Assigned to ${v.counselor}`, { counselor: v.counselor }) : {})); ctx.toast(`${n} assigned to ${v.counselor}`); } },
    {
      key: 'interviews',
      label: 'Schedule interviews',
      icon: 'calendar',
      form: { title: 'Schedule interviews', submitLabel: 'Schedule', fields: [{ key: 'date', label: 'Date', type: 'date', required: true }, { key: 'time', label: 'Time', type: 'time', required: true }], validate: (v) => (String(v.date) < todayISO() ? { date: 'Choose today or a later date' } : {}) },
      run: (rows, v, ctx) => { const n = rows.filter((r) => OPEN_STATUSES.includes(r.status)).length; if (!n) { ctx.toast('No open applications in the selection', 'info'); return; } ctx.updateMany((r) => (OPEN_STATUSES.includes(r.status) ? touch(r, `Interview scheduled for ${v.date} at ${v.time}`, { interviewStatus: 'Scheduled', interviewDate: v.date, interviewTime: v.time, status: r.status === 'Pending' ? 'Under Review' : r.status }) : {})); ctx.toast(`${n} interview${n > 1 ? 's' : ''} scheduled`); },
    },
    { key: 'message', label: 'Email / SMS', icon: 'mail', form: { title: 'Contact guardians', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: ['Email', 'SMS'], default: 'Email' }, { key: 'subject', label: 'Subject', type: 'text', required: true }] }, run: (rows, v, ctx) => { ctx.updateMany((r) => touch(r, `${v.channel} sent: ${v.subject}`)); ctx.toast(`${rows.length} ${v.channel} message${rows.length > 1 ? 's' : ''} logged (mock: nothing is sent)`, 'info'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ archived: true })); ctx.toast(`${rows.length} archived`, 'info'); } },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import applications',
      icon: 'upload',
      form: { title: 'Import applications', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Aditya,Thomas,Male,2018-05-10,Grade I,Antony Thomas,+91 98400 55555', hint: 'first name, last name, gender, date of birth, class, guardian, phone. Rows with an unknown class or a bad date are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        const used = snapshot<AdmissionRecord>('admissions').map((r) => r.applicationNo);
        for (const [firstName, lastName, gender, dob, className, parent, phone] of parseCsvRows(String(v.csv))) {
          const cls = snapshot<ClassRecord>('classes').find((c) => c.name.toLowerCase() === (className ?? '').toLowerCase());
          if (!firstName || !lastName || !['Male', 'Female'].includes(gender) || !/^\d{4}-\d{2}-\d{2}$/.test(dob ?? '') || dob >= todayISO() || !cls || !parent) { skipped += 1; continue; }
          const applicationNo = nextNo('ADM2026', used, 3);
          used.push(applicationNo);
          ctx.create({ applicationNo, firstName, lastName, name: `${firstName} ${lastName}`, gender: gender as AdmissionRecord['gender'], dob, bloodGroup: '', religion: '', nationality: 'Indian', motherTongue: '', address: '', classId: cls.id, sectionPref: 'A', academicYear: '2026-27', admissionType: 'New Admission', secondLanguage: '', source: 'Other', parentName: parent, relationship: 'Father', parentPhone: phone || '', parentEmail: '', occupation: '', annualIncome: '', emergencyName: '', emergencyRelation: '', emergencyPhone: '', allergies: 'None', conditions: 'None', medications: 'N/A', doctorContact: '', transport: false, route: '', pickup: '', hostel: false, previousSchool: '', board: '', lastClass: '', tcNo: '', status: 'Pending', appliedOn: todayISO(), counselor: 'Unassigned', interviewStatus: 'Not Scheduled', interviewDate: '', interviewTime: '', interviewMode: 'In person', interviewResult: '', interviewNotes: '', feeAmount: admissionFeeFor(classNoOf(cls.id)), feePaid: 0, decisionNote: '', documents: documentsFor(cls.id), activity: [logOf('Imported', BY)], notes: [], archived: false, studentId: '' });
          added += 1;
        }
        ctx.toast(`${added} application${added === 1 ? '' : 's'} imported${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};
