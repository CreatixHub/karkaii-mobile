import { repo, snapshot } from '@/core/store/store';
import { generateForSection } from '@/features/academic/timetableLogic';
import { formatDate, todayISO } from '@/core/utils/date';
import type { ClassroomRecord, ClassSubjectRecord, MaterialType, StudyMaterialRecord, SubjectCategory, SubjectRecord, TimetableEntryRecord } from '@/data/seed/academic';
import { FACILITIES } from '@/data/seed/academic';
import type { ClassRecord, SectionRecord } from '@/data/seed/master';
import { countBy, getClass, getSection, getTeacher, nextNo, sum, teacherName } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import {
  allStudents,
  classCapacity,
  classOptionList,
  gender,
  isFull,
  mappingsOfClass,
  mappingsOfSubject,
  opts,
  parseCsvRows,
  sectionInRoom,
  sectionLabel,
  sectionState,
  sectionsOfClass,
  seatTone,
  studentsInClass,
  studentsInSection,
  subjectName,
  subjectOf,
  teacherOptionList,
  timetableOfSection,
} from './helpers';

const ACTIVE_YEARS = ['2026-27', '2025-26', '2027-28'];
const teacherOpt = { collection: 'teachers', label: (t: { name: string }) => t.name, hint: (t: { department: string }) => t.department };

/* =================================== Classes =================================== */

const statusTone: Record<string, Tone> = { Active: 'success', New: 'info', Inactive: 'neutral', Archived: 'neutral' };
const classNo = (c: ClassRecord) => Number(c.id.slice(4));

export const classesCfg: ResourceConfig<ClassRecord> = {
  entity: 'Class',
  collection: 'classes',
  searchPlaceholder: 'Search class, teacher, room…',
  searchText: (r) => `${r.name} ${r.numeral} ${r.category} ${teacherName(r.classTeacherId)} ${r.roomNo}`,
  code: (r) => `Room ${r.roomNo}`,
  title: (r) => r.name,
  subtitle: (r) => `${r.category} · ${sectionsOfClass(r.id).length} sections · ${studentsInClass(r.id).length} students`,
  status: (r) => ({ label: r.status, tone: statusTone[r.status] }),
  badges: (r) => sectionsOfClass(r.id).map((s) => ({ label: `Sec ${s.name}`, tone: 'primary' as Tone })),
  facts: [
    { label: 'Class teacher', value: (r) => `${teacherName(r.classTeacherId)}${getTeacher(r.classTeacherId) ? ` · ${getTeacher(r.classTeacherId)!.department}` : ''}` },
    { label: 'Assistant', value: (r) => teacherName(r.assistantTeacherId) },
    { label: 'Strength', value: (r) => `${studentsInClass(r.id).length} / ${classCapacity(r.id)}` },
    { label: 'Boys / Girls', value: (r) => `${gender(studentsInClass(r.id), 'Male')} / ${gender(studentsInClass(r.id), 'Female')}` },
    { label: 'Subjects', value: (r) => mappingsOfClass(r.id).length },
    { label: 'Periods / week', value: (r) => sum(mappingsOfClass(r.id), (m) => m.periodsPerWeek) },
  ],
  progress: (r) => ({ value: studentsInClass(r.id).length, max: Math.max(1, classCapacity(r.id)), label: 'Seats filled', tone: seatTone(studentsInClass(r.id).length, classCapacity(r.id)) }),
  detail: [
    { title: 'Class', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Numeral', value: (r) => r.numeral }, { label: 'Category', value: (r) => r.category }, { label: 'Room', value: (r) => r.roomNo }, { label: 'Academic year', value: (r) => r.year }, { label: 'Status', value: (r) => r.status }, { label: 'Note', value: (r) => r.note || '—' }] },
    { title: 'Staff', items: [{ label: 'Class teacher', value: (r) => teacherName(r.classTeacherId) }, { label: 'Assistant teacher', value: (r) => teacherName(r.assistantTeacherId) }, { label: 'Effective from', value: (r) => (r.teachersEffectiveFrom ? formatDate(r.teachersEffectiveFrom) : '—') }] },
    {
      title: 'Strength',
      items: [
        { label: 'Students', value: (r) => studentsInClass(r.id).length },
        { label: 'Capacity', value: (r) => classCapacity(r.id) },
        { label: 'Boys', value: (r) => gender(studentsInClass(r.id), 'Male') },
        { label: 'Girls', value: (r) => gender(studentsInClass(r.id), 'Female') },
        { label: 'Sections', value: (r) => sectionsOfClass(r.id).map((s) => `${s.name} (${studentsInSection(s.id).length}/${s.capacity})`).join(', ') || '—' },
      ],
    },
    { title: 'Subjects & timetable', items: [{ label: 'Subjects', value: (r) => mappingsOfClass(r.id).map((m) => `${subjectName(m.subjectId)} ${m.periodsPerWeek}`).join(', ') || '—' }, { label: 'Timetable', value: (r) => { const n = sectionsOfClass(r.id).filter((s) => timetableOfSection(s.id).length > 0).length; return `${n} of ${sectionsOfClass(r.id).length} sections scheduled`; } }] },
  ],
  stats: [
    { label: 'Classes', value: (rows) => rows.length, icon: 'grid' },
    { label: 'Students', value: (rows) => sum(rows, (r) => studentsInClass(r.id).length), tone: 'info', icon: 'users' },
    { label: 'Sections', value: (rows) => sum(rows, (r) => sectionsOfClass(r.id).length), tone: 'purple', icon: 'columns' },
    { label: 'Seats left', value: (rows) => sum(rows, (r) => Math.max(0, classCapacity(r.id) - studentsInClass(r.id).length)), tone: 'success', icon: 'check-square' },
  ],
  views: [
    { key: 'all', label: 'All Classes', match: () => true },
    { key: 'active', label: 'Active Classes', match: (r) => r.status === 'Active' },
    { key: 'new', label: 'New This Year', match: (r) => r.status === 'New' },
    { key: 'inactive', label: 'Inactive Classes', match: (r) => r.status === 'Inactive' },
    { key: 'archived', label: 'Archived', match: (r) => r.status === 'Archived' },
  ],
  filters: [
    { key: 'category', label: 'Category', options: opts(['Primary', 'Middle', 'Secondary']), match: (r, v) => r.category === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => sectionsOfClass(r.id).some((s) => s.name === v) },
    { key: 'teacher', label: 'Class teacher', options: teacherOptionList, match: (r, v) => r.classTeacherId === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'New', 'Inactive', 'Archived']), match: (r, v) => r.status === v },
    { key: 'room', label: 'Room', options: () => snapshot<ClassRecord>('classes').map((c) => ({ label: `Room ${c.roomNo}`, value: c.roomNo })), match: (r, v) => r.roomNo === v },
    { key: 'strength', label: 'Strength', single: true, options: opts(['Under 80% full', '80–99% full', 'Full']), match: (r, v) => { const f = studentsInClass(r.id).length / Math.max(1, classCapacity(r.id)); return v === 'Full' ? f >= 1 : v === '80–99% full' ? f >= 0.8 && f < 1 : f < 0.8; } },
    { key: 'subject', label: 'Studies subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => mappingsOfClass(r.id).some((m) => m.subjectId === v) },
    { key: 'year', label: 'Academic year', options: opts(ACTIVE_YEARS), match: (r, v) => r.year === v },
  ],
  sorts: [
    { key: 'grade', label: 'Grade (I → X)', compare: (a, b) => classNo(a) - classNo(b) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'strength', label: 'Strength (high to low)', compare: (a, b) => studentsInClass(b.id).length - studentsInClass(a.id).length },
    { key: 'category', label: 'Category', compare: (a, b) => a.category.localeCompare(b.category) },
    { key: 'teacher', label: 'Class teacher (A–Z)', compare: (a, b) => teacherName(a.classTeacherId).localeCompare(teacherName(b.classTeacherId)) },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
  ],
  form: [
    { key: 'name', label: 'Class Name', type: 'text', required: true, placeholder: 'e.g. Grade XI' },
    { key: 'numeral', label: 'Numeral', type: 'text', required: true, placeholder: 'e.g. XI' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: opts(['Primary', 'Middle', 'Secondary']) },
    { key: 'classTeacherId', label: 'Class Teacher', type: 'select', required: true, optionsFrom: teacherOpt },
    { key: 'assistantTeacherId', label: 'Assistant Teacher', type: 'select', optionsFrom: teacherOpt },
    { key: 'roomNo', label: 'Room', type: 'text', required: true },
    { key: 'year', label: 'Academic Year', type: 'select', options: opts(ACTIVE_YEARS), default: '2026-27' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Active', 'New', 'Inactive', 'Archived']), default: 'Active' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A class with this name already exists' } : {}),
    ...(rows.some((r) => r.id !== existing?.id && r.numeral.toLowerCase() === String(v.numeral).trim().toLowerCase()) ? { numeral: 'This numeral is already used' } : {}),
    ...(v.assistantTeacherId && v.assistantTeacherId === v.classTeacherId ? { assistantTeacherId: 'Assistant must be a different teacher' } : {}),
  }),
  prepare: (v, { existing }) => ({ assistantTeacherId: v.assistantTeacherId ?? '', teachersEffectiveFrom: existing?.teachersEffectiveFrom }),
  canDeleteRecord: (r) => {
    const secs = sectionsOfClass(r.id).length;
    const kids = allStudents().filter((s) => s.classId === r.id).length;
    return secs || kids ? `${r.name} still has ${secs} section(s) and ${kids} student record(s). Move or remove them first, or set the class to Archived.` : null;
  },
  actions: [
    {
      key: 'teacher',
      label: 'Assign class teacher',
      icon: 'user-check',
      form: {
        title: 'Assign class teacher',
        submitLabel: 'Assign',
        fields: [
          { key: 'classTeacherId', label: 'Class Teacher', type: 'select', required: true, optionsFrom: teacherOpt },
          { key: 'assistantTeacherId', label: 'Assistant Teacher', type: 'select', optionsFrom: teacherOpt },
          { key: 'effectiveFrom', label: 'Effective from', type: 'date', required: true },
        ],
        initial: (r) => ({ classTeacherId: r.classTeacherId, assistantTeacherId: r.assistantTeacherId, effectiveFrom: todayISO() }),
        validate: (v) => (v.assistantTeacherId && v.assistantTeacherId === v.classTeacherId ? { assistantTeacherId: 'Assistant must be a different teacher' } : {}),
      },
      run: (r, v, ctx) => { ctx.update({ classTeacherId: v.classTeacherId, assistantTeacherId: v.assistantTeacherId ?? '', teachersEffectiveFrom: v.effectiveFrom }); ctx.toast(`${teacherName(v.classTeacherId)} assigned to ${r.name}`); },
    },
    {
      key: 'subject',
      label: 'Assign subject',
      icon: 'book-open',
      form: {
        title: 'Assign subject to class',
        submitLabel: 'Assign',
        fields: [
          {
            key: 'subjectId', label: 'Subject', type: 'select', required: true,
            optionsFrom: { collection: 'subjects', label: (s: SubjectRecord) => s.name, hint: (s: SubjectRecord) => s.code, filter: (s: SubjectRecord) => s.status !== 'Archived' },
            onChange: (id, _vals, lookup) => { const s = lookup('subjects', id) as SubjectRecord | undefined; return s ? { periodsPerWeek: String(s.periodsPerWeek), teacherId: s.teacherId } : undefined; },
          },
          { key: 'periodsPerWeek', label: 'Periods per week', type: 'number', required: true, min: 1, max: 12 },
          { key: 'teacherId', label: 'Subject teacher', type: 'select', required: true, optionsFrom: teacherOpt },
          { key: 'term', label: 'Academic Term', type: 'select', required: true, options: opts(['Annual', 'Term 1', 'Term 2']), default: 'Annual' },
        ],
        validate: (v, r) => {
          const others = mappingsOfClass(r.id).filter((m) => m.subjectId !== v.subjectId);
          const total = sum(others, (m) => m.periodsPerWeek) + Number(v.periodsPerWeek || 0);
          return total > 42 ? { periodsPerWeek: `${r.name} would have ${total} periods a week; a week has only 42 (7 × 6).` } : {};
        },
      },
      run: (r, v, ctx) => {
        const maps = repo<ClassSubjectRecord>('classSubjects');
        const existing = maps.list().find((m) => m.classId === r.id && m.subjectId === v.subjectId);
        const subject = subjectOf(v.subjectId)!;
        if (existing) {
          maps.update(existing.id, { periodsPerWeek: v.periodsPerWeek, teacherId: v.teacherId, term: v.term });
          ctx.toast(`${subject.name} updated for ${r.name}`);
        } else {
          maps.create({ id: `cs-${r.id}-${v.subjectId}`, classId: r.id, subjectId: v.subjectId, teacherId: v.teacherId, periodsPerWeek: v.periodsPerWeek, examMarks: subject.examMarks, internalMarks: subject.internalMarks, passMarks: subject.passMarks, isElective: false, term: v.term });
          ctx.toast(`${subject.name} assigned to ${r.name}`);
        }
      },
    },
    {
      key: 'timetable',
      label: 'Generate timetable',
      icon: 'calendar',
      form: {
        title: 'Timetable generator',
        submitLabel: 'Generate',
        fields: [
          { key: 'scope', label: 'Sections', type: 'select', required: true, options: opts(['All sections', 'Section A', 'Section B']), default: 'All sections' },
          { key: 'days', label: 'Days', type: 'select', required: true, options: opts(['Mon–Sat', 'Mon–Fri']), default: 'Mon–Sat', hint: 'Seven 45-minute periods a day, as set by the school day.' },
          { key: 'effectiveFrom', label: 'Starts from', type: 'date', required: true },
          { key: 'avoidClashes', label: 'Avoid teacher clashes across sections', type: 'switch', default: true },
        ],
        initial: () => ({ effectiveFrom: todayISO() }),
      },
      run: (r, v, ctx) => {
        const targets = sectionsOfClass(r.id).filter((s) => v.scope === 'All sections' || v.scope === `Section ${s.name}`);
        if (!targets.length) { ctx.toast('No sections to schedule', 'error'); return; }
        const days = v.days === 'Mon–Fri' ? (['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] as const) : (['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const);
        let placed = 0;
        let missing = 0;
        for (const s of targets) {
          const res = generateForSection(s.id, { days, effectiveFrom: v.effectiveFrom, avoidClashes: v.avoidClashes !== false });
          placed += res.placed;
          missing += res.unplaced.reduce((n, u) => n + u.missing, 0);
        }
        ctx.toast(missing ? `${placed} periods placed; ${missing} could not be fitted (teacher or room clashes).` : `${placed} periods scheduled for ${targets.length} section(s).`, missing ? 'info' : 'success');
      },
    },
    {
      key: 'announce',
      label: 'Send announcement',
      icon: 'volume-2',
      manage: true,
      form: {
        title: 'Class announcement',
        submitLabel: 'Send',
        fields: [
          { key: 'audience', label: 'Audience', type: 'select', required: true, options: opts(['Students and guardians', 'Students only', 'Guardians only', 'Teachers only']), default: 'Students and guardians' },
          { key: 'title', label: 'Title', type: 'text', required: true },
          { key: 'message', label: 'Message', type: 'textarea', required: true },
        ],
      },
      run: (r, v, ctx) => ctx.toast(`“${v.title}” queued for ${r.name} · ${v.audience} (mock — nothing is sent)`, 'info'),
    },
  ],
  bulk: [
    {
      key: 'status',
      label: 'Set status',
      icon: 'flag',
      form: { title: 'Set status for selected classes', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Active', 'New', 'Inactive', 'Archived']) }] },
      run: (rows, v, ctx) => { ctx.updateMany(() => ({ status: v.status })); ctx.toast(`${rows.length} classes set to ${v.status}`); },
    },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import classes',
      icon: 'upload',
      form: { title: 'Import classes', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Grade XI,XI,Secondary,321', hint: 'One class per line: name, numeral, category, room. Existing numerals are skipped.' }] },
      run: (v, ctx) => {
        const rows = parseCsvRows(String(v.csv)).filter((r) => !/^name$/i.test(r[0]));
        const codes = new Set(ctx.rows.map((r) => r.numeral.toLowerCase()));
        let added = 0;
        let skipped = 0;
        for (const [name, numeral, category, roomNo] of rows) {
          const cat = ['Primary', 'Middle', 'Secondary'].find((c) => c.toLowerCase() === (category ?? '').toLowerCase());
          if (!name || !numeral || !cat || !roomNo || codes.has(numeral.toLowerCase())) { skipped += 1; continue; }
          codes.add(numeral.toLowerCase());
          ctx.create({ name, numeral, category: cat as ClassRecord['category'], classTeacherId: ctx.rows[0]?.classTeacherId ?? '', assistantTeacherId: '', roomNo, year: '2026-27', note: '', status: 'New' });
          added += 1;
        }
        ctx.toast(`${added} class${added === 1 ? '' : 'es'} imported${skipped ? `, ${skipped} skipped` : ''} — assign a class teacher next`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ================================== Classrooms ================================== */

const roomTone: Record<string, Tone> = { Available: 'success', Occupied: 'info', Maintenance: 'warning', Reserved: 'purple', Inactive: 'neutral' };
const BUILDINGS = ['A', 'B', 'C'];
const FLOORS = ['Ground', 'First', 'Second'];
const ROOM_TYPES = ['Classroom', 'Lecture Hall', 'Science Lab', 'Computer Lab', 'Auditorium', 'Studio', 'Sports Ground', 'Library'];
const roomStudents = (r: ClassroomRecord) => { const s = sectionInRoom(r.roomNo); return s ? studentsInSection(s.id).length : 0; };
const bookedPeriods = (r: ClassroomRecord) => countBy(snapshot<TimetableEntryRecord>('timetableEntries'), (e) => e.room === r.roomNo && (e.mode === 'Teaching' || e.mode === 'Lab Session'));

export const classroomsCfg: ResourceConfig<ClassroomRecord> = {
  entity: 'Classroom',
  collection: 'classrooms',
  searchPlaceholder: 'Search room, building, type…',
  searchText: (r) => `${r.name} ${r.roomNo} ${r.code} ${r.building} ${r.type} ${r.floor}`,
  code: (r) => `${r.code} · Room ${r.roomNo}`,
  title: (r) => r.name,
  subtitle: (r) => `${r.type} · Building ${r.building} · ${r.floor} floor`,
  status: (r) => ({ label: r.status, tone: roomTone[r.status] }),
  badges: (r) => r.facilities.slice(0, 3).map((f) => ({ label: f, tone: 'neutral' as Tone })),
  facts: [
    { label: 'Capacity', value: (r) => r.capacity },
    { label: 'Students', value: (r) => (roomStudents(r) ? roomStudents(r) : undefined) },
    { label: 'Seats left', value: (r) => (roomStudents(r) ? Math.max(0, r.capacity - roomStudents(r)) : undefined) },
    { label: 'Assigned class', value: (r) => { const s = sectionInRoom(r.roomNo); return s ? sectionLabel(s.id) : undefined; } },
    { label: 'Class teacher', value: (r) => { const s = sectionInRoom(r.roomNo); return s ? teacherName(s.classTeacherId) : undefined; } },
    { label: 'Periods booked', value: (r) => bookedPeriods(r) || undefined },
  ],
  progress: (r) => (roomStudents(r) ? { value: roomStudents(r), max: r.capacity, label: 'Seat occupancy', tone: seatTone(roomStudents(r), r.capacity) } : undefined),
  detail: [
    { title: 'Room', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Room no', value: (r) => r.roomNo }, { label: 'Building', value: (r) => r.building }, { label: 'Floor', value: (r) => r.floor }, { label: 'Type', value: (r) => r.type }, { label: 'Capacity', value: (r) => r.capacity }, { label: 'Academic year', value: (r) => r.year }] },
    { title: 'Facilities & equipment', items: [{ label: 'Facilities', value: (r) => r.facilities.join(', ') || 'None' }, { label: 'Equipment', value: (r) => r.equipment }] },
    { title: 'Use', items: [{ label: 'Assigned class', value: (r) => { const s = sectionInRoom(r.roomNo); return s ? sectionLabel(s.id) : 'Not a class room'; } }, { label: 'Timetable', value: (r) => `${bookedPeriods(r)} periods booked each week` }, { label: 'Last serviced', value: (r) => formatDate(r.lastService) }, { label: 'Note', value: (r) => r.note || '—' }] },
  ],
  stats: [
    { label: 'Rooms', value: (rows) => rows.length, icon: 'monitor' },
    { label: 'Available', value: (rows) => countBy(rows, (r) => r.status === 'Available'), tone: 'success', icon: 'check-circle' },
    { label: 'Occupied', value: (rows) => countBy(rows, (r) => r.status === 'Occupied'), tone: 'info', icon: 'users' },
    { label: 'Maintenance', value: (rows) => countBy(rows, (r) => r.status === 'Maintenance'), tone: 'warning', icon: 'tool' },
    { label: 'Total seats', value: (rows) => sum(rows, (r) => r.capacity), tone: 'purple', icon: 'grid' },
  ],
  views: [
    { key: 'all', label: 'All Rooms', match: () => true },
    ...(['Available', 'Occupied', 'Maintenance', 'Reserved', 'Inactive'] as const).map((s) => ({ key: s, label: s, match: (r: ClassroomRecord) => r.status === s })),
  ],
  filters: [
    { key: 'building', label: 'Building', options: opts(BUILDINGS), match: (r, v) => r.building === v },
    { key: 'floor', label: 'Floor', options: opts(FLOORS), match: (r, v) => r.floor === v },
    { key: 'type', label: 'Type', options: opts(ROOM_TYPES), match: (r, v) => r.type === v },
    { key: 'capacity', label: 'Capacity', single: true, options: opts(['Up to 25', '26–60', 'Over 60']), match: (r, v) => (v === 'Up to 25' ? r.capacity <= 25 : v === '26–60' ? r.capacity > 25 && r.capacity <= 60 : r.capacity > 60) },
    { key: 'status', label: 'Status', options: opts(['Available', 'Occupied', 'Maintenance', 'Reserved', 'Inactive']), match: (r, v) => r.status === v },
    { key: 'year', label: 'Academic year', options: opts(ACTIVE_YEARS), match: (r, v) => r.year === v },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'building', label: 'Building', compare: (a, b) => a.building.localeCompare(b.building) || a.roomNo.localeCompare(b.roomNo) },
    { key: 'capacity', label: 'Capacity (high to low)', compare: (a, b) => b.capacity - a.capacity },
    { key: 'students', label: 'Students (high to low)', compare: (a, b) => roomStudents(b) - roomStudents(a) },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
  ],
  form: [
    { key: 'name', label: 'Room Name', type: 'text', required: true },
    { key: 'roomNo', label: 'Room No', type: 'text', required: true },
    { key: 'building', label: 'Building', type: 'select', required: true, options: opts(BUILDINGS) },
    { key: 'floor', label: 'Floor', type: 'select', required: true, options: opts(FLOORS) },
    { key: 'type', label: 'Room Type', type: 'select', required: true, options: opts(ROOM_TYPES), default: 'Classroom' },
    { key: 'capacity', label: 'Capacity', type: 'number', required: true, min: 1, max: 1000 },
    { key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Available', 'Occupied', 'Maintenance', 'Reserved', 'Inactive']), default: 'Available' },
    { key: 'year', label: 'Academic Year', type: 'select', options: opts(ACTIVE_YEARS), default: '2026-27' },
    { key: 'facilities', label: 'Facilities', type: 'multiselect', options: opts(FACILITIES) },
    { key: 'equipment', label: 'Equipment', type: 'text' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.roomNo.toLowerCase() === String(v.roomNo).trim().toLowerCase()) ? { roomNo: 'This room number is already used' } : {}),
    ...(existing && sectionInRoom(existing.roomNo) && Number(v.capacity) < roomStudents(existing) ? { capacity: `${roomStudents(existing)} students are seated here; capacity cannot be lower.` } : {}),
  }),
  prepare: (_v, { existing, rows }) => ({ code: existing?.code ?? nextNo('R', rows.map((r) => r.code), 6), lastService: existing?.lastService ?? todayISO() }),
  canDeleteRecord: (r) => {
    const sec = sectionInRoom(r.roomNo);
    if (sec) return `${r.name} is the home room of ${sectionLabel(sec.id)}. Reassign that section first.`;
    const used = bookedPeriods(r);
    return used ? `${r.name} has ${used} timetable period(s). Remove or move them first.` : null;
  },
  actions: [
    {
      key: 'maintenance',
      label: 'Mark for maintenance',
      icon: 'tool',
      visible: (r) => r.status !== 'Maintenance',
      form: { title: 'Mark for maintenance', submitLabel: 'Mark', fields: [{ key: 'note', label: 'What needs doing?', type: 'textarea', required: true }] },
      run: (_r, v, ctx) => { ctx.update({ status: 'Maintenance', note: v.note }); ctx.toast('Room marked for maintenance', 'info'); },
    },
    {
      key: 'available',
      label: 'Mark available',
      icon: 'check-circle',
      tone: 'success',
      visible: (r) => r.status === 'Maintenance' || r.status === 'Reserved' || r.status === 'Inactive',
      run: (r, _v, ctx) => { ctx.update({ status: sectionInRoom(r.roomNo) ? 'Occupied' : 'Available', lastService: r.status === 'Maintenance' ? todayISO() : r.lastService, note: '' }); ctx.toast('Room is available again'); },
    },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import rooms',
      icon: 'upload',
      form: {
        title: 'Import classrooms',
        submitLabel: 'Import',
        fields: [
          { key: 'mode', label: 'Import mode', type: 'select', required: true, options: opts(['Create only', 'Update only', 'Create and update']), default: 'Create only' },
          { key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Lovelace Hall,321,C,Second,Classroom,20', hint: 'name, roomNo, building, floor, type, capacity. Rooms are matched by roomNo.' },
        ],
      },
      run: (v, ctx) => {
        const rows = parseCsvRows(String(v.csv)).filter((r) => !/^name$/i.test(r[0]));
        const store = repo<ClassroomRecord>('classrooms');
        let created = 0;
        let updated = 0;
        let skipped = 0;
        for (const [name, roomNo, building, floor, type, capacity] of rows) {
          const cap = Number(capacity);
          if (!name || !roomNo || !BUILDINGS.includes(building) || !FLOORS.includes(floor) || !ROOM_TYPES.includes(type) || !(cap > 0)) { skipped += 1; continue; }
          const have = store.list().find((r) => r.roomNo === roomNo);
          if (have && v.mode !== 'Create only') { store.update(have.id, { name, building, floor, type, capacity: cap }); updated += 1; }
          else if (!have && v.mode !== 'Update only') {
            store.create({ code: nextNo('R', store.list().map((r) => r.code), 6), name, roomNo, building, floor, type, capacity: cap, status: 'Available', year: '2026-27', facilities: [], equipment: '', lastService: todayISO(), note: '' });
            created += 1;
          } else skipped += 1;
        }
        ctx.toast(`${created} created, ${updated} updated${skipped ? `, ${skipped} skipped` : ''}`, created + updated ? 'success' : 'error');
      },
    },
  ],
};

/* ================================== Sections ================================== */

const sectionTone: Record<string, Tone> = { Active: 'success', Full: 'warning', Inactive: 'neutral', Archived: 'neutral' };

export const sectionsCfg: ResourceConfig<SectionRecord> = {
  entity: 'Section',
  collection: 'sections',
  searchPlaceholder: 'Search section, class, teacher, room…',
  searchText: (r) => `${sectionLabel(r.id)} ${teacherName(r.classTeacherId)} ${r.roomNo} ${r.shift} ${r.medium}`,
  code: (r) => `Room ${r.roomNo} · ${r.floor} floor`,
  title: (r) => sectionLabel(r.id),
  subtitle: (r) => `Class teacher: ${teacherName(r.classTeacherId)}`,
  status: (r) => ({ label: sectionState(r), tone: sectionTone[sectionState(r)] }),
  badges: (r) => [{ label: r.shift, tone: r.shift === 'Morning' ? 'info' : 'purple' }, { label: r.medium, tone: 'neutral' }],
  facts: [
    { label: 'Students', value: (r) => `${studentsInSection(r.id).length} / ${r.capacity}` },
    { label: 'Seats left', value: (r) => Math.max(0, r.capacity - studentsInSection(r.id).length) },
    { label: 'Boys / Girls', value: (r) => `${gender(studentsInSection(r.id), 'Male')} / ${gender(studentsInSection(r.id), 'Female')}` },
    { label: 'Periods scheduled', value: (r) => timetableOfSection(r.id).length || 'None yet' },
  ],
  progress: (r) => ({ value: studentsInSection(r.id).length, max: r.capacity, label: 'Seat meter', tone: seatTone(studentsInSection(r.id).length, r.capacity) }),
  detail: [
    { title: 'Section', items: [{ label: 'Class', value: (r) => getClass(r.classId)?.name }, { label: 'Section', value: (r) => r.name }, { label: 'Academic year', value: (r) => r.year }, { label: 'Class teacher', value: (r) => teacherName(r.classTeacherId) }, { label: 'Room', value: (r) => r.roomNo }, { label: 'Floor', value: (r) => r.floor }, { label: 'Shift', value: (r) => r.shift }, { label: 'Medium', value: (r) => r.medium }, { label: 'Status', value: (r) => sectionState(r) }, { label: 'Note', value: (r) => r.note || (isFull({ ...r } as SectionRecord) ? 'Section at full capacity — no new admissions.' : '—') }] },
    { title: 'Strength', items: [{ label: 'Students', value: (r) => studentsInSection(r.id).length }, { label: 'Capacity', value: (r) => r.capacity }, { label: 'Seats left', value: (r) => Math.max(0, r.capacity - studentsInSection(r.id).length) }, { label: 'Boys', value: (r) => gender(studentsInSection(r.id), 'Male') }, { label: 'Girls', value: (r) => gender(studentsInSection(r.id), 'Female') }] },
    { title: 'Subjects & timetable', items: [{ label: 'Subjects', value: (r) => { const m = snapshot<ClassSubjectRecord>('classSubjects').filter((x) => x.classId === r.classId); return m.map((x) => subjectName(x.subjectId)).join(', ') || '—'; } }, { label: 'Periods scheduled', value: (r) => `${timetableOfSection(r.id).length} per week` }] },
  ],
  stats: [
    { label: 'Sections', value: (rows) => rows.length, icon: 'columns' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Full', value: (rows) => countBy(rows, isFull), tone: 'warning', icon: 'users' },
    { label: 'Students', value: (rows) => sum(rows, (r) => studentsInSection(r.id).length), tone: 'info', icon: 'user' },
    { label: 'Seats left', value: (rows) => sum(rows, (r) => Math.max(0, r.capacity - studentsInSection(r.id).length)), tone: 'purple', icon: 'check-square' },
  ],
  views: [
    { key: 'all', label: 'All Sections', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'full', label: 'Full', match: isFull },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
    { key: 'archived', label: 'Archived', match: (r) => r.status === 'Archived' },
  ],
  filters: [
    { key: 'year', label: 'Year', options: opts(ACTIVE_YEARS), match: (r, v) => r.year === v },
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => r.classId === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => r.name === v },
    { key: 'teacher', label: 'Class teacher', options: teacherOptionList, match: (r, v) => r.classTeacherId === v },
    { key: 'shift', label: 'Shift', options: opts(['Morning', 'Afternoon']), match: (r, v) => r.shift === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'Full', 'Inactive', 'Archived']), match: (r, v) => sectionState(r) === v },
  ],
  sorts: [
    { key: 'name', label: 'Class & section', compare: (a, b) => a.classId.localeCompare(b.classId) || a.name.localeCompare(b.name) },
    { key: 'teacher', label: 'Class teacher (A–Z)', compare: (a, b) => teacherName(a.classTeacherId).localeCompare(teacherName(b.classTeacherId)) },
    { key: 'students', label: 'Students (high to low)', compare: (a, b) => studentsInSection(b.id).length - studentsInSection(a.id).length },
    { key: 'capacity', label: 'Capacity (high to low)', compare: (a, b) => b.capacity - a.capacity },
    { key: 'status', label: 'Status', compare: (a, b) => sectionState(a).localeCompare(sectionState(b)) },
  ],
  form: [
    { key: 'classId', label: 'Class', type: 'select', required: true, optionsFrom: { collection: 'classes', label: (c: ClassRecord) => c.name } },
    { key: 'name', label: 'Section Name', type: 'text', required: true, placeholder: 'e.g. C' },
    { key: 'classTeacherId', label: 'Class Teacher', type: 'select', required: true, optionsFrom: teacherOpt },
    { key: 'roomNo', label: 'Room', type: 'select', required: true, optionsFrom: { collection: 'classrooms', label: (r: ClassroomRecord) => `${r.name} (${r.roomNo})`, hint: (r: ClassroomRecord) => r.type, value: (r: ClassroomRecord) => r.roomNo, filter: (r: ClassroomRecord) => r.type === 'Classroom' } },
    { key: 'floor', label: 'Floor', type: 'select', options: opts(FLOORS), default: 'Ground' },
    { key: 'shift', label: 'Shift', type: 'select', required: true, options: opts(['Morning', 'Afternoon']), default: 'Morning' },
    { key: 'medium', label: 'Medium', type: 'select', required: true, options: opts(['English', 'Hindi', 'Tamil']), default: 'English' },
    { key: 'capacity', label: 'Capacity', type: 'number', required: true, min: 1, max: 60, default: 15 },
    { key: 'year', label: 'Academic Year', type: 'select', options: opts(ACTIVE_YEARS), default: '2026-27' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Active', 'Inactive', 'Archived']), default: 'Active' },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => {
    const taken = rows.find((s) => s.id !== existing?.id && s.roomNo === v.roomNo);
    return {
      ...(rows.some((s) => s.id !== existing?.id && s.classId === v.classId && s.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'This class already has a section with that name' } : {}),
      ...(taken ? { roomNo: `Room already belongs to ${sectionLabel(taken.id)}` } : {}),
      ...(existing && Number(v.capacity) < studentsInSection(existing.id).length ? { capacity: `${studentsInSection(existing.id).length} students are enrolled; capacity cannot be lower.` } : {}),
    };
  },
  canDeleteRecord: (r) => {
    const n = studentsInSection(r.id).length;
    const all = allStudents().filter((s) => s.sectionId === r.id).length;
    return n || all ? `${sectionLabel(r.id)} still has ${all} student record(s). Move them first, or set the section to Archived.` : null;
  },
  pageActions: [
    {
      key: 'import',
      label: 'Import sections',
      icon: 'upload',
      form: { title: 'Import sections', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Grade X,C,321,Morning,English,15', hint: 'class name, section, roomNo, shift, medium, capacity. Existing class + section pairs are skipped.' }] },
      run: (v, ctx) => {
        const rows = parseCsvRows(String(v.csv)).filter((r) => !/^class/i.test(r[0]));
        const classes = snapshot<ClassRecord>('classes');
        let added = 0;
        let skipped = 0;
        for (const [className, name, roomNo, shift, medium, capacity] of rows) {
          const cls = classes.find((c) => c.name.toLowerCase() === (className ?? '').toLowerCase());
          const cap = Number(capacity);
          if (!cls || !name || !roomNo || !['Morning', 'Afternoon'].includes(shift) || !(cap > 0) || ctx.rows.some((s) => s.classId === cls.id && s.name === name) || ctx.rows.some((s) => s.roomNo === roomNo)) { skipped += 1; continue; }
          ctx.create({ classId: cls.id, name, classTeacherId: cls.classTeacherId, roomNo, floor: 'Ground', shift: shift as SectionRecord['shift'], medium: medium || 'English', capacity: cap, year: '2026-27', note: '', status: 'Active' });
          added += 1;
        }
        ctx.toast(`${added} section${added === 1 ? '' : 's'} imported${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ================================== Subjects ================================== */

const subjectTone: Record<string, Tone> = { Active: 'success', Published: 'info', Draft: 'warning', Archived: 'neutral' };
const CATEGORIES: SubjectCategory[] = ['Core', 'Languages', 'Science', 'Humanities', 'Technology', 'Co-curricular'];
const subjectClasses = (s: SubjectRecord) => mappingsOfSubject(s.id).map((m) => getClass(m.classId)?.numeral ?? '').filter(Boolean);

export const subjectsCfg: ResourceConfig<SubjectRecord> = {
  entity: 'Subject',
  collection: 'subjects',
  searchPlaceholder: 'Search subject, code, teacher…',
  searchText: (r) => `${r.name} ${r.code} ${r.category} ${r.department} ${teacherName(r.teacherId)}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.category} · ${r.department}`,
  status: (r) => ({ label: r.status, tone: subjectTone[r.status] }),
  badges: (r) => [{ label: r.type, tone: 'primary' }],
  facts: [
    { label: 'Lead teacher', value: (r) => teacherName(r.teacherId) },
    { label: 'Taught in', value: (r) => (subjectClasses(r).length ? `Grades ${subjectClasses(r).join(', ')}` : 'No class yet') },
    { label: 'Periods / week', value: (r) => r.periodsPerWeek },
    { label: 'Credits', value: (r) => r.credits },
    { label: 'Units · Lessons', value: (r) => `${r.units} · ${r.lessons}` },
    { label: 'Assignments · Exams', value: (r) => `${r.assignments} · ${r.exams}` },
    { label: 'Resources', value: (r) => r.resources },
    { label: 'Updated', value: (r) => formatDate(r.updatedOn) },
  ],
  detail: [
    { title: 'Subject', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Category', value: (r) => r.category }, { label: 'Department', value: (r) => r.department }, { label: 'Type', value: (r) => r.type }, { label: 'Credits', value: (r) => r.credits }, { label: 'Lead teacher', value: (r) => teacherName(r.teacherId) }, { label: 'Description', value: (r) => r.description }] },
    { title: 'Marks scheme', items: [{ label: 'Periods per week (default)', value: (r) => r.periodsPerWeek }, { label: 'Exam marks', value: (r) => r.examMarks }, { label: 'Internal marks', value: (r) => r.internalMarks }, { label: 'Pass marks', value: (r) => r.passMarks }] },
    { title: 'Curriculum', items: [{ label: 'Units', value: (r) => r.units }, { label: 'Lessons', value: (r) => r.lessons }, { label: 'Assignments', value: (r) => r.assignments }, { label: 'Exams', value: (r) => r.exams }, { label: 'Resources', value: (r) => r.resources }, { label: 'Study materials', value: (r) => countBy(snapshot<StudyMaterialRecord>('studyMaterials'), (m) => m.subjectId === r.id) }] },
    { title: 'Classes', items: [{ label: 'Taught in', value: (r) => mappingsOfSubject(r.id).map((m) => `${getClass(m.classId)?.name} (${m.periodsPerWeek}/wk · ${teacherName(m.teacherId)})`).join('; ') || 'Not assigned to any class' }] },
  ],
  stats: [
    { label: 'Subjects', value: (rows) => rows.length, icon: 'book' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active' || r.status === 'Published'), tone: 'success', icon: 'check-circle' },
    { label: 'Draft', value: (rows) => countBy(rows, (r) => r.status === 'Draft'), tone: 'warning', icon: 'edit-3' },
    { label: 'Credits', value: (rows) => sum(rows, (r) => r.credits), tone: 'purple', icon: 'award' },
  ],
  views: [
    { key: 'all', label: 'All Subjects', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'published', label: 'Published', match: (r) => r.status === 'Published' },
    { key: 'draft', label: 'Draft', match: (r) => r.status === 'Draft' },
    { key: 'archived', label: 'Archived', match: (r) => r.status === 'Archived' },
  ],
  filters: [
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => mappingsOfSubject(r.id).some((m) => m.classId === v) },
    { key: 'category', label: 'Category', options: opts(CATEGORIES), match: (r, v) => r.category === v },
    { key: 'department', label: 'Department', options: () => [...new Set(snapshot<SubjectRecord>('subjects').map((s) => s.department))].map((d) => ({ label: d, value: d })), match: (r, v) => r.department === v },
    { key: 'teacher', label: 'Teacher', options: teacherOptionList, match: (r, v) => r.teacherId === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'Published', 'Draft', 'Archived']), match: (r, v) => r.status === v },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'category', label: 'Category', compare: (a, b) => a.category.localeCompare(b.category) },
    { key: 'teacher', label: 'Teacher (A–Z)', compare: (a, b) => teacherName(a.teacherId).localeCompare(teacherName(b.teacherId)) },
    { key: 'periods', label: 'Periods / week', compare: (a, b) => b.periodsPerWeek - a.periodsPerWeek },
    { key: 'credits', label: 'Credits', compare: (a, b) => b.credits - a.credits },
    { key: 'units', label: 'Units', compare: (a, b) => b.units - a.units },
    { key: 'recent', label: 'Recently updated', compare: (a, b) => b.updatedOn.localeCompare(a.updatedOn) },
  ],
  form: [
    { key: 'name', label: 'Name', type: 'text', required: true },
    { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. ENG-101' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: opts(CATEGORIES) },
    { key: 'department', label: 'Department', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: opts(['Theory', 'Practical', 'Both']), default: 'Theory' },
    { key: 'teacherId', label: 'Lead Teacher', type: 'select', required: true, optionsFrom: teacherOpt },
    { key: 'credits', label: 'Credits (optional)', type: 'number', min: 0, max: 10, default: 3 },
    { key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Active', 'Published', 'Draft', 'Archived']), default: 'Draft' },
    { key: 'periodsPerWeek', label: 'Periods / week', type: 'number', required: true, min: 1, max: 12, default: 4, section: 'Marks scheme (defaults for new class assignments)' },
    { key: 'examMarks', label: 'Exam marks', type: 'number', required: true, min: 0, max: 200, default: 80 },
    { key: 'internalMarks', label: 'Internal marks', type: 'number', required: true, min: 0, max: 200, default: 20 },
    { key: 'passMarks', label: 'Pass marks', type: 'number', required: true, min: 0, max: 200, default: 33 },
    { key: 'units', label: 'Units', type: 'number', min: 0, default: 0, section: 'Curriculum' },
    { key: 'lessons', label: 'Lessons', type: 'number', min: 0, default: 0 },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This subject code is already used' } : {}),
    ...(rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A subject with this name already exists' } : {}),
    ...(Number(v.passMarks) > Number(v.examMarks) + Number(v.internalMarks) ? { passMarks: 'Pass marks cannot exceed exam + internal marks' } : {}),
  }),
  prepare: (_v, { existing }) => ({ updatedOn: todayISO(), assignments: existing?.assignments ?? 0, exams: existing?.exams ?? 0, resources: existing?.resources ?? 0 }),
  canDeleteRecord: (r) => {
    const n = mappingsOfSubject(r.id).length;
    const t = countBy(snapshot<TimetableEntryRecord>('timetableEntries'), (e) => e.subjectId === r.id);
    return n || t ? `${r.name} is assigned to ${n} class(es) and has ${t} timetable period(s). Remove those first, or archive the subject instead.` : null;
  },
  actions: [
    { key: 'publish', label: 'Publish', icon: 'send', visible: (r) => r.status === 'Draft', run: (_r, _v, ctx) => { ctx.update({ status: 'Published', updatedOn: todayISO() }); ctx.toast('Subject published'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status !== 'Archived', confirm: 'Archived subjects are left out of new timetables. Existing class assignments stay.', run: (_r, _v, ctx) => { ctx.update({ status: 'Archived', updatedOn: todayISO() }); ctx.toast('Subject archived', 'info'); } },
    {
      key: 'classes',
      label: 'Assign to classes',
      icon: 'plus-square',
      visible: (r) => r.status !== 'Archived',
      form: { title: 'Assign to classes', submitLabel: 'Assign', fields: [{ key: 'classIds', label: 'Classes', type: 'multiselect', required: true, optionsFrom: { collection: 'classes', label: (c: ClassRecord) => c.name } }] },
      run: (r, v, ctx) => {
        const maps = repo<ClassSubjectRecord>('classSubjects');
        let added = 0;
        for (const classId of v.classIds as string[]) {
          if (maps.list().some((m) => m.classId === classId && m.subjectId === r.id)) continue;
          maps.create({ id: `cs-${classId}-${r.id}`, classId, subjectId: r.id, teacherId: r.teacherId, periodsPerWeek: r.periodsPerWeek, examMarks: r.examMarks, internalMarks: r.internalMarks, passMarks: r.passMarks, isElective: false, term: 'Annual' });
          added += 1;
        }
        ctx.toast(added ? `${r.name} assigned to ${added} class${added > 1 ? 'es' : ''}` : 'Already assigned to all of those classes', added ? 'success' : 'info');
      },
    },
  ],
};

/* ============================== Study materials ============================== */

const materialTone: Record<string, Tone> = { Published: 'success', Draft: 'warning', Archived: 'neutral' };
const typeTone: Record<MaterialType, Tone> = { PDF: 'danger', PPT: 'warning', DOC: 'primary', Video: 'info', Link: 'success', Audio: 'purple' };
const MATERIAL_TYPES: MaterialType[] = ['PDF', 'PPT', 'DOC', 'Video', 'Link', 'Audio'];
const monthOf = (iso: string) => iso.slice(0, 7);
const materialClass = (m: StudyMaterialRecord) => `${getClass(m.classId)?.numeral ?? ''}${m.sectionId ? `-${getSection(m.sectionId)?.name}` : ''}`;
const subjectsOfClass = (classId?: string) => mappingsOfClass(classId ?? '').map((m) => m.subjectId);

export const materialsCfg: ResourceConfig<StudyMaterialRecord> = {
  entity: 'Material',
  collection: 'studyMaterials',
  rowScope: (r, user) => {
    // Students and parents only see published materials for their own class.
    if (user?.role !== 'student' && user?.role !== 'parent') return true;
    if (r.status !== 'Published') return false;
    const kids = user.role === 'student' ? [user.studentId] : user.childIds ?? [];
    return kids.some((id) => allStudents().find((s) => s.id === id)?.classId === r.classId);
  },
  searchPlaceholder: 'Search title, subject, chapter…',
  searchText: (r) => `${r.title} ${r.code} ${subjectName(r.subjectId)} ${r.chapter} ${teacherName(r.teacherId)} ${r.type}`,
  code: (r) => r.code,
  title: (r) => r.title,
  subtitle: (r) => `${subjectName(r.subjectId)} · Class ${materialClass(r)}`,
  status: (r) => ({ label: r.status, tone: materialTone[r.status] }),
  badges: (r) => [{ label: r.type, tone: typeTone[r.type] }],
  facts: [
    { label: 'Chapter', value: (r) => r.chapter },
    { label: 'Uploaded by', value: (r) => teacherName(r.teacherId) },
    { label: 'Uploaded', value: (r) => formatDate(r.uploadedOn) },
    { label: 'Downloads', value: (r) => r.downloads },
    { label: 'Size', value: (r) => r.size },
  ],
  detail: [
    { title: 'Material', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Title', value: (r) => r.title }, { label: 'Type', value: (r) => r.type }, { label: 'File / link', value: (r) => r.fileName }, { label: 'Size', value: (r) => r.size }, { label: 'Chapter', value: (r) => r.chapter }, { label: 'Description', value: (r) => r.description }] },
    { title: 'Academic', items: [{ label: 'Subject', value: (r) => subjectName(r.subjectId) }, { label: 'Class', value: (r) => getClass(r.classId)?.name }, { label: 'Section', value: (r) => (r.sectionId ? getSection(r.sectionId)?.name : 'All sections') }, { label: 'Academic year', value: (r) => r.year }] },
    { title: 'Engagement', items: [{ label: 'Uploaded by', value: (r) => teacherName(r.teacherId) }, { label: 'Uploaded on', value: (r) => formatDate(r.uploadedOn) }, { label: 'Downloads', value: (r) => r.downloads }] },
  ],
  stats: [
    { label: 'Materials', value: (rows) => rows.length, icon: 'file-text' },
    { label: 'Published', value: (rows) => countBy(rows, (r) => r.status === 'Published'), tone: 'success', icon: 'check-circle' },
    { label: 'Draft', value: (rows) => countBy(rows, (r) => r.status === 'Draft'), tone: 'warning', icon: 'edit-3' },
    { label: 'Downloads', value: (rows) => sum(rows, (r) => r.downloads), tone: 'info', icon: 'download' },
  ],
  views: [
    { key: 'all', label: 'All Materials', match: () => true },
    { key: 'Published', label: 'Published', match: (r) => r.status === 'Published' },
    { key: 'Draft', label: 'Draft', match: (r) => r.status === 'Draft' },
    { key: 'Archived', label: 'Archived', match: (r) => r.status === 'Archived' },
  ],
  filters: [
    { key: 'year', label: 'Academic year', options: opts(ACTIVE_YEARS), match: (r, v) => r.year === v },
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => r.classId === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => getSection(r.sectionId)?.name === v },
    { key: 'subject', label: 'Subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => r.subjectId === v },
    { key: 'type', label: 'Material type', options: opts(MATERIAL_TYPES), match: (r, v) => r.type === v },
    { key: 'teacher', label: 'Uploaded by', options: teacherOptionList, match: (r, v) => r.teacherId === v },
    { key: 'status', label: 'Status', options: opts(['Published', 'Draft', 'Archived']), match: (r, v) => r.status === v },
    { key: 'month', label: 'Upload month', options: () => [...new Set(snapshot<StudyMaterialRecord>('studyMaterials').map((m) => monthOf(m.uploadedOn)))].sort().reverse().map((m) => ({ label: m, value: m })), match: (r, v) => monthOf(r.uploadedOn) === v },
  ],
  sorts: [
    { key: 'recent', label: 'Newest first', compare: (a, b) => b.uploadedOn.localeCompare(a.uploadedOn) },
    { key: 'name', label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
    { key: 'subject', label: 'Subject', compare: (a, b) => subjectName(a.subjectId).localeCompare(subjectName(b.subjectId)) },
    { key: 'teacher', label: 'Uploaded by (A–Z)', compare: (a, b) => teacherName(a.teacherId).localeCompare(teacherName(b.teacherId)) },
    { key: 'downloads', label: 'Most downloaded', compare: (a, b) => b.downloads - a.downloads },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
  ],
  form: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'classId', label: 'Class', type: 'select', required: true, optionsFrom: { collection: 'classes', label: (c: ClassRecord) => c.name }, onChange: () => ({ sectionId: '', subjectId: '' }) },
    { key: 'sectionId', label: 'Section (optional)', type: 'select', optionsFrom: { collection: 'sections', label: (s: SectionRecord) => `Section ${s.name}`, filter: (s: SectionRecord, vals) => !vals.classId || s.classId === vals.classId }, hint: 'Leave empty to share with every section.' },
    { key: 'subjectId', label: 'Subject', type: 'select', required: true, optionsFrom: { collection: 'subjects', label: (s: SubjectRecord) => s.name, hint: (s: SubjectRecord) => s.code, filter: (s: SubjectRecord, vals) => !vals.classId || subjectsOfClass(vals.classId).includes(s.id) } },
    { key: 'type', label: 'Material Type', type: 'select', required: true, options: opts(MATERIAL_TYPES), default: 'PDF' },
    { key: 'fileName', label: 'File name or link', type: 'text', required: true, hint: 'File picking is not available in the mock app; enter the file name, or a URL for Link materials.' },
    { key: 'size', label: 'Size', type: 'text', placeholder: 'e.g. 2.4 MB', hidden: (v) => v.type === 'Link' },
    { key: 'chapter', label: 'Chapter', type: 'text', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'status', label: 'Visibility', type: 'select', required: true, options: opts(['Published', 'Draft']), default: 'Draft', hint: 'Published materials are visible to students and guardians.' },
  ],
  validate: (v) => ({
    ...(v.type === 'Link' && !/^https?:\/\/\S+$/i.test(String(v.fileName).trim()) ? { fileName: 'Enter a link starting with http:// or https://' } : {}),
  }),
  prepare: (v, { existing, rows, user }) => ({
    code: existing?.code ?? nextNo('SM', rows.map((r) => r.code), 6),
    teacherId: existing?.teacherId ?? user?.teacherId ?? subjectOf(v.subjectId)?.teacherId ?? '',
    uploadedOn: existing?.uploadedOn ?? todayISO(),
    downloads: existing?.downloads ?? 0,
    size: v.type === 'Link' ? 'External resource' : v.size || existing?.size || '—',
    year: existing?.year ?? '2026-27',
  }),
  actions: [
    { key: 'download', label: 'Download', icon: 'download', manage: false, visible: (r) => r.type !== 'Link', run: (r, _v, ctx) => { ctx.update({ downloads: r.downloads + 1 }); ctx.toast(`Downloading ${r.fileName} (mock — no file is saved)`, 'info'); } },
    { key: 'open', label: 'Open link', icon: 'external-link', manage: false, visible: (r) => r.type === 'Link', run: (r, _v, ctx) => { ctx.update({ downloads: r.downloads + 1 }); ctx.toast(`Opening ${r.fileName} (mock)`, 'info'); } },
    { key: 'publish', label: 'Publish', icon: 'send', visible: (r) => r.status === 'Draft', run: (_r, _v, ctx) => { ctx.update({ status: 'Published' }); ctx.toast('Material published'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status !== 'Archived', confirm: 'Archived materials are hidden from students and guardians.', run: (_r, _v, ctx) => { ctx.update({ status: 'Archived' }); ctx.toast('Material archived', 'info'); } },
  ],
  bulk: [
    { key: 'publish', label: 'Publish', icon: 'send', run: (rows, _v, ctx) => { ctx.updateMany((r) => (r.status === 'Archived' ? {} : { status: 'Published' as const })); ctx.toast(`${rows.filter((r) => r.status !== 'Archived').length} materials published`); } },
    { key: 'archive', label: 'Archive', icon: 'archive', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ status: 'Archived' as const })); ctx.toast(`${rows.length} materials archived`, 'info'); } },
  ],
};
