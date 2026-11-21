/** Communication seed data: announcements, notice board, broadcasts, notifications, SMS and WhatsApp. */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildStaff, buildStudents, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

export type Audience = 'Students' | 'Teachers' | 'Parents' | 'Staff' | 'All';
export const AUDIENCES: Audience[] = ['Students', 'Teachers', 'Parents', 'Staff', 'All'];

/** Audience sizes at seed time (the screens use the live records). */
const seedSize = (a: Audience): number => {
  const s = buildStudents().filter((x) => x.status === 'Active' || x.status === 'On Leave');
  const students = s.length;
  const parents = new Set(s.map((x) => x.parentName)).size;
  const teachers = buildTeachers().length;
  const staff = buildStaff().length;
  return a === 'Students' ? students : a === 'Parents' ? parents : a === 'Teachers' ? teachers : a === 'Staff' ? staff : students + parents + teachers + staff;
};
const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
/** Local day and 'HH:mm' that many minutes ago (negative = in the future). */
const dateTime = (minAgo: number): { date: string; time: string } => {
  const d = new Date(Date.now() - minAgo * 60000);
  const p = (n: number) => String(n).padStart(2, '0');
  return { date: `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`, time: `${p(d.getHours())}:${p(d.getMinutes())}` };
};

/* ---------------------------------- Announcements ---------------------------------- */

export type AnnCategory = 'Academic' | 'Examination' | 'Fees' | 'Events' | 'Emergency' | 'Holiday' | 'Admissions' | 'Newsletter';
export type AnnPriority = 'Urgent' | 'High' | 'Normal';
export type AnnStatus = 'Draft' | 'Scheduled' | 'Published' | 'Archived';
export type AnnChannel = 'In-App' | 'Email' | 'SMS' | 'WhatsApp' | 'Push notification' | 'Website banner';
export const ANN_CATEGORIES: AnnCategory[] = ['Academic', 'Examination', 'Fees', 'Events', 'Emergency', 'Holiday', 'Admissions', 'Newsletter'];
export const ANN_CHANNELS: AnnChannel[] = ['In-App', 'Email', 'SMS', 'WhatsApp', 'Push notification', 'Website banner'];

export interface CommentRecord {
  author: string;
  at: string;
  body: string;
}

export interface AnnouncementRecord extends Entity {
  title: string;
  summary: string;
  body: string;
  category: AnnCategory;
  priority: AnnPriority;
  status: AnnStatus;
  author: string;
  /** Publish date, or the scheduled date for a Scheduled announcement. */
  dated: string;
  expires: string;
  audience: Audience;
  /** '' = all classes. */
  classId: string;
  channels: AnnChannel[];
  ackRequired: boolean;
  allowComments: boolean;
  delivered: number;
  readers: number;
  acknowledged: number;
  comments: CommentRecord[];
}

// title, category, priority, status, audience, days from today (negative = past), expires in days, channels, read %, ack %
const ANN_ROWS: [string, AnnCategory, AnnPriority, AnnStatus, Audience, number, number, AnnChannel[], number, number][] = [
  ['Term 2 examination timetable released', 'Examination', 'High', 'Published', 'All', -6, 40, ['In-App', 'Email', 'Push notification'], 78, 0],
  ['Fee instalment due this month', 'Fees', 'High', 'Published', 'Parents', -4, 12, ['In-App', 'SMS', 'Email'], 64, 0],
  ['Annual Day rehearsal schedule', 'Events', 'Normal', 'Published', 'Students', -3, 20, ['In-App', 'Push notification'], 71, 0],
  ['Heavy rain: school closes at noon', 'Emergency', 'Urgent', 'Published', 'All', -1, 2, ['In-App', 'SMS', 'WhatsApp', 'Push notification'], 93, 82],
  ['Admissions open for 2027-28', 'Admissions', 'Normal', 'Published', 'Parents', -9, 60, ['Website banner', 'Email'], 41, 0],
  ['Diwali holidays', 'Holiday', 'Normal', 'Scheduled', 'All', 8, 30, ['In-App', 'Email'], 0, 0],
  ['Staff meeting: new grading policy', 'Academic', 'High', 'Draft', 'Teachers', 0, 14, ['In-App', 'Email'], 0, 0],
  ['October newsletter', 'Newsletter', 'Normal', 'Archived', 'Parents', -40, -10, ['Email'], 55, 0],
];

export const buildAnnouncements = (): AnnouncementRecord[] =>
  ANN_ROWS.map(([title, category, priority, status, audience, daysFrom, expiresIn, channels, readPct, ackPct], i) => {
    const total = seedSize(audience);
    const live = status === 'Published' || status === 'Archived';
    const readers = live ? Math.round((total * readPct) / 100) : 0;
    const ackRequired = ackPct > 0 || (category === 'Emergency');
    return {
      id: `ann-${pad(i + 1)}`,
      title,
      summary: `${title}. Please read and share with your family.`,
      body: `${title}.\n\nThis notice applies to ${audience === 'All' ? 'everyone in the school community' : audience.toLowerCase()}. Contact the school office for any clarification.`,
      category,
      priority,
      status,
      author: ['Principal’s Office', 'Academic Coordinator', 'Accounts Office', 'Front Office'][i % 4],
      dated: addDays(SEED_TODAY, daysFrom),
      expires: addDays(SEED_TODAY, daysFrom + Math.max(expiresIn, 1)),
      audience,
      classId: '',
      channels,
      ackRequired,
      allowComments: category !== 'Emergency',
      delivered: live ? total : 0,
      readers,
      acknowledged: ackRequired && live ? Math.round((readers * (ackPct || 80)) / 100) : 0,
      comments: i === 0 ? [{ author: 'Priya Venkatesh', at: addDays(SEED_TODAY, -5), body: 'Can the lab practicals be moved to the second week?' }] : [],
    };
  });
export const announcements = defineCollection<AnnouncementRecord>('announcements', buildAnnouncements);

/* ------------------------------------ Notice board ------------------------------------ */

export type NoticeCategory = 'Emergency' | 'Important' | 'Holiday' | 'Examination' | 'Event' | 'Circular' | 'General';
export type NoticePriority = 'High' | 'Medium' | 'Low';
export type NoticeStatus = 'Published' | 'Draft' | 'Archived';
export const NOTICE_CATEGORIES: NoticeCategory[] = ['Emergency', 'Important', 'Holiday', 'Examination', 'Event', 'Circular', 'General'];

export interface NoticeRecord extends Entity {
  title: string;
  desc: string;
  full: string;
  category: NoticeCategory;
  priority: NoticePriority;
  audience: Audience;
  department: string;
  /** '' = all classes. */
  classId: string;
  branch: string;
  status: NoticeStatus;
  publisher: string;
  published: string;
  expiry: string;
  reads: number;
  pinned: boolean;
  comments: CommentRecord[];
}

const NOTICE_ROWS: [string, NoticeCategory, NoticePriority, NoticeStatus, Audience, string, number, number, boolean][] = [
  ['Fire drill on Friday at 10:30', 'Emergency', 'High', 'Published', 'All', 'Safety Office', -2, 6, true],
  ['Mid-term papers: seating plan', 'Examination', 'High', 'Published', 'Students', 'Examination Cell', -5, 20, true],
  ['Inter-house football finals', 'Event', 'Medium', 'Published', 'Students', 'Sports Department', -3, 9, false],
  ['Library fines amnesty week', 'Circular', 'Low', 'Published', 'All', 'Library Department', -7, 14, false],
  ['Staff appraisal forms due', 'Important', 'Medium', 'Published', 'Teachers', 'HR Department', -4, 11, false],
  ['Republic Day holiday', 'Holiday', 'Medium', 'Draft', 'All', 'Principal’s Office', 0, 60, false],
  ['Uniform guidelines', 'General', 'Low', 'Published', 'Parents', 'Academic Coordinator', -40, 25, false],
  ['Transport route changes', 'Circular', 'Medium', 'Archived', 'Parents', 'Transport Office', -60, 30, false],
];

export const buildNotices = (): NoticeRecord[] =>
  NOTICE_ROWS.map(([title, category, priority, status, audience, publisher, daysFrom, validFor, pinned], i) => {
    const total = seedSize(audience);
    return {
      id: `ntc-${pad(i + 1)}`,
      title,
      desc: `${title}. See the full notice for details.`,
      full: `${title}\n\nIssued by ${publisher}. Please comply with the instructions and contact the office if you have questions.`,
      category,
      priority,
      audience,
      department: ['Administration', 'Examinations', 'Sports', 'Library', 'HR', 'Academics'][i % 6],
      classId: '',
      branch: 'Main Campus',
      status,
      publisher,
      published: addDays(SEED_TODAY, daysFrom),
      expiry: addDays(SEED_TODAY, daysFrom + validFor),
      reads: status === 'Published' || status === 'Archived' ? Math.round(total * (0.4 + (i % 5) * 0.1)) : 0,
      pinned,
      comments: [],
    };
  });
export const notices = defineCollection<NoticeRecord>('notices', buildNotices);

/* ---------------------------------- Broadcast scheduler ---------------------------------- */

export type BroadcastStatus = 'Scheduled' | 'Draft' | 'Paused' | 'Completed' | 'Cancelled';
export type Approval = 'Awaiting approval' | 'Approved' | 'Auto-approved' | 'Rejected';
export type Cadence = 'One-off' | 'Daily' | 'Weekly' | 'Monthly' | 'Yearly';
export type BroadcastChannel = 'Email' | 'SMS' | 'WhatsApp' | 'Push Notification' | 'In-App' | 'Website Banner' | 'Digital Notice Board';
export const CADENCES: Cadence[] = ['One-off', 'Daily', 'Weekly', 'Monthly', 'Yearly'];
export const BROADCAST_CHANNELS: BroadcastChannel[] = ['Email', 'SMS', 'WhatsApp', 'Push Notification', 'In-App', 'Website Banner', 'Digital Notice Board'];

export interface ApprovalStep {
  who: string;
  state: string;
  at: string;
  note: string;
}

export interface BroadcastRecord extends Entity {
  title: string;
  category: string;
  body: string;
  status: BroadcastStatus;
  approval: Approval;
  sendDate: string;
  sendTime: string;
  cadence: Cadence;
  /** Last day a recurring broadcast may go out, '' = no end. */
  expires: string;
  audience: Audience;
  classId: string;
  channels: BroadcastChannel[];
  sentTimes: number;
  /** Day of the most recent send, '' = never sent. */
  lastSent: string;
  delivered: number;
  createdBy: string;
  createdOn: string;
  trail: ApprovalStep[];
}

const BC_ROWS: [string, string, BroadcastStatus, Approval, Audience, number, string, Cadence, BroadcastChannel[], number][] = [
  ['Daily attendance summary to parents', 'Attendance', 'Scheduled', 'Approved', 'Parents', 1, '16:30', 'Daily', ['SMS', 'Push Notification'], 38],
  ['Weekly fee reminder', 'Fees', 'Scheduled', 'Approved', 'Parents', 3, '10:00', 'Weekly', ['SMS', 'Email'], 6],
  ['Annual Day invitation', 'Events', 'Scheduled', 'Awaiting approval', 'All', 12, '09:00', 'One-off', ['Email', 'In-App', 'WhatsApp'], 0],
  ['Staff meeting reminder', 'Staff', 'Scheduled', 'Auto-approved', 'Staff', 2, '08:00', 'Weekly', ['In-App', 'Email'], 11],
  ['Monthly newsletter', 'Newsletter', 'Paused', 'Approved', 'Parents', 15, '11:00', 'Monthly', ['Email'], 4],
  ['Exam hall tickets', 'Examination', 'Draft', 'Auto-approved', 'Students', 20, '09:30', 'One-off', ['In-App', 'Push Notification'], 0],
  ['Admissions open — banner', 'Admissions', 'Completed', 'Approved', 'Parents', -8, '09:00', 'One-off', ['Website Banner', 'Email'], 1],
  ['Holiday greetings', 'Greetings', 'Cancelled', 'Rejected', 'All', -3, '07:30', 'One-off', ['SMS'], 0],
];

export const buildBroadcasts = (): BroadcastRecord[] =>
  BC_ROWS.map(([title, category, status, approval, audience, inDays, sendTime, cadence, channels, sentTimes], i) => {
    const total = seedSize(audience);
    return {
      id: `bc-${pad(i + 1)}`,
      title,
      category,
      body: `${title}. Sent by the school office.`,
      status,
      approval,
      sendDate: addDays(SEED_TODAY, inDays),
      sendTime,
      cadence,
      expires: cadence === 'One-off' ? '' : addDays(SEED_TODAY, 200),
      audience,
      classId: '',
      channels,
      sentTimes,
      lastSent: sentTimes ? addDays(SEED_TODAY, cadence === 'One-off' ? inDays : -1) : '',
      delivered: sentTimes * total,
      createdBy: ['Front Office', 'Accounts Office', 'Principal’s Office'][i % 3],
      createdOn: addDays(SEED_TODAY, -(20 + i)),
      trail: [
        { who: 'Front Office', state: 'Submitted', at: addDays(SEED_TODAY, -(20 + i)), note: '' },
        ...(approval === 'Approved' ? [{ who: 'Dr. Meera Krishnan', state: 'Approved', at: addDays(SEED_TODAY, -(18 + i)), note: '' }] : approval === 'Rejected' ? [{ who: 'Dr. Meera Krishnan', state: 'Rejected', at: addDays(SEED_TODAY, -4), note: 'Not needed this year.' }] : approval === 'Auto-approved' ? [{ who: 'System', state: 'Auto-approved', at: addDays(SEED_TODAY, -(20 + i)), note: 'Within the standing approval for this category.' }] : []),
      ],
    };
  });
export const broadcasts = defineCollection<BroadcastRecord>('broadcasts', buildBroadcasts);

/* ------------------------------------ Notification center ------------------------------------ */

export type NtfCategory = 'Academic' | 'Attendance' | 'Fees' | 'Examination' | 'Homework' | 'Behaviour' | 'PTA' | 'Achievement' | 'Emergency' | 'Transport' | 'Medical' | 'Newsletter';
export type NtfStatus = 'Sent' | 'Scheduled' | 'Draft' | 'Failed' | 'Archived';
export type NtfChannel = 'Email' | 'Push' | 'Portal';
export const NTF_CATEGORIES: NtfCategory[] = ['Academic', 'Attendance', 'Fees', 'Examination', 'Homework', 'Behaviour', 'PTA', 'Achievement', 'Emergency', 'Transport', 'Medical', 'Newsletter'];

export interface NotificationRecord extends Entity {
  category: NtfCategory;
  title: string;
  summary: string;
  audience: Audience;
  priority: 'Urgent' | 'High' | 'Normal' | 'Low';
  channels: NtfChannel[];
  status: NtfStatus;
  /** Day and time it was sent, or is due to be sent. */
  date: string;
  time: string;
  delivered: number;
  read: number;
  ackRequired: boolean;
  acknowledged: number;
  failure: string;
  createdBy: string;
  automated: boolean;
}

const NTF_ROWS: [NtfCategory, string, Audience, NtfStatus, 'Urgent' | 'High' | 'Normal' | 'Low', NtfChannel[], number, number, boolean][] = [
  ['Attendance', 'Absence alert: your child was marked absent today', 'Parents', 'Sent', 'High', ['Push', 'Portal'], 35, 62, true],
  ['Fees', 'Fee reminder: instalment due in 5 days', 'Parents', 'Sent', 'Normal', ['Email', 'Push'], 300, 48, true],
  ['Homework', 'New homework posted in Mathematics', 'Students', 'Sent', 'Low', ['Push', 'Portal'], 90, 77, true],
  ['Examination', 'Hall tickets are now available', 'Students', 'Scheduled', 'High', ['Email', 'Push', 'Portal'], -1440, 0, false],
  ['Emergency', 'Early closure due to weather', 'All', 'Sent', 'Urgent', ['Email', 'Push', 'Portal'], 1500, 94, false],
  ['PTA', 'Parent–teacher meeting on Saturday', 'Parents', 'Draft', 'Normal', ['Email'], 0, 0, false],
  ['Transport', 'Route RT-01 is running 10 minutes late', 'Parents', 'Failed', 'High', ['Push'], 60, 0, true],
  ['Achievement', 'Congratulations to the football team', 'All', 'Sent', 'Low', ['Portal'], 2880, 55, false],
  ['Medical', 'Vaccination camp next week', 'Parents', 'Scheduled', 'Normal', ['Email', 'Portal'], -2880, 0, false],
  ['Newsletter', 'October newsletter', 'Parents', 'Archived', 'Low', ['Email'], 28800, 58, false],
  ['Behaviour', 'Commendation: Excellent conduct in assembly', 'Parents', 'Sent', 'Low', ['Portal'], 4000, 70, true],
  ['Academic', 'Syllabus change for Grade X Science', 'Teachers', 'Sent', 'High', ['Email', 'Portal'], 6000, 88, false],
];

export const buildNotifications = (): NotificationRecord[] =>
  NTF_ROWS.map(([category, title, audience, status, priority, channels, agoMin, readPct, automated], i) => {
    const total = seedSize(audience);
    const sent = status === 'Sent' || status === 'Archived';
    return {
      id: `ntf-${pad(i + 1)}`,
      category,
      title,
      summary: `${title}.`,
      audience,
      priority,
      channels,
      status,
      ...dateTime(agoMin),
      delivered: sent ? total : 0,
      read: sent ? Math.round((total * readPct) / 100) : 0,
      ackRequired: priority === 'Urgent',
      acknowledged: priority === 'Urgent' && sent ? Math.round(total * 0.8) : 0,
      failure: status === 'Failed' ? 'Push gateway timed out for 3 devices.' : '',
      createdBy: automated ? 'Automation' : 'Front Office',
      automated,
    };
  });
export const notifications = defineCollection<NotificationRecord>('notifications', buildNotifications);

/* ---------------------------------------- SMS ---------------------------------------- */

export type SmsCategory = 'Fees' | 'Attendance' | 'Examination' | 'Holiday' | 'Emergency' | 'PTA' | 'Transport' | 'Library' | 'Greetings' | 'Admissions' | 'Results';
export type SmsRoute = 'Transactional' | 'Promotional';
export type SmsStatus = 'Approved' | 'Pending registration' | 'Rejected' | 'Draft';
export const SMS_CATEGORIES: SmsCategory[] = ['Fees', 'Attendance', 'Examination', 'Holiday', 'Emergency', 'PTA', 'Transport', 'Library', 'Greetings', 'Admissions', 'Results'];
export const SENDER_IDS = ['KARKAI', 'KRKSCH', 'SCHOOL'];
export const RATE_PER_SEGMENT = 0.3;

export interface SmsTemplateRecord extends Entity {
  name: string;
  category: SmsCategory;
  body: string;
  route: SmsRoute;
  senderId: string;
  status: SmsStatus;
  rejectedReason: string;
  uses: number;
  lastUsed: string;
  updatedOn: string;
  updatedBy: string;
}

const SMS_ROWS: [string, SmsCategory, string, SmsRoute, SmsStatus, number][] = [
  ['Fee due reminder', 'Fees', 'Dear {#var#}, the fee of {#var#} for {#var#} is due on {#var#}. Please pay at the school office or online. - Karkaii School', 'Transactional', 'Approved', 18],
  ['Absence alert', 'Attendance', 'Dear parent, {#var#} was absent from school today. Please inform the class teacher. - Karkaii School', 'Transactional', 'Approved', 42],
  ['Exam timetable', 'Examination', 'Dear parent, the {#var#} timetable is on the parent portal. - Karkaii School', 'Transactional', 'Approved', 6],
  ['Holiday notice', 'Holiday', 'School will remain closed on {#var#} for {#var#}. Classes resume on {#var#}. - Karkaii School', 'Promotional', 'Approved', 3],
  ['Emergency closure', 'Emergency', 'URGENT: School closes at {#var#} today. Please collect your child. - Karkaii School', 'Transactional', 'Approved', 2],
  ['PTA invitation', 'PTA', 'You are invited to the parent-teacher meeting on {#var#} at {#var#}. - Karkaii School', 'Transactional', 'Pending registration', 0],
  ['Bus delay', 'Transport', 'Bus {#var#} is running {#var#} minutes late. - Karkaii School', 'Transactional', 'Approved', 9],
  ['Diwali greetings', 'Greetings', 'Warm Diwali wishes from Karkaii School! தீபாவளி நல்வாழ்த்துக்கள்', 'Promotional', 'Rejected', 0],
  ['Admission enquiry reply', 'Admissions', 'Thank you for your interest in Karkaii School. Our counsellor will call you within 24 hours.', 'Promotional', 'Draft', 0],
  ['Result published', 'Results', 'Dear parent, the {#var#} results of {#var#} are published on the parent portal. - Karkaii School', 'Transactional', 'Approved', 5],
];

export const buildSmsTemplates = (): SmsTemplateRecord[] =>
  SMS_ROWS.map(([name, category, body, route, status, uses], i) => ({
    id: `smt-${pad(i + 1)}`,
    name,
    category,
    body,
    route,
    senderId: SENDER_IDS[i % 3],
    status,
    rejectedReason: status === 'Rejected' ? 'Non-English text on a promotional route needs separate registration.' : '',
    uses,
    lastUsed: uses ? addDays(SEED_TODAY, -(i * 3 + 1)) : '',
    updatedOn: addDays(SEED_TODAY, -(i * 4 + 2)),
    updatedBy: ['Front Office', 'Accounts Office'][i % 2],
  }));
export const smsTemplates = defineCollection<SmsTemplateRecord>('smsTemplates', buildSmsTemplates);

export type SmsState = 'Delivered' | 'Failed' | 'Pending DLR' | 'Queued' | 'Rejected';

export interface SmsLogRecord extends Entity {
  title: string;
  audience: Audience;
  classId: string;
  message: string;
  templateId: string;
  recipients: number;
  segments: number;
  cost: number;
  state: SmsState;
  failed: number;
  reason: string;
  gateway: string;
  at: string;
  by: string;
}

export const buildSmsLog = (): SmsLogRecord[] => {
  const rng = makeRng(94000);
  // title (also the template name), audience, message, minutes ago, delivery state
  const rows: [string, Audience, string, number, SmsState][] = [
    ['Fee due reminder', 'Parents', 'Dear parents, the fee of $450 for Term 2 is due on 28 Nov.', 3, 'Delivered'],
    ['Absence alert', 'Parents', 'Dear parent, your child was absent from school today.', 20, 'Delivered'],
    ['Emergency closure', 'All', 'URGENT: School closes at 12:00 today. Please collect your child.', 1500, 'Delivered'],
    ['Bus delay', 'Parents', 'Bus RT-01 is running 10 minutes late.', 60, 'Failed'],
    ['Exam timetable', 'Students', 'The Term 2 timetable is on the portal.', 300, 'Pending DLR'],
    ['Holiday notice', 'All', 'School will remain closed on 12 Nov for Diwali.', 4000, 'Delivered'],
  ];
  const templateIds = new Map(buildSmsTemplates().map((t) => [t.name, t.id]));
  return rows.map(([title, audience, message, agoMin, state], i) => {
    const recipients = seedSize(audience);
    const failed = state === 'Failed' ? Math.round(recipients * 0.25) : state === 'Delivered' ? rng.int(0, Math.max(1, Math.round(recipients * 0.02))) : 0;
    return {
      id: `sms-${pad(i + 1)}`,
      title,
      audience,
      classId: '',
      message,
      templateId: templateIds.get(title) ?? '',
      recipients,
      segments: 1, // every message above is plain GSM-7 and under 160 characters
      cost: Math.round((recipients - failed) * RATE_PER_SEGMENT * 100) / 100, // only numbers that reached the operator are billed
      state,
      failed,
      reason: state === 'Failed' ? 'Operator rejected the sender ID for 25% of numbers.' : '',
      gateway: 'Gateway A',
      at: minutesAgo(agoMin),
      by: 'Front Office',
    };
  });
};
export const smsLog = defineCollection<SmsLogRecord>('smsLog', buildSmsLog);

/* -------------------------------------- WhatsApp -------------------------------------- */

export type WaCategory = 'Utility' | 'Marketing' | 'Authentication';
export type WaState = 'Approved' | 'In review' | 'Rejected' | 'Paused' | 'Draft';
export type WaQuality = 'High' | 'Medium' | 'Low' | 'Not rated';
export const WA_LANGUAGES = ['English', 'Hindi', 'Tamil', 'Malayalam'];

export interface WaTemplateRecord extends Entity {
  name: string;
  category: WaCategory;
  languages: string[];
  header: string;
  body: string;
  footer: string;
  button: 'None' | 'Visit website' | 'Call phone number' | 'Quick reply';
  state: WaState;
  quality: WaQuality;
  rejectedReason: string;
  uses: number;
  lastUsed: string;
  updatedOn: string;
}

const WA_ROWS: [string, WaCategory, string, WaState, WaQuality, number][] = [
  ['fee_reminder', 'Utility', 'Hello {{1}}, the fee of {{2}} for {{3}} is due on {{4}}.', 'Approved', 'High', 31],
  ['attendance_alert', 'Utility', 'Hello {{1}}, {{2}} was marked absent on {{3}}.', 'Approved', 'High', 64],
  ['ptm_invite', 'Utility', 'Dear {{1}}, the parent-teacher meeting is on {{2}} at {{3}}.', 'Approved', 'Medium', 12],
  ['otp_login', 'Authentication', 'Your Karkaii verification code is {{1}}. It expires in 10 minutes.', 'Approved', 'High', 120],
  ['admission_offer', 'Marketing', 'Admissions are open for {{1}}. Reply YES to speak to a counsellor.', 'In review', 'Not rated', 0],
  ['festival_greeting', 'Marketing', 'Warm wishes from Karkaii School on {{1}}!', 'Rejected', 'Not rated', 0],
  ['transport_delay', 'Utility', 'Bus {{1}} is running {{2}} minutes late.', 'Paused', 'Low', 8],
  ['result_published', 'Utility', 'Hello {{1}}, the {{2}} results are published.', 'Draft', 'Not rated', 0],
];

export const buildWaTemplates = (): WaTemplateRecord[] =>
  WA_ROWS.map(([name, category, body, state, quality, uses], i) => ({
    id: `wat-${pad(i + 1)}`,
    name,
    category,
    languages: i % 3 === 0 ? ['English', 'Tamil'] : ['English'],
    header: '',
    body,
    footer: 'Karkaii International School',
    button: i === 2 ? 'Quick reply' : 'None',
    state,
    quality,
    rejectedReason: state === 'Rejected' ? 'Marketing content must be tied to an opt-in.' : '',
    uses,
    lastUsed: uses ? addDays(SEED_TODAY, -(i + 1)) : '',
    updatedOn: addDays(SEED_TODAY, -(i * 3 + 1)),
  }));
export const waTemplates = defineCollection<WaTemplateRecord>('waTemplates', buildWaTemplates);

export interface WaMessage {
  from: 'contact' | 'staff';
  text: string;
  /** ISO date-time. */
  at: string;
}

export interface WaThreadRecord extends Entity {
  contact: string;
  phone: string;
  relation: string;
  channel: 'WhatsApp' | 'SMS' | 'In-App';
  label: string;
  assignedTo: string;
  team: string;
  messages: WaMessage[];
  resolved: boolean;
  /** ISO date-time the thread wakes up at, '' = not snoozed. */
  snoozedUntil: string;
  archived: boolean;
  flagged: boolean;
}

const WA_THREADS: [string, string, string, string, string, string, number, string][] = [
  ['Robert Daniel', 'Parent of Janet Daniel', 'Fee query', 'Unassigned', 'Accounts', '', 12, 'Can I pay the second instalment in two parts?'],
  ['Anil Joseph', 'Parent', 'Transport', 'Front Office', 'Transport', 'Thanks, noted. We will inform the driver.', 95, 'My son missed the bus today. Can he be picked up at the next stop?'],
  ['Meera Nair', 'Parent', 'Admission', 'Front Office', 'Front office', '', 28, 'What documents do I need for a Grade 4 transfer admission?'],
  ['Suresh Iyer', 'Parent', 'Complaint', 'Principal’s Office', 'Academics', '', 140, 'My daughter says the homework load this week is too heavy.'],
  ['Fatima Khan', 'Parent', 'Academic', 'Front Office', 'Academics', 'The result will be shared on Friday.', 300, 'When will the Term 1 result be published?'],
  ['George Thomas', 'Parent', 'Follow-up', 'Accounts Office', 'Accounts', '', 18, 'I paid the fees yesterday but the receipt has not arrived.'],
  ['Divya Menon', 'Parent', 'Admission', 'Front Office', 'Front office', 'Your interview is on Monday at 10:00.', 55, 'Is there a seat in Grade 2 section B?'],
  ['Imran Sheikh', 'Staff', 'Follow-up', 'Unassigned', 'Transport', '', 220, 'Bus RT-05 needs a new tyre before Monday.'],
];

export const buildWaThreads = (): WaThreadRecord[] =>
  WA_THREADS.map(([contact, relation, label, assignedTo, team, reply, agoMin, text], i) => ({
    id: `wth-${pad(i + 1)}`,
    contact,
    phone: `+91 98400 8${pad(i + 1, 4)}`,
    relation,
    channel: i % 4 === 3 ? 'SMS' : 'WhatsApp',
    label,
    assignedTo,
    team,
    messages: [{ from: 'contact' as const, text, at: minutesAgo(agoMin) }, ...(reply ? [{ from: 'staff' as const, text: reply, at: minutesAgo(Math.max(1, agoMin - 20)) }] : [])].sort((a, b) => a.at.localeCompare(b.at)),
    resolved: i === 4,
    snoozedUntil: i === 7 ? new Date(Date.now() + 3 * 3600000).toISOString() : '',
    archived: false,
    flagged: i === 3,
  }));
export const waThreads = defineCollection<WaThreadRecord>('waThreads', buildWaThreads);
