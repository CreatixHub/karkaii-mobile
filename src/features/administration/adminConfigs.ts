import { repo, snapshot } from '@/core/store/store';
import { formatDate, formatTime, todayISO } from '@/core/utils/date';
import {
  EVENT_AUDIENCES,
  EVENT_CATEGORIES,
  VENUES,
  type AcademicYearRecord,
  type CampusRecord,
  type EventRecord,
  type SchoolProfileRecord,
} from '@/data/seed/administration';
import type { StaffRecord, TeacherRecord } from '@/data/seed/master';
import type { UserRecord } from '@/data/seed/peopleAdmin';
import { opts } from '@/features/academic/helpers';
import type { AuditRecord } from '@/features/common/audit';
import { countBy } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import { campusUsage, eventState, eventVisible, isRegistered, registerBlockers, registrantRole, spotsLeft, venueConflict, yearProblems, yearState, yearUsage, type EventState, type YearState } from './adminLogic';

const clip = (s: string, n = 110) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const phoneOk = (p: string) => p.replace(/\D/g, '').length >= 10;
const MANAGERS: string[] = ['admin', 'teacher'];

/* ------------------------------------------- Events ------------------------------------------- */

const eventTone: Record<EventState, Tone> = { Cancelled: 'danger', Completed: 'neutral', Ongoing: 'success', 'Invite Only': 'purple', 'Registration Closed': 'warning', Full: 'danger', 'Closing Soon': 'warning', Open: 'success' };
const EVENT_STATES: EventState[] = ['Open', 'Closing Soon', 'Full', 'Invite Only', 'Registration Closed', 'Ongoing', 'Completed', 'Cancelled'];
const when = (e: EventRecord) => `${formatDate(e.date)} · ${formatTime(e.startTime)} – ${formatTime(e.endTime)}`;
const seats = (e: EventRecord) => (e.capacity > 0 ? `${e.registrations.length} of ${e.capacity} seats taken` : `${e.registrations.length} registered`);

export const eventsCfg: ResourceConfig<EventRecord> = {
  entity: 'Event',
  collection: 'events',
  manageRoles: ['admin', 'teacher'],
  auditEntity: 'event',
  searchPlaceholder: 'Search event, venue, organiser…',
  rowScope: (r, user) => eventVisible(r, user),
  searchText: (r) => `${r.title} ${r.description} ${r.venue} ${r.organizer} ${r.category}`,
  code: (r) => r.category,
  title: (r) => r.title,
  subtitle: (r) => `${r.venue} · ${r.organizer}`,
  status: (r) => ({ label: eventState(r), tone: eventTone[eventState(r)] }),
  badges: (r) => [{ label: r.audience === 'All' ? 'Everyone' : r.audience, tone: 'primary' }, { label: seats(r), tone: 'neutral' }],
  facts: [
    { label: 'When', value: (r) => when(r) },
    { label: 'About', value: (r) => clip(r.description) },
    { label: 'Register by', value: (r) => (r.inviteOnly ? 'By invitation' : formatDate(r.deadline)) },
    { label: 'Seats left', value: (r) => { const s = spotsLeft(r); return s === null ? undefined : s; } },
  ],
  detail: [
    { title: 'Event', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Status', value: (r) => eventState(r) }, { label: 'About', value: (r) => r.description }, { label: 'Organiser', value: (r) => r.organizer }] },
    { title: 'Time and place', items: [{ label: 'Date', value: (r) => formatDate(r.date) }, { label: 'Time', value: (r) => `${formatTime(r.startTime)} – ${formatTime(r.endTime)}` }, { label: 'Venue', value: (r) => r.venue }] },
    { title: 'Registration', items: [{ label: 'For', value: (r) => (r.audience === 'All' ? 'Everyone' : r.audience) }, { label: 'Open to', value: (r) => (r.inviteOnly ? 'Invited people only' : 'Anyone in the audience') }, { label: 'Register by', value: (r) => formatDate(r.deadline) }, { label: 'Seats', value: (r) => (r.capacity > 0 ? `${r.registrations.length} of ${r.capacity}` : `${r.registrations.length} (no limit)`) }, { label: 'Attendees', value: (r) => { const byRole = new Map<string, number>(); r.registrations.forEach((x) => byRole.set(x.role, (byRole.get(x.role) ?? 0) + 1)); return [...byRole].map(([k, n]) => `${n} ${k.toLowerCase()}${n === 1 ? '' : 's'}`).join(', ') || 'None yet'; } }] },
  ],
  stats: [
    { label: 'Events', value: (rows) => rows.length, icon: 'calendar' },
    { label: 'Open for registration', value: (rows) => countBy(rows, (r) => ['Open', 'Closing Soon'].includes(eventState(r))), tone: 'success', icon: 'user-plus' },
    { label: 'Closing soon', value: (rows) => countBy(rows, (r) => eventState(r) === 'Closing Soon'), tone: 'warning', icon: 'clock' },
    { label: 'Full', value: (rows) => countBy(rows, (r) => eventState(r) === 'Full'), tone: 'danger', icon: 'users' },
    { label: 'Total registrations', value: (rows) => rows.filter((r) => !r.cancelled).reduce((n, r) => n + r.registrations.length, 0), tone: 'primary', icon: 'check-square' },
  ],
  views: [
    { key: 'upcoming', label: 'Upcoming', match: (r) => !['Completed', 'Cancelled'].includes(eventState(r)) },
    { key: 'past', label: 'Past', match: (r) => eventState(r) === 'Completed' },
    { key: 'cancelled', label: 'Cancelled', match: (r) => r.cancelled },
    { key: 'all', label: 'All', match: () => true },
  ],
  filters: [
    { key: 'category', label: 'Category', options: opts(EVENT_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'status', label: 'Status', options: opts(EVENT_STATES), match: (r, v) => eventState(r) === v },
    { key: 'audience', label: 'For', options: opts(EVENT_AUDIENCES), match: (r, v) => r.audience === v },
    { key: 'venue', label: 'Venue', options: opts(VENUES), match: (r, v) => r.venue === v },
  ],
  sorts: [
    { key: 'soonest', label: 'Soonest first', compare: (a, b) => `${a.date}T${a.startTime}`.localeCompare(`${b.date}T${b.startTime}`) },
    { key: 'latest', label: 'Latest first', compare: (a, b) => `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`) },
    { key: 'popular', label: 'Most registered', compare: (a, b) => b.registrations.length - a.registrations.length },
  ],
  form: [
    { key: 'title', label: 'Event Title', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: EVENT_CATEGORIES, default: 'Academic' },
    { key: 'description', label: 'Description', type: 'textarea', required: true },
    { key: 'date', label: 'Date', type: 'date', required: true, section: 'Time and place' },
    { key: 'startTime', label: 'Starts', type: 'time', required: true, default: '10:00' },
    { key: 'endTime', label: 'Ends', type: 'time', required: true, default: '12:00' },
    { key: 'venue', label: 'Venue', type: 'select', required: true, options: VENUES, default: VENUES[0] },
    { key: 'organizer', label: 'Organiser', type: 'text', required: true },
    { key: 'audience', label: 'Who Is It For', type: 'select', required: true, options: EVENT_AUDIENCES, default: 'All', section: 'Registration' },
    { key: 'inviteOnly', label: 'By invitation only', type: 'switch', default: false, hint: 'Only the office can add attendees' },
    { key: 'deadline', label: 'Register By', type: 'date', hidden: (v) => !!v.inviteOnly },
    { key: 'capacity', label: 'Seats (0 = no limit)', type: 'number', min: 0, default: 0 },
  ],
  defaults: () => ({ date: todayISO(), deadline: todayISO() }),
  validate: (v, { existing, rows }) => {
    const draft = { id: existing?.id ?? '__new__', venue: String(v.venue), date: String(v.date), startTime: String(v.startTime), endTime: String(v.endTime) };
    const clash = venueConflict(draft, rows);
    const capacity = Number(v.capacity) || 0;
    const registered = existing?.registrations.length ?? 0;
    return {
      ...(String(v.endTime) <= String(v.startTime) ? { endTime: 'The event must end after it starts' } : {}),
      ...(!existing && String(v.date) < todayISO() ? { date: 'A new event cannot be on a past day' } : {}),
      ...(!v.inviteOnly && !String(v.deadline) ? { deadline: 'Choose the last day to register' } : {}),
      ...(!v.inviteOnly && String(v.deadline) && String(v.deadline) > String(v.date) ? { deadline: 'Registration must close on or before the event day' } : {}),
      ...(!v.inviteOnly && !existing && String(v.deadline) && String(v.deadline) < todayISO() ? { deadline: 'The deadline has already passed' } : {}),
      ...(capacity < 0 || !Number.isInteger(capacity) ? { capacity: 'Enter a whole number, 0 or more' } : {}),
      ...(capacity > 0 && capacity < registered ? { capacity: `${registered} people are already registered` } : {}),
      ...(clash ? { venue: `${clash.title} already uses ${clash.venue} at ${formatTime(clash.startTime)}–${formatTime(clash.endTime)}` } : {}),
    };
  },
  prepare: (v, { existing }) => ({
    deadline: v.inviteOnly ? String(v.date) : String(v.deadline),
    capacity: Number(v.capacity) || 0,
    cancelled: existing?.cancelled ?? false,
    registrations: existing?.registrations ?? [],
  }),
  editable: (r) => !r.cancelled && ['Open', 'Closing Soon', 'Full', 'Invite Only', 'Registration Closed'].includes(eventState(r)),
  canDeleteRecord: (r) => (r.registrations.length > 0 && !r.cancelled && eventState(r) !== 'Completed' ? 'People have registered. Cancel the event instead so they are told.' : null),
  actions: [
    {
      key: 'register',
      label: 'Register me',
      icon: 'user-plus',
      tone: 'success',
      manage: false,
      visible: (r, _role, user) => !isRegistered(r, user) && registerBlockers(r, user).length === 0,
      run: (r, _v, ctx) => {
        const blockers = registerBlockers(r, ctx.user);
        if (blockers.length || !ctx.user) { ctx.toast(blockers[0] ?? 'Sign in to register.', 'error'); return; }
        ctx.update({ registrations: [...r.registrations, { key: ctx.user.id, name: ctx.user.name, role: registrantRole(ctx.user.role), at: new Date().toISOString() }] });
        ctx.toast(`You are registered for ${r.title}`);
      },
    },
    {
      key: 'unregister',
      label: 'Cancel my registration',
      icon: 'user-x',
      manage: false,
      visible: (r, _role, user) => isRegistered(r, user) && ['Open', 'Closing Soon', 'Full', 'Invite Only', 'Registration Closed'].includes(eventState(r)),
      confirm: 'Cancel your registration for this event?',
      run: (r, _v, ctx) => { ctx.update({ registrations: r.registrations.filter((x) => x.key !== ctx.user?.id) }); ctx.toast('Registration cancelled', 'info'); },
    },
    {
      key: 'addAttendee',
      label: 'Add attendee',
      icon: 'user-plus',
      visible: (r, role) => !!role && MANAGERS.includes(role) && !r.cancelled && eventState(r) !== 'Completed',
      form: { title: 'Add attendee', submitLabel: 'Add', fields: [{ key: 'name', label: 'Name', type: 'text', required: true }, { key: 'role', label: 'Role', type: 'select', required: true, options: ['Student', 'Parent', 'Teacher', 'Staff', 'Guest'], default: 'Guest' }] },
      run: (r, v, ctx) => {
        const name = String(v.name).trim();
        if (r.registrations.some((x) => x.name.toLowerCase() === name.toLowerCase() && x.role === v.role)) { ctx.toast(`${name} is already on the list`, 'error'); return; }
        const spots = spotsLeft(r);
        if (spots === 0) { ctx.toast('No seats are left', 'error'); return; }
        ctx.update({ registrations: [...r.registrations, { key: `added:${Date.now()}`, name, role: String(v.role), at: new Date().toISOString() }] });
        ctx.toast(`${name} added`);
      },
    },
    {
      key: 'removeAttendee',
      label: 'Remove an attendee',
      icon: 'user-minus',
      visible: (r, role) => !!role && MANAGERS.includes(role) && r.registrations.length > 0 && !r.cancelled && eventState(r) !== 'Completed',
      form: { title: 'Remove attendee', submitLabel: 'Remove', fields: [{ key: 'name', label: 'Name (exactly as listed)', type: 'text', required: true }], validate: (v, r) => (r.registrations.some((x) => x.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? {} : { name: 'No attendee has this name' }) },
      run: (r, v, ctx) => { const name = String(v.name).trim().toLowerCase(); ctx.update({ registrations: r.registrations.filter((x) => x.name.toLowerCase() !== name) }); ctx.toast('Attendee removed', 'info'); },
    },
    {
      key: 'attendees',
      label: 'View attendees',
      icon: 'users',
      manage: false,
      visible: (r, role) => !!role && MANAGERS.includes(role),
      run: (r, _v, ctx) => ctx.alert(`${r.title}: ${r.registrations.length} registered`, r.registrations.length ? r.registrations.map((x) => `${x.name} (${x.role})`).slice(0, 40).join('\n') + (r.registrations.length > 40 ? `\n…and ${r.registrations.length - 40} more` : '') : 'No one has registered yet.'),
    },
    { key: 'cancel', label: 'Cancel event', icon: 'slash', tone: 'danger', visible: (r, role) => !!role && MANAGERS.includes(role) && !r.cancelled && eventState(r) !== 'Completed', confirm: 'Cancel this event? Registered people will see it as cancelled.', run: (r, _v, ctx) => { ctx.update({ cancelled: true }); ctx.toast(`${r.title} cancelled`, 'info'); } },
    {
      key: 'restore',
      label: 'Restore event',
      icon: 'rotate-ccw',
      visible: (r, role) => !!role && MANAGERS.includes(role) && r.cancelled && r.date >= todayISO(),
      run: (r, _v, ctx) => {
        const clash = venueConflict({ ...r, id: r.id }, ctx.rows.filter((x) => !x.cancelled));
        if (clash) { ctx.toast(`${clash.title} now uses ${clash.venue} at that time`, 'error'); return; }
        ctx.update({ cancelled: false });
        ctx.toast('Event restored');
      },
    },
    { key: 'share', label: 'Share', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.title, `${r.title}\n${when(r)}\n${r.venue} · organised by ${r.organizer}\n\n${r.description}\n${r.inviteOnly ? 'By invitation.' : `Register by ${formatDate(r.deadline)}.`}`) },
  ],
};

/* ---------------------------------------- School profile ---------------------------------------- */

export const schoolProfileCfg: ResourceConfig<SchoolProfileRecord> = {
  entity: 'School Profile',
  collection: 'schoolProfile',
  auditEntity: 'schoolProfile',
  searchText: (r) => `${r.name} ${r.code} ${r.address}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => r.tagline,
  badges: (r) => [{ label: `Since ${r.established}`, tone: 'primary' }, { label: r.affiliation, tone: 'neutral' }],
  facts: [
    { label: 'Principal', value: (r) => r.principal },
    { label: 'Email', value: (r) => r.email },
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Website', value: (r) => r.website },
    { label: 'Address', value: (r) => r.address },
    { label: 'Current academic year', value: (r) => snapshot<AcademicYearRecord>('academicYears').find((y) => y.current)?.name ?? 'None set' },
  ],
  detail: [
    { title: 'School', items: [{ label: 'Name', value: (r) => r.name }, { label: 'School code', value: (r) => r.code }, { label: 'Tagline', value: (r) => r.tagline }, { label: 'Affiliation', value: (r) => r.affiliation }, { label: 'Established', value: (r) => r.established }, { label: 'Principal', value: (r) => r.principal }] },
    { title: 'Contact', items: [{ label: 'Email', value: (r) => r.email }, { label: 'Phone', value: (r) => r.phone }, { label: 'Website', value: (r) => r.website }, { label: 'Address', value: (r) => r.address }] },
    { title: 'Regional', items: [{ label: 'Currency', value: (r) => r.currency }, { label: 'Time zone', value: (r) => r.timezone }, { label: 'Language', value: (r) => r.language }, { label: 'Current academic year', value: (r) => snapshot<AcademicYearRecord>('academicYears').find((y) => y.current)?.name ?? 'None set' }] },
  ],
  form: [
    { key: 'name', label: 'School Name', type: 'text', required: true },
    { key: 'code', label: 'School Code', type: 'text', required: true },
    { key: 'tagline', label: 'Tagline', type: 'text' },
    { key: 'affiliation', label: 'Board and Affiliation', type: 'text' },
    { key: 'established', label: 'Year Established', type: 'number', required: true, min: 1800, max: new Date().getFullYear() },
    { key: 'principal', label: 'Principal', type: 'text', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true, section: 'Contact' },
    { key: 'phone', label: 'Phone', type: 'phone', required: true },
    { key: 'website', label: 'Website', type: 'text', placeholder: 'https://' },
    { key: 'address', label: 'Address', type: 'textarea', required: true },
    { key: 'currency', label: 'Currency', type: 'select', options: ['USD ($)', 'INR (₹)', 'GBP (£)', 'EUR (€)'], default: 'USD ($)', section: 'Regional' },
    { key: 'timezone', label: 'Time Zone', type: 'select', options: ['Asia/Kolkata (GMT+5:30)', 'Europe/London (GMT+0)', 'America/New_York (GMT-5)', 'Asia/Dubai (GMT+4)'], default: 'Asia/Kolkata (GMT+5:30)' },
    { key: 'language', label: 'Language', type: 'select', options: ['English', 'Tamil', 'Hindi'], default: 'English' },
  ],
  validate: (v) => ({
    ...(!phoneOk(String(v.phone)) ? { phone: 'Enter a phone number with at least 10 digits' } : {}),
    ...(String(v.website).trim() && !/^https?:\/\/[^\s.]+\.[^\s]+$/.test(String(v.website).trim()) ? { website: 'Start with http:// or https:// and include a domain' } : {}),
    ...(!/^[A-Za-z0-9-]{3,16}$/.test(String(v.code).trim()) ? { code: 'Use 3 to 16 letters, numbers or dashes' } : {}),
    ...(!Number.isInteger(Number(v.established)) ? { established: 'Enter a year' } : {}),
  }),
  prepare: (v) => ({ name: String(v.name).trim(), code: String(v.code).trim(), website: String(v.website ?? '').trim(), established: Number(v.established) }),
  canCreate: false,
  canDelete: false,
  actions: [
    { key: 'share', label: 'Share school details', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.name, `${r.name.toUpperCase()}\n${r.tagline}\n${r.affiliation} · Established ${r.established}\n\nPrincipal: ${r.principal}\n${r.address}\n${r.phone} · ${r.email}\n${r.website}`) },
  ],
};

/* ------------------------------------------- Campuses ------------------------------------------- */

export const campusesCfg: ResourceConfig<CampusRecord> = {
  entity: 'Campus',
  collection: 'campuses',
  auditEntity: 'campus',
  searchPlaceholder: 'Search campus, code, principal…',
  searchText: (r) => `${r.name} ${r.code} ${r.principal} ${r.address}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => r.address,
  status: (r) => (r.isMain ? { label: 'Main campus', tone: 'primary' } : { label: 'Campus', tone: 'neutral' }),
  badges: (r) => [{ label: `${campusUsage(r.name).teachers} teachers`, tone: 'info' }, { label: `${campusUsage(r.name).staff} staff`, tone: 'teal' }],
  facts: [
    { label: 'Head', value: (r) => r.principal },
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Email', value: (r) => r.email },
    { label: 'People assigned', value: (r) => { const u = campusUsage(r.name); return `${u.total} (${u.teachers} teachers, ${u.staff} staff)`; } },
  ],
  detail: [
    { title: 'Campus', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Code', value: (r) => r.code }, { label: 'Main campus', value: (r) => (r.isMain ? 'Yes' : 'No') }, { label: 'Head', value: (r) => r.principal }, { label: 'Address', value: (r) => r.address }] },
    { title: 'Contact', items: [{ label: 'Phone', value: (r) => r.phone }, { label: 'Email', value: (r) => r.email }] },
    { title: 'People', items: [{ label: 'Teachers', value: (r) => campusUsage(r.name).teachers }, { label: 'Staff', value: (r) => campusUsage(r.name).staff }, { label: 'Login accounts', value: (r) => campusUsage(r.name).users }] },
  ],
  stats: [
    { label: 'Campuses', value: (rows) => rows.length, icon: 'map-pin' },
    { label: 'Teachers placed', value: (rows) => rows.reduce((n, r) => n + campusUsage(r.name).teachers, 0), tone: 'info', icon: 'user' },
    { label: 'Staff placed', value: (rows) => rows.reduce((n, r) => n + campusUsage(r.name).staff, 0), tone: 'teal', icon: 'users' },
    { label: 'Without anyone', value: (rows) => countBy(rows, (r) => campusUsage(r.name).total === 0), tone: 'warning', icon: 'alert-circle' },
  ],
  sorts: [
    { key: 'main', label: 'Main campus first', compare: (a, b) => Number(b.isMain) - Number(a.isMain) || a.name.localeCompare(b.name) },
    { key: 'people', label: 'Most people', compare: (a, b) => campusUsage(b.name).total - campusUsage(a.name).total },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  ],
  form: [
    { key: 'name', label: 'Campus Name', type: 'text', required: true, hint: 'Renaming also renames it for the teachers and staff placed here' },
    { key: 'code', label: 'Campus Code', type: 'text', required: true, hint: 'Capital letters, numbers and dashes, e.g. KIS-MAIN' },
    { key: 'address', label: 'Address', type: 'textarea', required: true },
    { key: 'principal', label: 'Head of Campus', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'phone', required: true },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'isMain', label: 'This is the main campus', type: 'switch', default: false },
  ],
  validate: (v, { existing, rows }) => {
    const others = rows.filter((r) => r.id !== existing?.id);
    return {
      ...(others.some((r) => r.name.trim().toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A campus with this name already exists' } : {}),
      ...(!/^[A-Z0-9-]{3,12}$/.test(String(v.code).trim()) ? { code: 'Use 3 to 12 capital letters, numbers or dashes' } : others.some((r) => r.code === String(v.code).trim()) ? { code: 'This code is already used' } : {}),
      ...(!phoneOk(String(v.phone)) ? { phone: 'Enter a phone number with at least 10 digits' } : {}),
      ...(existing?.isMain && !v.isMain ? { isMain: 'Choose another campus as the main one instead' } : {}),
      ...(!existing && !others.some((r) => r.isMain) && !v.isMain ? { isMain: 'The school needs a main campus' } : {}),
    };
  },
  prepare: (v) => ({ name: String(v.name).trim(), code: String(v.code).trim(), principal: String(v.principal).trim() }),
  afterSave: (kind, record, previous) => {
    if (kind === 'delete') return;
    // A new main campus takes the flag from the old one.
    if (record.isMain) for (const other of snapshot<CampusRecord>('campuses')) if (other.id !== record.id && other.isMain) repo<CampusRecord>('campuses').update(other.id, { isMain: false });
    // Renaming carries the new name to everyone placed here.
    if (kind === 'update' && previous && previous.name !== record.name) {
      for (const t of snapshot<TeacherRecord>('teachers')) if (t.campus === previous.name) repo<TeacherRecord>('teachers').update(t.id, { campus: record.name });
      for (const s of snapshot<StaffRecord>('staff')) if (s.campus === previous.name) repo<StaffRecord>('staff').update(s.id, { campus: record.name });
      for (const u of snapshot<UserRecord>('users')) if (u.branch === previous.name) repo<UserRecord>('users').update(u.id, { branch: record.name });
    }
  },
  canDeleteRecord: (r) => {
    if (r.isMain) return 'The main campus cannot be deleted. Make another campus the main one first.';
    const u = campusUsage(r.name);
    if (u.total > 0) return `${u.teachers} teacher${u.teachers === 1 ? '' : 's'} and ${u.staff} staff member${u.staff === 1 ? '' : 's'} are placed here. Move them to another campus first.`;
    return null;
  },
  actions: [
    { key: 'makeMain', label: 'Make main campus', icon: 'star', visible: (r) => !r.isMain, confirm: 'Make this the main campus?', run: (r, _v, ctx) => { ctx.update({ isMain: true }); for (const o of ctx.rows) if (o.id !== r.id && o.isMain) repo<CampusRecord>('campuses').update(o.id, { isMain: false }); ctx.toast(`${r.name} is now the main campus`); } },
    { key: 'share', label: 'Share details', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.name, `${r.name} (${r.code})\n${r.address}\nHead: ${r.principal}\n${r.phone} · ${r.email}`) },
  ],
};

/* ---------------------------------------- Academic years ---------------------------------------- */

const yearTone: Record<YearState, Tone> = { Current: 'success', Upcoming: 'info', Completed: 'neutral' };

export const academicYearsCfg: ResourceConfig<AcademicYearRecord> = {
  entity: 'Academic Year',
  collection: 'academicYears',
  auditEntity: 'academicYear',
  searchText: (r) => `${r.name} ${r.note}`,
  code: (r) => r.name,
  title: (r) => `Academic year ${r.name}`,
  subtitle: (r) => `${formatDate(r.startDate)} – ${formatDate(r.endDate)}`,
  status: (r) => ({ label: yearState(r), tone: yearTone[yearState(r)] }),
  facts: [
    { label: 'Runs', value: (r) => `${formatDate(r.startDate)} to ${formatDate(r.endDate)}` },
    { label: 'Notes', value: (r) => r.note || undefined },
    { label: 'Records stamped with it', value: (r) => yearUsage(r.name) },
  ],
  detail: [{ title: 'Academic year', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Status', value: (r) => yearState(r) }, { label: 'Starts', value: (r) => formatDate(r.startDate) }, { label: 'Ends', value: (r) => formatDate(r.endDate) }, { label: 'Notes', value: (r) => r.note || '—' }, { label: 'Records using it', value: (r) => yearUsage(r.name) }] }],
  stats: [
    { label: 'Years', value: (rows) => rows.length, icon: 'calendar' },
    { label: 'Current', value: (rows) => rows.find((r) => r.current)?.name ?? 'None', tone: 'success', icon: 'check-circle' },
    { label: 'Upcoming', value: (rows) => countBy(rows, (r) => yearState(r) === 'Upcoming'), tone: 'info', icon: 'arrow-right-circle' },
    { label: 'Completed', value: (rows) => countBy(rows, (r) => yearState(r) === 'Completed'), tone: 'neutral', icon: 'archive' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...(['Current', 'Upcoming', 'Completed'] as YearState[]).map((s) => ({ key: s, label: s, match: (r: AcademicYearRecord) => yearState(r) === s }))],
  sorts: [{ key: 'newest', label: 'Newest first', compare: (a, b) => b.startDate.localeCompare(a.startDate) }, { key: 'oldest', label: 'Oldest first', compare: (a, b) => a.startDate.localeCompare(b.startDate) }],
  form: [
    { key: 'name', label: 'Name', type: 'text', required: true, placeholder: '2027-28', hint: 'Start year, a dash, and the last two digits of the end year' },
    { key: 'startDate', label: 'Starts', type: 'date', required: true },
    { key: 'endDate', label: 'Ends', type: 'date', required: true },
    { key: 'note', label: 'Notes', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => yearProblems({ name: String(v.name).trim(), startDate: String(v.startDate), endDate: String(v.endDate) }, rows, existing?.id),
  prepare: (v, { existing }) => ({ name: String(v.name).trim(), current: existing?.current ?? false }),
  canDeleteRecord: (r) => (r.current ? 'The current year cannot be deleted. Make another year current first.' : yearUsage(r.name) > 0 ? `${yearUsage(r.name)} records (fees, holidays, transport…) are stamped with this year.` : null),
  actions: [
    {
      key: 'activate',
      label: 'Make current year',
      icon: 'check-circle',
      tone: 'success',
      visible: (r) => !r.current,
      confirm: 'Make this the current academic year? The present one is closed.',
      run: (r, _v, ctx) => {
        if (r.endDate < todayISO()) { ctx.toast('This year has already ended.', 'error'); return; }
        for (const o of ctx.rows) if (o.current && o.id !== r.id) repo<AcademicYearRecord>('academicYears').update(o.id, { current: false });
        ctx.update({ current: true });
        ctx.toast(`${r.name} is now the current year`);
      },
    },
  ],
};

/* ------------------------------------------ Audit logs ------------------------------------------ */

const auditTone: Record<AuditRecord['action'], Tone> = { Created: 'success', Updated: 'info', Deleted: 'danger', Action: 'purple' };
const ago = (iso: string) => (Date.now() - new Date(iso).getTime()) / 86400000;
const stamp = (iso: string) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const nice = (s: string) => s.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export const auditLogsCfg: ResourceConfig<AuditRecord> = {
  entity: 'Audit Entry',
  collection: 'auditLog',
  searchPlaceholder: 'Search by who, what or record…',
  searchText: (r) => `${r.summary} ${r.by} ${r.entity} ${r.entityId} ${r.action}`,
  code: (r) => nice(r.entity),
  title: (r) => r.summary,
  subtitle: (r) => `${r.by} · ${stamp(r.at)}`,
  status: (r) => ({ label: r.action, tone: auditTone[r.action] }),
  facts: [
    { label: 'Who', value: (r) => r.by },
    { label: 'When', value: (r) => stamp(r.at) },
    { label: 'Record', value: (r) => `${nice(r.entity)} · ${r.entityId}` },
  ],
  detail: [{ title: 'Entry', items: [{ label: 'What happened', value: (r) => r.summary }, { label: 'Action', value: (r) => r.action }, { label: 'Area', value: (r) => nice(r.entity) }, { label: 'Record id', value: (r) => r.entityId }, { label: 'Done by', value: (r) => r.by }, { label: 'At', value: (r) => stamp(r.at) }] }],
  stats: [
    { label: 'Entries', value: (rows) => rows.length, icon: 'list' },
    { label: 'Today', value: (rows) => countBy(rows, (r) => ago(r.at) < 1 && new Date(r.at).toDateString() === new Date().toDateString()), tone: 'primary', icon: 'clock' },
    { label: 'Last 7 days', value: (rows) => countBy(rows, (r) => ago(r.at) <= 7), tone: 'info', icon: 'calendar' },
    { label: 'Deletions', value: (rows) => countBy(rows, (r) => r.action === 'Deleted'), tone: 'danger', icon: 'trash-2' },
    { label: 'People involved', value: (rows) => new Set(rows.map((r) => r.by)).size, tone: 'teal', icon: 'users' },
  ],
  views: [
    { key: 'all', label: 'All', match: () => true },
    { key: 'today', label: 'Today', match: (r) => new Date(r.at).toDateString() === new Date().toDateString() },
    { key: 'week', label: 'Last 7 days', match: (r) => ago(r.at) <= 7 },
  ],
  filters: [
    { key: 'action', label: 'Action', options: opts(['Created', 'Updated', 'Deleted', 'Action']), match: (r, v) => r.action === v },
    { key: 'entity', label: 'Area', options: (rows) => [...new Set(rows.map((r) => r.entity))].sort().map((e) => ({ label: nice(e), value: e })), match: (r, v) => r.entity === v },
    { key: 'by', label: 'Done by', options: (rows) => opts([...new Set(rows.map((r) => r.by))].sort()), match: (r, v) => r.by === v },
  ],
  sorts: [{ key: 'newest', label: 'Newest first', compare: (a, b) => b.at.localeCompare(a.at) }, { key: 'oldest', label: 'Oldest first', compare: (a, b) => a.at.localeCompare(b.at) }],
  form: [],
  canCreate: false,
  canEdit: false,
  canDelete: false,
  exportColumns: [{ label: 'When', value: (r) => r.at }, { label: 'Who', value: (r) => r.by }, { label: 'Action', value: (r) => r.action }, { label: 'Area', value: (r) => r.entity }, { label: 'Record', value: (r) => r.entityId }, { label: 'Summary', value: (r) => r.summary }],
};
