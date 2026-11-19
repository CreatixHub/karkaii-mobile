import { snapshot } from '@/core/store/store';
import { formatDate, formatTime, inclusiveDays, parseISO, todayISO } from '@/core/utils/date';
import { nextCode, pct } from '@/core/utils/format';
import {
  AT_RISK_BELOW,
  DEVICES,
  SCHOOL_START,
  type DutyMethod,
  type DutyStatus,
  type HolidayCategory,
  type HolidayRecord,
  type LeaveRecord,
  type LeaveStatus,
  type StaffAttendanceRecord,
  type StudentAttendanceRecord,
  type StudentAttendanceStatus,
  type TeacherAttendanceRecord,
} from '@/data/seed/hrm';
import type { StaffRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';
import { classOptions, classSection, countBy, getClass, getStaff, getStudent, getTeacher, nextNo, ownStudentScope, staffSideScope, studentOptions } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';

const opts = (list: readonly string[]) => list.map((v) => ({ label: v, value: v }));
const minutesOf = (t: string): number => {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '');
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};
const hm = (min: number) => (min > 0 ? `${Math.floor(min / 60)}h ${String(min % 60).padStart(2, '0')}m` : '—');
const time = (t: string) => (t ? formatTime(t) : '—');

/* ================================== Holidays ================================== */

const CATEGORIES: HolidayCategory[] = ['Public', 'School', 'Festival', 'Examination', 'Optional'];
const BRANCHES = ['All Branches', 'Main Campus', 'North Wing', 'South Wing'];
export const categoryTone: Record<HolidayCategory, Tone> = { Public: 'danger', School: 'primary', Festival: 'warning', Examination: 'info', Optional: 'teal' };
const durationOf = (h: Pick<HolidayRecord, 'start' | 'end'>) => inclusiveDays(h.start, h.end);
const whenOf = (h: Pick<HolidayRecord, 'start' | 'end'>): 'Ongoing' | 'Upcoming' | 'Past' => {
  const t = todayISO();
  return h.end < t ? 'Past' : h.start > t ? 'Upcoming' : 'Ongoing';
};

/** Parse "name,category,start,end,classes,branch" lines (start/end as YYYY-MM-DD). */
export function parseHolidayCsv(text: string): { rows: Omit<HolidayRecord, 'id' | 'code'>[]; skipped: number } {
  const rows: Omit<HolidayRecord, 'id' | 'code'>[] = [];
  let skipped = 0;
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || /^name\s*,/i.test(line)) continue;
    const [name, category, start, end, classes, branch] = line.split(',').map((c) => c.trim());
    const cat = CATEGORIES.find((c) => c.toLowerCase() === (category ?? '').toLowerCase());
    if (!name || !cat || !parseISO(start) || !parseISO(end ?? start) || (end ?? start) < start) {
      skipped += 1;
      continue;
    }
    rows.push({ name, category: cat, start, end: end || start, classes: classes || 'All Classes', branch: branch || 'All Branches', academicYear: '2026-27', description: 'Imported from calendar file.', createdBy: 'HR Office', createdOn: todayISO() });
  }
  return { rows, skipped };
}

export const holidaysCfg: ResourceConfig<HolidayRecord> = {
  entity: 'Holiday',
  collection: 'holidays',
  searchPlaceholder: 'Search holidays…',
  searchText: (r) => `${r.name} ${r.category} ${r.branch} ${r.classes}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => (r.start === r.end ? formatDate(r.start) : `${formatDate(r.start)} – ${formatDate(r.end)}`),
  status: (r) => ({ label: r.category, tone: categoryTone[r.category] }),
  badges: (r) => [{ label: whenOf(r), tone: whenOf(r) === 'Upcoming' ? 'success' : whenOf(r) === 'Ongoing' ? 'warning' : 'neutral' }, { label: `${durationOf(r)} ${durationOf(r) === 1 ? 'day' : 'days'}`, tone: 'neutral' }],
  facts: [
    { label: 'Applies to', value: (r) => r.classes },
    { label: 'Branch', value: (r) => r.branch },
    { label: 'Starts', value: (r) => formatDate(r.start) },
    { label: 'Ends', value: (r) => formatDate(r.end) },
  ],
  detail: [
    { title: 'Holiday', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => `${r.category} Holiday` }, { label: 'Start', value: (r) => formatDate(r.start) }, { label: 'End', value: (r) => formatDate(r.end) }, { label: 'Duration', value: (r) => `${durationOf(r)} ${durationOf(r) === 1 ? 'day' : 'days'}` }, { label: 'Classes', value: (r) => r.classes }, { label: 'Branch', value: (r) => r.branch }, { label: 'Academic year', value: (r) => r.academicYear }, { label: 'Description', value: (r) => r.description }] },
    { title: 'Record', items: [{ label: 'Created by', value: (r) => r.createdBy }, { label: 'Created on', value: (r) => formatDate(r.createdOn) }] },
  ],
  stats: [
    { label: 'Total holidays', value: (rows) => rows.length, icon: 'calendar' },
    { label: 'Upcoming', value: (rows) => countBy(rows, (r) => whenOf(r) !== 'Past'), tone: 'success', icon: 'arrow-up-right' },
    { label: 'Public', value: (rows) => countBy(rows, (r) => r.category === 'Public'), tone: 'danger', icon: 'flag' },
    { label: 'Optional', value: (rows) => countBy(rows, (r) => r.category === 'Optional'), tone: 'teal', icon: 'star' },
  ],
  views: [
    { key: 'all', label: 'All Holidays', match: () => true },
    ...(['Public', 'Festival', 'Examination', 'Optional'] as HolidayCategory[]).map((c) => ({ key: c, label: `${c} Holidays`, match: (r: HolidayRecord) => r.category === c })),
  ],
  filters: [
    { key: 'category', label: 'Holiday category', options: opts(CATEGORIES), match: (r, v) => r.category === v },
    { key: 'branch', label: 'Branch', options: opts(BRANCHES), match: (r, v) => r.branch === v },
    { key: 'when', label: 'When', options: opts(['Upcoming', 'Ongoing', 'Past']), single: true, match: (r, v) => whenOf(r) === v },
    { key: 'ay', label: 'Academic year', options: () => [...new Set(snapshot<HolidayRecord>('holidays').map((h) => h.academicYear))].map((y) => ({ label: y, value: y })), match: (r, v) => r.academicYear === v },
  ],
  sorts: [
    { key: 'date', label: 'Date (earliest first)', compare: (a, b) => a.start.localeCompare(b.start) },
    { key: 'date-desc', label: 'Date (latest first)', compare: (a, b) => b.start.localeCompare(a.start) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  ],
  form: [
    { key: 'name', label: 'Holiday Title', type: 'text', required: true },
    { key: 'category', label: 'Holiday Category', type: 'select', required: true, options: opts(CATEGORIES) },
    {
      key: 'start', label: 'Start Date', type: 'date', required: true,
      onChange: (v, vals) => (!vals.end || String(vals.end) < String(v) ? { end: v } : undefined),
    },
    { key: 'end', label: 'End Date', type: 'date', required: true },
    { key: 'branch', label: 'Branch', type: 'select', required: true, options: opts(BRANCHES), default: 'All Branches' },
    { key: 'classes', label: 'Applicable Classes', type: 'text', default: 'All Classes' },
    { key: 'academicYear', label: 'Academic Year', type: 'select', options: opts(['2026-27', '2025-26', '2027-28']), default: '2026-27' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(String(v.end) < String(v.start) ? { end: 'End date cannot be before the start date' } : {}),
    ...(rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase() && r.start === v.start) ? { name: 'This holiday is already on the calendar for that date' } : {}),
  }),
  prepare: (_v, { existing, rows }) => ({
    code: existing?.code ?? nextCode('HOL', rows.map((r) => r.code), 2),
    createdBy: existing?.createdBy ?? 'HR Office',
    createdOn: existing?.createdOn ?? todayISO(),
  }),
  actions: [
    {
      key: 'notice',
      label: 'Share holiday notice',
      icon: 'share-2',
      manage: false,
      run: (r, _v, ctx) =>
        ctx.share(
          `Holiday notice: ${r.name}`,
          `Karkaii International School – Holiday Notice\n\n${r.name} (${r.category} Holiday)\n${r.start === r.end ? formatDate(r.start) : `${formatDate(r.start)} to ${formatDate(r.end)}`} · ${durationOf(r)} ${durationOf(r) === 1 ? 'day' : 'days'}\nApplies to: ${r.classes} · ${r.branch}\n\n${r.description}`,
        ),
    },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import calendar',
      icon: 'upload',
      form: {
        title: 'Import holiday calendar',
        submitLabel: 'Import',
        fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Pongal,Festival,2027-01-14,2027-01-16,All Classes,All Branches', hint: 'One holiday per line: name, category, start, end, classes, branch. Dates as YYYY-MM-DD; classes and branch are optional.' }],
      },
      run: (v, ctx) => {
        const parsed = parseHolidayCsv(String(v.csv));
        const unreadable = parsed.skipped;
        if (!parsed.rows.length) {
          ctx.toast(`Nothing imported${unreadable ? ` — ${unreadable} line${unreadable > 1 ? 's' : ''} could not be read` : ''}`, 'error');
          return;
        }
        const codes = ctx.rows.map((r) => r.code);
        let added = 0;
        let duplicates = 0;
        for (const row of parsed.rows) {
          if (ctx.rows.some((r) => r.name.toLowerCase() === row.name.toLowerCase() && r.start === row.start)) {
            duplicates += 1;
            continue;
          }
          const code = nextCode('HOL', codes, 2);
          codes.push(code);
          ctx.create({ ...row, code });
          added += 1;
        }
        const skipped = unreadable + duplicates;
        ctx.toast(`${added} holiday${added === 1 ? '' : 's'} imported${skipped ? `, ${skipped} line${skipped > 1 ? 's' : ''} skipped` : ''}`, added ? 'success' : 'info');
      },
    },
  ],
};

/* ============================== Student attendance ============================== */

const STUDENT_STATUSES: StudentAttendanceStatus[] = ['Present', 'Absent', 'Late', 'Half Day', 'On Leave', 'Holiday', 'Excused', 'Not Marked'];
const studentTone: Record<string, Tone> = { Present: 'success', Late: 'warning', 'Half Day': 'warning', Absent: 'danger', 'On Leave': 'info', Holiday: 'neutral', Excused: 'neutral', 'Not Marked': 'neutral' };
const ATTENDED: StudentAttendanceStatus[] = ['Present', 'Late', 'Half Day'];

let pctCache: { source: StudentAttendanceRecord[]; table: Map<string, number> } | null = null;
/**
 * Attendance % per student: (Present + Late + ½ Half Day) ÷ (Present + Late + Half Day + Absent).
 * Approved leave, holidays, excused days and unmarked days are not counted for or against the student.
 */
function pctTable(): Map<string, number> {
  const recs = snapshot<StudentAttendanceRecord>('studentAttendance');
  if (pctCache && pctCache.source === recs) return pctCache.table;
  const acc = new Map<string, { a: number; n: number }>();
  for (const r of recs) {
    const cur = acc.get(r.studentId) ?? { a: 0, n: 0 };
    if (r.status === 'Present' || r.status === 'Late') { cur.a += 1; cur.n += 1; }
    else if (r.status === 'Half Day') { cur.a += 0.5; cur.n += 1; }
    else if (r.status === 'Absent') cur.n += 1;
    acc.set(r.studentId, cur);
  }
  const table = new Map<string, number>();
  acc.forEach((v, k) => table.set(k, v.n ? (v.a / v.n) * 100 : 100));
  pctCache = { source: recs, table };
  return table;
}
export const attendancePct = (studentId: string): number => pctTable().get(studentId) ?? 100;
const isAtRisk = (r: StudentAttendanceRecord) => attendancePct(r.studentId) < AT_RISK_BELOW;
const countOn = (studentId: string, status: StudentAttendanceStatus) => countBy(snapshot<StudentAttendanceRecord>('studentAttendance'), (r) => r.studentId === studentId && r.status === status);

const studentNameOf = (r: StudentAttendanceRecord) => getStudent(r.studentId)?.name ?? '—';
const needsTimes = (status: unknown) => ATTENDED.includes(status as StudentAttendanceStatus);
const channelOptions = ['SMS + Email + App', 'SMS only', 'Email only'];
const DEFAULT_ABSENCE_MESSAGE = 'Your ward was marked absent for today’s session. Please respond through the parent portal or contact the class teacher.';

export const studentAttendanceCfg: ResourceConfig<StudentAttendanceRecord> = {
  entity: 'Attendance Entry',
  collection: 'studentAttendance',
  rowScope: ownStudentScope,
  dateFilter: { key: 'date', allowAll: true },
  searchPlaceholder: 'Search name, admission no, roll…',
  searchText: (r) => { const s = getStudent(r.studentId); return `${s?.name ?? ''} ${s?.admissionNo ?? ''} ${s?.rollNo ?? ''} ${classSection(s)}`; },
  code: (r) => getStudent(r.studentId)?.admissionNo,
  title: studentNameOf,
  subtitle: (r) => { const s = getStudent(r.studentId); return `${classSection(s)} · Roll ${s?.rollNo ?? '—'} · ${s?.house ?? ''} House`; },
  status: (r) => ({ label: r.status, tone: studentTone[r.status] }),
  badges: (r) => {
    const p = attendancePct(r.studentId);
    return [{ label: `${pct(p)} attendance`, tone: p >= 90 ? 'success' : p >= AT_RISK_BELOW ? 'warning' : 'danger' }, ...(isAtRisk(r) ? [{ label: 'At risk', tone: 'danger' as Tone }] : [])];
  },
  facts: [
    { label: 'Check in', value: (r) => (r.checkIn ? `${time(r.checkIn)}${r.checkInNote ? ` · ${r.checkInNote}` : ''}` : undefined) },
    { label: 'Check out', value: (r) => (r.checkOut ? time(r.checkOut) : undefined) },
    { label: 'Late by', value: (r) => (r.lateMinutes ? `${r.lateMinutes} min` : undefined) },
    { label: 'Leave', value: (r) => r.leaveNote || undefined },
    { label: 'Remark', value: (r) => r.remark || undefined },
  ],
  detail: [
    { title: 'Entry', items: [{ label: 'Date', value: (r) => formatDate(r.date) }, { label: 'Session', value: (r) => r.session }, { label: 'Status', value: (r) => r.status }, { label: 'Check in', value: (r) => (r.checkIn ? `${time(r.checkIn)} ${r.checkInNote}` : '—') }, { label: 'Check out', value: (r) => time(r.checkOut) }, { label: 'Late by', value: (r) => (r.lateMinutes ? `${r.lateMinutes} min` : '—') }, { label: 'Leave', value: (r) => r.leaveNote || '—' }, { label: 'Remark', value: (r) => r.remark || '—' }] },
    { title: 'Student', items: [{ label: 'Admission no', value: (r) => getStudent(r.studentId)?.admissionNo }, { label: 'Class', value: (r) => classSection(getStudent(r.studentId)) }, { label: 'House', value: (r) => getStudent(r.studentId)?.house }, { label: 'Guardian', value: (r) => getStudent(r.studentId)?.parentName }, { label: 'Guardian phone', value: (r) => getStudent(r.studentId)?.parentPhone }] },
    { title: 'Attendance record', items: [{ label: 'Attendance %', value: (r) => pct(attendancePct(r.studentId), 1) }, { label: 'Present days', value: (r) => countOn(r.studentId, 'Present') }, { label: 'Late days', value: (r) => countOn(r.studentId, 'Late') }, { label: 'Absent days', value: (r) => countOn(r.studentId, 'Absent') }, { label: 'Leave days', value: (r) => countOn(r.studentId, 'On Leave') }] },
  ],
  stats: [
    { label: 'Students', value: (rows) => rows.length, icon: 'users' },
    { label: 'Present', value: (rows) => countBy(rows, (r) => r.status === 'Present'), tone: 'success', icon: 'user-check' },
    { label: 'Absent', value: (rows) => countBy(rows, (r) => r.status === 'Absent'), tone: 'danger', icon: 'user-x' },
    { label: 'Late', value: (rows) => countBy(rows, (r) => r.status === 'Late'), tone: 'warning', icon: 'clock' },
    { label: 'On leave', value: (rows) => countBy(rows, (r) => r.status === 'On Leave'), tone: 'info', icon: 'calendar' },
    { label: 'Not marked', value: (rows) => countBy(rows, (r) => r.status === 'Not Marked'), tone: 'neutral', icon: 'help-circle' },
    {
      label: 'Attendance rate',
      tone: 'purple',
      icon: 'percent',
      value: (rows) => {
        const marked = rows.filter((r) => ['Present', 'Late', 'Half Day', 'Absent'].includes(r.status));
        return marked.length ? pct((countBy(marked, (r) => ATTENDED.includes(r.status)) / marked.length) * 100) : '—';
      },
    },
  ],
  views: [
    { key: 'today', label: 'Register', match: () => true },
    { key: 'absent', label: 'Absentees', match: (r) => r.status === 'Absent' },
    { key: 'late', label: 'Late', match: (r) => r.status === 'Late' },
    { key: 'leave', label: 'On Leave', match: (r) => r.status === 'On Leave' },
    { key: 'risk', label: 'At Risk', match: isAtRisk },
    { key: 'missing', label: 'Not Marked', match: (r) => r.status === 'Not Marked' },
  ],
  filters: [
    { key: 'class', label: 'Class', options: () => snapshot<{ id: string; name: string }>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => getStudent(r.studentId)?.classId === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => getStudent(r.studentId)?.sectionId.endsWith(`-${v}`) ?? false },
    { key: 'status', label: 'Status', options: opts(STUDENT_STATUSES), match: (r, v) => r.status === v },
    { key: 'house', label: 'House', options: opts(['Red', 'Blue', 'Green', 'Yellow']), match: (r, v) => getStudent(r.studentId)?.house === v },
    { key: 'transport', label: 'Transport', options: opts(['Bus users', 'Day scholars']), single: true, match: (r, v) => (v === 'Bus users') === !!getStudent(r.studentId)?.transport },
    { key: 'residence', label: 'Residence', options: opts(['Boarders', 'Day scholars']), single: true, match: (r, v) => (v === 'Boarders') === !!getStudent(r.studentId)?.hostel },
    { key: 'pct', label: 'Attendance %', options: opts(['Below 75%', '75–90%', 'Above 90%']), single: true, match: (r, v) => { const p = attendancePct(r.studentId); return v === 'Below 75%' ? p < 75 : v === '75–90%' ? p >= 75 && p <= 90 : p > 90; } },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => studentNameOf(a).localeCompare(studentNameOf(b)) },
    { key: 'roll', label: 'Roll no', compare: (a, b) => (getStudent(a.studentId)?.rollNo ?? 0) - (getStudent(b.studentId)?.rollNo ?? 0) },
    { key: 'pct', label: 'Attendance % (lowest first)', compare: (a, b) => attendancePct(a.studentId) - attendancePct(b.studentId) },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
  ],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: studentOptions, readOnly: (_v, edit) => edit },
    { key: 'date', label: 'Date', type: 'date', required: true, readOnly: (_v, edit) => edit },
    { key: 'session', label: 'Session', type: 'select', options: opts(['Morning', 'Afternoon']), default: 'Morning' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: opts(STUDENT_STATUSES), default: 'Present' },
    { key: 'checkIn', label: 'Check In', type: 'time', hidden: (v) => !needsTimes(v.status) },
    { key: 'checkOut', label: 'Check Out', type: 'time', hidden: (v) => !needsTimes(v.status) },
    { key: 'leaveNote', label: 'Leave Detail', type: 'text', hidden: (v) => v.status !== 'On Leave' },
    { key: 'remark', label: 'Remark', type: 'textarea' },
  ],
  defaults: (_rows, ctx) => ({ date: ctx.date ?? todayISO() }),
  validate: (v, { existing, rows }) => ({
    ...(String(v.date) > todayISO() ? { date: 'Attendance cannot be marked for a future date' } : {}),
    ...(!existing && rows.some((r) => r.studentId === v.studentId && r.date === v.date) ? { studentId: 'This student already has an entry for that date. Edit it instead.' } : {}),
    ...(v.checkIn && v.checkOut && minutesOf(v.checkOut) <= minutesOf(v.checkIn) ? { checkOut: 'Check out must be after check in' } : {}),
    ...(v.status === 'Late' && !v.checkIn ? { checkIn: 'Enter the time the student arrived' } : {}),
  }),
  prepare: (v, { existing }) => {
    const attended = needsTimes(v.status);
    const inMin = minutesOf(v.checkIn);
    return {
      checkIn: attended ? v.checkIn : '',
      checkOut: attended ? v.checkOut : '',
      lateMinutes: v.status === 'Late' && inMin > SCHOOL_START ? inMin - SCHOOL_START : 0,
      leaveNote: v.status === 'On Leave' ? v.leaveNote : '',
      checkInNote: attended ? existing?.checkInNote ?? (getStudent(v.studentId)?.transport ? 'Bus' : 'Gate 1') : '',
    };
  },
  actions: [
    {
      key: 'status',
      label: 'Change status',
      icon: 'edit-3',
      form: {
        title: 'Change attendance status',
        submitLabel: 'Update',
        fields: [
          { key: 'status', label: 'Status', type: 'select', required: true, options: opts(STUDENT_STATUSES) },
          { key: 'checkIn', label: 'Check In', type: 'time', hidden: (v) => !needsTimes(v.status) },
          { key: 'remark', label: 'Remark', type: 'text' },
        ],
        initial: (r) => ({ status: r.status, checkIn: r.checkIn, remark: r.remark }),
        validate: (v) => (v.status === 'Late' && !v.checkIn ? { checkIn: 'Enter the time the student arrived' } : {}),
      },
      run: (r, v, ctx) => {
        const attended = needsTimes(v.status);
        const inMin = minutesOf(v.checkIn);
        ctx.update({
          status: v.status,
          checkIn: attended ? v.checkIn || r.checkIn : '',
          checkOut: attended ? r.checkOut : '',
          lateMinutes: v.status === 'Late' && inMin > SCHOOL_START ? inMin - SCHOOL_START : 0,
          leaveNote: v.status === 'On Leave' ? r.leaveNote || 'Leave' : '',
          remark: v.remark,
        });
        ctx.toast(`Marked ${v.status}`);
      },
    },
    {
      key: 'notify',
      label: 'Message guardian',
      icon: 'message-circle',
      form: { title: 'Message guardian', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: opts(channelOptions), default: channelOptions[0] }, { key: 'message', label: 'Message', type: 'textarea', required: true }], initial: () => ({ message: DEFAULT_ABSENCE_MESSAGE }) },
      run: (r, v, ctx) => ctx.toast(`${v.channel}: queued for ${getStudent(r.studentId)?.parentName ?? 'guardian'} (mock — nothing is sent)`, 'info'),
    },
  ],
  bulk: [
    {
      key: 'apply',
      label: 'Apply status',
      icon: 'check-square',
      form: { title: 'Apply status to selected', fields: [{ key: 'status', label: 'Apply status', type: 'select', required: true, options: opts(['Present', 'Absent', 'Half Day', 'Holiday', 'Excused']), default: 'Present' }] },
      run: (rows, v, ctx) => {
        ctx.updateMany(() => (v.status === 'Present' || v.status === 'Half Day' ? { status: v.status, lateMinutes: 0 } : { status: v.status, checkIn: '', checkOut: '', lateMinutes: 0, checkInNote: '' }));
        ctx.toast(`${rows.length} entries marked ${v.status}`);
      },
    },
    {
      key: 'notify',
      label: 'Notify',
      icon: 'bell',
      form: { title: 'Notify guardians of selected', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channels', type: 'select', required: true, options: opts(channelOptions), default: channelOptions[0] }, { key: 'message', label: 'Message', type: 'textarea', required: true }] },
      run: (rows, v, ctx) => ctx.toast(`${v.channel}: queued for ${new Set(rows.map((r) => getStudent(r.studentId)?.parentName)).size} guardians (mock — nothing is sent)`, 'info'),
    },
  ],
  pageActions: [
    {
      key: 'all-present',
      label: 'Mark all present',
      icon: 'user-check',
      run: (_v, ctx) => {
        const todo = ctx.visible.filter((r) => r.status === 'Not Marked');
        if (!todo.length) { ctx.toast('Everyone shown is already marked', 'info'); return; }
        ctx.updateMany(todo.map((r) => r.id), () => ({ status: 'Present' as const }));
        ctx.toast(`${todo.length} not-yet-marked students set to Present`);
      },
    },
    {
      key: 'bulk',
      label: 'Bulk apply',
      icon: 'layers',
      form: {
        title: 'Bulk apply attendance',
        submitLabel: 'Apply',
        fields: [
          { key: 'scope', label: 'Scope', type: 'select', required: true, options: opts(['Whole class', 'Whole section', 'Entire school']), default: 'Whole class' },
          { key: 'classId', label: 'Class', type: 'select', optionsFrom: classOptions, hidden: (v) => v.scope === 'Entire school' },
          { key: 'sectionId', label: 'Section', type: 'select', optionsFrom: { collection: 'sections', label: (s: { name: string }) => `Section ${s.name}`, filter: (s: { classId: string }, vals) => !vals.classId || s.classId === vals.classId }, hidden: (v) => v.scope !== 'Whole section' },
          { key: 'status', label: 'Apply status', type: 'select', required: true, options: opts(['Present', 'Absent', 'Half Day', 'Holiday', 'Excused']), default: 'Present' },
        ],
        validate: (v) => ({
          ...(v.scope !== 'Entire school' && !v.classId ? { classId: 'Choose a class' } : {}),
          ...(v.scope === 'Whole section' && !v.sectionId ? { sectionId: 'Choose a section' } : {}),
        }),
      },
      run: (v, ctx) => {
        if (!ctx.date || ctx.date === 'all') { ctx.toast('Pick a single date first (turn off “All”).', 'error'); return; }
        const inScope = (r: StudentAttendanceRecord) => {
          if (r.date !== ctx.date) return false;
          const s = getStudent(r.studentId) as StudentRecord | undefined;
          if (!s) return false;
          if (v.scope === 'Entire school') return true;
          if (v.scope === 'Whole section') return s.sectionId === v.sectionId;
          return s.classId === v.classId;
        };
        const hit = ctx.rows.filter(inScope);
        if (!hit.length) { ctx.toast('No register entries for that scope on this date', 'info'); return; }
        const clears = v.status === 'Absent' || v.status === 'Holiday' || v.status === 'Excused';
        ctx.updateMany(hit.map((r) => r.id), () => (clears ? { status: v.status, checkIn: '', checkOut: '', lateMinutes: 0 } : { status: v.status, lateMinutes: 0 }));
        ctx.toast(`${hit.length} entries marked ${v.status}`);
      },
    },
    {
      key: 'notify',
      label: 'Notify guardians',
      icon: 'bell',
      form: {
        title: 'Notify guardians',
        submitLabel: 'Send',
        fields: [
          { key: 'audience', label: 'Audience', type: 'select', required: true, options: opts(['Guardians of absentees', 'Guardians of late arrivals']), default: 'Guardians of absentees' },
          { key: 'channel', label: 'Channels', type: 'select', required: true, options: opts(channelOptions), default: channelOptions[0] },
          { key: 'message', label: 'Message', type: 'textarea', required: true, default: DEFAULT_ABSENCE_MESSAGE },
        ],
      },
      run: (v, ctx) => {
        const want = v.audience === 'Guardians of late arrivals' ? 'Late' : 'Absent';
        const list = ctx.visible.filter((r) => r.status === want);
        ctx.toast(list.length ? `${v.channel}: queued for ${new Set(list.map((r) => getStudent(r.studentId)?.parentName)).size} guardians (mock — nothing is sent)` : `No ${want.toLowerCase()} students in the current list`, list.length ? 'info' : 'error');
      },
    },
  ],
};

/* ====================== Teacher & staff attendance (shared) ====================== */

type Duty = TeacherAttendanceRecord | StaffAttendanceRecord;
const DUTY_STATUSES: DutyStatus[] = ['Present', 'Absent', 'Late', 'On Leave', 'Half Day', 'Pending'];
const dutyTone: Record<string, Tone> = { Present: 'success', Late: 'warning', Pending: 'warning', Absent: 'danger', 'On Leave': 'info', 'Half Day': 'neutral' };
const METHODS: DutyMethod[] = ['Biometric', 'RFID', 'Manual'];
const dutyAttended = (s: unknown) => s === 'Present' || s === 'Late' || s === 'Half Day' || s === 'Pending';
const checkInStatus = (r: Duty) => (!r.checkIn ? 'Not Checked In' : r.checkOut ? 'Checked Out' : 'Checked In');
const workedMin = (r: Duty) => {
  const a = minutesOf(r.checkIn);
  const b = minutesOf(r.checkOut);
  return Number.isNaN(a) || Number.isNaN(b) ? 0 : Math.max(0, b - a - r.breakMin);
};
const classLabels = (teacherId: string) =>
  snapshot<{ id: string; classId: string; name: string; classTeacherId: string }>('sections')
    .filter((s) => s.classTeacherId === teacherId)
    .map((s) => `${getClass(s.classId)?.numeral ?? ''}-${s.name}`)
    .join(', ') || '—';

function makeDutyCfg(kind: 'teacher' | 'staff'): ResourceConfig<Duty> {
  const isTeacher = kind === 'teacher';
  const idKey = isTeacher ? 'teacherId' : 'staffId';
  const collection = isTeacher ? 'teacherAttendance' : 'staffAttendance';
  const pid = (r: Duty): string => (isTeacher ? (r as TeacherAttendanceRecord).teacherId : (r as StaffAttendanceRecord).staffId);
  const person = (r: Duty): (TeacherRecord & StaffRecord) | undefined => (isTeacher ? getTeacher(pid(r)) : getStaff(pid(r))) as (TeacherRecord & StaffRecord) | undefined;
  const nameOf = (r: Duty) => person(r)?.name ?? '—';
  const entity = isTeacher ? 'Teacher Attendance' : 'Staff Attendance';
  const departments = () => [...new Set(snapshot<{ id: string; department: string }>(isTeacher ? 'teachers' : 'staff').map((p) => p.department))].map((d) => ({ label: d, value: d }));

  return {
    entity,
    collection,
    rowScope: staffSideScope,
    dateFilter: { key: 'date', allowAll: true },
    searchPlaceholder: isTeacher ? 'Search teacher, department…' : 'Search staff, department…',
    searchText: (r) => `${nameOf(r)} ${person(r)?.department ?? ''} ${person(r)?.designation ?? ''} ${person(r)?.employeeId ?? ''}`,
    code: (r) => person(r)?.employeeId,
    title: nameOf,
    subtitle: (r) => `${person(r)?.department ?? ''} · ${person(r)?.designation ?? ''}`,
    status: (r) => ({ label: r.status, tone: dutyTone[r.status] }),
    badges: (r) => [{ label: r.method, tone: 'primary' }, ...(r.overtimeMin ? [{ label: `+${r.overtimeMin}m overtime`, tone: 'warning' as Tone }] : [])],
    facts: [
      { label: 'Check in', value: (r) => (r.checkIn ? time(r.checkIn) : undefined) },
      { label: 'Check out', value: (r) => (r.checkOut ? time(r.checkOut) : undefined) },
      { label: 'Working hours', value: (r) => (workedMin(r) ? hm(workedMin(r)) : undefined) },
      { label: 'Break', value: (r) => (r.breakMin ? `${r.breakMin} min` : undefined) },
      ...(isTeacher
        ? [{ label: 'Subjects', value: (r: Duty) => (person(r) as TeacherRecord | undefined)?.subjects.join(', ') }, { label: 'Classes', value: (r: Duty) => classLabels(pid(r)) }]
        : [{ label: 'Shift', value: (r: Duty) => (person(r) as StaffRecord | undefined)?.shift }, { label: 'Staff type', value: (r: Duty) => (person(r) as StaffRecord | undefined)?.staffType }]),
      { label: 'Recorded by', value: (r) => r.recordedBy },
    ],
    detail: [
      { title: 'Attendance', items: [{ label: 'Date', value: (r) => formatDate(r.date) }, { label: 'Status', value: (r) => r.status }, { label: 'Check in', value: (r) => time(r.checkIn) }, { label: 'Check out', value: (r) => time(r.checkOut) }, { label: 'Working hours', value: (r) => hm(workedMin(r)) }, { label: 'Total break', value: (r) => (r.breakMin ? `${r.breakMin} min` : '—') }, { label: 'Overtime', value: (r) => (r.overtimeMin ? `${r.overtimeMin} min` : '0') }, { label: 'Notes', value: (r) => r.notes }] },
      { title: 'Device & record', items: [{ label: 'Method', value: (r) => r.method }, { label: 'Device', value: (r) => r.device }, { label: 'Recorded by', value: (r) => r.recordedBy }, { label: 'Last updated', value: (r) => time(r.lastUpdated) }, { label: 'Corrections', value: (r) => r.corrections }, { label: 'Campus', value: (r) => r.campus }] },
      { title: isTeacher ? 'Teacher' : 'Staff member', items: [{ label: 'Employee ID', value: (r) => person(r)?.employeeId }, { label: 'Department', value: (r) => person(r)?.department }, { label: 'Designation', value: (r) => person(r)?.designation }, ...(isTeacher ? [{ label: 'Class teacher of', value: (r: Duty) => classLabels(pid(r)) }] : [{ label: 'Reports to', value: (r: Duty) => (person(r) as StaffRecord | undefined)?.reportsTo }])] },
      {
        title: 'Last 5 records',
        items: [0, 1, 2, 3, 4].map((i) => ({
          label: `Entry ${i + 1}`,
          value: (r: Duty) => {
            const mine = snapshot<Duty>(collection).filter((x) => pid(x) === pid(r) && x.date <= r.date).sort((a, b) => b.date.localeCompare(a.date))[i];
            return mine ? `${formatDate(mine.date)} · ${mine.status}${mine.checkIn ? ` · in ${time(mine.checkIn)}` : ''}` : '—';
          },
        })),
      },
    ],
    stats: [
      { label: isTeacher ? 'Teachers' : 'Staff', value: (rows) => rows.length, icon: 'users' },
      { label: 'Present', value: (rows) => countBy(rows, (r) => r.status === 'Present'), tone: 'success', icon: 'user-check' },
      { label: 'Late', value: (rows) => countBy(rows, (r) => r.status === 'Late'), tone: 'warning', icon: 'clock' },
      { label: 'Absent', value: (rows) => countBy(rows, (r) => r.status === 'Absent'), tone: 'danger', icon: 'user-x' },
      { label: 'On leave', value: (rows) => countBy(rows, (r) => r.status === 'On Leave'), tone: 'info', icon: 'calendar' },
      { label: 'Pending', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'help-circle' },
    ],
    views: [
      { key: 'all', label: isTeacher ? 'All Teachers' : 'All Staff', match: () => true },
      { key: 'absentees', label: 'Absentees', match: (r) => r.status === 'Absent' },
      { key: 'late', label: 'Late Arrivals', match: (r) => r.status === 'Late' },
    ],
    filters: [
      { key: 'department', label: 'Department', options: departments, match: (r, v) => person(r)?.department === v },
      ...(isTeacher
        ? [
            { key: 'subject', label: 'Subject', options: () => [...new Set(snapshot<TeacherRecord>('teachers').flatMap((t) => t.subjects))].map((s) => ({ label: s, value: s })), match: (r: Duty, v: string) => (person(r) as TeacherRecord | undefined)?.subjects.includes(v) ?? false },
            { key: 'classTeacher', label: 'Class teacher of', options: () => snapshot<{ id: string; classId: string; name: string; classTeacherId: string }>('sections').map((s) => ({ label: `${getClass(s.classId)?.name}-${s.name}`, value: s.id })), match: (r: Duty, v: string) => snapshot<{ id: string; classTeacherId: string }>('sections').find((s) => s.id === v)?.classTeacherId === pid(r) },
          ]
        : [
            { key: 'staffType', label: 'Staff type', options: opts(['Administrative', 'Support']), match: (r: Duty, v: string) => (person(r) as StaffRecord | undefined)?.staffType === v },
            { key: 'shift', label: 'Shift', options: opts(['Morning', 'General']), match: (r: Duty, v: string) => (person(r) as StaffRecord | undefined)?.shift === v },
          ]),
      { key: 'designation', label: 'Designation', options: () => [...new Set(snapshot<{ id: string; designation: string }>(isTeacher ? 'teachers' : 'staff').map((p) => p.designation))].map((d) => ({ label: d, value: d })), match: (r, v) => person(r)?.designation === v },
      { key: 'campus', label: 'Campus', options: () => [...new Set(snapshot<{ id: string; campus: string }>(isTeacher ? 'teachers' : 'staff').map((p) => p.campus))].map((c) => ({ label: c, value: c })), match: (r, v) => r.campus === v },
      { key: 'status', label: 'Attendance status', options: opts(DUTY_STATUSES), match: (r, v) => r.status === v },
      { key: 'checkin', label: 'Check-in status', options: opts(['Checked In', 'Not Checked In', 'Checked Out']), match: (r, v) => checkInStatus(r) === v },
    ],
    sorts: [
      { key: 'name', label: `${isTeacher ? 'Teacher' : 'Name'} (A–Z)`, compare: (a, b) => nameOf(a).localeCompare(nameOf(b)) },
      { key: 'checkin', label: 'Check-in time', compare: (a, b) => (a.checkIn || '99:99').localeCompare(b.checkIn || '99:99') },
      { key: 'hours', label: 'Working hours', compare: (a, b) => workedMin(b) - workedMin(a) },
    ],
    form: [
      { key: idKey, label: isTeacher ? 'Teacher' : 'Staff Member', type: 'select', required: true, readOnly: (_v, edit) => edit, optionsFrom: isTeacher ? { collection: 'teachers', label: (t: TeacherRecord) => t.name, hint: (t: TeacherRecord) => t.department } : { collection: 'staff', label: (s: StaffRecord) => s.name, hint: (s: StaffRecord) => s.department } },
      { key: 'date', label: 'Attendance Date', type: 'date', required: true, readOnly: (_v, edit) => edit },
      { key: 'status', label: 'Status', type: 'select', required: true, options: opts(DUTY_STATUSES), default: 'Present' },
      { key: 'method', label: 'Attendance Method', type: 'select', required: true, options: opts(METHODS), default: 'Manual' },
      { key: 'checkIn', label: 'Check-In', type: 'time', hidden: (v) => !dutyAttended(v.status) },
      { key: 'checkOut', label: 'Check-Out', type: 'time', hidden: (v) => !dutyAttended(v.status) },
      { key: 'breakMin', label: 'Break Duration (minutes)', type: 'number', min: 0, max: 240, default: 45, hidden: (v) => !dutyAttended(v.status) },
      { key: 'overtimeMin', label: 'Overtime (minutes)', type: 'number', min: 0, max: 360, default: 0, hidden: (v) => !dutyAttended(v.status) },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: (_rows, ctx) => ({ date: ctx.date ?? todayISO() }),
    validate: (v, { existing, rows }) => ({
      ...(String(v.date) > todayISO() ? { date: 'Attendance cannot be marked for a future date' } : {}),
      ...(!existing && rows.some((r) => pid(r) === v[idKey] && r.date === v.date) ? { [idKey]: 'An entry already exists for this date. Edit it instead.' } : {}),
      ...(['Present', 'Late', 'Half Day'].includes(v.status) && !v.checkIn ? { checkIn: 'Check-in time is required' } : {}),
      ...(v.checkIn && v.checkOut && minutesOf(v.checkOut) <= minutesOf(v.checkIn) ? { checkOut: 'Check-out must be after check-in' } : {}),
    }),
    prepare: (v, { existing }) => {
      const attended = dutyAttended(v.status);
      const method = v.method as DutyMethod;
      const checkIn = attended ? v.checkIn : '';
      const checkOut = attended ? v.checkOut : '';
      return {
        checkIn,
        checkOut,
        breakMin: attended ? v.breakMin : 0,
        overtimeMin: attended ? v.overtimeMin : 0,
        device: DEVICES[method],
        recordedBy: method === 'Manual' ? 'Admin Office' : 'System',
        lastUpdated: checkOut || checkIn,
        corrections: existing?.corrections ?? 0,
        campus: (isTeacher ? getTeacher(v[idKey]) : getStaff(v[idKey]))?.campus ?? existing?.campus ?? 'Main Campus',
      } as Partial<Duty>;
    },
    actions: [
      {
        key: 'correct',
        label: 'Attendance correction',
        icon: 'edit',
        form: {
          title: 'Attendance correction',
          submitLabel: 'Apply correction',
          fields: [
            { key: 'checkIn', label: 'Check-In', type: 'time', required: true },
            { key: 'checkOut', label: 'Check-Out', type: 'time' },
            { key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Present', 'Late']), default: 'Present' },
            { key: 'reason', label: 'Reason for Correction', type: 'textarea', required: true },
          ],
          initial: (r) => ({ checkIn: r.checkIn, checkOut: r.checkOut, status: r.status === 'Late' ? 'Late' : 'Present' }),
          validate: (v) => (v.checkOut && minutesOf(v.checkOut) <= minutesOf(v.checkIn) ? { checkOut: 'Check-out must be after check-in' } : {}),
        },
        run: (r, v, ctx) => {
          ctx.update({ checkIn: v.checkIn, checkOut: v.checkOut, status: v.status, lastUpdated: v.checkOut || v.checkIn, corrections: r.corrections + 1, notes: `Corrected: ${v.reason}` } as Partial<Duty>);
          ctx.toast('Correction applied');
        },
      },
    ],
    bulk: [
      { key: 'present', label: 'Present', icon: 'user-check', run: (rows, _v, ctx) => { ctx.updateMany((r) => ({ status: 'Present', notes: r.notes } as Partial<Duty>)); ctx.toast(`${rows.length} marked present`); } },
      { key: 'absent', label: 'Absent', icon: 'user-x', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ status: 'Absent', checkIn: '', checkOut: '', breakMin: 0, overtimeMin: 0, lastUpdated: '' } as Partial<Duty>)); ctx.toast(`${rows.length} marked absent`); } },
      {
        key: 'approve',
        label: 'Approve',
        icon: 'check-circle',
        run: (rows, _v, ctx) => {
          const pending = rows.filter((r) => r.status === 'Pending').length;
          if (!pending) { ctx.toast('No pending entries in the selection', 'info'); return; }
          ctx.updateMany((r) => (r.status === 'Pending' ? ({ status: 'Present' } as Partial<Duty>) : {}));
          ctx.toast(`${pending} pending ${pending === 1 ? 'entry' : 'entries'} approved`);
        },
      },
    ],
  };
}

export const teacherAttendanceCfg = makeDutyCfg('teacher');
export const staffAttendanceCfg = makeDutyCfg('staff');

/* ================================== Leave list ================================== */

const LEAVE_TYPES: LeaveRecord['leaveType'][] = ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave'];
/** Yearly allowance per type (the frontend's leave-balance table: Casual 12, Sick 10, Earned 18). */
export const LEAVE_ALLOWANCE: Record<LeaveRecord['leaveType'], number> = { 'Casual Leave': 12, 'Sick Leave': 10, 'Earned Leave': 18, 'Maternity Leave': 90 };
const leaveTone: Record<LeaveStatus, Tone> = { Approved: 'success', Pending: 'warning', Forwarded: 'info', Rejected: 'danger', Cancelled: 'neutral' };
const typeTone: Record<LeaveRecord['leaveType'], Tone> = { 'Casual Leave': 'primary', 'Sick Leave': 'info', 'Earned Leave': 'success', 'Maternity Leave': 'purple' };
const approvalOf = (s: LeaveStatus) => (s === 'Approved' ? 'Approved' : s === 'Rejected' || s === 'Cancelled' ? 'Rejected' : 'Awaiting Approval');
const leaveStaff = (r: LeaveRecord) => getStaff(r.staffId);
const usedDays = (staffId: string, type: LeaveRecord['leaveType']) =>
  snapshot<LeaveRecord>('leaves').filter((l) => l.staffId === staffId && l.leaveType === type && l.status === 'Approved').reduce((n, l) => n + l.days, 0);
const balanceText = (r: LeaveRecord, type: LeaveRecord['leaveType']) => `${Math.max(0, LEAVE_ALLOWANCE[type] - usedDays(r.staffId, type))} of ${LEAVE_ALLOWANCE[type]} days left`;
const OPEN_STATUSES: LeaveStatus[] = ['Pending', 'Forwarded'];

export const leavesCfg: ResourceConfig<LeaveRecord> = {
  entity: 'Leave Request',
  collection: 'leaves',
  rowScope: staffSideScope,
  searchPlaceholder: 'Search employee, staff ID, leave type…',
  searchText: (r) => `${leaveStaff(r)?.name ?? ''} ${leaveStaff(r)?.employeeId ?? ''} ${r.code} ${r.leaveType}`,
  code: (r) => `${r.code} · ${leaveStaff(r)?.employeeId ?? ''}`,
  title: (r) => leaveStaff(r)?.name ?? '—',
  subtitle: (r) => `${leaveStaff(r)?.department ?? ''} · ${leaveStaff(r)?.designation ?? ''}`,
  status: (r) => ({ label: r.status, tone: leaveTone[r.status] }),
  badges: (r) => [{ label: r.leaveType, tone: typeTone[r.leaveType] }, ...(r.hasAttachment ? [{ label: 'Attachment', tone: 'neutral' as Tone }] : [])],
  facts: [
    { label: 'Days', value: (r) => `${r.days} ${r.days === 1 ? 'day' : 'days'}` },
    { label: 'Applied', value: (r) => formatDate(r.applied) },
    { label: 'From', value: (r) => formatDate(r.from) },
    { label: 'To', value: (r) => formatDate(r.to) },
    { label: 'Approver', value: (r) => r.approver },
    { label: 'Branch', value: (r) => leaveStaff(r)?.campus },
  ],
  detail: [
    { title: 'Leave', items: [{ label: 'Request ID', value: (r) => r.code }, { label: 'Leave type', value: (r) => r.leaveType }, { label: 'From', value: (r) => formatDate(r.from) }, { label: 'To', value: (r) => formatDate(r.to) }, { label: 'No of days', value: (r) => `${r.days} ${r.days === 1 ? 'day' : 'days'}` }, { label: 'Reason', value: (r) => r.reason }, { label: 'Attachment', value: (r) => (r.hasAttachment ? 'leave-note.pdf' : 'No attachments') }] },
    { title: 'Approval', items: [{ label: 'Applied on', value: (r) => formatDate(r.applied) }, { label: 'Approver', value: (r) => r.approver }, { label: 'Approval status', value: (r) => approvalOf(r.status) }, { label: 'Decision note', value: (r) => r.decisionNote || '—' }] },
    { title: 'Employee', items: [{ label: 'Staff ID', value: (r) => leaveStaff(r)?.employeeId }, { label: 'Department', value: (r) => leaveStaff(r)?.department }, { label: 'Designation', value: (r) => leaveStaff(r)?.designation }, { label: 'Branch', value: (r) => leaveStaff(r)?.campus }] },
    { title: 'Leave balance (approved leave)', items: (['Casual Leave', 'Sick Leave', 'Earned Leave'] as const).map((t) => ({ label: t, value: (r: LeaveRecord) => balanceText(r, t) })) },
  ],
  stats: [
    { label: 'Total requests', value: (rows) => rows.length, icon: 'calendar' },
    { label: 'Approved', value: (rows) => countBy(rows, (r) => r.status === 'Approved'), tone: 'success', icon: 'check-circle' },
    { label: 'Pending', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Rejected', value: (rows) => countBy(rows, (r) => r.status === 'Rejected'), tone: 'danger', icon: 'x-circle' },
    { label: 'Leave days', value: (rows) => rows.reduce((n, r) => n + r.days, 0), tone: 'info', icon: 'sun' },
  ],
  views: [
    { key: 'all', label: 'All Leaves', match: () => true },
    { key: 'pending', label: 'Pending Approval', match: (r) => r.status === 'Pending' },
    { key: 'approved', label: 'Approved Leaves', match: (r) => r.status === 'Approved' },
  ],
  filters: [
    { key: 'employee', label: 'Employee', options: () => snapshot<StaffRecord>('staff').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => r.staffId === v },
    { key: 'department', label: 'Department', options: () => [...new Set(snapshot<StaffRecord>('staff').map((s) => s.department))].map((d) => ({ label: d, value: d })), match: (r, v) => leaveStaff(r)?.department === v },
    { key: 'type', label: 'Leave type', options: opts(LEAVE_TYPES), match: (r, v) => r.leaveType === v },
    { key: 'status', label: 'Leave status', options: opts(['Approved', 'Pending', 'Forwarded', 'Rejected', 'Cancelled']), match: (r, v) => r.status === v },
    { key: 'approval', label: 'Approval status', options: opts(['Approved', 'Awaiting Approval', 'Rejected']), match: (r, v) => approvalOf(r.status) === v },
    { key: 'branch', label: 'Branch', options: opts(['Main Campus', 'North Wing', 'South Wing']), match: (r, v) => leaveStaff(r)?.campus === v },
  ],
  sorts: [
    { key: 'employee', label: 'Employee (A–Z)', compare: (a, b) => (leaveStaff(a)?.name ?? '').localeCompare(leaveStaff(b)?.name ?? '') },
    { key: 'applied', label: 'Applied date (newest)', compare: (a, b) => b.applied.localeCompare(a.applied) },
    { key: 'days', label: 'Duration (longest)', compare: (a, b) => b.days - a.days },
  ],
  form: [
    { key: 'staffId', label: 'Employee', type: 'select', required: true, readOnly: (_v, edit) => edit, optionsFrom: { collection: 'staff', label: (s: StaffRecord) => s.name, hint: (s: StaffRecord) => `${s.employeeId} · ${s.department}` } },
    { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: opts(LEAVE_TYPES), default: 'Casual Leave' },
    {
      key: 'from', label: 'From Date', type: 'date', required: true,
      onChange: (v, vals) => {
        const to = !vals.to || String(vals.to) < String(v) ? v : vals.to;
        return { to, days: String(inclusiveDays(String(v), String(to))) };
      },
    },
    {
      key: 'to', label: 'To Date', type: 'date', required: true,
      onChange: (v, vals) => (vals.from ? { days: String(inclusiveDays(String(vals.from), String(v))) } : undefined),
    },
    { key: 'days', label: 'No of Days', type: 'number', required: true, min: 0.5, hint: 'Filled from the dates; change it for a half-day.' },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
    { key: 'hasAttachment', label: 'Supporting document attached', type: 'switch' },
  ],
  validate: (v, { existing, rows }) => {
    const from = String(v.from);
    const to = String(v.to);
    const overlap = rows.find((l) => l.id !== existing?.id && l.staffId === v.staffId && (l.status === 'Pending' || l.status === 'Forwarded' || l.status === 'Approved') && l.from <= to && l.to >= from);
    return {
      ...(to < from ? { to: 'To date cannot be before the from date' } : {}),
      ...(Number(v.days) > inclusiveDays(from, to) ? { days: `Cannot exceed ${inclusiveDays(from, to)} day(s) between those dates` } : {}),
      ...(overlap ? { from: `Overlaps ${overlap.code} (${formatDate(overlap.from)} – ${formatDate(overlap.to)})` } : {}),
    };
  },
  prepare: (_v, { existing, rows }) => ({
    code: existing?.code ?? nextNo('LV-', rows.map((r) => r.code), 4),
    applied: existing?.applied ?? todayISO(),
    approver: existing?.approver ?? 'Principal Office',
    status: existing?.status ?? 'Pending',
    decisionNote: existing?.decisionNote ?? '',
  }),
  editable: (r) => r.status === 'Pending',
  actions: [
    {
      key: 'approve',
      label: 'Approve leave',
      icon: 'check',
      tone: 'success',
      visible: (r) => OPEN_STATUSES.includes(r.status),
      form: { title: 'Approve leave', submitLabel: 'Approve', fields: [{ key: 'note', label: 'Approver Note', type: 'textarea' }] },
      run: (r, v, ctx) => { ctx.update({ status: 'Approved', decisionNote: v.note ?? '' }); ctx.toast(`${leaveStaff(r)?.name ?? 'Leave'} approved`); },
    },
    {
      key: 'reject',
      label: 'Reject leave',
      icon: 'x',
      tone: 'danger',
      visible: (r) => OPEN_STATUSES.includes(r.status),
      form: { title: 'Reject leave', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason for Rejection', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update({ status: 'Rejected', decisionNote: v.reason }); ctx.toast(`${leaveStaff(r)?.name ?? 'Leave'} rejected`, 'info'); },
    },
  ],
  bulk: [
    {
      key: 'approve',
      label: 'Approve',
      icon: 'check-circle',
      run: (rows, _v, ctx) => {
        const open = rows.filter((r) => OPEN_STATUSES.includes(r.status)).length;
        if (!open) { ctx.toast('No open requests in the selection', 'info'); return; }
        ctx.updateMany((r) => (OPEN_STATUSES.includes(r.status) ? { status: 'Approved' as const } : {}));
        ctx.toast(`${open} request${open > 1 ? 's' : ''} approved`);
      },
    },
    {
      key: 'reject',
      label: 'Reject',
      icon: 'x-circle',
      form: { title: 'Reject selected requests', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason for Rejection', type: 'textarea', required: true }] },
      run: (rows, v, ctx) => {
        const open = rows.filter((r) => OPEN_STATUSES.includes(r.status)).length;
        if (!open) { ctx.toast('No open requests in the selection', 'info'); return; }
        ctx.updateMany((r) => (OPEN_STATUSES.includes(r.status) ? { status: 'Rejected' as const, decisionNote: v.reason } : {}));
        ctx.toast(`${open} request${open > 1 ? 's' : ''} rejected`, 'info');
      },
    },
  ],
};

