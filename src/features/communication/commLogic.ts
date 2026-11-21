/** Communication rules: audiences, SMS segments and cost, WhatsApp template variables, lifecycle and SLA. */
import { snapshot } from '@/core/store/store';
import { addDays, parseISO, todayISO, toISO } from '@/core/utils/date';
import type { StaffRecord, StudentRecord, TeacherRecord } from '@/data/seed/master';
import {
  RATE_PER_SEGMENT,
  type AnnouncementRecord,
  type Audience,
  type BroadcastRecord,
  type Cadence,
  type NotificationRecord,
  type NoticeRecord,
  type SmsTemplateRecord,
  type WaThreadRecord,
  type WaTemplateRecord,
} from '@/data/seed/communication';

/* ---------------------------------- audiences ---------------------------------- */

const inStrength = (s: StudentRecord) => s.status === 'Active' || s.status === 'On Leave';

/** Live number of people an audience reaches. A class narrows Students and Parents only. */
export function audienceCount(audience: Audience, classId = ''): number {
  const students = snapshot<StudentRecord>('students').filter((s) => inStrength(s) && (!classId || s.classId === classId));
  const parents = new Set(students.map((s) => s.parentName)).size;
  const teachers = snapshot<TeacherRecord>('teachers').length;
  const staff = snapshot<StaffRecord>('staff').length;
  switch (audience) {
    case 'Students': return students.length;
    case 'Parents': return parents;
    case 'Teachers': return teachers;
    case 'Staff': return staff;
    default: return students.length + parents + teachers + staff;
  }
}

/** Why this audience cannot be used (empty = fine). */
export function audienceProblem(audience: Audience, classId: string): string | undefined {
  if (classId && audience !== 'Students' && audience !== 'Parents') return 'A class can only be chosen for Students or Parents';
  if (audienceCount(audience, classId) === 0) return 'No one is in this audience';
  return undefined;
}

export const audienceLabel = (audience: Audience, classId: string, className?: string) => (classId && className ? `${audience} · ${className}` : audience);

/* ------------------------------------- SMS ------------------------------------- */

const GSM_BASIC = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
const GSM_EXTENDED = '^{}\\[~]|€';
export const SMS_MAX_CHARS = 640;

export interface SmsMeasure {
  encoding: 'GSM-7' | 'Unicode';
  /** Characters counted the way the network counts them (extended GSM characters use two). */
  length: number;
  segments: number;
  perSegment: number;
}

/** GSM-7 messages fit 160 characters (153 each when split); anything else is Unicode: 70 (67 each when split). */
export function smsMeasure(text: string): SmsMeasure {
  const chars = [...text];
  const gsm = chars.every((c) => GSM_BASIC.includes(c) || GSM_EXTENDED.includes(c));
  if (gsm) {
    const length = chars.reduce((n, c) => n + (GSM_EXTENDED.includes(c) ? 2 : 1), 0);
    return { encoding: 'GSM-7', length, segments: length === 0 ? 0 : length <= 160 ? 1 : Math.ceil(length / 153), perSegment: length <= 160 ? 160 : 153 };
  }
  const length = text.length; // UTF-16 units, so an emoji is two
  return { encoding: 'Unicode', length, segments: length === 0 ? 0 : length <= 70 ? 1 : Math.ceil(length / 67), perSegment: length <= 70 ? 70 : 67 };
}

export const smsCost = (segments: number, recipients: number) => Math.round(segments * recipients * RATE_PER_SEGMENT * 100) / 100;

/** The number of `{#var#}` placeholders in an SMS template. */
export const smsPlaceholders = (body: string) => (body.match(/\{#var#\}/g) ?? []).length;

/** Fill a template's `{#var#}` markers from a list (extras are ignored, missing ones stay as the marker). */
export function fillSms(body: string, values: string[]): string {
  let i = 0;
  return body.replace(/\{#var#\}/g, () => values[i++]?.trim() || '{#var#}');
}

/* ------------------------------------ WhatsApp ------------------------------------ */

/** Variable numbers used in a template body, in order of appearance: "Hi {{1}}, {{2}}" -> [1, 2]. */
export const waVariables = (body: string): number[] => [...body.matchAll(/\{\{(\d+)\}\}/g)].map((m) => Number(m[1]));

/** Problems with a WhatsApp template body (variables must run 1, 2, 3…; the body cannot start or end with one). */
export function waBodyProblems(body: string): string[] {
  const out: string[] = [];
  const vars = waVariables(body);
  const unique = [...new Set(vars)].sort((a, b) => a - b);
  if (unique.some((n, i) => n !== i + 1)) out.push('Variables must be numbered {{1}}, {{2}}, {{3}}… with no gaps');
  if (/\{\{[^}]*\}\}/.test(body.replace(/\{\{\d+\}\}/g, ''))) out.push('Variables can only be numbers, like {{1}}');
  const trimmed = body.trim();
  if (/^\{\{\d+\}\}/.test(trimmed) || /\{\{\d+\}\}$/.test(trimmed)) out.push('The message cannot start or end with a variable');
  if (trimmed.length > 1024) out.push('The body can be at most 1024 characters');
  const words = (trimmed.replace(/\{\{\d+\}\}/g, ' ').match(/[A-Za-z0-9஀-௿ऀ-ॿ]+/g) ?? []).length;
  if (unique.length && words < unique.length + 2) out.push('Add more wording around the variables');
  return out;
}

export const waNameOk = (name: string) => /^[a-z][a-z0-9_]{2,59}$/.test(name);

/** Replace {{n}} with sample values so a preview reads like a real message. */
export const waPreview = (body: string, samples: string[] = ['Anita', '₹4,500', 'Term 2', '28 Nov']) => body.replace(/\{\{(\d+)\}\}/g, (_m, n) => samples[Number(n) - 1] ?? `{{${n}}}`);

/* ------------------------------ announcements & notices ------------------------------ */

export type AnnState = 'Draft' | 'Scheduled' | 'Published' | 'Expired' | 'Archived';

export function annState(a: Pick<AnnouncementRecord, 'status' | 'expires'>, today = todayISO()): AnnState {
  if (a.status === 'Published' && a.expires < today) return 'Expired';
  return a.status;
}

/** True for a scheduled announcement whose day has come but which nobody has published yet. */
export const annDue = (a: Pick<AnnouncementRecord, 'status' | 'dated'>, today = todayISO()) => a.status === 'Scheduled' && a.dated <= today;

/** What stops this announcement being published (empty = it can go out). */
export function publishBlockers(a: Pick<AnnouncementRecord, 'title' | 'body' | 'channels' | 'audience' | 'expires' | 'dated'> & { classId?: string }, today = todayISO()): string[] {
  const out: string[] = [];
  if (!a.title.trim()) out.push('Add a title.');
  if (!a.body.trim()) out.push('Write the announcement.');
  if (!a.channels.length) out.push('Choose at least one channel.');
  const p = audienceProblem(a.audience, a.classId ?? '');
  if (p) out.push(`${p}.`);
  if (a.expires < today) out.push('The expiry date has already passed.');
  return out;
}

export type NoticeState = 'Draft' | 'Published' | 'Expired' | 'Archived';
export const noticeState = (n: Pick<NoticeRecord, 'status' | 'expiry'>, today = todayISO()): NoticeState => (n.status === 'Published' && n.expiry < today ? 'Expired' : n.status);
export const MAX_PINNED = 3;
/** Notices that are live and pinned (an expired or archived notice no longer takes up a pin). */
export const pinnedLive = (rows: NoticeRecord[], exceptId?: string) => rows.filter((n) => n.pinned && n.id !== exceptId && noticeState(n) === 'Published').length;

/* ---------------------------------- broadcasts ---------------------------------- */

/** The next date a recurring broadcast goes out after `from`. */
export function nextOccurrence(from: string, cadence: Cadence): string {
  if (cadence === 'One-off') return from;
  if (cadence === 'Daily') return addDays(from, 1);
  if (cadence === 'Weekly') return addDays(from, 7);
  const d = parseISO(from) ?? new Date();
  const day = d.getDate();
  const months = cadence === 'Monthly' ? 1 : 12;
  const next = new Date(d.getFullYear(), d.getMonth() + months, 1);
  const last = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate();
  next.setDate(Math.min(day, last)); // 31 Jan -> 28/29 Feb
  return toISO(next);
}

/** Mass or paid channels, or everyone at once, go through the principal's approval. */
export const needsApproval = (b: Pick<BroadcastRecord, 'audience' | 'channels'>) => b.audience === 'All' || b.channels.includes('SMS') || b.channels.includes('WhatsApp');

export function broadcastBlockers(b: Pick<BroadcastRecord, 'title' | 'body' | 'channels' | 'audience' | 'classId' | 'sendDate' | 'sendTime' | 'expires' | 'cadence'>, today = todayISO(), now = new Date()): string[] {
  const out: string[] = [];
  if (!b.title.trim()) out.push('Add a title.');
  if (!b.body.trim()) out.push('Write the message.');
  if (!b.channels.length) out.push('Choose at least one channel.');
  const p = audienceProblem(b.audience, b.classId);
  if (p) out.push(`${p}.`);
  if (b.sendDate < today || (b.sendDate === today && b.sendTime <= `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)) out.push('The send time is in the past.');
  if (b.cadence !== 'One-off' && b.expires && b.expires < b.sendDate) out.push('The end date is before the first send.');
  return out;
}

/* ------------------------------- notification centre ------------------------------- */

export const ntfDue = (n: Pick<NotificationRecord, 'date' | 'time'>) => `${n.date}T${n.time}`;
export const ntfWhen = (n: Pick<NotificationRecord, 'date' | 'time'>, now = new Date()) => {
  const [y, m, d] = n.date.split('-').map(Number);
  const [hh, mm] = n.time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).getTime() - now.getTime();
};

/* ------------------------------------- inbox ------------------------------------- */

export type ThreadState = 'Waiting' | 'Answered' | 'Resolved' | 'Snoozed' | 'Archived';
export type Sla = 'Within SLA' | 'Due soon' | 'Breached' | '—';
export const SLA_MINUTES = 30;

export const lastMessage = (t: Pick<WaThreadRecord, 'messages'>) => t.messages[t.messages.length - 1];

export function threadState(t: WaThreadRecord, now = new Date()): ThreadState {
  if (t.archived) return 'Archived';
  if (t.resolved) return 'Resolved';
  if (t.snoozedUntil && new Date(t.snoozedUntil).getTime() > now.getTime()) return 'Snoozed';
  return lastMessage(t)?.from === 'staff' ? 'Answered' : 'Waiting';
}

/** Minutes the contact has been waiting for a reply (0 unless the thread is Waiting). */
export function waitingMinutes(t: WaThreadRecord, now = new Date()): number {
  if (threadState(t, now) !== 'Waiting') return 0;
  return Math.max(0, Math.round((now.getTime() - new Date(lastMessage(t).at).getTime()) / 60000));
}

export function threadSla(t: WaThreadRecord, now = new Date()): Sla {
  if (threadState(t, now) !== 'Waiting') return '—';
  const w = waitingMinutes(t, now);
  return w > SLA_MINUTES ? 'Breached' : w >= SLA_MINUTES - 10 ? 'Due soon' : 'Within SLA';
}

export const waitText = (m: number) => (m < 60 ? `${m} min` : m < 1440 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${Math.floor(m / 1440)} d`);

/* ------------------------------- template usage guards ------------------------------- */

/** Approved SMS templates are the only ones a message may be sent from. */
export const smsUsable = (t: SmsTemplateRecord) => t.status === 'Approved';
export const waUsable = (t: WaTemplateRecord) => t.state === 'Approved';

/* --------------------------- SMS delivery and template matching --------------------------- */

export const validPhone = (p: string | undefined) => (p ?? '').replace(/\D/g, '').length >= 10;

/** People in an audience whose phone number is missing or too short to dial (these messages fail). */
export function unreachable(audience: Audience, classId = ''): number {
  const students = snapshot<StudentRecord>('students').filter((s) => inStrength(s) && (!classId || s.classId === classId));
  const parents = [...new Map(students.map((s) => [s.parentName, s.parentPhone])).values()];
  const bad = (list: (string | undefined)[]) => list.filter((p) => !validPhone(p)).length;
  const teachers = bad(snapshot<TeacherRecord>('teachers').map((t) => t.phone));
  const staff = bad(snapshot<StaffRecord>('staff').map((s) => s.phone));
  switch (audience) {
    case 'Students': return bad(students.map((s) => s.phone));
    case 'Parents': return bad(parents);
    case 'Teachers': return teachers;
    case 'Staff': return staff;
    default: return bad(students.map((s) => s.phone)) + bad(parents) + teachers + staff;
  }
}

/** A message sent from a registered template must keep its fixed wording and only fill the `{#var#}` gaps. */
export function matchesTemplate(templateBody: string, message: string): boolean {
  const escaped = templateBody.trim().split('{#var#}').map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`^${escaped.join('[^]+?')}$`).test(message.trim());
}

/** WhatsApp lets staff reply freely only within 24 hours of the contact's last message. */
export const REPLY_WINDOW_HOURS = 24;
export function replyWindowOpen(t: Pick<WaThreadRecord, 'channel' | 'messages'>, now = new Date()): boolean {
  if (t.channel !== 'WhatsApp') return true;
  const lastFromContact = [...t.messages].reverse().find((m) => m.from === 'contact');
  if (!lastFromContact) return false;
  return now.getTime() - new Date(lastFromContact.at).getTime() <= REPLY_WINDOW_HOURS * 3600000;
}
