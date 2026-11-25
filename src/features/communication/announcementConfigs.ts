import { repo, snapshot } from '@/core/store/store';
import { formatDate, formatTime, todayISO } from '@/core/utils/date';
import {
  ANN_CATEGORIES,
  ANN_CHANNELS,
  AUDIENCES,
  BROADCAST_CHANNELS,
  CADENCES,
  NOTICE_CATEGORIES,
  NTF_CATEGORIES,
  type AnnouncementRecord,
  type BroadcastRecord,
  type NoticeRecord,
  type NotificationRecord,
} from '@/data/seed/communication';
import type { ClassRecord } from '@/data/seed/master';
import { opts } from '@/features/academic/helpers';
import { countBy } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import {
  MAX_PINNED,
  annDue,
  annState,
  audienceCount,
  audienceProblem,
  broadcastBlockers,
  needsApproval,
  nextOccurrence,
  noticeState,
  ntfWhen,
  pinnedLive,
  publishBlockers,
  type AnnState,
} from './commLogic';

const className = (id: string) => snapshot<ClassRecord>('classes').find((c) => c.id === id)?.name ?? '';
const classChoice = () => [{ label: 'All classes', value: '' }, ...snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id }))];
const withClass = (audience: string, classId: string) => (classId ? `${audience} · ${className(classId)}` : audience);
const classApplies = (audience: unknown) => audience === 'Students' || audience === 'Parents';
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : '—');
const nowHHmm = () => `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`;
const clip = (s: string, n = 120) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const priorityTone: Record<string, Tone> = { Urgent: 'danger', High: 'warning', Normal: 'neutral', Medium: 'warning', Low: 'neutral' };

/* ------------------------------------ Announcements ------------------------------------ */

const annTone: Record<AnnState, Tone> = { Draft: 'neutral', Scheduled: 'info', Published: 'success', Expired: 'warning', Archived: 'neutral' };
const ANN_STATES: AnnState[] = ['Published', 'Scheduled', 'Draft', 'Expired', 'Archived'];
const liveCount = (rows: AnnouncementRecord[]) => rows.filter((r) => annState(r) === 'Published');

export const announcementsCfg: ResourceConfig<AnnouncementRecord> = {
  entity: 'Announcement',
  collection: 'announcements',
  auditEntity: 'announcement',
  searchPlaceholder: 'Search title, category, author…',
  searchText: (r) => `${r.title} ${r.summary} ${r.body} ${r.category} ${r.author} ${r.audience}`,
  code: (r) => r.category,
  title: (r) => r.title,
  subtitle: (r) => `${withClass(r.audience, r.classId)} · ${r.channels.join(', ')}`,
  status: (r) => ({ label: annState(r), tone: annTone[annState(r)] }),
  badges: (r) => [
    { label: r.priority, tone: priorityTone[r.priority] },
    ...(annDue(r) ? [{ label: 'Due to publish', tone: 'warning' as Tone }] : []),
    ...(r.ackRequired ? [{ label: 'Acknowledgement required', tone: 'info' as Tone }] : []),
  ],
  facts: [
    { label: 'Date', value: (r) => `${r.status === 'Scheduled' ? 'Goes out ' : ''}${formatDate(r.dated)} · expires ${formatDate(r.expires)}` },
    { label: 'Summary', value: (r) => clip(r.summary, 90) },
    { label: 'Reach', value: (r) => (r.delivered ? `${r.delivered} delivered · ${r.readers} read (${pct(r.readers, r.delivered)})` : undefined) },
    { label: 'Acknowledged', value: (r) => (r.ackRequired && r.delivered ? `${r.acknowledged} of ${r.readers} readers (${pct(r.acknowledged, r.readers)})` : undefined) },
    { label: 'Author', value: (r) => r.author },
  ],
  detail: [
    { title: 'Announcement', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Priority', value: (r) => r.priority }, { label: 'Status', value: (r) => annState(r) }, { label: 'Author', value: (r) => r.author }, { label: 'Date', value: (r) => formatDate(r.dated) }, { label: 'Expires', value: (r) => formatDate(r.expires) }] },
    { title: 'Message', items: [{ label: 'Summary', value: (r) => r.summary || '—' }, { label: 'Body', value: (r) => r.body }] },
    { title: 'Delivery', items: [{ label: 'Audience', value: (r) => withClass(r.audience, r.classId) }, { label: 'People now in this audience', value: (r) => audienceCount(r.audience, r.classId) }, { label: 'Channels', value: (r) => r.channels.join(', ') }, { label: 'Delivered', value: (r) => r.delivered }, { label: 'Read', value: (r) => `${r.readers} (${pct(r.readers, r.delivered)})` }, { label: 'Acknowledgement', value: (r) => (r.ackRequired ? `${r.acknowledged} acknowledged (${pct(r.acknowledged, r.readers)} of readers)` : 'Not required') }] },
    { title: 'Comments', items: [{ label: 'Allowed', value: (r) => (r.allowComments ? 'Yes' : 'No') }, { label: 'Thread', value: (r) => r.comments.map((c) => `${c.author} · ${formatDate(c.at.slice(0, 10))}: ${c.body}`).join('\n') || 'No comments' }] },
  ],
  stats: [
    { label: 'Announcements', value: (rows) => rows.length, icon: 'volume-2' },
    { label: 'Live now', value: (rows) => liveCount(rows).length, tone: 'success', icon: 'radio' },
    { label: 'Scheduled', value: (rows) => countBy(rows, (r) => r.status === 'Scheduled'), tone: 'info', icon: 'calendar' },
    { label: 'Drafts', value: (rows) => countBy(rows, (r) => r.status === 'Draft'), tone: 'neutral', icon: 'edit-3' },
    { label: 'Average read rate', value: (rows) => { const sent = rows.filter((r) => r.delivered > 0); return pct(sent.reduce((n, r) => n + r.readers, 0), sent.reduce((n, r) => n + r.delivered, 0)); }, tone: 'primary', icon: 'eye' },
    { label: 'Due to publish', value: (rows) => countBy(rows, (r) => annDue(r)), tone: 'warning', icon: 'alert-circle' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...ANN_STATES.map((s) => ({ key: s, label: s, match: (r: AnnouncementRecord) => annState(r) === s }))],
  filters: [
    { key: 'category', label: 'Category', options: opts(ANN_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'priority', label: 'Priority', options: opts(['Urgent', 'High', 'Normal']), match: (r, v) => r.priority === v },
    { key: 'audience', label: 'Audience', options: opts(AUDIENCES), match: (r, v) => r.audience === v },
    { key: 'channel', label: 'Channel', options: opts(ANN_CHANNELS), match: (r, v) => r.channels.includes(v as never) },
    { key: 'ack', label: 'Acknowledgement', single: true, options: opts(['Required', 'Not required']), match: (r, v) => r.ackRequired === (v === 'Required') },
  ],
  sorts: [
    { key: 'latest', label: 'Latest first', compare: (a, b) => b.dated.localeCompare(a.dated) },
    { key: 'priority', label: 'Priority', compare: (a, b) => ['Urgent', 'High', 'Normal'].indexOf(a.priority) - ['Urgent', 'High', 'Normal'].indexOf(b.priority) },
    { key: 'reach', label: 'Most read', compare: (a, b) => b.readers - a.readers },
    { key: 'title', label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
  ],
  form: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'summary', label: 'Short Summary', type: 'text', hint: 'Shown in the list and in push notifications' },
    { key: 'body', label: 'Announcement', type: 'textarea', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ANN_CATEGORIES, default: 'Academic' },
    { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['Urgent', 'High', 'Normal'], default: 'Normal' },
    { key: 'audience', label: 'Audience', type: 'select', required: true, options: AUDIENCES, default: 'All', section: 'Who receives it' },
    { key: 'classId', label: 'Class', type: 'select', options: classChoice, placeholder: 'All classes', hidden: (v) => !classApplies(v.audience) },
    { key: 'channels', label: 'Channels', type: 'multiselect', required: true, options: ANN_CHANNELS, default: ['In-App'] },
    { key: 'ackRequired', label: 'Ask readers to acknowledge', type: 'switch', default: false },
    { key: 'allowComments', label: 'Allow comments', type: 'switch', default: true },
    { key: 'status', label: 'When', type: 'select', required: true, options: [{ label: 'Save as draft', value: 'Draft' }, { label: 'Schedule for a later day', value: 'Scheduled' }, { label: 'Publish now', value: 'Published' }], default: 'Draft', section: 'Publishing' },
    { key: 'dated', label: 'Publish On', type: 'date', hidden: (v) => v.status !== 'Scheduled' },
    { key: 'expires', label: 'Expires On', type: 'date', required: true },
  ],
  defaults: () => ({ dated: todayISO(), expires: '' }),
  validate: (v, { existing }) => {
    const today = todayISO();
    const publishDay = v.status === 'Scheduled' ? String(v.dated) : today;
    const classId = classApplies(v.audience) ? String(v.classId ?? '') : '';
    const live = v.status !== 'Draft';
    const problem = live ? audienceProblem(v.audience, classId) : undefined;
    return {
      ...(v.status === 'Scheduled' && !String(v.dated) ? { dated: 'Choose the day it goes out' } : {}),
      ...(v.status === 'Scheduled' && String(v.dated) && String(v.dated) <= today ? { dated: 'A scheduled announcement must be for a future day' } : {}),
      ...(String(v.expires) && String(v.expires) < publishDay ? { expires: 'It cannot expire before it goes out' } : {}),
      ...(v.status === 'Published' && String(v.expires) && String(v.expires) < today ? { expires: 'This date has already passed' } : {}),
      ...(problem ? { audience: problem } : {}),
      ...(existing && existing.status === 'Published' ? { title: 'A published announcement cannot be edited' } : {}),
    };
  },
  prepare: (v, { existing, user }) => {
    const publishing = v.status === 'Published';
    const classId = classApplies(v.audience) ? String(v.classId ?? '') : '';
    return {
      classId,
      author: existing?.author ?? user?.name ?? 'Administrator',
      dated: publishing ? todayISO() : v.status === 'Scheduled' ? String(v.dated) : existing?.dated ?? todayISO(),
      delivered: publishing ? audienceCount(v.audience, classId) : 0,
      readers: publishing ? 0 : existing?.readers ?? 0,
      acknowledged: publishing ? 0 : existing?.acknowledged ?? 0,
      comments: existing?.comments ?? [],
    };
  },
  editable: (r) => r.status === 'Draft' || r.status === 'Scheduled',
  canDeleteRecord: (r) => (r.status === 'Published' ? 'A published announcement has been delivered. Archive it instead.' : null),
  actions: [
    {
      key: 'publish',
      label: 'Publish now',
      icon: 'send',
      tone: 'success',
      visible: (r) => r.status === 'Draft' || r.status === 'Scheduled',
      confirm: 'Publish this announcement to its audience now?',
      run: (r, _v, ctx) => {
        const blockers = publishBlockers(r);
        if (blockers.length) { ctx.toast(blockers[0], 'error'); return; }
        const delivered = audienceCount(r.audience, r.classId);
        ctx.update({ status: 'Published', dated: todayISO(), delivered, readers: 0, acknowledged: 0 });
        ctx.toast(`Published to ${delivered} people`);
      },
    },
    {
      key: 'schedule',
      label: 'Schedule',
      icon: 'calendar',
      visible: (r) => r.status === 'Draft',
      form: { title: 'Schedule announcement', submitLabel: 'Schedule', fields: [{ key: 'on', label: 'Publish On', type: 'date', required: true }], validate: (v, r) => (String(v.on) <= todayISO() ? { on: 'Choose a future day' } : r.expires < String(v.on) ? { on: 'This is after the expiry date' } : {}) },
      run: (r, v, ctx) => {
        const blockers = publishBlockers({ ...r, dated: v.on });
        if (blockers.length) { ctx.toast(blockers[0], 'error'); return; }
        ctx.update({ status: 'Scheduled', dated: v.on });
        ctx.toast(`Scheduled for ${formatDate(v.on)}`);
      },
    },
    { key: 'unschedule', label: 'Back to draft', icon: 'rotate-ccw', visible: (r) => r.status === 'Scheduled', run: (_r, _v, ctx) => { ctx.update({ status: 'Draft' }); ctx.toast('Moved back to drafts'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status === 'Published', confirm: 'Archive this announcement? It stops showing to its audience.', run: (_r, _v, ctx) => { ctx.update({ status: 'Archived' }); ctx.toast('Archived'); } },
    { key: 'restore', label: 'Restore as draft', icon: 'rotate-ccw', visible: (r) => r.status === 'Archived', run: (_r, _v, ctx) => { ctx.update({ status: 'Draft' }); ctx.toast('Restored as a draft'); } },
    {
      key: 'comment',
      label: 'Add comment',
      icon: 'message-circle',
      manage: false,
      visible: (r) => r.allowComments && annState(r) === 'Published',
      form: { title: 'Add comment', submitLabel: 'Post', fields: [{ key: 'body', label: 'Comment', type: 'textarea', required: true }], validate: (v) => (String(v.body).trim().length > 500 ? { body: 'Keep it under 500 characters' } : {}) },
      run: (r, v, ctx) => { ctx.update({ comments: [...r.comments, { author: ctx.user?.name ?? 'Administrator', at: new Date().toISOString(), body: String(v.body).trim() }] }); ctx.toast('Comment posted'); },
    },
    {
      key: 'duplicate',
      label: 'Duplicate as draft',
      icon: 'copy',
      run: (r, _v, ctx) => { repo<AnnouncementRecord>('announcements').create({ ...r, id: undefined, title: `${r.title} (copy)`, status: 'Draft', dated: todayISO(), delivered: 0, readers: 0, acknowledged: 0, comments: [], author: ctx.user?.name ?? r.author }); ctx.toast('Draft created'); },
    },
    { key: 'share', label: 'Share', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.title, `${r.title}\n${r.category} · ${r.priority} priority\n\n${r.body}\n\nValid until ${formatDate(r.expires)}`) },
  ],
  exportColumns: [
    { label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Priority', value: (r) => r.priority }, { label: 'Status', value: (r) => annState(r) },
    { label: 'Audience', value: (r) => withClass(r.audience, r.classId) }, { label: 'Channels', value: (r) => r.channels.join(' / ') }, { label: 'Date', value: (r) => r.dated }, { label: 'Expires', value: (r) => r.expires },
    { label: 'Delivered', value: (r) => r.delivered }, { label: 'Read', value: (r) => r.readers }, { label: 'Acknowledged', value: (r) => r.acknowledged },
  ],
};

/* ------------------------------------- Notice board ------------------------------------- */

const noticeTone: Record<string, Tone> = { Published: 'success', Draft: 'neutral', Expired: 'warning', Archived: 'neutral' };
const noticeCatTone: Record<string, Tone> = { Emergency: 'danger', Important: 'warning', Holiday: 'info', Examination: 'primary', Event: 'primary', Circular: 'neutral', General: 'neutral' };

export const noticesCfg: ResourceConfig<NoticeRecord> = {
  entity: 'Notice',
  collection: 'notices',
  auditEntity: 'notice',
  searchPlaceholder: 'Search notice, department, publisher…',
  searchText: (r) => `${r.title} ${r.desc} ${r.full} ${r.category} ${r.department} ${r.publisher}`,
  code: (r) => r.category,
  title: (r) => `${r.pinned ? '📌 ' : ''}${r.title}`,
  subtitle: (r) => `${withClass(r.audience, r.classId)} · ${r.department}`,
  status: (r) => ({ label: noticeState(r), tone: noticeTone[noticeState(r)] }),
  badges: (r) => [{ label: r.category, tone: noticeCatTone[r.category] }, { label: `${r.priority} priority`, tone: priorityTone[r.priority] }],
  facts: [
    { label: 'About', value: (r) => clip(r.desc, 100) },
    { label: 'Published', value: (r) => `${formatDate(r.published)} by ${r.publisher}` },
    { label: 'Valid until', value: (r) => formatDate(r.expiry) },
    { label: 'Read by', value: (r) => (r.reads ? `${r.reads} people` : undefined) },
    { label: 'Comments', value: (r) => (r.comments.length ? r.comments.length : undefined) },
  ],
  detail: [
    { title: 'Notice', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Priority', value: (r) => r.priority }, { label: 'Status', value: (r) => noticeState(r) }, { label: 'Pinned', value: (r) => (r.pinned ? 'Yes' : 'No') }] },
    { title: 'Content', items: [{ label: 'Summary', value: (r) => r.desc }, { label: 'Full notice', value: (r) => r.full }] },
    { title: 'Audience', items: [{ label: 'Audience', value: (r) => withClass(r.audience, r.classId) }, { label: 'Department', value: (r) => r.department }, { label: 'Branch', value: (r) => r.branch }, { label: 'Published', value: (r) => `${formatDate(r.published)} by ${r.publisher}` }, { label: 'Valid until', value: (r) => formatDate(r.expiry) }, { label: 'Read by', value: (r) => r.reads }] },
    { title: 'Comments', items: [{ label: 'Thread', value: (r) => r.comments.map((c) => `${c.author} · ${formatDate(c.at.slice(0, 10))}: ${c.body}`).join('\n') || 'No comments' }] },
  ],
  stats: [
    { label: 'Notices', value: (rows) => rows.length, icon: 'clipboard' },
    { label: 'Live', value: (rows) => countBy(rows, (r) => noticeState(r) === 'Published'), tone: 'success', icon: 'radio' },
    { label: 'Pinned', value: (rows) => `${pinnedLive(rows)} of ${MAX_PINNED}`, tone: 'primary', icon: 'bookmark' },
    { label: 'Drafts', value: (rows) => countBy(rows, (r) => r.status === 'Draft'), tone: 'neutral', icon: 'edit-3' },
    { label: 'Expired', value: (rows) => countBy(rows, (r) => noticeState(r) === 'Expired'), tone: 'warning', icon: 'clock' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...['Published', 'Draft', 'Expired', 'Archived'].map((s) => ({ key: s, label: s, match: (r: NoticeRecord) => noticeState(r) === s })), { key: 'pinned', label: 'Pinned', match: (r) => r.pinned && noticeState(r) === 'Published' }],
  filters: [
    { key: 'category', label: 'Category', options: opts(NOTICE_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'priority', label: 'Priority', options: opts(['High', 'Medium', 'Low']), match: (r, v) => r.priority === v },
    { key: 'audience', label: 'Audience', options: opts(AUDIENCES), match: (r, v) => r.audience === v },
    { key: 'department', label: 'Department', options: (rows) => opts([...new Set(rows.map((r) => r.department))].sort()), match: (r, v) => r.department === v },
  ],
  sorts: [
    { key: 'pinned', label: 'Pinned first', compare: (a, b) => Number(b.pinned) - Number(a.pinned) || b.published.localeCompare(a.published) },
    { key: 'latest', label: 'Latest first', compare: (a, b) => b.published.localeCompare(a.published) },
    { key: 'expiry', label: 'Expiring soonest', compare: (a, b) => a.expiry.localeCompare(b.expiry) },
  ],
  form: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'desc', label: 'Short Description', type: 'text', required: true },
    { key: 'full', label: 'Full Notice', type: 'textarea', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: NOTICE_CATEGORIES, default: 'General' },
    { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['High', 'Medium', 'Low'], default: 'Medium' },
    { key: 'audience', label: 'Audience', type: 'select', required: true, options: AUDIENCES, default: 'All' },
    { key: 'classId', label: 'Class', type: 'select', options: classChoice, placeholder: 'All classes', hidden: (v) => !classApplies(v.audience) },
    { key: 'department', label: 'Department', type: 'text', required: true },
    { key: 'branch', label: 'Branch', type: 'text', default: 'Main Campus' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: [{ label: 'Save as draft', value: 'Draft' }, { label: 'Publish now', value: 'Published' }], default: 'Published' },
    { key: 'expiry', label: 'Valid Until', type: 'date', required: true },
    { key: 'pinned', label: `Pin to the top (max ${MAX_PINNED})`, type: 'switch', default: false },
  ],
  validate: (v, { existing, rows }) => {
    const live = v.status === 'Published';
    return {
      ...(live && String(v.expiry) < todayISO() ? { expiry: 'A published notice must be valid until today or later' } : {}),
      ...(live && v.pinned && pinnedLive(rows, existing?.id) >= MAX_PINNED ? { pinned: `Only ${MAX_PINNED} notices can be pinned. Unpin one first.` } : {}),
      ...(live ? (audienceProblem(v.audience, classApplies(v.audience) ? String(v.classId ?? '') : '') ? { audience: audienceProblem(v.audience, classApplies(v.audience) ? String(v.classId ?? '') : '') } : {}) : {}),
    };
  },
  prepare: (v, { existing, user }) => ({
    classId: classApplies(v.audience) ? String(v.classId ?? '') : '',
    publisher: existing?.publisher ?? user?.name ?? 'Administrator',
    published: existing && existing.status === 'Published' ? existing.published : v.status === 'Published' ? todayISO() : existing?.published ?? todayISO(),
    reads: existing?.reads ?? 0,
    comments: existing?.comments ?? [],
  }),
  editable: (r) => r.status === 'Draft',
  canDeleteRecord: (r) => (r.status === 'Published' && noticeState(r) === 'Published' ? 'A live notice has been seen. Archive it instead.' : null),
  actions: [
    {
      key: 'publish',
      label: 'Publish',
      icon: 'send',
      tone: 'success',
      visible: (r) => r.status === 'Draft',
      run: (r, _v, ctx) => {
        if (r.expiry < todayISO()) { ctx.toast('The validity date has passed. Edit the notice first.', 'error'); return; }
        if (r.pinned && pinnedLive(ctx.rows, r.id) >= MAX_PINNED) { ctx.toast(`Only ${MAX_PINNED} notices can be pinned. Unpin one first.`, 'error'); return; }
        const p = audienceProblem(r.audience, r.classId);
        if (p) { ctx.toast(p, 'error'); return; }
        ctx.update({ status: 'Published', published: todayISO(), reads: 0 });
        ctx.toast('Notice published');
      },
    },
    {
      key: 'pin',
      label: 'Pin to top',
      icon: 'bookmark',
      visible: (r) => !r.pinned && noticeState(r) === 'Published',
      run: (r, _v, ctx) => { if (pinnedLive(ctx.rows, r.id) >= MAX_PINNED) { ctx.toast(`Only ${MAX_PINNED} notices can be pinned. Unpin one first.`, 'error'); return; } ctx.update({ pinned: true }); ctx.toast('Pinned'); },
    },
    { key: 'unpin', label: 'Unpin', icon: 'bookmark', visible: (r) => r.pinned, run: (_r, _v, ctx) => { ctx.update({ pinned: false }); ctx.toast('Unpinned'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status === 'Published', confirm: 'Archive this notice? It leaves the board.', run: (_r, _v, ctx) => { ctx.update({ status: 'Archived', pinned: false }); ctx.toast('Archived'); } },
    { key: 'restore', label: 'Restore as draft', icon: 'rotate-ccw', visible: (r) => r.status === 'Archived', run: (_r, _v, ctx) => { ctx.update({ status: 'Draft' }); ctx.toast('Restored as a draft'); } },
    {
      key: 'comment',
      label: 'Add comment',
      icon: 'message-circle',
      manage: false,
      visible: (r) => noticeState(r) === 'Published',
      form: { title: 'Add comment', submitLabel: 'Post', fields: [{ key: 'body', label: 'Comment', type: 'textarea', required: true }] },
      run: (r, v, ctx) => { ctx.update({ comments: [...r.comments, { author: ctx.user?.name ?? 'Administrator', at: new Date().toISOString(), body: String(v.body).trim() }] }); ctx.toast('Comment posted'); },
    },
    { key: 'share', label: 'Share', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.title, `NOTICE — ${r.title}\n${r.category} · ${r.priority} priority\n\n${r.full}\n\nIssued by ${r.publisher}. Valid until ${formatDate(r.expiry)}.`) },
  ],
};

/* ---------------------------------- Broadcast scheduler ---------------------------------- */

const bcTone: Record<string, Tone> = { Scheduled: 'info', Draft: 'neutral', Paused: 'warning', Completed: 'success', Cancelled: 'danger' };
const apprTone: Record<string, Tone> = { 'Awaiting approval': 'warning', Approved: 'success', 'Auto-approved': 'success', Rejected: 'danger' };
const BC_CATEGORIES = ['Attendance', 'Fees', 'Events', 'Examination', 'Newsletter', 'Admissions', 'Staff', 'Greetings', 'General'];
const SEND_OK = (b: BroadcastRecord) => b.approval === 'Approved' || b.approval === 'Auto-approved';
const stampOf = (b: BroadcastRecord) => `${b.sendDate}T${b.sendTime}`;
const isDue = (b: BroadcastRecord, now = new Date()) => b.status === 'Scheduled' && SEND_OK(b) && stampOf(b) <= `${todayISO()}T${nowHHmm()}` && now.getTime() > 0;

/** The change a send makes: counts go up, and the next date is worked out (or the broadcast is complete). */
export function afterSend(b: BroadcastRecord): Partial<BroadcastRecord> {
  const today = todayISO();
  const delivered = b.delivered + audienceCount(b.audience, b.classId);
  const base = { sentTimes: b.sentTimes + 1, lastSent: today, delivered };
  if (b.cadence === 'One-off') return { ...base, status: 'Completed' as const };
  let next = nextOccurrence(b.sendDate, b.cadence);
  for (let i = 0; i < 1000 && next <= today; i += 1) next = nextOccurrence(next, b.cadence); // catch up after missed days: one send, then the next future date
  if (b.expires && next > b.expires) return { ...base, status: 'Completed' as const };
  return { ...base, sendDate: next };
}

const trailEntry = (who: string | undefined, state: string, note = '') => ({ who: who ?? 'Administrator', state, at: todayISO(), note });

export const broadcastsCfg: ResourceConfig<BroadcastRecord> = {
  entity: 'Broadcast',
  collection: 'broadcasts',
  auditEntity: 'broadcast',
  searchPlaceholder: 'Search broadcast, category, creator…',
  searchText: (r) => `${r.title} ${r.category} ${r.body} ${r.createdBy} ${r.audience}`,
  code: (r) => r.category,
  title: (r) => r.title,
  subtitle: (r) => `${withClass(r.audience, r.classId)} · ${r.channels.join(', ')}`,
  status: (r) => ({ label: r.status, tone: bcTone[r.status] }),
  badges: (r) => [{ label: r.approval, tone: apprTone[r.approval] }, { label: r.cadence, tone: 'primary' }, ...(isDue(r) ? [{ label: 'Due now', tone: 'warning' as Tone }] : [])],
  facts: [
    { label: 'Next send', value: (r) => (r.status === 'Scheduled' || r.status === 'Paused' || r.status === 'Draft' ? `${formatDate(r.sendDate)} at ${formatTime(r.sendTime)}` : undefined) },
    { label: 'Repeats', value: (r) => (r.cadence === 'One-off' ? 'One-off' : `${r.cadence}${r.expires ? ` until ${formatDate(r.expires)}` : ''}`) },
    { label: 'Sent', value: (r) => (r.sentTimes ? `${r.sentTimes} time${r.sentTimes === 1 ? '' : 's'} · ${r.delivered} deliveries · last ${formatDate(r.lastSent)}` : 'Not sent yet') },
    { label: 'Created', value: (r) => `${r.createdBy} · ${formatDate(r.createdOn)}` },
  ],
  detail: [
    { title: 'Broadcast', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Message', value: (r) => r.body }, { label: 'Status', value: (r) => r.status }, { label: 'Approval', value: (r) => r.approval }] },
    { title: 'Schedule', items: [{ label: 'Send date', value: (r) => formatDate(r.sendDate) }, { label: 'Send time', value: (r) => formatTime(r.sendTime) }, { label: 'Repeats', value: (r) => r.cadence }, { label: 'Ends', value: (r) => (r.expires ? formatDate(r.expires) : 'No end date') }] },
    { title: 'Reach', items: [{ label: 'Audience', value: (r) => withClass(r.audience, r.classId) }, { label: 'People now in this audience', value: (r) => audienceCount(r.audience, r.classId) }, { label: 'Channels', value: (r) => r.channels.join(', ') }, { label: 'Times sent', value: (r) => r.sentTimes }, { label: 'Deliveries', value: (r) => r.delivered }] },
    { title: 'Approval trail', items: [{ label: 'History', value: (r) => r.trail.map((t) => `${formatDate(t.at)} · ${t.who} · ${t.state}${t.note ? ` — ${t.note}` : ''}`).join('\n') }] },
  ],
  pageActions: [
    {
      key: 'runDue',
      label: 'Send due broadcasts',
      icon: 'play',
      run: (_v, ctx) => {
        const due = ctx.rows.filter((r) => isDue(r));
        if (!due.length) { ctx.toast('Nothing is due right now', 'info'); return; }
        const patches = new Map(due.map((r) => [r.id, afterSend(r)]));
        ctx.updateMany([...patches.keys()], (r) => patches.get(r.id) ?? {});
        ctx.toast(`${due.length} broadcast${due.length === 1 ? '' : 's'} sent`);
      },
    },
  ],
  stats: [
    { label: 'Broadcasts', value: (rows) => rows.length, icon: 'radio' },
    { label: 'Scheduled', value: (rows) => countBy(rows, (r) => r.status === 'Scheduled'), tone: 'info', icon: 'calendar' },
    { label: 'Awaiting approval', value: (rows) => countBy(rows, (r) => r.approval === 'Awaiting approval' && r.status !== 'Cancelled'), tone: 'warning', icon: 'clock' },
    { label: 'Due now', value: (rows) => countBy(rows, (r) => isDue(r)), tone: 'danger', icon: 'alert-circle' },
    { label: 'Recurring', value: (rows) => countBy(rows, (r) => r.cadence !== 'One-off' && r.status === 'Scheduled'), tone: 'primary', icon: 'repeat' },
    { label: 'Deliveries to date', value: (rows) => rows.reduce((n, r) => n + r.delivered, 0), tone: 'success', icon: 'send' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...['Scheduled', 'Draft', 'Paused', 'Completed', 'Cancelled'].map((s) => ({ key: s, label: s, match: (r: BroadcastRecord) => r.status === s })), { key: 'approval', label: 'Needs approval', match: (r) => r.approval === 'Awaiting approval' && r.status !== 'Cancelled' }],
  filters: [
    { key: 'category', label: 'Category', options: opts(BC_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'cadence', label: 'Repeats', options: opts(CADENCES), match: (r, v) => r.cadence === v },
    { key: 'audience', label: 'Audience', options: opts(AUDIENCES), match: (r, v) => r.audience === v },
    { key: 'channel', label: 'Channel', options: opts(BROADCAST_CHANNELS), match: (r, v) => r.channels.includes(v as never) },
    { key: 'approval', label: 'Approval', options: opts(['Awaiting approval', 'Approved', 'Auto-approved', 'Rejected']), match: (r, v) => r.approval === v },
  ],
  sorts: [
    { key: 'next', label: 'Next to send', compare: (a, b) => stampOf(a).localeCompare(stampOf(b)) },
    { key: 'created', label: 'Newest', compare: (a, b) => b.createdOn.localeCompare(a.createdOn) },
    { key: 'title', label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
  ],
  form: [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: BC_CATEGORIES, default: 'General' },
    { key: 'body', label: 'Message', type: 'textarea', required: true },
    { key: 'audience', label: 'Audience', type: 'select', required: true, options: AUDIENCES, default: 'Parents', section: 'Who receives it' },
    { key: 'classId', label: 'Class', type: 'select', options: classChoice, placeholder: 'All classes', hidden: (v) => !classApplies(v.audience) },
    { key: 'channels', label: 'Channels', type: 'multiselect', required: true, options: BROADCAST_CHANNELS, default: ['Email'], hint: 'SMS, WhatsApp and Everyone need approval' },
    { key: 'sendDate', label: 'Send On', type: 'date', required: true, section: 'Schedule' },
    { key: 'sendTime', label: 'Send At', type: 'time', required: true, default: '09:00' },
    { key: 'cadence', label: 'Repeats', type: 'select', required: true, options: CADENCES, default: 'One-off' },
    { key: 'expires', label: 'Stop Repeating After', type: 'date', hidden: (v) => v.cadence === 'One-off', hint: 'Leave empty to repeat until cancelled' },
    { key: 'status', label: 'Save As', type: 'select', required: true, options: [{ label: 'Draft', value: 'Draft' }, { label: 'Scheduled', value: 'Scheduled' }], default: 'Scheduled' },
  ],
  defaults: () => ({ sendDate: todayISO() }),
  validate: (v) => {
    const classId = classApplies(v.audience) ? String(v.classId ?? '') : '';
    const all = broadcastBlockers({ title: String(v.title), body: String(v.body), channels: v.channels, audience: v.audience, classId, sendDate: String(v.sendDate), sendTime: String(v.sendTime), expires: v.cadence === 'One-off' ? '' : String(v.expires ?? ''), cadence: v.cadence });
    const scheduled = v.status === 'Scheduled';
    return {
      ...(scheduled && all.some((b) => b.startsWith('The send time')) ? { sendTime: 'The send time is in the past' } : {}),
      ...(v.cadence !== 'One-off' && String(v.expires ?? '') && String(v.expires) < String(v.sendDate) ? { expires: 'This is before the first send' } : {}),
      ...(scheduled && all.some((b) => /audience/i.test(b) || b.startsWith('No one')) ? { audience: all.find((b) => /audience|No one|class/i.test(b))?.replace(/\.$/, '') } : {}),
    };
  },
  prepare: (v, { existing, user }) => {
    const classId = classApplies(v.audience) ? String(v.classId ?? '') : '';
    const material = (x: object) => { const r = x as Record<string, unknown>; return JSON.stringify([r.audience, r.classId, r.channels, String(r.body).trim(), r.sendDate, r.sendTime, r.cadence]); };
    const needs = needsApproval({ audience: v.audience, channels: v.channels });
    const unchanged = !!existing && material(existing) === material({ ...v, classId });
    const approval = !needs ? ('Auto-approved' as const) : unchanged && existing?.approval === 'Approved' ? ('Approved' as const) : ('Awaiting approval' as const);
    const trail = existing ? [...existing.trail] : [trailEntry(user?.name, 'Created')];
    if (existing && approval !== existing.approval) trail.push(trailEntry(user?.name, approval === 'Awaiting approval' ? 'Edited — approval needed again' : 'Approval no longer needed'));
    if (!existing && needs) trail.push(trailEntry(user?.name, 'Submitted for approval'));
    return {
      classId,
      expires: v.cadence === 'One-off' ? '' : String(v.expires ?? ''),
      approval,
      trail,
      sentTimes: existing?.sentTimes ?? 0,
      lastSent: existing?.lastSent ?? '',
      delivered: existing?.delivered ?? 0,
      createdBy: existing?.createdBy ?? user?.name ?? 'Administrator',
      createdOn: existing?.createdOn ?? todayISO(),
    };
  },
  editable: (r) => r.status === 'Draft' || r.status === 'Scheduled' || r.status === 'Paused',
  canDeleteRecord: (r) => (r.status === 'Scheduled' || r.status === 'Paused' ? 'Cancel this broadcast before deleting it.' : null),
  actions: [
    { key: 'approve', label: 'Approve', icon: 'check', tone: 'success', visible: (r) => r.approval === 'Awaiting approval' && r.status !== 'Cancelled' && r.status !== 'Completed', run: (r, _v, ctx) => { ctx.update({ approval: 'Approved', trail: [...r.trail, trailEntry(ctx.user?.name, 'Approved')] }); ctx.toast('Approved'); } },
    {
      key: 'reject',
      label: 'Reject',
      icon: 'x',
      tone: 'danger',
      visible: (r) => r.approval === 'Awaiting approval' && r.status !== 'Cancelled' && r.status !== 'Completed',
      form: { title: 'Reject broadcast', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason', type: 'text', required: true }] },
      run: (r, v, ctx) => { ctx.update({ approval: 'Rejected', status: 'Cancelled', trail: [...r.trail, trailEntry(ctx.user?.name, 'Rejected', String(v.reason).trim())] }); ctx.toast('Rejected and cancelled', 'info'); },
    },
    {
      key: 'sendNow',
      label: 'Send now',
      icon: 'send',
      tone: 'success',
      visible: (r) => r.status === 'Scheduled' || r.status === 'Draft',
      confirm: 'Send this broadcast to its audience now?',
      run: (r, _v, ctx) => {
        if (!SEND_OK(r)) { ctx.toast(r.approval === 'Rejected' ? 'This broadcast was rejected.' : 'It needs approval before it can be sent.', 'error'); return; }
        const blockers = broadcastBlockers({ ...r, sendDate: todayISO(), sendTime: '23:59' });
        if (blockers.length) { ctx.toast(blockers[0], 'error'); return; }
        const patch = afterSend(r);
        ctx.update(patch);
        ctx.toast(`Sent to ${audienceCount(r.audience, r.classId)} people`);
      },
    },
    { key: 'pause', label: 'Pause', icon: 'pause', visible: (r) => r.status === 'Scheduled', run: (_r, _v, ctx) => { ctx.update({ status: 'Paused' }); ctx.toast('Paused', 'info'); } },
    {
      key: 'resume',
      label: 'Resume',
      icon: 'play',
      visible: (r) => r.status === 'Paused',
      run: (r, _v, ctx) => {
        const today = todayISO();
        let date = r.sendDate;
        if (date < today) {
          if (r.cadence === 'One-off') { ctx.toast('The send date has passed. Edit the date first.', 'error'); return; }
          for (let i = 0; i < 1000 && date < today; i += 1) date = nextOccurrence(date, r.cadence);
          if (r.expires && date > r.expires) { ctx.toast('It has passed its end date. Edit the end date first.', 'error'); return; }
        }
        ctx.update({ status: 'Scheduled', sendDate: date });
        ctx.toast(`Resumed. Next send ${formatDate(date)}`);
      },
    },
    { key: 'cancel', label: 'Cancel broadcast', icon: 'slash', tone: 'danger', visible: (r) => r.status === 'Scheduled' || r.status === 'Paused' || r.status === 'Draft', confirm: 'Cancel this broadcast? It will not be sent.', run: (r, _v, ctx) => { ctx.update({ status: 'Cancelled', trail: [...r.trail, trailEntry(ctx.user?.name, 'Cancelled')] }); ctx.toast('Cancelled', 'info'); } },
    { key: 'duplicate', label: 'Duplicate as draft', icon: 'copy', run: (r, _v, ctx) => { repo<BroadcastRecord>('broadcasts').create({ ...r, id: undefined, title: `${r.title} (copy)`, status: 'Draft', approval: needsApproval(r) ? 'Awaiting approval' : 'Auto-approved', sendDate: todayISO(), sentTimes: 0, lastSent: '', delivered: 0, createdBy: ctx.user?.name ?? r.createdBy, createdOn: todayISO(), trail: [trailEntry(ctx.user?.name, 'Created')] }); ctx.toast('Draft created'); } },
  ],
};

/* --------------------------------- Notification center --------------------------------- */

const ntfStatusTone: Record<string, Tone> = { Sent: 'success', Scheduled: 'info', Draft: 'neutral', Failed: 'danger', Archived: 'neutral' };
const isNtfDue = (n: NotificationRecord) => n.status === 'Scheduled' && ntfWhen(n) <= 0;

const sendPatch = (n: NotificationRecord): Partial<NotificationRecord> => ({ status: 'Sent', failure: '', delivered: audienceCount(n.audience), read: 0, acknowledged: 0 });

export const notificationsCfg: ResourceConfig<NotificationRecord> = {
  entity: 'Notification',
  collection: 'notifications',
  auditEntity: 'notification',
  searchPlaceholder: 'Search notification, category…',
  searchText: (r) => `${r.title} ${r.summary} ${r.category} ${r.audience} ${r.createdBy}`,
  code: (r) => r.category,
  title: (r) => r.title,
  subtitle: (r) => `${r.audience} · ${r.channels.join(', ')}`,
  status: (r) => ({ label: r.status, tone: ntfStatusTone[r.status] }),
  badges: (r) => [{ label: r.priority, tone: priorityTone[r.priority] }, ...(r.automated ? [{ label: 'Automated', tone: 'primary' as Tone }] : []), ...(isNtfDue(r) ? [{ label: 'Due now', tone: 'warning' as Tone }] : [])],
  facts: [
    { label: 'When', value: (r) => `${formatDate(r.date)} at ${formatTime(r.time)}` },
    { label: 'Delivered', value: (r) => (r.delivered ? `${r.delivered} · ${r.read} read (${pct(r.read, r.delivered)})` : undefined) },
    { label: 'Acknowledged', value: (r) => (r.ackRequired && r.delivered ? `${r.acknowledged} (${pct(r.acknowledged, r.delivered)})` : undefined) },
    { label: 'Problem', value: (r) => r.failure || undefined },
    { label: 'Created by', value: (r) => r.createdBy },
  ],
  detail: [
    { title: 'Notification', items: [{ label: 'Title', value: (r) => r.title }, { label: 'Category', value: (r) => r.category }, { label: 'Message', value: (r) => r.summary }, { label: 'Priority', value: (r) => r.priority }, { label: 'Status', value: (r) => r.status }, { label: 'When', value: (r) => `${formatDate(r.date)} at ${formatTime(r.time)}` }, { label: 'Created by', value: (r) => `${r.createdBy}${r.automated ? ' (automated)' : ''}` }] },
    { title: 'Delivery', items: [{ label: 'Audience', value: (r) => r.audience }, { label: 'Channels', value: (r) => r.channels.join(', ') }, { label: 'Delivered', value: (r) => r.delivered }, { label: 'Read', value: (r) => `${r.read} (${pct(r.read, r.delivered)})` }, { label: 'Acknowledgement', value: (r) => (r.ackRequired ? `${r.acknowledged} acknowledged` : 'Not required') }, { label: 'Failure', value: (r) => r.failure || '—' }] },
  ],
  pageActions: [
    {
      key: 'runDue',
      label: 'Send due notifications',
      icon: 'play',
      run: (_v, ctx) => {
        const due = ctx.rows.filter(isNtfDue);
        if (!due.length) { ctx.toast('Nothing is due right now', 'info'); return; }
        const patches = new Map(due.map((r) => [r.id, sendPatch(r)]));
        ctx.updateMany([...patches.keys()], (r) => patches.get(r.id) ?? {});
        ctx.toast(`${due.length} notification${due.length === 1 ? '' : 's'} sent`);
      },
    },
    {
      key: 'retryFailed',
      label: 'Retry all failed',
      icon: 'refresh-cw',
      run: (_v, ctx) => {
        const failed = ctx.rows.filter((r) => r.status === 'Failed');
        if (!failed.length) { ctx.toast('No failed notifications', 'info'); return; }
        const patches = new Map(failed.map((r) => [r.id, sendPatch(r)]));
        ctx.updateMany([...patches.keys()], (r) => patches.get(r.id) ?? {});
        ctx.toast(`${failed.length} retried and sent`);
      },
    },
  ],
  stats: [
    { label: 'Notifications', value: (rows) => rows.length, icon: 'bell' },
    { label: 'Sent', value: (rows) => countBy(rows, (r) => r.status === 'Sent'), tone: 'success', icon: 'check-circle' },
    { label: 'Scheduled', value: (rows) => countBy(rows, (r) => r.status === 'Scheduled'), tone: 'info', icon: 'calendar' },
    { label: 'Failed', value: (rows) => countBy(rows, (r) => r.status === 'Failed'), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Average read rate', value: (rows) => { const sent = rows.filter((r) => r.delivered > 0); return pct(sent.reduce((n, r) => n + r.read, 0), sent.reduce((n, r) => n + r.delivered, 0)); }, tone: 'primary', icon: 'eye' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...['Sent', 'Scheduled', 'Draft', 'Failed', 'Archived'].map((s) => ({ key: s, label: s, match: (r: NotificationRecord) => r.status === s }))],
  filters: [
    { key: 'category', label: 'Category', options: opts(NTF_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'priority', label: 'Priority', options: opts(['Urgent', 'High', 'Normal', 'Low']), match: (r, v) => r.priority === v },
    { key: 'audience', label: 'Audience', options: opts(AUDIENCES), match: (r, v) => r.audience === v },
    { key: 'channel', label: 'Channel', options: opts(['Email', 'Push', 'Portal']), match: (r, v) => r.channels.includes(v as never) },
    { key: 'source', label: 'Source', single: true, options: opts(['Automated', 'Manual']), match: (r, v) => r.automated === (v === 'Automated') },
  ],
  sorts: [
    { key: 'latest', label: 'Latest first', compare: (a, b) => `${b.date}T${b.time}`.localeCompare(`${a.date}T${a.time}`) },
    { key: 'priority', label: 'Priority', compare: (a, b) => ['Urgent', 'High', 'Normal', 'Low'].indexOf(a.priority) - ['Urgent', 'High', 'Normal', 'Low'].indexOf(b.priority) },
    { key: 'title', label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
  ],
  form: [
    { key: 'category', label: 'Category', type: 'select', required: true, options: NTF_CATEGORIES, default: 'Academic' },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'summary', label: 'Message', type: 'textarea', required: true },
    { key: 'audience', label: 'Audience', type: 'select', required: true, options: AUDIENCES, default: 'Parents' },
    { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['Urgent', 'High', 'Normal', 'Low'], default: 'Normal' },
    { key: 'channels', label: 'Channels', type: 'multiselect', required: true, options: ['Email', 'Push', 'Portal'], default: ['Portal'] },
    { key: 'ackRequired', label: 'Ask recipients to acknowledge', type: 'switch', default: false },
    { key: 'status', label: 'When', type: 'select', required: true, options: [{ label: 'Save as draft', value: 'Draft' }, { label: 'Schedule', value: 'Scheduled' }, { label: 'Send now', value: 'Sent' }], default: 'Sent', section: 'Sending' },
    { key: 'date', label: 'Send On', type: 'date', hidden: (v) => v.status !== 'Scheduled' },
    { key: 'time', label: 'Send At', type: 'time', hidden: (v) => v.status !== 'Scheduled', default: '09:00' },
  ],
  defaults: () => ({ date: todayISO() }),
  validate: (v) => {
    const scheduled = v.status === 'Scheduled';
    const p = v.status !== 'Draft' ? audienceProblem(v.audience, '') : undefined;
    return {
      ...(scheduled && !String(v.date) ? { date: 'Choose the day' } : {}),
      ...(scheduled && String(v.date) && ntfWhen({ date: String(v.date), time: String(v.time || '00:00') }) <= 0 ? { time: 'Choose a time in the future' } : {}),
      ...(p ? { audience: p } : {}),
    };
  },
  prepare: (v, { existing, user }) => {
    const sending = v.status === 'Sent';
    return {
      date: sending ? todayISO() : v.status === 'Scheduled' ? String(v.date) : existing?.date ?? todayISO(),
      time: sending ? nowHHmm() : v.status === 'Scheduled' ? String(v.time) : existing?.time ?? nowHHmm(),
      delivered: sending ? audienceCount(v.audience) : 0,
      read: 0,
      acknowledged: 0,
      failure: '',
      createdBy: existing?.createdBy ?? user?.name ?? 'Administrator',
      automated: existing?.automated ?? false,
    };
  },
  editable: (r) => r.status === 'Draft' || r.status === 'Scheduled' || r.status === 'Failed',
  canDeleteRecord: (r) => (r.status === 'Sent' ? 'A sent notification is part of the delivery record. Archive it instead.' : null),
  actions: [
    {
      key: 'send',
      label: 'Send now',
      icon: 'send',
      tone: 'success',
      visible: (r) => r.status === 'Draft' || r.status === 'Scheduled',
      confirm: 'Send this notification now?',
      run: (r, _v, ctx) => {
        const p = audienceProblem(r.audience, '');
        if (p) { ctx.toast(p, 'error'); return; }
        if (!r.channels.length) { ctx.toast('Choose at least one channel first.', 'error'); return; }
        ctx.update({ ...sendPatch(r), date: todayISO(), time: nowHHmm() });
        ctx.toast(`Sent to ${audienceCount(r.audience)} people`);
      },
    },
    { key: 'retry', label: 'Retry', icon: 'refresh-cw', visible: (r) => r.status === 'Failed', run: (r, _v, ctx) => { ctx.update({ ...sendPatch(r), date: todayISO(), time: nowHHmm() }); ctx.toast('Retried and sent'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status === 'Sent', run: (_r, _v, ctx) => { ctx.update({ status: 'Archived' }); ctx.toast('Archived'); } },
    { key: 'restore', label: 'Restore', icon: 'rotate-ccw', visible: (r) => r.status === 'Archived', run: (_r, _v, ctx) => { ctx.update({ status: 'Sent' }); ctx.toast('Restored'); } },
    { key: 'duplicate', label: 'Duplicate as draft', icon: 'copy', run: (r, _v, ctx) => { repo<NotificationRecord>('notifications').create({ ...r, id: undefined, title: `${r.title} (copy)`, status: 'Draft', delivered: 0, read: 0, acknowledged: 0, failure: '', automated: false, createdBy: ctx.user?.name ?? r.createdBy, date: todayISO(), time: nowHHmm() }); ctx.toast('Draft created'); } },
  ],
};
