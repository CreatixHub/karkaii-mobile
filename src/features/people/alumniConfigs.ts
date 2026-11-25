import { repo, snapshot } from '@/core/store/store';
import { diffDays, formatDate, formatTime, todayISO } from '@/core/utils/date';
import type { AlumniChapterRecord, AlumniEventRecord, AlumniOpportunityRecord, AlumniRecord, AlumniStoryRecord, MentorRequestRecord } from '@/data/seed/admissionsAlumni';
import type { StudentRecord } from '@/data/seed/master';
import { opts, parseCsvRows } from '@/features/academic/helpers';
import { classSection, countBy, studentOptions } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Option } from '@/ui/Fields';
import type { Tone } from '@/ui/tone';

const alumniAll = () => snapshot<AlumniRecord>('alumni');
const chaptersAll = () => snapshot<AlumniChapterRecord>('alumniChapters');
const chapterName = (id: string) => chaptersAll().find((c) => c.id === id)?.name ?? 'Unassigned';
const alumnusName = (id: string) => alumniAll().find((a) => a.id === id)?.name ?? '—';
const alumniOptions = (): Option[] => alumniAll().map((a) => ({ label: a.name, value: a.id, hint: `Batch ${a.batchYear} · ${a.company || a.profession}` }));
const chapterOptions = (): Option[] => chaptersAll().map((c) => ({ label: c.name, value: c.id }));

export const DEPARTMENTS = ['Computer Science', 'Commerce', 'Biology', 'Mathematics', 'Arts & Humanities'];
export const PROFESSIONS = ['Engineering', 'Medicine', 'Finance', 'Design', 'Academia', 'Entrepreneurship', 'Higher studies'];
const COUNTRIES = ['India', 'United Arab Emirates', 'Singapore', 'United States', 'United Kingdom', 'Australia'];
const INDUSTRIES = ['Software & IT', 'Healthcare', 'Banking', 'Manufacturing', 'Media', 'Education'];
const EVENT_TYPES = ['Reunion', 'Networking Meetup', 'Career Fair', 'Startup Summit', 'Webinar', 'Sports Meet'];
const OPP_CATEGORIES = ['Job', 'Internship', 'Scholarship', 'Mentorship', 'Business Collaboration', 'Investment', 'Volunteer Programme', 'Campus Talk'];
const batchBand = (y: number) => (y >= 2020 ? '2020-2024' : y >= 2015 ? '2015-2019' : y >= 2010 ? '2010-2014' : 'Before 2010');

/* ================================== Members ================================== */

const memberTone: Record<string, Tone> = { Active: 'success', 'Pending Verification': 'warning' };
const eventsOf = (a: AlumniRecord) => countBy(snapshot<AlumniEventRecord>('alumniEvents'), (e) => e.attendeeIds.includes(a.id));
const menteesOf = (a: AlumniRecord) => countBy(snapshot<MentorRequestRecord>('mentorRequests'), (m) => m.alumnusId === a.id && (m.status === 'Matched' || m.status === 'Completed'));
const postedBy = (a: AlumniRecord) => countBy(snapshot<AlumniOpportunityRecord>('alumniOpportunities'), (o) => o.postedBy === a.name);

export const membersCfg: ResourceConfig<AlumniRecord> = {
  entity: 'Alumnus',
  collection: 'alumni',
  auditEntity: 'alumnus',
  searchPlaceholder: 'Search name, company, batch, city…',
  searchText: (r) => `${r.name} ${r.company} ${r.role} ${r.batchYear} ${r.city} ${r.country} ${r.department} ${r.profession} ${chapterName(r.chapterId)}`,
  code: (r) => `Batch of ${r.batchYear}`,
  title: (r) => r.name,
  subtitle: (r) => [r.role, r.company].filter(Boolean).join(' · ') || r.profession,
  status: (r) => ({ label: r.status, tone: memberTone[r.status] }),
  badges: (r) => [{ label: chapterName(r.chapterId), tone: 'primary' }, ...(r.mentor ? [{ label: 'Mentor', tone: 'success' as Tone }] : []), ...(r.recruit ? [{ label: 'Recruiting', tone: 'info' as Tone }] : []), ...(r.speak ? [{ label: 'Speaker', tone: 'purple' as Tone }] : []), ...(r.studentId ? [{ label: 'Recent graduate', tone: 'teal' as Tone }] : [])],
  facts: [
    { label: 'Department', value: (r) => r.department },
    { label: 'Profession', value: (r) => `${r.profession} · ${r.industry}` },
    { label: 'Location', value: (r) => `${r.city}, ${r.country}` },
    { label: 'Connections', value: (r) => r.connections },
    { label: 'Member since', value: (r) => formatDate(r.memberSince) },
  ],
  detail: [
    { title: 'Profile', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Batch', value: (r) => `${r.batchYear} (${batchBand(r.batchYear)})` }, { label: 'Department', value: (r) => r.department }, { label: 'Role', value: (r) => r.role }, { label: 'Company', value: (r) => r.company || '—' }, { label: 'Profession / industry', value: (r) => `${r.profession} · ${r.industry}` }, { label: 'Location', value: (r) => `${r.city}, ${r.country}` }, { label: 'Chapter', value: (r) => chapterName(r.chapterId) }, { label: 'Bio', value: (r) => r.bio }] },
    { title: 'Contact', items: [{ label: 'Email', value: (r) => r.email }, { label: 'Phone', value: (r) => r.phone }] },
    { title: 'Participation', items: [{ label: 'Connections', value: (r) => r.connections }, { label: 'Events registered', value: (r) => eventsOf(r) }, { label: 'Mentees', value: (r) => menteesOf(r) }, { label: 'Opportunities posted', value: (r) => postedBy(r) }, { label: 'Open to', value: (r) => [r.mentor && 'Mentoring', r.recruit && 'Recruitment', r.speak && 'Speaking'].filter(Boolean).join(', ') || 'Nothing yet' }] },
    { title: 'Skills & achievements', items: [{ label: 'Skills', value: (r) => r.skills.join(', ') || '—' }, { label: 'Achievements', value: (r) => r.achievements.join('; ') || '—' }, { label: 'Notes', value: (r) => r.notes.join('\n') || '—' }] },
  ],
  stats: [
    { label: 'Members', value: (rows) => rows.length, icon: 'users' },
    { label: 'Mentors', value: (rows) => countBy(rows, (r) => r.mentor), tone: 'success', icon: 'compass' },
    { label: 'Recruiters', value: (rows) => countBy(rows, (r) => r.recruit), tone: 'info', icon: 'briefcase' },
    { label: 'Speakers', value: (rows) => countBy(rows, (r) => r.speak), tone: 'purple', icon: 'mic' },
    { label: 'To verify', value: (rows) => countBy(rows, (r) => r.status === 'Pending Verification'), tone: 'warning', icon: 'user-check' },
  ],
  views: [
    { key: 'all', label: 'All Members', match: () => true },
    { key: 'recent', label: 'Batch 2020–24', match: (r) => r.batchYear >= 2020 },
    { key: 'mid', label: '2015–19', match: (r) => r.batchYear >= 2015 && r.batchYear < 2020 },
    { key: 'older', label: '2010–14', match: (r) => r.batchYear >= 2010 && r.batchYear < 2015 },
    { key: 'early', label: 'Before 2010', match: (r) => r.batchYear < 2010 },
    { key: 'verify', label: 'To verify', match: (r) => r.status === 'Pending Verification' },
  ],
  filters: [
    { key: 'year', label: 'Graduation year', options: () => [...new Set(alumniAll().map((a) => a.batchYear))].sort((a, b) => b - a).map((y) => ({ label: String(y), value: String(y) })), match: (r, v) => String(r.batchYear) === v },
    { key: 'department', label: 'Department', options: opts(DEPARTMENTS), match: (r, v) => r.department === v },
    { key: 'profession', label: 'Profession', options: opts(PROFESSIONS), match: (r, v) => r.profession === v },
    { key: 'country', label: 'Country', options: opts(COUNTRIES), match: (r, v) => r.country === v },
    { key: 'chapter', label: 'Chapter', options: chapterOptions, match: (r, v) => r.chapterId === v },
    { key: 'industry', label: 'Industry', options: opts(INDUSTRIES), match: (r, v) => r.industry === v },
    { key: 'open', label: 'Open to', options: [{ label: 'Mentoring', value: 'mentor' }, { label: 'Recruitment', value: 'recruit' }, { label: 'Speaking', value: 'speak' }], match: (r, v) => (v === 'mentor' ? r.mentor : v === 'recruit' ? r.recruit : r.speak) },
  ],
  sorts: [
    { key: 'recent', label: 'Recently joined', compare: (a, b) => b.memberSince.localeCompare(a.memberSince) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'year', label: 'Graduation year (latest)', compare: (a, b) => b.batchYear - a.batchYear },
    { key: 'connections', label: 'Most connections', compare: (a, b) => b.connections - a.connections },
  ],
  form: [
    { key: 'name', label: 'Full Name', type: 'text', required: true, section: 'Alumnus' },
    { key: 'batchYear', label: 'Graduation Year', type: 'number', required: true, min: 1976, max: new Date().getFullYear() + 1 },
    { key: 'department', label: 'Department', type: 'select', required: true, options: DEPARTMENTS },
    { key: 'email', label: 'Email', type: 'email', required: true },
    { key: 'phone', label: 'Phone', type: 'phone' },
    { key: 'profession', label: 'Profession', type: 'select', required: true, options: PROFESSIONS },
    { key: 'industry', label: 'Industry', type: 'select', required: true, options: INDUSTRIES },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'role', label: 'Role / Title', type: 'text' },
    { key: 'city', label: 'City', type: 'text', required: true },
    { key: 'country', label: 'Country', type: 'select', required: true, options: COUNTRIES },
    { key: 'chapterId', label: 'Chapter', type: 'select', options: chapterOptions },
    { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'mentor', label: 'Open to mentoring', type: 'switch', section: 'Open to' },
    { key: 'recruit', label: 'Open to recruitment', type: 'switch' },
    { key: 'speak', label: 'Open to speaking', type: 'switch' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Pending Verification'], default: 'Active' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.email.toLowerCase() === String(v.email).trim().toLowerCase()) ? { email: 'An alumnus with this email already exists' } : {}),
    ...(Number(v.batchYear) > new Date().getFullYear() + 1 ? { batchYear: 'Graduation year is too far in the future' } : {}),
  }),
  prepare: (_v, { existing }) => ({ memberSince: existing?.memberSince ?? todayISO(), skills: existing?.skills ?? [], connections: existing?.connections ?? 0, achievements: existing?.achievements ?? [], notes: existing?.notes ?? [], studentId: existing?.studentId ?? '' }),
  canDeleteRecord: (r) => {
    const leads = chaptersAll().filter((c) => c.coordinatorId === r.id).map((c) => c.name);
    if (leads.length) return `${r.name} coordinates ${leads.join(', ')}. Choose a new coordinator first.`;
    const mentoring = countBy(snapshot<MentorRequestRecord>('mentorRequests'), (m) => m.alumnusId === r.id);
    return mentoring ? `${r.name} is linked to ${mentoring} mentoring request(s). Decline or reassign them first.` : null;
  },
  actions: [
    { key: 'verify', label: 'Verify member', icon: 'user-check', tone: 'success', visible: (r) => r.status === 'Pending Verification', run: (r, _v, ctx) => { ctx.update({ status: 'Active' }); ctx.toast(`${r.name} verified`); } },
    { key: 'chapter', label: 'Assign chapter', icon: 'flag', form: { title: 'Assign chapter', fields: [{ key: 'chapterId', label: 'Chapter', type: 'select', required: true, options: chapterOptions }], initial: (r) => ({ chapterId: r.chapterId }) }, run: (r, v, ctx) => { ctx.update({ chapterId: v.chapterId }); ctx.toast(`${r.name} joined ${chapterName(v.chapterId)}`); } },
    { key: 'note', label: 'Add note', icon: 'edit-3', form: { title: 'Add note', fields: [{ key: 'text', label: 'Note', type: 'textarea', required: true }] }, run: (r, v, ctx) => { ctx.update({ notes: [...r.notes, `${v.text} (${todayISO()})`] }); ctx.toast('Note added'); } },
    { key: 'connect', label: 'Connect', icon: 'user-plus', manage: false, run: (r, _v, ctx) => { ctx.update({ connections: r.connections + 1 }); ctx.toast(`Connection request recorded for ${r.name}`, 'info'); } },
    { key: 'message', label: 'Message', icon: 'mail', form: { title: 'Message alumnus', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] }, run: (r, v, ctx) => ctx.toast(`“${v.subject}” queued for ${r.email} (mock: nothing is sent)`, 'info') },
    { key: 'share', label: 'Share profile', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.name, `${r.name}\nBatch of ${r.batchYear} · ${r.department}\n${r.role}${r.company ? `, ${r.company}` : ''}\n${r.city}, ${r.country}\n${r.email}`) },
  ],
  bulk: [
    { key: 'verify', label: 'Verify', icon: 'user-check', run: (rows, _v, ctx) => { ctx.updateMany(() => ({ status: 'Active' as const })); ctx.toast(`${rows.length} members verified`); } },
    { key: 'chapter', label: 'Assign chapter', icon: 'flag', form: { title: 'Assign chapter', fields: [{ key: 'chapterId', label: 'Chapter', type: 'select', required: true, options: chapterOptions }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ chapterId: v.chapterId })); ctx.toast(`${rows.length} members joined ${chapterName(v.chapterId)}`); } },
    { key: 'invite', label: 'Invite', icon: 'mail', form: { title: 'Invite selected members', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }] }, run: (rows, v, ctx) => ctx.toast(`“${v.subject}” queued for ${rows.length} members (mock: nothing is sent)`, 'info') },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Register alumni',
      icon: 'upload',
      form: { title: 'Register alumni', submitLabel: 'Register', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Asha Menon,2019,Biology,asha@example.org,Doctor,Chennai,India', hint: 'name, graduation year, department, email, profession, city, country. Duplicates and bad rows are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        const emails = new Set(ctx.rows.map((r) => r.email.toLowerCase()));
        for (const [name, year, department, email, profession, city, country] of parseCsvRows(String(v.csv))) {
          const y = Number(year);
          if (!name || !(y >= 1976 && y <= new Date().getFullYear() + 1) || !DEPARTMENTS.includes(department) || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? '') || emails.has(email.toLowerCase()) || !city || !COUNTRIES.includes(country)) { skipped += 1; continue; }
          emails.add(email.toLowerCase());
          ctx.create({ name, batchYear: y, department, profession: profession || 'Higher studies', industry: 'Education', company: '', role: '', country, city, chapterId: '', email, phone: '', memberSince: todayISO(), status: 'Pending Verification', bio: '', skills: [], mentor: false, recruit: false, speak: false, connections: 0, achievements: [], notes: [], studentId: '' });
          added += 1;
        }
        ctx.toast(`${added} alumni registered${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ================================== Chapters ================================== */

const membersOfChapter = (id: string) => countBy(alumniAll(), (a) => a.chapterId === id);

export const chaptersCfg: ResourceConfig<AlumniChapterRecord> = {
  entity: 'Chapter',
  collection: 'alumniChapters',
  auditEntity: 'alumniChapter',
  searchText: (r) => `${r.name} ${r.location} ${r.type} ${alumnusName(r.coordinatorId)}`,
  title: (r) => r.name,
  subtitle: (r) => `${r.location} · ${r.type}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Open' ? 'success' : 'warning' }),
  facts: [
    { label: 'Members', value: (r) => membersOfChapter(r.id) },
    { label: 'Coordinator', value: (r) => alumnusName(r.coordinatorId) },
    { label: 'Next meetup', value: (r) => (r.meetupTitle ? `${r.meetupTitle} · ${formatDate(r.meetupDate)}` : undefined) },
  ],
  detail: [{ title: 'Chapter', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Location', value: (r) => r.location }, { label: 'Type', value: (r) => r.type }, { label: 'Status', value: (r) => r.status }, { label: 'Coordinator', value: (r) => alumnusName(r.coordinatorId) }, { label: 'Members', value: (r) => membersOfChapter(r.id) }, { label: 'Next meetup', value: (r) => (r.meetupTitle ? `${r.meetupTitle} · ${formatDate(r.meetupDate)}` : '—') }, { label: 'About', value: (r) => r.description }] }],
  stats: [
    { label: 'Chapters', value: (rows) => rows.length, icon: 'flag' },
    { label: 'Open', value: (rows) => countBy(rows, (r) => r.status === 'Open'), tone: 'success', icon: 'check-circle' },
    { label: 'Members', value: () => countBy(alumniAll(), (a) => !!a.chapterId), tone: 'info', icon: 'users' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, { key: 'open', label: 'Open', match: (r) => r.status === 'Open' }, { key: 'soon', label: 'Opening soon', match: (r) => r.status === 'Opening soon' }],
  filters: [{ key: 'type', label: 'Type', options: opts(['Regional', 'Interest group', 'Batch group']), match: (r, v) => r.type === v }],
  sorts: [{ key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) }, { key: 'members', label: 'Most members', compare: (a, b) => membersOfChapter(b.id) - membersOfChapter(a.id) }],
  form: [
    { key: 'name', label: 'Chapter Name', type: 'text', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: ['Regional', 'Interest group', 'Batch group'], default: 'Regional' },
    { key: 'coordinatorId', label: 'Coordinator', type: 'select', options: alumniOptions },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ['Open', 'Opening soon'], default: 'Opening soon' },
    { key: 'meetupTitle', label: 'Next Meetup', type: 'text' },
    { key: 'meetupDate', label: 'Meetup Date', type: 'date', hidden: (v) => !v.meetupTitle },
    { key: 'description', label: 'About', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A chapter with this name already exists' } : {}),
    ...(v.meetupTitle && !v.meetupDate ? { meetupDate: 'Choose a date for the meetup' } : {}),
  }),
  canDeleteRecord: (r) => (membersOfChapter(r.id) ? `${membersOfChapter(r.id)} member(s) belong to ${r.name}. Move them to another chapter first.` : null),
  actions: [
    { key: 'join', label: 'Add member', icon: 'user-plus', form: { title: 'Add member to chapter', fields: [{ key: 'alumnusId', label: 'Alumnus', type: 'select', required: true, options: alumniOptions }] }, run: (r, v, ctx) => { repo<AlumniRecord>('alumni').update(v.alumnusId, { chapterId: r.id }); ctx.toast(`${alumnusName(v.alumnusId)} added to ${r.name}`); } },
    { key: 'open', label: 'Open chapter', icon: 'unlock', visible: (r) => r.status === 'Opening soon', run: (r, _v, ctx) => { ctx.update({ status: 'Open' }); ctx.toast(`${r.name} is now open`); } },
  ],
};

/* =================================== Events =================================== */

export const eventState = (e: AlumniEventRecord): 'Open' | 'Filling fast' | 'Full' | 'Closed' => (e.date < todayISO() ? 'Closed' : e.registered >= e.capacity ? 'Full' : e.registered / e.capacity >= 0.85 ? 'Filling fast' : 'Open');
const eventTone: Record<string, Tone> = { Open: 'success', 'Filling fast': 'warning', Full: 'danger', Closed: 'neutral' };

export const eventsCfg: ResourceConfig<AlumniEventRecord> = {
  entity: 'Event',
  collection: 'alumniEvents',
  auditEntity: 'alumniEvent',
  searchText: (r) => `${r.title} ${r.type} ${r.location} ${r.organizer}`,
  code: (r) => `${formatDate(r.date)} · ${formatTime(r.time)}`,
  title: (r) => r.title,
  subtitle: (r) => `${r.type} · ${r.location}`,
  status: (r) => ({ label: eventState(r), tone: eventTone[eventState(r)] }),
  facts: [
    { label: 'Organiser', value: (r) => r.organizer },
    { label: 'Registered', value: (r) => `${r.registered} of ${r.capacity}` },
    { label: 'Seats left', value: (r) => Math.max(0, r.capacity - r.registered) },
  ],
  progress: (r) => ({ value: r.registered, max: r.capacity, label: `${Math.round((r.registered / Math.max(1, r.capacity)) * 100)}% registered`, tone: eventState(r) === 'Full' ? 'danger' : eventState(r) === 'Filling fast' ? 'warning' : 'primary' }),
  detail: [{ title: 'Event', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Type', value: (r) => r.type }, { label: 'When', value: (r) => `${formatDate(r.date)} · ${formatTime(r.time)}` }, { label: 'Where', value: (r) => r.location }, { label: 'Organiser', value: (r) => r.organizer }, { label: 'Registered', value: (r) => `${r.registered} of ${r.capacity}` }, { label: 'Registered through this app', value: (r) => r.attendeeIds.map(alumnusName).join(', ') || '—' }, { label: 'About', value: (r) => r.description }] }],
  stats: [
    { label: 'Events', value: (rows) => rows.length, icon: 'calendar' },
    { label: 'Upcoming', value: (rows) => countBy(rows, (r) => r.date >= todayISO()), tone: 'success', icon: 'clock' },
    { label: 'Registrations', value: (rows) => rows.reduce((n, r) => n + r.registered, 0), tone: 'info', icon: 'users' },
    { label: 'Filling fast / full', value: (rows) => countBy(rows, (r) => ['Filling fast', 'Full'].includes(eventState(r))), tone: 'warning', icon: 'alert-circle' },
  ],
  views: [{ key: 'upcoming', label: 'Upcoming', match: (r) => r.date >= todayISO() }, { key: 'past', label: 'Past', match: (r) => r.date < todayISO() }, { key: 'all', label: 'All', match: () => true }],
  filters: [{ key: 'type', label: 'Type', options: opts(EVENT_TYPES), match: (r, v) => r.type === v }, { key: 'state', label: 'Availability', options: opts(['Open', 'Filling fast', 'Full', 'Closed']), match: (r, v) => eventState(r) === v }],
  sorts: [{ key: 'date', label: 'Soonest first', compare: (a, b) => a.date.localeCompare(b.date) }, { key: 'latest', label: 'Latest first', compare: (a, b) => b.date.localeCompare(a.date) }, { key: 'registered', label: 'Most registered', compare: (a, b) => b.registered - a.registered }],
  form: [
    { key: 'title', label: 'Event Title', type: 'text', required: true },
    { key: 'type', label: 'Event Type', type: 'select', required: true, options: EVENT_TYPES },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'time', label: 'Time', type: 'time', required: true },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'organizer', label: 'Organiser', type: 'text', required: true },
    { key: 'capacity', label: 'Capacity', type: 'number', required: true, min: 1, max: 5000 },
    { key: 'description', label: 'About', type: 'textarea' },
  ],
  validate: (v, { existing }) => ({
    ...(!existing && String(v.date) < todayISO() ? { date: 'Choose today or a later date' } : {}),
    ...(existing && Number(v.capacity) < existing.registered ? { capacity: `${existing.registered} people are already registered` } : {}),
  }),
  prepare: (_v, { existing }) => ({ registered: existing?.registered ?? 0, attendeeIds: existing?.attendeeIds ?? [] }),
  canDeleteRecord: (r) => (r.registered > 0 && r.date >= todayISO() ? `${r.registered} people have registered. Move the date or reduce the event instead of deleting it.` : null),
  actions: [
    {
      key: 'register',
      label: 'Register a member',
      icon: 'user-plus',
      visible: (r) => eventState(r) !== 'Closed',
      form: { title: 'Register a member', submitLabel: 'Register', fields: [{ key: 'alumnusId', label: 'Alumnus', type: 'select', required: true, options: alumniOptions }] },
      run: (r, v, ctx) => {
        if (r.attendeeIds.includes(v.alumnusId)) { ctx.toast(`${alumnusName(v.alumnusId)} is already registered`, 'error'); return; }
        if (r.registered >= r.capacity) { ctx.toast('This event is full', 'error'); return; }
        ctx.update({ attendeeIds: [...r.attendeeIds, v.alumnusId], registered: r.registered + 1 });
        ctx.toast(`${alumnusName(v.alumnusId)} registered`);
      },
    },
    {
      key: 'unregister',
      label: 'Cancel a registration',
      icon: 'user-minus',
      visible: (r) => r.attendeeIds.length > 0 && eventState(r) !== 'Closed',
      form: { title: 'Cancel a registration', submitLabel: 'Cancel registration', fields: [{ key: 'alumnusId', label: 'Alumnus', type: 'select', required: true, options: () => alumniOptions() }] },
      run: (r, v, ctx) => {
        if (!r.attendeeIds.includes(v.alumnusId)) { ctx.toast(`${alumnusName(v.alumnusId)} was not registered by this app`, 'error'); return; }
        ctx.update({ attendeeIds: r.attendeeIds.filter((id) => id !== v.alumnusId), registered: Math.max(0, r.registered - 1) });
        ctx.toast('Registration cancelled', 'info');
      },
    },
    { key: 'share', label: 'Share invitation', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.title, `${r.title}\n${r.type} · ${formatDate(r.date)} at ${formatTime(r.time)}\n${r.location}\nHosted by ${r.organizer}`) },
  ],
};

/* ================================= Opportunities ================================= */

export const oppState = (o: AlumniOpportunityRecord): 'Open' | 'Closing soon' | 'Closed' => (o.closed || o.deadline < todayISO() ? 'Closed' : diffDays(todayISO(), o.deadline) <= 7 ? 'Closing soon' : 'Open');
const oppTone: Record<string, Tone> = { Open: 'success', 'Closing soon': 'warning', Closed: 'neutral' };

export const opportunitiesCfg: ResourceConfig<AlumniOpportunityRecord> = {
  entity: 'Opportunity',
  collection: 'alumniOpportunities',
  auditEntity: 'alumniOpportunity',
  searchText: (r) => `${r.title} ${r.org} ${r.category} ${r.location} ${r.postedBy}`,
  code: (r) => r.category,
  title: (r) => r.title,
  subtitle: (r) => `${r.org} · ${r.location}`,
  status: (r) => ({ label: oppState(r), tone: oppTone[oppState(r)] }),
  facts: [
    { label: 'Deadline', value: (r) => formatDate(r.deadline) },
    { label: 'Posted by', value: (r) => r.postedBy },
    { label: 'Open to', value: (r) => r.openTo },
  ],
  detail: [{ title: 'Opportunity', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Organisation', value: (r) => r.org }, { label: 'Category', value: (r) => r.category }, { label: 'Location', value: (r) => r.location }, { label: 'Deadline', value: (r) => formatDate(r.deadline) }, { label: 'Posted by', value: (r) => r.postedBy }, { label: 'Open to', value: (r) => r.openTo }, { label: 'Details', value: (r) => r.description }] }],
  stats: [
    { label: 'Opportunities', value: (rows) => rows.length, icon: 'briefcase' },
    { label: 'Open', value: (rows) => countBy(rows, (r) => oppState(r) !== 'Closed'), tone: 'success', icon: 'check-circle' },
    { label: 'Closing soon', value: (rows) => countBy(rows, (r) => oppState(r) === 'Closing soon'), tone: 'warning', icon: 'clock' },
  ],
  views: [{ key: 'open', label: 'Open', match: (r) => oppState(r) !== 'Closed' }, { key: 'closed', label: 'Closed', match: (r) => oppState(r) === 'Closed' }, { key: 'all', label: 'All', match: () => true }],
  filters: [{ key: 'category', label: 'Category', options: opts(OPP_CATEGORIES), match: (r, v) => r.category === v }, { key: 'openTo', label: 'Open to', options: opts(['Students', 'Alumni', 'Students & alumni']), match: (r, v) => r.openTo === v }],
  sorts: [{ key: 'deadline', label: 'Nearest deadline', compare: (a, b) => a.deadline.localeCompare(b.deadline) }, { key: 'title', label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) }],
  form: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'org', label: 'Organisation', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: OPP_CATEGORIES },
    { key: 'location', label: 'Location', type: 'text', required: true },
    { key: 'deadline', label: 'Deadline', type: 'date', required: true },
    { key: 'postedBy', label: 'Posted By', type: 'select', required: true, optionsFrom: { collection: 'alumni', label: (a: AlumniRecord) => a.name, value: (a: AlumniRecord) => a.name } },
    { key: 'openTo', label: 'Open To', type: 'select', required: true, options: ['Students', 'Alumni', 'Students & alumni'], default: 'Students & alumni' },
    { key: 'description', label: 'Details', type: 'textarea' },
  ],
  validate: (v, { existing }) => (!existing && String(v.deadline) < todayISO() ? { deadline: 'The deadline must be today or later' } : {}),
  prepare: (_v, { existing }) => ({ closed: existing?.closed ?? false }),
  actions: [
    { key: 'close', label: 'Close', icon: 'lock', visible: (r) => oppState(r) !== 'Closed', confirm: 'Close this opportunity to new applicants?', run: (r, _v, ctx) => { ctx.update({ closed: true }); ctx.toast(`${r.title} closed`, 'info'); } },
    { key: 'extend', label: 'Extend deadline', icon: 'calendar', form: { title: 'Extend deadline', fields: [{ key: 'deadline', label: 'New Deadline', type: 'date', required: true }], initial: (r) => ({ deadline: r.deadline }), validate: (v) => (String(v.deadline) < todayISO() ? { deadline: 'Choose today or a later date' } : {}) }, run: (r, v, ctx) => { ctx.update({ deadline: v.deadline, closed: false }); ctx.toast(`Open until ${formatDate(v.deadline)}`); } },
    { key: 'share', label: 'Share', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.title, `${r.title}\n${r.org} · ${r.category} · ${r.location}\nApply by ${formatDate(r.deadline)}\nPosted by ${r.postedBy}`) },
  ],
};

/* =================================== Stories =================================== */

export const storiesCfg: ResourceConfig<AlumniStoryRecord> = {
  entity: 'Story',
  collection: 'alumniStories',
  searchText: (r) => `${r.headline} ${r.award} ${alumnusName(r.alumnusId)}`,
  code: (r) => r.award,
  title: (r) => r.headline,
  subtitle: (r) => alumnusName(r.alumnusId),
  status: (r) => ({ label: r.published ? 'Published' : 'Draft', tone: r.published ? 'success' : 'warning' }),
  facts: [{ label: 'Alumnus', value: (r) => alumnusName(r.alumnusId) }, { label: 'Story', value: (r) => r.body }],
  stats: [{ label: 'Stories', value: (rows) => rows.length, icon: 'award' }, { label: 'Published', value: (rows) => countBy(rows, (r) => r.published), tone: 'success', icon: 'check-circle' }],
  views: [{ key: 'all', label: 'All', match: () => true }, { key: 'published', label: 'Published', match: (r) => r.published }, { key: 'draft', label: 'Drafts', match: (r) => !r.published }],
  sorts: [{ key: 'headline', label: 'Headline (A–Z)', compare: (a, b) => a.headline.localeCompare(b.headline) }],
  form: [
    { key: 'headline', label: 'Headline', type: 'text', required: true },
    { key: 'award', label: 'Award / Recognition', type: 'text', required: true },
    { key: 'alumnusId', label: 'Alumnus', type: 'select', required: true, options: alumniOptions },
    { key: 'body', label: 'Story', type: 'textarea', required: true },
    { key: 'published', label: 'Publish', type: 'switch' },
  ],
  actions: [
    { key: 'publish', label: 'Publish', icon: 'send', visible: (r) => !r.published, run: (r, _v, ctx) => { ctx.update({ published: true }); ctx.toast('Story published'); } },
    { key: 'unpublish', label: 'Unpublish', icon: 'eye-off', visible: (r) => r.published, run: (r, _v, ctx) => { ctx.update({ published: false }); ctx.toast('Moved back to drafts', 'info'); } },
    { key: 'share', label: 'Share', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.headline, `${r.headline}\n${r.award} — ${alumnusName(r.alumnusId)}\n\n${r.body}`) },
  ],
};

/* ================================== Mentoring ================================== */

const mentorTone: Record<string, Tone> = { Pending: 'warning', Matched: 'success', Completed: 'neutral', Declined: 'danger' };
const studentOf = (id: string) => snapshot<StudentRecord>('students').find((s) => s.id === id);
const mentorOptions = (): Option[] => alumniAll().filter((a) => a.mentor).map((a) => ({ label: a.name, value: a.id, hint: `${a.role}${a.company ? `, ${a.company}` : ''}` }));

export const mentoringCfg: ResourceConfig<MentorRequestRecord> = {
  entity: 'Mentor Request',
  collection: 'mentorRequests',
  auditEntity: 'mentorRequest',
  searchText: (r) => `${studentOf(r.studentId)?.name ?? ''} ${r.focus} ${alumnusName(r.alumnusId)} ${r.status}`,
  code: (r) => r.focus,
  title: (r) => studentOf(r.studentId)?.name ?? '—',
  subtitle: (r) => `${classSection(studentOf(r.studentId))} · ${r.alumnusId ? alumnusName(r.alumnusId) : 'Any available mentor'}`,
  status: (r) => ({ label: r.status, tone: mentorTone[r.status] }),
  facts: [{ label: 'Format', value: (r) => r.format }, { label: 'Duration', value: (r) => r.duration }, { label: 'Requested', value: (r) => formatDate(r.requestedOn) }, { label: 'Note', value: (r) => r.note || undefined }],
  stats: [
    { label: 'Requests', value: (rows) => rows.length, icon: 'compass' },
    { label: 'Pending', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Matched', value: (rows) => countBy(rows, (r) => r.status === 'Matched'), tone: 'success', icon: 'check' },
    { label: 'Mentors available', value: () => countBy(alumniAll(), (a) => a.mentor && a.status === 'Active'), tone: 'info', icon: 'users' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, { key: 'pending', label: 'Pending', match: (r) => r.status === 'Pending' }, { key: 'matched', label: 'Matched', match: (r) => r.status === 'Matched' }, { key: 'done', label: 'Completed', match: (r) => r.status === 'Completed' }],
  sorts: [{ key: 'recent', label: 'Newest', compare: (a, b) => b.requestedOn.localeCompare(a.requestedOn) }],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: studentOptions },
    { key: 'alumnusId', label: 'Preferred Mentor', type: 'select', options: mentorOptions, hint: 'Leave empty for any available mentor.' },
    { key: 'focus', label: 'Focus Area', type: 'select', required: true, options: ['Career guidance', 'Higher studies', 'Interview preparation', 'Entrepreneurship'] },
    { key: 'format', label: 'Format', type: 'select', required: true, options: ['1:1 video', 'In person', 'Email only'] },
    { key: 'duration', label: 'Duration', type: 'select', required: true, options: ['One session', '3 months', '6 months', 'Full academic year'] },
    { key: 'note', label: 'Note', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => (rows.some((r) => r.id !== existing?.id && r.studentId === v.studentId && r.focus === v.focus && (r.status === 'Pending' || r.status === 'Matched')) ? { focus: 'This student already has an open request for this focus area' } : {}),
  prepare: (_v, { existing }) => ({ status: existing?.status ?? ('Pending' as const), requestedOn: existing?.requestedOn ?? todayISO() }),
  actions: [
    { key: 'match', label: 'Match mentor', icon: 'user-check', visible: (r) => r.status === 'Pending', form: { title: 'Match mentor', submitLabel: 'Match', fields: [{ key: 'alumnusId', label: 'Mentor', type: 'select', required: true, options: mentorOptions }], initial: (r) => ({ alumnusId: r.alumnusId }) }, run: (r, v, ctx) => { ctx.update({ alumnusId: v.alumnusId, status: 'Matched' }); ctx.toast(`${studentOf(r.studentId)?.name} matched with ${alumnusName(v.alumnusId)}`); } },
    { key: 'complete', label: 'Mark completed', icon: 'check-circle', visible: (r) => r.status === 'Matched', run: (r, _v, ctx) => { ctx.update({ status: 'Completed' }); ctx.toast('Mentoring completed'); } },
    { key: 'decline', label: 'Decline', icon: 'x', tone: 'danger', visible: (r) => r.status === 'Pending', form: { title: 'Decline request', submitLabel: 'Decline', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] }, run: (r, v, ctx) => { ctx.update({ status: 'Declined', note: v.reason }); ctx.toast('Request declined', 'info'); } },
  ],
};
