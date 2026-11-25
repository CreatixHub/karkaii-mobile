import { repo, snapshot } from '@/core/store/store';
import { formatDate, todayISO } from '@/core/utils/date';
import {
  AUDIENCES,
  SENDER_IDS,
  SMS_CATEGORIES,
  WA_LANGUAGES,
  type Audience,
  type SmsLogRecord,
  type SmsTemplateRecord,
  type WaMessage,
  type WaTemplateRecord,
  type WaThreadRecord,
} from '@/data/seed/communication';
import type { ClassRecord } from '@/data/seed/master';
import { opts } from '@/features/academic/helpers';
import { countBy } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import {
  REPLY_WINDOW_HOURS,
  SLA_MINUTES,
  SMS_MAX_CHARS,
  audienceCount,
  audienceProblem,
  lastMessage,
  matchesTemplate,
  replyWindowOpen,
  smsCost,
  smsMeasure,
  smsPlaceholders,
  threadSla,
  threadState,
  unreachable,
  validPhone,
  waBodyProblems,
  waNameOk,
  waPreview,
  waitText,
  waitingMinutes,
  type ThreadState,
} from './commLogic';

const className = (id: string) => snapshot<ClassRecord>('classes').find((c) => c.id === id)?.name ?? '';
const classChoice = () => [{ label: 'All classes', value: '' }, ...snapshot<ClassRecord>('classes').map((c) => ({ label: c.name, value: c.id }))];
const withClass = (audience: string, classId: string) => (classId ? `${audience} · ${className(classId)}` : audience);
const classApplies = (audience: unknown) => audience === 'Students' || audience === 'Parents';
const clip = (s: string, n = 100) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);
const money = (n: number) => `$${n.toFixed(2)}`;
const timeText = (iso: string) => new Date(iso).toLocaleString([], { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/* ----------------------------------------- Send SMS ----------------------------------------- */

const smsTone: Record<string, Tone> = { Delivered: 'success', Failed: 'danger', 'Pending DLR': 'warning', Queued: 'info', Rejected: 'danger' };
const approvedTemplates = () => snapshot<SmsTemplateRecord>('smsTemplates').filter((t) => t.status === 'Approved');

/** Counts and state for a message going out now. Numbers that cannot be dialled fail; if every one fails the send fails. */
export function smsDelivery(audience: Audience, classId: string, message: string): Pick<SmsLogRecord, 'recipients' | 'segments' | 'cost' | 'state' | 'failed' | 'reason'> {
  const recipients = audienceCount(audience, classId);
  const failed = Math.min(recipients, unreachable(audience, classId));
  const segments = smsMeasure(message).segments;
  return {
    recipients,
    segments,
    cost: smsCost(segments, recipients - failed), // only numbers that went to the operator are billed
    state: recipients > 0 && failed === recipients ? 'Failed' : 'Delivered',
    failed,
    reason: failed ? `${failed} ${failed === 1 ? 'number is' : 'numbers are'} missing or too short to dial.` : '',
  };
}

export const smsLogCfg: ResourceConfig<SmsLogRecord> = {
  entity: 'SMS',
  collection: 'smsLog',
  auditEntity: 'sms',
  searchPlaceholder: 'Search campaign or message…',
  searchText: (r) => `${r.title} ${r.message} ${r.audience} ${r.state}`,
  title: (r) => r.title,
  subtitle: (r) => `${withClass(r.audience, r.classId)} · ${r.recipients} recipients`,
  status: (r) => ({ label: r.state, tone: smsTone[r.state] ?? 'neutral' }),
  badges: (r) => [{ label: `${r.segments} segment${r.segments === 1 ? '' : 's'}`, tone: 'primary' }, { label: money(r.cost), tone: 'neutral' }, ...(r.failed ? [{ label: `${r.failed} failed`, tone: 'danger' as Tone }] : [])],
  facts: [
    { label: 'Message', value: (r) => clip(r.message, 110) },
    { label: 'Sent', value: (r) => `${timeText(r.at)} by ${r.by}` },
    { label: 'Cost', value: (r) => `${money(r.cost)} (${r.segments} × ${r.recipients - r.failed} billed numbers)` },
    { label: 'Problem', value: (r) => r.reason || undefined },
  ],
  detail: [
    { title: 'Message', items: [{ label: 'Campaign', value: (r) => r.title }, { label: 'Text', value: (r) => r.message }, { label: 'Characters', value: (r) => { const m = smsMeasure(r.message); return `${m.length} (${m.encoding}, ${m.perSegment} per segment)`; } }, { label: 'Template', value: (r) => snapshot<SmsTemplateRecord>('smsTemplates').find((t) => t.id === r.templateId)?.name ?? 'None (typed message)' }] },
    { title: 'Delivery', items: [{ label: 'Audience', value: (r) => withClass(r.audience, r.classId) }, { label: 'Recipients', value: (r) => r.recipients }, { label: 'Failed', value: (r) => r.failed }, { label: 'State', value: (r) => r.state }, { label: 'Gateway', value: (r) => r.gateway }, { label: 'Sent', value: (r) => `${timeText(r.at)} by ${r.by}` }, { label: 'Problem', value: (r) => r.reason || '—' }] },
    { title: 'Cost', items: [{ label: 'Segments per message', value: (r) => r.segments }, { label: 'Billed numbers', value: (r) => r.recipients - r.failed }, { label: 'Total', value: (r) => money(r.cost) }] },
  ],
  pageActions: [
    {
      key: 'calc',
      label: 'Check a message',
      icon: 'edit-3',
      manage: false,
      form: { title: 'Check a message', submitLabel: 'Check', fields: [{ key: 'message', label: 'Message', type: 'textarea', required: true }, { key: 'audience', label: 'Audience', type: 'select', options: AUDIENCES, default: 'Parents' }] },
      run: (v, ctx) => {
        const m = smsMeasure(String(v.message));
        const n = audienceCount(v.audience as Audience, '');
        ctx.alert('Message check', `${m.length} characters (${m.encoding})\n${m.segments} segment${m.segments === 1 ? '' : 's'} of ${m.perSegment}\n${n} recipients in ${v.audience}\nCost ${money(smsCost(m.segments, n))} at $0.30 per segment\n${m.length > SMS_MAX_CHARS ? `\nToo long: the limit is ${SMS_MAX_CHARS} characters.` : ''}`);
      },
    },
  ],
  stats: [
    { label: 'Messages sent', value: (rows) => rows.length, icon: 'message-square' },
    { label: 'Recipients reached', value: (rows) => rows.reduce((n, r) => n + r.recipients - r.failed, 0), tone: 'success', icon: 'users' },
    { label: 'Failed numbers', value: (rows) => rows.reduce((n, r) => n + r.failed, 0), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Total spend', value: (rows) => money(rows.reduce((n, r) => n + r.cost, 0)), tone: 'primary', icon: 'credit-card' },
    { label: 'Awaiting delivery reports', value: (rows) => countBy(rows, (r) => r.state === 'Pending DLR'), tone: 'warning', icon: 'clock' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...['Delivered', 'Pending DLR', 'Failed'].map((s) => ({ key: s, label: s, match: (r: SmsLogRecord) => r.state === s }))],
  filters: [
    { key: 'audience', label: 'Audience', options: opts(AUDIENCES), match: (r, v) => r.audience === v },
    { key: 'template', label: 'Source', single: true, options: opts(['From a template', 'Typed message']), match: (r, v) => !!r.templateId === (v === 'From a template') },
  ],
  sorts: [
    { key: 'latest', label: 'Latest first', compare: (a, b) => b.at.localeCompare(a.at) },
    { key: 'cost', label: 'Highest cost', compare: (a, b) => b.cost - a.cost },
  ],
  form: [
    { key: 'title', label: 'Campaign Name', type: 'text', required: true, hint: 'For your own records, e.g. “Fee reminder Term 2”' },
    { key: 'audience', label: 'Send To', type: 'select', required: true, options: AUDIENCES, default: 'Parents' },
    { key: 'classId', label: 'Class', type: 'select', options: classChoice, placeholder: 'All classes', hidden: (v) => !classApplies(v.audience) },
    {
      key: 'templateId',
      label: 'Template (optional)',
      type: 'select',
      options: () => [{ label: 'No template (typed message)', value: '' }, ...approvedTemplates().map((t) => ({ label: t.name, value: t.id }))],
      placeholder: 'No template',
      hint: 'Only approved templates are listed. The wording must match; fill each {#var#}.',
      onChange: (value, _values, lookup) => { const t = lookup('smsTemplates', String(value)) as SmsTemplateRecord | undefined; return t ? { message: t.body } : undefined; },
    },
    { key: 'message', label: 'Message', type: 'textarea', required: true, hint: `GSM-7: 160 characters, then 153 per part. Unicode (Tamil, emoji…): 70, then 67. Maximum ${SMS_MAX_CHARS}. $0.30 per segment per recipient.` },
  ],
  validate: (v) => {
    const message = String(v.message);
    const classId = classApplies(v.audience) ? String(v.classId ?? '') : '';
    const template = v.templateId ? snapshot<SmsTemplateRecord>('smsTemplates').find((t) => t.id === v.templateId) : undefined;
    const problem = audienceProblem(v.audience, classId);
    return {
      ...(problem ? { audience: problem } : {}),
      ...(message.trim().length > SMS_MAX_CHARS ? { message: `Too long: ${message.trim().length} of ${SMS_MAX_CHARS} characters` } : {}),
      ...(template && template.status !== 'Approved' ? { templateId: 'Only an approved template can be used' } : {}),
      ...(template && template.status === 'Approved' && message.includes('{#var#}') ? { message: 'Replace every {#var#} with a real value' } : {}),
      ...(template && template.status === 'Approved' && !message.includes('{#var#}') && !matchesTemplate(template.body, message) ? { message: 'The wording must match the template. Only the {#var#} gaps can change.' } : {}),
      ...(!template && message.includes('{#var#}') ? { message: 'Remove the {#var#} markers or choose their template' } : {}),
    };
  },
  prepare: (v, { user }) => {
    const classId = classApplies(v.audience) ? String(v.classId ?? '') : '';
    return { classId, message: String(v.message).trim(), templateId: String(v.templateId ?? ''), ...smsDelivery(v.audience, classId, String(v.message).trim()), gateway: 'Demo gateway', at: new Date().toISOString(), by: user?.name ?? 'Administrator' };
  },
  afterSave: (kind, record) => {
    if (kind !== 'create' || !record.templateId) return;
    const t = snapshot<SmsTemplateRecord>('smsTemplates').find((x) => x.id === record.templateId);
    if (t) repo<SmsTemplateRecord>('smsTemplates').update(t.id, { uses: t.uses + 1, lastUsed: todayISO() });
  },
  canEdit: false,
  canDelete: false,
  actions: [
    {
      key: 'again',
      label: 'Send again',
      icon: 'repeat',
      confirm: 'Send this message again to the same audience?',
      run: (r, _v, ctx) => {
        const problem = audienceProblem(r.audience, r.classId);
        if (problem) { ctx.toast(problem, 'error'); return; }
        const created = repo<SmsLogRecord>('smsLog').create({ ...r, id: undefined, ...smsDelivery(r.audience, r.classId, r.message), at: new Date().toISOString(), by: ctx.user?.name ?? 'Administrator' });
        if (r.templateId) { const t = snapshot<SmsTemplateRecord>('smsTemplates').find((x) => x.id === r.templateId); if (t) repo<SmsTemplateRecord>('smsTemplates').update(t.id, { uses: t.uses + 1, lastUsed: todayISO() }); }
        ctx.toast(`Sent to ${created.recipients - created.failed} numbers`);
      },
    },
    { key: 'share', label: 'Share report', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.title, `SMS — ${r.title}\n${timeText(r.at)}\nTo: ${withClass(r.audience, r.classId)} (${r.recipients})\nState: ${r.state}${r.failed ? `, ${r.failed} failed` : ''}\nSegments: ${r.segments} · Cost ${money(r.cost)}\n\n${r.message}`) },
  ],
};

/* -------------------------------------- SMS templates -------------------------------------- */

const smsTplTone: Record<string, Tone> = { Approved: 'success', 'Pending registration': 'warning', Rejected: 'danger', Draft: 'neutral' };
const sameName = (rows: { id: string; name: string }[], name: string, exceptId?: string) => rows.some((r) => r.id !== exceptId && r.name.trim().toLowerCase() === name.trim().toLowerCase());

export const smsTemplatesCfg: ResourceConfig<SmsTemplateRecord> = {
  entity: 'SMS Template',
  collection: 'smsTemplates',
  auditEntity: 'smsTemplate',
  searchPlaceholder: 'Search template name or text…',
  searchText: (r) => `${r.name} ${r.body} ${r.category} ${r.senderId}`,
  code: (r) => r.category,
  title: (r) => r.name,
  subtitle: (r) => `${r.route} · sender ${r.senderId}`,
  status: (r) => ({ label: r.status, tone: smsTplTone[r.status] }),
  badges: (r) => [{ label: `${smsPlaceholders(r.body)} variable${smsPlaceholders(r.body) === 1 ? '' : 's'}`, tone: 'primary' }, { label: smsMeasure(r.body).encoding, tone: 'neutral' }],
  facts: [
    { label: 'Text', value: (r) => clip(r.body, 120) },
    { label: 'Length', value: (r) => { const m = smsMeasure(r.body); return `${m.length} characters · ${m.segments} segment${m.segments === 1 ? '' : 's'}`; } },
    { label: 'Used', value: (r) => (r.uses ? `${r.uses} times · last ${formatDate(r.lastUsed)}` : 'Never used') },
    { label: 'Reason rejected', value: (r) => r.rejectedReason || undefined },
    { label: 'Updated', value: (r) => `${formatDate(r.updatedOn)} by ${r.updatedBy}` },
  ],
  detail: [
    { title: 'Template', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Route', value: (r) => r.route }, { label: 'Sender ID', value: (r) => r.senderId }, { label: 'Status', value: (r) => r.status }, { label: 'Rejected because', value: (r) => r.rejectedReason || '—' }] },
    { title: 'Text', items: [{ label: 'Body', value: (r) => r.body }, { label: 'Variables', value: (r) => smsPlaceholders(r.body) }, { label: 'Encoding', value: (r) => smsMeasure(r.body).encoding }, { label: 'Length', value: (r) => `${smsMeasure(r.body).length} characters, ${smsMeasure(r.body).segments} segment(s)` }] },
    { title: 'Use', items: [{ label: 'Times used', value: (r) => r.uses }, { label: 'Last used', value: (r) => (r.lastUsed ? formatDate(r.lastUsed) : '—') }, { label: 'Updated', value: (r) => `${formatDate(r.updatedOn)} by ${r.updatedBy}` }] },
  ],
  stats: [
    { label: 'Templates', value: (rows) => rows.length, icon: 'file-text' },
    { label: 'Approved', value: (rows) => countBy(rows, (r) => r.status === 'Approved'), tone: 'success', icon: 'check-circle' },
    { label: 'Pending registration', value: (rows) => countBy(rows, (r) => r.status === 'Pending registration'), tone: 'warning', icon: 'clock' },
    { label: 'Rejected', value: (rows) => countBy(rows, (r) => r.status === 'Rejected'), tone: 'danger', icon: 'x-circle' },
    { label: 'Messages sent from templates', value: (rows) => rows.reduce((n, r) => n + r.uses, 0), tone: 'primary', icon: 'send' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...['Approved', 'Pending registration', 'Draft', 'Rejected'].map((s) => ({ key: s, label: s, match: (r: SmsTemplateRecord) => r.status === s }))],
  filters: [
    { key: 'category', label: 'Category', options: opts(SMS_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'route', label: 'Route', options: opts(['Transactional', 'Promotional']), match: (r, v) => r.route === v },
    { key: 'sender', label: 'Sender ID', options: (rows) => opts([...new Set(rows.map((r) => r.senderId))].sort()), match: (r, v) => r.senderId === v },
    { key: 'encoding', label: 'Encoding', single: true, options: opts(['GSM-7', 'Unicode']), match: (r, v) => smsMeasure(r.body).encoding === v },
  ],
  sorts: [
    { key: 'used', label: 'Most used', compare: (a, b) => b.uses - a.uses },
    { key: 'updated', label: 'Recently updated', compare: (a, b) => b.updatedOn.localeCompare(a.updatedOn) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  ],
  form: [
    { key: 'name', label: 'Template Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: SMS_CATEGORIES, default: 'Fees' },
    { key: 'route', label: 'Route', type: 'select', required: true, options: ['Transactional', 'Promotional'], default: 'Transactional', hint: 'Promotional messages are not sent to people on the do-not-disturb list' },
    { key: 'senderId', label: 'Sender ID', type: 'text', required: true, default: SENDER_IDS[0], hint: 'Exactly six capital letters' },
    { key: 'body', label: 'Template Text', type: 'textarea', required: true, hint: `Use {#var#} where a value is filled in at send time. Up to ${SMS_MAX_CHARS} characters.` },
  ],
  validate: (v, { existing, rows }) => ({
    ...(sameName(rows, String(v.name), existing?.id) ? { name: 'A template with this name already exists' } : {}),
    ...(!/^[A-Z]{6}$/.test(String(v.senderId).trim()) ? { senderId: 'Use exactly six capital letters, like KARKAI' } : {}),
    ...(String(v.body).trim().length > SMS_MAX_CHARS ? { body: `Too long: ${String(v.body).trim().length} of ${SMS_MAX_CHARS} characters` } : {}),
    ...(smsPlaceholders(String(v.body)) > 10 ? { body: 'Use at most 10 variables' } : {}),
    ...(/\{#?var#?\}/.test(String(v.body).replace(/\{#var#\}/g, '')) ? { body: 'Write variables exactly as {#var#}' } : {}),
  }),
  prepare: (v, { existing, user }) => ({
    name: String(v.name).trim(),
    body: String(v.body).trim(),
    senderId: String(v.senderId).trim(),
    status: existing && existing.status !== 'Rejected' ? existing.status : ('Draft' as const), // editing a rejected template starts again
    rejectedReason: '',
    uses: existing?.uses ?? 0,
    lastUsed: existing?.lastUsed ?? '',
    updatedOn: todayISO(),
    updatedBy: user?.name ?? 'Administrator',
  }),
  editable: (r) => r.status === 'Draft' || r.status === 'Rejected',
  canDeleteRecord: (r) => (snapshot<SmsLogRecord>('smsLog').some((l) => l.templateId === r.id) ? 'Sent messages were made from this template. It is part of their record.' : r.status === 'Approved' ? 'Approved templates are registered with the operator. Create a new one instead of removing this.' : null),
  actions: [
    {
      key: 'submit',
      label: 'Submit for registration',
      icon: 'upload',
      visible: (r) => r.status === 'Draft',
      run: (r, _v, ctx) => {
        if (!r.body.trim()) { ctx.toast('The template has no text.', 'error'); return; }
        ctx.update({ status: 'Pending registration', updatedOn: todayISO(), updatedBy: ctx.user?.name ?? r.updatedBy });
        ctx.toast('Submitted. Waiting for the operator to register it');
      },
    },
    { key: 'approve', label: 'Mark approved', icon: 'check', tone: 'success', visible: (r) => r.status === 'Pending registration', run: (_r, _v, ctx) => { ctx.update({ status: 'Approved', rejectedReason: '', updatedOn: todayISO() }); ctx.toast('Approved. It can now be used to send'); } },
    { key: 'reject', label: 'Mark rejected', icon: 'x', tone: 'danger', visible: (r) => r.status === 'Pending registration', form: { title: 'Operator rejected the template', submitLabel: 'Save', fields: [{ key: 'reason', label: 'Reason given', type: 'text', required: true }] }, run: (_r, v, ctx) => { ctx.update({ status: 'Rejected', rejectedReason: String(v.reason).trim(), updatedOn: todayISO() }); ctx.toast('Marked rejected', 'info'); } },
    { key: 'reopen', label: 'Back to draft', icon: 'rotate-ccw', visible: (r) => r.status === 'Rejected' || r.status === 'Pending registration', run: (_r, _v, ctx) => { ctx.update({ status: 'Draft', rejectedReason: '', updatedOn: todayISO() }); ctx.toast('Moved back to draft'); } },
    { key: 'duplicate', label: 'Duplicate as draft', icon: 'copy', run: (r, _v, ctx) => { const taken = snapshot<SmsTemplateRecord>('smsTemplates'); let name = `${r.name} (copy)`; for (let n = 2; sameName(taken, name); n += 1) name = `${r.name} (copy ${n})`; repo<SmsTemplateRecord>('smsTemplates').create({ ...r, id: undefined, name, status: 'Draft', rejectedReason: '', uses: 0, lastUsed: '', updatedOn: todayISO(), updatedBy: ctx.user?.name ?? r.updatedBy }); ctx.toast('Draft created'); } },
    { key: 'use', label: 'Send with this template', icon: 'send', visible: (r) => r.status === 'Approved', run: (_r, _v, ctx) => ctx.go('/communication/sms-send') },
  ],
};

/* -------------------------------------- WhatsApp templates -------------------------------------- */

const waTone: Record<string, Tone> = { Approved: 'success', 'In review': 'warning', Rejected: 'danger', Paused: 'neutral', Draft: 'neutral' };
const qualityTone: Record<string, Tone> = { High: 'success', Medium: 'warning', Low: 'danger', 'Not rated': 'neutral' };

export const waTemplatesCfg: ResourceConfig<WaTemplateRecord> = {
  entity: 'WhatsApp Template',
  collection: 'waTemplates',
  auditEntity: 'waTemplate',
  searchPlaceholder: 'Search template name or text…',
  searchText: (r) => `${r.name} ${r.body} ${r.category} ${r.header}`,
  code: (r) => r.category,
  title: (r) => r.name,
  subtitle: (r) => r.languages.join(', '),
  status: (r) => ({ label: r.state, tone: waTone[r.state] }),
  badges: (r) => [{ label: `Quality: ${r.quality}`, tone: qualityTone[r.quality] }, ...(r.button !== 'None' ? [{ label: r.button, tone: 'primary' as Tone }] : [])],
  facts: [
    { label: 'Preview', value: (r) => clip(waPreview(r.body), 130) },
    { label: 'Variables', value: (r) => new Set(r.body.match(/\{\{\d+\}\}/g) ?? []).size },
    { label: 'Used', value: (r) => (r.uses ? `${r.uses} times · last ${formatDate(r.lastUsed)}` : 'Never used') },
    { label: 'Rejected because', value: (r) => r.rejectedReason || undefined },
    { label: 'Updated', value: (r) => formatDate(r.updatedOn) },
  ],
  detail: [
    { title: 'Template', items: [{ label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Languages', value: (r) => r.languages.join(', ') }, { label: 'State', value: (r) => r.state }, { label: 'Quality', value: (r) => r.quality }, { label: 'Rejected because', value: (r) => r.rejectedReason || '—' }] },
    { title: 'Message', items: [{ label: 'Header', value: (r) => r.header || '—' }, { label: 'Body', value: (r) => r.body }, { label: 'Preview', value: (r) => waPreview(r.body) }, { label: 'Footer', value: (r) => r.footer || '—' }, { label: 'Button', value: (r) => r.button }] },
    { title: 'Use', items: [{ label: 'Times used', value: (r) => r.uses }, { label: 'Last used', value: (r) => (r.lastUsed ? formatDate(r.lastUsed) : '—') }, { label: 'Updated', value: (r) => formatDate(r.updatedOn) }] },
  ],
  stats: [
    { label: 'Templates', value: (rows) => rows.length, icon: 'file-text' },
    { label: 'Approved', value: (rows) => countBy(rows, (r) => r.state === 'Approved'), tone: 'success', icon: 'check-circle' },
    { label: 'In review', value: (rows) => countBy(rows, (r) => r.state === 'In review'), tone: 'warning', icon: 'clock' },
    { label: 'Paused or rejected', value: (rows) => countBy(rows, (r) => r.state === 'Paused' || r.state === 'Rejected'), tone: 'danger', icon: 'pause-circle' },
    { label: 'Sent from templates', value: (rows) => rows.reduce((n, r) => n + r.uses, 0), tone: 'primary', icon: 'send' },
  ],
  views: [{ key: 'all', label: 'All', match: () => true }, ...['Approved', 'In review', 'Draft', 'Paused', 'Rejected'].map((s) => ({ key: s, label: s, match: (r: WaTemplateRecord) => r.state === s }))],
  filters: [
    { key: 'category', label: 'Category', options: opts(['Utility', 'Marketing', 'Authentication']), match: (r, v) => r.category === v },
    { key: 'language', label: 'Language', options: opts(WA_LANGUAGES), match: (r, v) => r.languages.includes(v) },
    { key: 'quality', label: 'Quality', options: opts(['High', 'Medium', 'Low', 'Not rated']), match: (r, v) => r.quality === v },
  ],
  sorts: [
    { key: 'used', label: 'Most used', compare: (a, b) => b.uses - a.uses },
    { key: 'updated', label: 'Recently updated', compare: (a, b) => b.updatedOn.localeCompare(a.updatedOn) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  ],
  form: [
    { key: 'name', label: 'Template Name', type: 'text', required: true, hint: 'Lowercase letters, numbers and underscores, e.g. fee_reminder' },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Utility', 'Marketing', 'Authentication'], default: 'Utility' },
    { key: 'languages', label: 'Languages', type: 'multiselect', required: true, options: WA_LANGUAGES, default: ['English'] },
    { key: 'header', label: 'Header (optional)', type: 'text', hint: 'Up to 60 characters' },
    { key: 'body', label: 'Body', type: 'textarea', required: true, hint: 'Variables look like {{1}}, {{2}}. Up to 1024 characters. It cannot start or end with a variable.' },
    { key: 'footer', label: 'Footer (optional)', type: 'text', hint: 'Up to 60 characters' },
    { key: 'button', label: 'Button', type: 'select', options: ['None', 'Visit website', 'Call phone number', 'Quick reply'], default: 'None' },
  ],
  validate: (v, { existing, rows }) => {
    const body = waBodyProblems(String(v.body));
    return {
      ...(!waNameOk(String(v.name).trim()) ? { name: 'Use lowercase letters, numbers and underscores (3–60 characters, starting with a letter)' } : {}),
      ...(sameName(rows, String(v.name), existing?.id) ? { name: 'A template with this name already exists' } : {}),
      ...(String(v.header).trim().length > 60 ? { header: 'At most 60 characters' } : {}),
      ...(String(v.footer).trim().length > 60 ? { footer: 'At most 60 characters' } : {}),
      ...(body.length ? { body: body[0] } : {}),
      ...(v.category === 'Authentication' && waBodyProblems(String(v.body)).length === 0 && (String(v.body).match(/\{\{\d+\}\}/g) ?? []).length !== 1 ? { body: 'An authentication template uses exactly one variable, the code' } : {}),
    };
  },
  prepare: (v, { existing }) => ({
    name: String(v.name).trim(),
    body: String(v.body).trim(),
    header: String(v.header ?? '').trim(),
    footer: String(v.footer ?? '').trim(),
    state: existing && existing.state !== 'Rejected' ? existing.state : ('Draft' as const),
    quality: existing?.quality ?? ('Not rated' as const),
    rejectedReason: '',
    uses: existing?.uses ?? 0,
    lastUsed: existing?.lastUsed ?? '',
    updatedOn: todayISO(),
  }),
  editable: (r) => r.state === 'Draft' || r.state === 'Rejected',
  canDeleteRecord: (r) => (r.state === 'In review' ? 'Wait for the review to finish, or move it back to draft first.' : null),
  actions: [
    { key: 'submit', label: 'Submit for review', icon: 'upload', visible: (r) => r.state === 'Draft', run: (_r, _v, ctx) => { ctx.update({ state: 'In review', updatedOn: todayISO() }); ctx.toast('Submitted for WhatsApp review'); } },
    { key: 'approve', label: 'Mark approved', icon: 'check', tone: 'success', visible: (r) => r.state === 'In review', run: (_r, _v, ctx) => { ctx.update({ state: 'Approved', quality: 'Not rated', rejectedReason: '', updatedOn: todayISO() }); ctx.toast('Approved. It can start conversations'); } },
    { key: 'reject', label: 'Mark rejected', icon: 'x', tone: 'danger', visible: (r) => r.state === 'In review', form: { title: 'WhatsApp rejected the template', submitLabel: 'Save', fields: [{ key: 'reason', label: 'Reason given', type: 'text', required: true }] }, run: (_r, v, ctx) => { ctx.update({ state: 'Rejected', rejectedReason: String(v.reason).trim(), updatedOn: todayISO() }); ctx.toast('Marked rejected', 'info'); } },
    { key: 'pause', label: 'Pause', icon: 'pause', visible: (r) => r.state === 'Approved', confirm: 'Pause this template? New conversations cannot use it.', run: (_r, _v, ctx) => { ctx.update({ state: 'Paused', updatedOn: todayISO() }); ctx.toast('Paused', 'info'); } },
    { key: 'resume', label: 'Resume', icon: 'play', visible: (r) => r.state === 'Paused', run: (_r, _v, ctx) => { ctx.update({ state: 'Approved', updatedOn: todayISO() }); ctx.toast('Resumed'); } },
    { key: 'reopen', label: 'Back to draft', icon: 'rotate-ccw', visible: (r) => r.state === 'Rejected' || r.state === 'In review', run: (_r, _v, ctx) => { ctx.update({ state: 'Draft', rejectedReason: '', updatedOn: todayISO() }); ctx.toast('Moved back to draft'); } },
    { key: 'duplicate', label: 'Duplicate as draft', icon: 'copy', run: (r, _v, ctx) => { const taken = snapshot<WaTemplateRecord>('waTemplates'); let name = `${r.name}_copy`; for (let n = 2; sameName(taken, name); n += 1) name = `${r.name}_copy${n}`; repo<WaTemplateRecord>('waTemplates').create({ ...r, id: undefined, name, state: 'Draft', quality: 'Not rated', rejectedReason: '', uses: 0, lastUsed: '', updatedOn: todayISO() }); ctx.toast('Draft created'); } },
  ],
};

/* ---------------------------------------- WhatsApp inbox ---------------------------------------- */

export const INBOX_AGENTS = ['Front Office', 'Accounts Office', 'Admissions Desk', 'Transport Office', 'Principal’s Office'];
export const THREAD_LABELS = ['Fee query', 'Admission', 'Transport', 'Academic', 'Complaint', 'Follow-up', 'General'];
const threadTone: Record<ThreadState, Tone> = { Waiting: 'warning', Answered: 'success', Resolved: 'neutral', Snoozed: 'info', Archived: 'neutral' };
const slaTone: Record<string, Tone> = { 'Within SLA': 'success', 'Due soon': 'warning', Breached: 'danger' };
const staffMessage = (text: string): WaMessage => ({ from: 'staff', text: text.trim(), at: new Date().toISOString() });

const snoozeUntil = (choice: string, now = new Date()): string => {
  const d = new Date(now);
  if (choice === '1 hour') d.setHours(d.getHours() + 1);
  else if (choice === '3 hours') d.setHours(d.getHours() + 3);
  else if (choice === 'Tomorrow 9 AM') { d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0); }
  else { d.setDate(d.getDate() + ((8 - d.getDay()) % 7 || 7)); d.setHours(9, 0, 0, 0); } // next Monday
  return d.toISOString();
};
export const SNOOZE_CHOICES = ['1 hour', '3 hours', 'Tomorrow 9 AM', 'Next Monday 9 AM'];

export const waThreadsCfg: ResourceConfig<WaThreadRecord> = {
  entity: 'Conversation',
  collection: 'waThreads',
  auditEntity: 'conversation',
  searchPlaceholder: 'Search contact, phone, message…',
  searchText: (r) => `${r.contact} ${r.phone} ${r.relation} ${r.label} ${r.assignedTo} ${r.messages.map((m) => m.text).join(' ')}`,
  code: (r) => r.label,
  title: (r) => `${r.flagged ? '🚩 ' : ''}${r.contact}`,
  subtitle: (r) => `${r.relation} · ${r.channel} · ${r.phone}`,
  status: (r) => ({ label: threadState(r), tone: threadTone[threadState(r)] }),
  badges: (r) => [...(threadSla(r) !== '—' ? [{ label: `${threadSla(r)} · ${waitText(waitingMinutes(r))}`, tone: slaTone[threadSla(r)] }] : []), { label: r.assignedTo === 'Unassigned' ? 'Unassigned' : r.assignedTo, tone: r.assignedTo === 'Unassigned' ? 'warning' : 'primary' }],
  facts: [
    { label: 'Last message', value: (r) => `${lastMessage(r).from === 'staff' ? 'You: ' : ''}${clip(lastMessage(r).text, 90)}` },
    { label: 'Team', value: (r) => r.team },
    { label: 'Messages', value: (r) => `${r.messages.length} · last ${timeText(lastMessage(r).at)}` },
    { label: 'Snoozed until', value: (r) => (threadState(r) === 'Snoozed' ? timeText(r.snoozedUntil) : undefined) },
  ],
  detail: [
    { title: 'Contact', items: [{ label: 'Name', value: (r) => r.contact }, { label: 'Phone', value: (r) => r.phone }, { label: 'Relation', value: (r) => r.relation }, { label: 'Channel', value: (r) => r.channel }] },
    { title: 'Handling', items: [{ label: 'Status', value: (r) => threadState(r) }, { label: 'Label', value: (r) => r.label }, { label: 'Assigned to', value: (r) => r.assignedTo }, { label: 'Team', value: (r) => r.team }, { label: `Reply target (${SLA_MINUTES} min)`, value: (r) => (threadSla(r) === '—' ? 'Not waiting' : `${threadSla(r)} — waiting ${waitText(waitingMinutes(r))}`) }, { label: 'Flagged', value: (r) => (r.flagged ? 'Yes' : 'No') }] },
    { title: 'Conversation', items: [{ label: 'Messages', value: (r) => r.messages.map((m) => `${m.from === 'staff' ? 'You' : r.contact} · ${timeText(m.at)}\n${m.text}`).join('\n\n') }] },
  ],
  pageActions: [
    {
      key: 'new',
      label: 'New conversation',
      icon: 'message-circle',
      form: {
        title: 'New conversation',
        submitLabel: 'Send',
        fields: [
          { key: 'contact', label: 'Contact Name', type: 'text', required: true },
          { key: 'phone', label: 'Phone', type: 'phone', required: true, hint: 'With country code, e.g. +91 98400 12345' },
          { key: 'relation', label: 'Relation', type: 'select', options: ['Parent', 'Staff', 'Student', 'Other'], default: 'Parent' },
          { key: 'channel', label: 'Channel', type: 'select', options: ['WhatsApp', 'SMS', 'In-App'], default: 'WhatsApp' },
          { key: 'templateId', label: 'Approved template', type: 'select', options: () => snapshot<WaTemplateRecord>('waTemplates').filter((t) => t.state === 'Approved').map((t) => ({ label: t.name, value: t.id })), hidden: (v) => v.channel !== 'WhatsApp', hint: 'WhatsApp only lets you start a conversation with an approved template' },
          { key: 'label', label: 'Label', type: 'select', options: THREAD_LABELS, default: 'General' },
          { key: 'text', label: 'Message', type: 'textarea', required: true },
        ],
        validate: (v) => {
          const phone = String(v.phone);
          const digits = phone.replace(/\D/g, '');
          return {
            ...(!validPhone(phone) || digits.length > 15 ? { phone: 'Enter a phone number with 10 to 15 digits' } : {}),
            ...(snapshot<WaThreadRecord>('waThreads').some((t) => t.phone.replace(/\D/g, '') === digits) ? { phone: 'A conversation with this number already exists. Open it and reply instead.' } : {}),
            ...(v.channel === 'WhatsApp' && !v.templateId ? { templateId: 'Choose an approved template to start a WhatsApp conversation' } : {}),
            ...(String(v.text).trim().length > 1024 ? { text: 'At most 1024 characters' } : {}),
          };
        },
      },
      run: (v, ctx) => {
        const created = ctx.create({ contact: String(v.contact).trim(), phone: String(v.phone).trim(), relation: v.relation, channel: v.channel, label: v.label, assignedTo: 'Unassigned', team: 'Front office', messages: [staffMessage(String(v.text))], resolved: false, snoozedUntil: '', archived: false, flagged: false });
        if (v.channel === 'WhatsApp' && v.templateId) {
          const t = snapshot<WaTemplateRecord>('waTemplates').find((x) => x.id === v.templateId);
          if (t) repo<WaTemplateRecord>('waTemplates').update(t.id, { uses: t.uses + 1, lastUsed: todayISO() });
        }
        ctx.toast(`Message sent to ${created.contact}`);
      },
    },
  ],
  stats: [
    { label: 'Conversations', value: (rows) => rows.filter((r) => !r.archived).length, icon: 'message-circle' },
    { label: 'Waiting for a reply', value: (rows) => countBy(rows, (r) => threadState(r) === 'Waiting'), tone: 'warning', icon: 'clock' },
    { label: 'Past reply target', value: (rows) => countBy(rows, (r) => threadSla(r) === 'Breached'), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Unassigned', value: (rows) => countBy(rows, (r) => r.assignedTo === 'Unassigned' && !r.archived && !r.resolved), tone: 'primary', icon: 'user-x' },
    { label: 'Resolved', value: (rows) => countBy(rows, (r) => threadState(r) === 'Resolved'), tone: 'success', icon: 'check-circle' },
  ],
  views: [{ key: 'open', label: 'Open', match: (r) => ['Waiting', 'Answered', 'Snoozed'].includes(threadState(r)) }, ...['Waiting', 'Answered', 'Snoozed', 'Resolved', 'Archived'].map((s) => ({ key: s, label: s, match: (r: WaThreadRecord) => threadState(r) === s })), { key: 'all', label: 'All', match: () => true }],
  filters: [
    { key: 'label', label: 'Label', options: opts(THREAD_LABELS), match: (r, v) => r.label === v },
    { key: 'channel', label: 'Channel', options: opts(['WhatsApp', 'SMS', 'In-App']), match: (r, v) => r.channel === v },
    { key: 'assigned', label: 'Assigned to', options: opts(['Unassigned', ...INBOX_AGENTS]), match: (r, v) => r.assignedTo === v },
    { key: 'sla', label: 'Reply target', options: opts(['Within SLA', 'Due soon', 'Breached']), match: (r, v) => threadSla(r) === v },
    { key: 'flag', label: 'Flagged', single: true, options: opts(['Flagged']), match: (r) => r.flagged },
  ],
  sorts: [
    { key: 'waiting', label: 'Waiting longest', compare: (a, b) => waitingMinutes(b) - waitingMinutes(a) || lastMessage(b).at.localeCompare(lastMessage(a).at) },
    { key: 'latest', label: 'Latest activity', compare: (a, b) => lastMessage(b).at.localeCompare(lastMessage(a).at) },
    { key: 'name', label: 'Contact (A–Z)', compare: (a, b) => a.contact.localeCompare(b.contact) },
  ],
  form: [],
  canCreate: false,
  canEdit: false,
  canDeleteRecord: (r) => (r.archived ? null : 'Archive the conversation instead of deleting it.'),
  actions: [
    {
      key: 'reply',
      label: 'Reply',
      icon: 'corner-up-left',
      tone: 'success',
      visible: (r) => !r.archived,
      form: { title: 'Reply', submitLabel: 'Send', fields: [{ key: 'text', label: 'Message', type: 'textarea', required: true }], validate: (v) => (String(v.text).trim().length > 1024 ? { text: 'At most 1024 characters' } : {}) },
      run: (r, v, ctx) => {
        if (!replyWindowOpen(r)) { ctx.toast(`The ${REPLY_WINDOW_HOURS}-hour reply window has closed. Start a new conversation with an approved template.`, 'error'); return; }
        ctx.update({ messages: [...r.messages, staffMessage(String(v.text))], resolved: false, snoozedUntil: '', assignedTo: r.assignedTo === 'Unassigned' ? 'Front Office' : r.assignedTo });
        ctx.toast('Reply sent');
      },
    },
    { key: 'assign', label: 'Assign', icon: 'user-plus', visible: (r) => !r.archived, form: { title: 'Assign conversation', submitLabel: 'Assign', fields: [{ key: 'to', label: 'Assign To', type: 'select', required: true, options: ['Unassigned', ...INBOX_AGENTS] }], initial: (r) => ({ to: r.assignedTo }) }, run: (_r, v, ctx) => { ctx.update({ assignedTo: String(v.to) }); ctx.toast(v.to === 'Unassigned' ? 'Unassigned' : `Assigned to ${v.to}`); } },
    { key: 'label', label: 'Change label', icon: 'tag', visible: (r) => !r.archived, form: { title: 'Change label', submitLabel: 'Save', fields: [{ key: 'label', label: 'Label', type: 'select', required: true, options: THREAD_LABELS }], initial: (r) => ({ label: r.label }) }, run: (_r, v, ctx) => { ctx.update({ label: String(v.label) }); ctx.toast('Label changed'); } },
    { key: 'resolve', label: 'Resolve', icon: 'check-circle', tone: 'success', visible: (r) => !r.archived && !r.resolved, run: (_r, _v, ctx) => { ctx.update({ resolved: true, snoozedUntil: '' }); ctx.toast('Marked resolved'); } },
    { key: 'reopen', label: 'Reopen', icon: 'rotate-ccw', visible: (r) => !r.archived && r.resolved, run: (_r, _v, ctx) => { ctx.update({ resolved: false }); ctx.toast('Reopened'); } },
    { key: 'snooze', label: 'Snooze', icon: 'moon', visible: (r) => !r.archived && !r.resolved && threadState(r) !== 'Snoozed', form: { title: 'Snooze until', submitLabel: 'Snooze', fields: [{ key: 'choice', label: 'Come back', type: 'select', required: true, options: SNOOZE_CHOICES, default: '1 hour' }] }, run: (_r, v, ctx) => { ctx.update({ snoozedUntil: snoozeUntil(String(v.choice)) }); ctx.toast(`Snoozed until ${v.choice}`, 'info'); } },
    { key: 'unsnooze', label: 'Wake now', icon: 'sun', visible: (r) => threadState(r) === 'Snoozed', run: (_r, _v, ctx) => { ctx.update({ snoozedUntil: '' }); ctx.toast('Back in the queue'); } },
    { key: 'flag', label: 'Flag', icon: 'flag', visible: (r) => !r.flagged, run: (_r, _v, ctx) => { ctx.update({ flagged: true }); ctx.toast('Flagged'); } },
    { key: 'unflag', label: 'Remove flag', icon: 'flag', visible: (r) => r.flagged, run: (_r, _v, ctx) => { ctx.update({ flagged: false }); ctx.toast('Flag removed'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => !r.archived, run: (_r, _v, ctx) => { ctx.update({ archived: true, flagged: false }); ctx.toast('Archived'); } },
    { key: 'unarchive', label: 'Restore from archive', icon: 'inbox', visible: (r) => r.archived, run: (_r, _v, ctx) => { ctx.update({ archived: false }); ctx.toast('Restored'); } },
  ],
};
