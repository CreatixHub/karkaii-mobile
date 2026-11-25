import { gradeFor, GRADES, latePenaltyMarks } from '@/core/academic';
import { snapshot } from '@/core/store/store';
import { diffDays, formatDate, formatTime, todayISO } from '@/core/utils/date';
import { pct } from '@/core/utils/format';
import type { HomeworkRecord, HomeworkStatus, SubjectRecord, SubmissionRecord } from '@/data/seed/academic';
import type { SectionRecord, StudentRecord } from '@/data/seed/master';
import { classSection, countBy, getSection, getStudent, nextNo, ownStudentScope, staffSideScope, studentName, studentOptions, sum, teacherName } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import { allHomework, classOptionList, homeworkOf, homeworkStats, mappingsOfClass, netMarks, opts, sectionLabel, subjectName, subjectOf, teacherOptionList } from './helpers';

const ACTIVE_YEARS = ['2026-27', '2025-26'];
const HW_TYPES = ['Assignment', 'Worksheet', 'Problem Set', 'Project', 'Reading', 'Practice'];
const statusTone: Record<HomeworkStatus, Tone> = { Draft: 'neutral', Assigned: 'info', 'In Progress': 'warning', Completed: 'success', Overdue: 'danger', Archived: 'neutral' };
const priorityTone = { High: 'danger', Medium: 'warning', Low: 'neutral' } as const;
const NOTES: Record<HomeworkStatus, string> = {
  Draft: 'Draft — not yet published to students.',
  Assigned: 'On track — reviewing submissions as they arrive.',
  'In Progress': 'On track — reviewing submissions as they arrive.',
  Completed: 'All submissions graded and returned.',
  Overdue: 'Follow up with students who missed the deadline.',
  Archived: 'On track — reviewing submissions as they arrive.',
};

/** Which sections a signed-in student / parent belongs to (for read-only scoping). */
const ownSections = (user: { role: string; studentId?: string; childIds?: string[] } | null): string[] | null => {
  if (user?.role === 'student') return [getStudent(user.studentId)?.sectionId ?? ''];
  if (user?.role === 'parent') return (user.childIds ?? []).map((id) => getStudent(id)?.sectionId ?? '');
  return null;
};

const sectionPick = { collection: 'sections', label: (s: SectionRecord) => sectionLabel(s.id), hint: (s: SectionRecord) => `Teacher: ${teacherName(s.classTeacherId)}` };
const subjectPick = {
  collection: 'subjects',
  label: (s: SubjectRecord) => s.name,
  hint: (s: SubjectRecord) => s.code,
  filter: (s: SubjectRecord, vals: Record<string, any>) => {
    const classId = getSection(vals.sectionId)?.classId;
    return !classId || mappingsOfClass(classId).some((m) => m.subjectId === s.id);
  },
};

/* ================================ Homework list ================================ */

export const homeworkCfg: ResourceConfig<HomeworkRecord> = {
  entity: 'Homework',
  collection: 'homework',
  rowScope: (r, user) => {
    const mine = ownSections(user);
    return mine ? r.status !== 'Draft' && mine.includes(r.sectionId) : true;
  },
  searchPlaceholder: 'Search homework, subject, class…',
  searchText: (r) => `${r.title} ${r.code} ${subjectName(r.subjectId)} ${sectionLabel(r.sectionId)} ${teacherName(r.teacherId)} ${r.type}`,
  code: (r) => r.code,
  title: (r) => r.title,
  subtitle: (r) => `${subjectName(r.subjectId)} · ${sectionLabel(r.sectionId)}`,
  status: (r) => ({ label: r.status, tone: statusTone[r.status] }),
  badges: (r) => [{ label: `${r.priority} priority`, tone: priorityTone[r.priority] }, { label: r.type, tone: 'primary' }],
  facts: [
    { label: 'Teacher', value: (r) => teacherName(r.teacherId) },
    { label: 'Assigned', value: (r) => formatDate(r.assignedOn) },
    { label: 'Due', value: (r) => formatDate(r.dueDate) },
    { label: 'Duration', value: (r) => `${r.durationMin} min` },
    { label: 'Submitted', value: (r) => { const s = homeworkStats(r); return `${s.submitted} / ${s.total}`; } },
    { label: 'Pending · Late', value: (r) => { const s = homeworkStats(r); return `${s.pending} · ${s.late}`; } },
  ],
  progress: (r) => { const s = homeworkStats(r); return { value: s.submitted, max: Math.max(1, s.total), label: 'Submission progress', tone: s.pct >= 80 ? 'success' : s.pct >= 50 ? 'warning' : 'danger' }; },
  detail: [
    { title: 'Homework', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Title', value: (r) => r.title }, { label: 'Subject', value: (r) => subjectName(r.subjectId) }, { label: 'Class', value: (r) => sectionLabel(r.sectionId) }, { label: 'Teacher', value: (r) => teacherName(r.teacherId) }, { label: 'Type', value: (r) => r.type }, { label: 'Priority', value: (r) => r.priority }, { label: 'Description', value: (r) => r.description }, { label: 'Attachments', value: (r) => `${r.files} file${r.files === 1 ? '' : 's'}` }] },
    { title: 'Schedule & marking', items: [{ label: 'Assigned', value: (r) => formatDate(r.assignedOn) }, { label: 'Due', value: (r) => formatDate(r.dueDate) }, { label: 'Duration', value: (r) => `${r.durationMin} min` }, { label: 'Max marks', value: (r) => r.maxMarks }, { label: 'Late submissions', value: (r) => (r.allowLate ? `Allowed, ${r.latePenaltyPct}% penalty` : 'Not allowed') }] },
    { title: 'Submissions', items: [{ label: 'Submitted', value: (r) => { const s = homeworkStats(r); return `${s.submitted} of ${s.total} (${pct(s.pct)})`; } }, { label: 'Pending', value: (r) => homeworkStats(r).pending }, { label: 'Late', value: (r) => homeworkStats(r).late }, { label: 'Graded', value: (r) => homeworkStats(r).graded }, { label: 'Teacher note', value: (r) => NOTES[r.status] }] },
  ],
  stats: [
    { label: 'Homework', value: (rows) => rows.length, icon: 'edit-3' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Assigned' || r.status === 'In Progress'), tone: 'info', icon: 'send' },
    { label: 'Overdue', value: (rows) => countBy(rows, (r) => r.status === 'Overdue'), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Completed', value: (rows) => countBy(rows, (r) => r.status === 'Completed'), tone: 'success', icon: 'check-circle' },
    { label: 'Pending work', value: (rows) => sum(rows.filter((r) => r.status !== 'Draft' && r.status !== 'Archived'), (r) => homeworkStats(r).pending), tone: 'warning', icon: 'clock' },
  ],
  views: [
    { key: 'all', label: 'All Homework', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Assigned' || r.status === 'In Progress' },
    { key: 'overdue', label: 'Overdue', match: (r) => r.status === 'Overdue' },
    { key: 'completed', label: 'Completed', match: (r) => r.status === 'Completed' },
    { key: 'draft', label: 'Draft', match: (r) => r.status === 'Draft' },
    { key: 'archived', label: 'Archived', match: (r) => r.status === 'Archived' },
  ],
  filters: [
    { key: 'year', label: 'Academic year', options: opts(ACTIVE_YEARS), match: (r, v) => r.year === v },
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => getSection(r.sectionId)?.classId === v },
    { key: 'section', label: 'Section', options: opts(['A', 'B']), match: (r, v) => getSection(r.sectionId)?.name === v },
    { key: 'subject', label: 'Subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => r.subjectId === v },
    { key: 'teacher', label: 'Teacher', options: teacherOptionList, match: (r, v) => r.teacherId === v },
    { key: 'status', label: 'Status', options: opts(['Draft', 'Assigned', 'In Progress', 'Completed', 'Overdue', 'Archived']), match: (r, v) => r.status === v },
    { key: 'submission', label: 'Submission', single: true, options: opts(['None yet', 'Partial', 'All in']), match: (r, v) => { const s = homeworkStats(r); return v === 'None yet' ? s.submitted === 0 : v === 'All in' ? s.total > 0 && s.submitted >= s.total : s.submitted > 0 && s.submitted < s.total; } },
    { key: 'due', label: 'Due', single: true, options: opts(['Overdue', 'Due this week', 'Later']), match: (r, v) => { const d = diffDays(todayISO(), r.dueDate); return v === 'Overdue' ? d < 0 : v === 'Due this week' ? d >= 0 && d <= 7 : d > 7; } },
    { key: 'priority', label: 'Priority', options: opts(['High', 'Medium', 'Low']), match: (r, v) => r.priority === v },
    { key: 'type', label: 'Type', options: opts(HW_TYPES), match: (r, v) => r.type === v },
  ],
  sorts: [
    { key: 'recent', label: 'Recently assigned', compare: (a, b) => b.assignedOn.localeCompare(a.assignedOn) },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
    { key: 'subject', label: 'Subject', compare: (a, b) => subjectName(a.subjectId).localeCompare(subjectName(b.subjectId)) },
    { key: 'teacher', label: 'Teacher (A–Z)', compare: (a, b) => teacherName(a.teacherId).localeCompare(teacherName(b.teacherId)) },
    { key: 'due', label: 'Due date (soonest)', compare: (a, b) => a.dueDate.localeCompare(b.dueDate) },
    { key: 'completion', label: 'Completion (lowest first)', compare: (a, b) => homeworkStats(a).pct - homeworkStats(b).pct },
    { key: 'status', label: 'Status', compare: (a, b) => a.status.localeCompare(b.status) },
  ],
  form: [
    { key: 'sectionId', label: 'Class & Section', type: 'select', required: true, optionsFrom: sectionPick, readOnly: (_v, edit) => edit, onChange: () => ({ subjectId: '' }) },
    { key: 'subjectId', label: 'Subject', type: 'select', required: true, optionsFrom: subjectPick },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: opts(HW_TYPES), default: 'Assignment' },
    { key: 'priority', label: 'Priority', type: 'select', required: true, options: opts(['High', 'Medium', 'Low']), default: 'Medium' },
    { key: 'assignedOn', label: 'Homework Date', type: 'date', required: true },
    { key: 'dueDate', label: 'Submission Date', type: 'date', required: true },
    { key: 'durationMin', label: 'Estimated duration (minutes)', type: 'number', min: 5, max: 600, default: 45 },
    { key: 'maxMarks', label: 'Max marks', type: 'number', required: true, min: 1, max: 200, default: 20 },
    { key: 'files', label: 'Attachments (number of files)', type: 'number', min: 0, max: 20, default: 0 },
    { key: 'description', label: 'Description', type: 'textarea' },
    { key: 'allowLate', label: 'Allow late submissions', type: 'switch', default: true },
    { key: 'latePenaltyPct', label: 'Late penalty (% of max marks)', type: 'number', min: 0, max: 100, default: 10, hidden: (v) => !v.allowLate },
    { key: 'status', label: 'Status', type: 'select', required: true, options: opts(['Draft', 'Assigned', 'In Progress', 'Completed', 'Overdue', 'Archived']), default: 'Assigned' },
  ],
  defaults: () => ({ assignedOn: todayISO() }),
  validate: (v) => ({
    ...(String(v.dueDate) < String(v.assignedOn) ? { dueDate: 'Submission date cannot be before the homework date' } : {}),
  }),
  prepare: (v, { existing, rows }) => {
    const classId = getSection(v.sectionId)?.classId ?? '';
    const mapped = mappingsOfClass(classId).find((m) => m.subjectId === v.subjectId);
    return {
      code: existing?.code ?? nextNo('HW', rows.map((r) => r.code), 7),
      teacherId: existing?.teacherId ?? mapped?.teacherId ?? subjectOf(v.subjectId)?.teacherId ?? '',
      year: existing?.year ?? '2026-27',
      latePenaltyPct: v.allowLate ? v.latePenaltyPct : 0,
    };
  },
  canDeleteRecord: (r) => {
    const n = homeworkStats(r).submitted;
    return n ? `${r.title} already has ${n} student submission(s). Archive it instead of deleting.` : null;
  },
  actions: [
    { key: 'publish', label: 'Publish to students', icon: 'send', visible: (r) => r.status === 'Draft', run: (_r, _v, ctx) => { ctx.update({ status: 'Assigned' }); ctx.toast('Homework published'); } },
    { key: 'remind', label: 'Remind pending students', icon: 'bell', visible: (r) => (r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Overdue') && homeworkStats(r).pending > 0, run: (r, _v, ctx) => ctx.toast(`Reminder queued for ${homeworkStats(r).pending} students (mock — nothing is sent)`, 'info') },
    { key: 'close', label: 'Mark completed', icon: 'check-circle', tone: 'success', visible: (r) => r.status === 'Assigned' || r.status === 'In Progress' || r.status === 'Overdue', confirm: 'Close this homework? Students can no longer submit.', run: (_r, _v, ctx) => { ctx.update({ status: 'Completed' }); ctx.toast('Homework marked completed'); } },
    { key: 'archive', label: 'Archive', icon: 'archive', visible: (r) => r.status !== 'Archived', confirm: 'Archive this homework?', run: (_r, _v, ctx) => { ctx.update({ status: 'Archived' }); ctx.toast('Homework archived', 'info'); } },
  ],
};

/* ================================ Tracking (read-only) ================================ */

const subsOf = (hwId: string) => snapshot<SubmissionRecord>('homeworkSubmissions').filter((s) => s.homeworkId === hwId);
const avgScore = (hw: HomeworkRecord) => {
  const graded = subsOf(hw.id).filter((s) => s.graded);
  return graded.length ? Math.round(sum(graded, (s) => (netMarks(s) / s.outOf) * 100) / graded.length) : null;
};
const lastActivity = (hw: HomeworkRecord) => subsOf(hw.id).map((s) => s.submittedOn).sort().pop();

export const trackingCfg: ResourceConfig<HomeworkRecord> = {
  entity: 'Tracked Homework',
  collection: 'homework',
  rowScope: (r, user) => staffSideScope(r, user) && r.status !== 'Draft',
  canCreate: false,
  canEdit: false,
  canDelete: false,
  searchPlaceholder: 'Search tracked homework…',
  searchText: (r) => `${r.title} ${subjectName(r.subjectId)} ${sectionLabel(r.sectionId)}`,
  code: (r) => r.code,
  title: (r) => r.title,
  subtitle: (r) => `${subjectName(r.subjectId)} · ${sectionLabel(r.sectionId)}`,
  status: (r) => { const s = homeworkStats(r); return { label: `${s.pct}% in`, tone: s.pct >= 80 ? 'success' : s.pct >= 50 ? 'warning' : 'danger' }; },
  facts: [
    { label: 'Submitted', value: (r) => { const s = homeworkStats(r); return `${s.submitted} / ${s.total}`; } },
    { label: 'Pending', value: (r) => homeworkStats(r).pending },
    { label: 'Reviewed', value: (r) => countBy(subsOf(r.id), (s) => s.review === 'Reviewed') },
    { label: 'Returned', value: (r) => countBy(subsOf(r.id), (s) => s.review === 'Returned') },
    { label: 'Average score', value: (r) => (avgScore(r) === null ? '—' : `${avgScore(r)}%`) },
    { label: 'Last activity', value: (r) => { const d = lastActivity(r); return d ? formatDate(d) : '—'; } },
  ],
  progress: (r) => { const s = homeworkStats(r); return { value: s.submitted, max: Math.max(1, s.total), label: 'Completion', tone: s.pct >= 80 ? 'success' : s.pct >= 50 ? 'warning' : 'danger' }; },
  stats: [
    { label: 'Tracked', value: (rows) => rows.length, icon: 'activity' },
    { label: 'Submissions', value: (rows) => sum(rows, (r) => homeworkStats(r).submitted), tone: 'info', icon: 'inbox' },
    { label: 'Pending', value: (rows) => sum(rows, (r) => homeworkStats(r).pending), tone: 'warning', icon: 'clock' },
    { label: 'To review', value: (rows) => sum(rows, (r) => countBy(subsOf(r.id), (s) => s.review === 'Not Reviewed' || s.review === 'Under Review')), tone: 'purple', icon: 'eye' },
  ],
  views: [
    { key: 'all', label: 'All', match: () => true },
    { key: 'low', label: 'Low completion', match: (r) => homeworkStats(r).pct < 50 },
    { key: 'complete', label: 'All submitted', match: (r) => { const s = homeworkStats(r); return s.total > 0 && s.submitted >= s.total; } },
    { key: 'review', label: 'Needs review', match: (r) => subsOf(r.id).some((s) => s.review === 'Not Reviewed' || s.review === 'Under Review') },
  ],
  filters: [
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => getSection(r.sectionId)?.classId === v },
    { key: 'subject', label: 'Subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => r.subjectId === v },
    { key: 'teacher', label: 'Teacher', options: teacherOptionList, match: (r, v) => r.teacherId === v },
  ],
  sorts: [
    { key: 'completion-asc', label: 'Completion (lowest first)', compare: (a, b) => homeworkStats(a).pct - homeworkStats(b).pct },
    { key: 'completion-desc', label: 'Completion (highest first)', compare: (a, b) => homeworkStats(b).pct - homeworkStats(a).pct },
    { key: 'pending', label: 'Most pending', compare: (a, b) => homeworkStats(b).pending - homeworkStats(a).pending },
    { key: 'score', label: 'Average score', compare: (a, b) => (avgScore(b) ?? -1) - (avgScore(a) ?? -1) },
  ],
  form: [],
};

/* ================================ Submissions ================================ */

const reviewTone: Record<string, Tone> = { Reviewed: 'success', 'Under Review': 'warning', Returned: 'info', 'Not Reviewed': 'neutral' };
const FEEDBACK_TYPES = ['Positive', 'Constructive', 'Needs Improvement', 'Resubmit'];
const hwTitle = (s: SubmissionRecord) => homeworkOf(s.homeworkId)?.title ?? '—';
const hwSubject = (s: SubmissionRecord) => subjectName(homeworkOf(s.homeworkId)?.subjectId);
const marksText = (s: SubmissionRecord) => (s.graded ? `${netMarks(s)} / ${s.outOf}${s.marksDeducted ? ` (−${s.marksDeducted} late)` : ''}` : 'Not graded');

export const submissionsCfg: ResourceConfig<SubmissionRecord> = {
  entity: 'Submission',
  collection: 'homeworkSubmissions',
  rowScope: ownStudentScope,
  searchPlaceholder: 'Search student, homework…',
  searchText: (r) => `${studentName(r.studentId)} ${getStudent(r.studentId)?.admissionNo ?? ''} ${hwTitle(r)} ${hwSubject(r)}`,
  code: (r) => getStudent(r.studentId)?.admissionNo,
  title: (r) => studentName(r.studentId),
  subtitle: (r) => `${hwTitle(r)} · ${classSection(getStudent(r.studentId))}`,
  status: (r) => ({ label: r.review, tone: reviewTone[r.review] }),
  badges: (r) => [{ label: r.type, tone: 'primary' }, ...(r.graded ? [{ label: `Grade ${r.grade}`, tone: 'success' as Tone }] : []), ...(r.late ? [{ label: 'Late', tone: 'danger' as Tone }] : [])],
  facts: [
    { label: 'Subject', value: (r) => hwSubject(r) },
    { label: 'Submitted', value: (r) => `${formatDate(r.submittedOn)} · ${formatTime(r.submittedTime)}` },
    { label: 'Marks', value: marksText },
    { label: 'Feedback', value: (r) => r.feedbackType || undefined },
  ],
  detail: [
    { title: 'Submission', items: [{ label: 'Student', value: (r) => studentName(r.studentId) }, { label: 'Admission no', value: (r) => getStudent(r.studentId)?.admissionNo }, { label: 'Class', value: (r) => classSection(getStudent(r.studentId)) }, { label: 'Homework', value: hwTitle }, { label: 'Subject', value: hwSubject }, { label: 'Submitted', value: (r) => `${formatDate(r.submittedOn)} · ${formatTime(r.submittedTime)}` }, { label: 'Type', value: (r) => r.type }, { label: 'Late', value: (r) => (r.late ? `Yes — ${r.lateReason}` : 'No') }] },
    { title: 'Grading', items: [{ label: 'Review status', value: (r) => r.review }, { label: 'Marks', value: marksText }, { label: 'Grade', value: (r) => r.grade || '—' }, { label: 'Late deduction', value: (r) => (r.marksDeducted ? `−${r.marksDeducted}` : 'None') }, { label: 'Remarks', value: (r) => r.remarks || '—' }] },
    { title: 'Teacher feedback', items: [{ label: 'Type', value: (r) => r.feedbackType || '—' }, { label: 'Message', value: (r) => r.feedbackMessage || '—' }] },
  ],
  stats: [
    { label: 'Submissions', value: (rows) => rows.length, icon: 'inbox' },
    { label: 'To grade', value: (rows) => countBy(rows, (r) => !r.graded), tone: 'warning', icon: 'edit-2' },
    { label: 'Graded', value: (rows) => countBy(rows, (r) => r.graded), tone: 'success', icon: 'check-circle' },
    { label: 'Late', value: (rows) => countBy(rows, (r) => r.late), tone: 'danger', icon: 'clock' },
    { label: 'Returned', value: (rows) => countBy(rows, (r) => r.review === 'Returned'), tone: 'info', icon: 'corner-up-left' },
  ],
  views: [
    { key: 'all', label: 'All Submissions', match: () => true },
    { key: 'togr', label: 'To Grade', match: (r) => !r.graded },
    { key: 'graded', label: 'Graded', match: (r) => r.graded },
    { key: 'late', label: 'Late', match: (r) => r.late },
    { key: 'returned', label: 'Returned', match: (r) => r.review === 'Returned' },
  ],
  filters: [
    { key: 'homework', label: 'Homework', options: () => allHomework().filter((h) => h.status !== 'Draft').map((h) => ({ label: h.title, value: h.id, hint: sectionLabel(h.sectionId) })), match: (r, v) => r.homeworkId === v },
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => getStudent(r.studentId)?.classId === v },
    { key: 'subject', label: 'Subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => homeworkOf(r.homeworkId)?.subjectId === v },
    { key: 'review', label: 'Review status', options: opts(['Reviewed', 'Under Review', 'Returned', 'Not Reviewed']), match: (r, v) => r.review === v },
    { key: 'grade', label: 'Grade', options: opts(GRADES), match: (r, v) => r.grade === v },
    { key: 'type', label: 'Submission type', options: opts(['File', 'Text', 'Both']), match: (r, v) => r.type === v },
  ],
  sorts: [
    { key: 'recent', label: 'Newest first', compare: (a, b) => (b.submittedOn + b.submittedTime).localeCompare(a.submittedOn + a.submittedTime) },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
    { key: 'homework', label: 'Homework (A–Z)', compare: (a, b) => hwTitle(a).localeCompare(hwTitle(b)) },
    { key: 'grade', label: 'Grade', compare: (a, b) => (a.grade || 'Z').localeCompare(b.grade || 'Z') },
    { key: 'review', label: 'Review status', compare: (a, b) => a.review.localeCompare(b.review) },
  ],
  form: [
    { key: 'homeworkId', label: 'Homework', type: 'select', required: true, readOnly: (_v, edit) => edit, optionsFrom: { collection: 'homework', label: (h: HomeworkRecord) => h.title, hint: (h: HomeworkRecord) => sectionLabel(h.sectionId), filter: (h: HomeworkRecord) => h.status !== 'Draft' && h.status !== 'Archived' }, onChange: () => ({ studentId: '' }) },
    { key: 'studentId', label: 'Student', type: 'select', required: true, readOnly: (_v, edit) => edit, optionsFrom: { ...studentOptions, filter: (s: StudentRecord, vals: Record<string, any>) => { const hw = homeworkOf(vals.homeworkId); return !hw || s.sectionId === hw.sectionId; } } },
    { key: 'submittedOn', label: 'Submitted on', type: 'date', required: true },
    { key: 'submittedTime', label: 'Time', type: 'time', required: true },
    { key: 'type', label: 'Submission type', type: 'select', required: true, options: opts(['File', 'Text', 'Both']), default: 'File' },
    { key: 'lateReason', label: 'Reason for lateness (if late)', type: 'text' },
  ],
  defaults: () => ({ submittedOn: todayISO() }),
  validate: (v, { existing, rows }) => {
    const hw = homeworkOf(v.homeworkId);
    return {
      ...(hw && String(v.submittedOn) < hw.assignedOn ? { submittedOn: 'Cannot be before the homework was assigned' } : {}),
      ...(String(v.submittedOn) > todayISO() ? { submittedOn: 'Cannot be in the future' } : {}),
      ...(hw && !hw.allowLate && String(v.submittedOn) > hw.dueDate ? { submittedOn: 'This homework does not accept late submissions' } : {}),
      ...(!existing && rows.some((s) => s.homeworkId === v.homeworkId && s.studentId === v.studentId) ? { studentId: 'This student has already submitted' } : {}),
    };
  },
  prepare: (v, { existing }) => {
    const hw = homeworkOf(v.homeworkId);
    const late = !!hw && String(v.submittedOn) > hw.dueDate;
    return {
      late,
      lateReason: late ? v.lateReason : '',
      lateApproval: late ? existing?.lateApproval || 'Pending' : '',
      finalStatus: late ? existing?.finalStatus || 'Under Review' : '',
      marksDeducted: existing?.marksDeducted ?? 0,
      graded: existing?.graded ?? false,
      marks: existing?.marks ?? 0,
      outOf: existing?.outOf ?? hw?.maxMarks ?? 0,
      grade: existing?.grade ?? '',
      review: existing?.review ?? 'Not Reviewed',
      feedbackType: existing?.feedbackType ?? '',
      feedbackMessage: existing?.feedbackMessage ?? '',
      remarks: existing?.remarks ?? '',
    };
  },
  editable: (r) => !r.graded,
  actions: [
    {
      key: 'grade',
      label: 'Grade submission',
      icon: 'award',
      form: {
        title: 'Grade submission',
        submitLabel: 'Save grade',
        fields: [
          { key: 'marks', label: 'Marks Obtained', type: 'number', required: true, min: 0, onChange: (v, vals) => { const out = Number(vals.outOf); return out > 0 && v !== '' && !Number.isNaN(Number(v)) ? { grade: gradeFor((Number(v) / out) * 100) } : undefined; } },
          { key: 'outOf', label: 'Out of', type: 'number', required: true, min: 1 },
          { key: 'grade', label: 'Grade', type: 'select', required: true, options: opts(GRADES) },
          { key: 'review', label: 'Status', type: 'select', required: true, options: opts(['Reviewed', 'Under Review', 'Returned']), default: 'Reviewed' },
          { key: 'remarks', label: 'Remarks', type: 'textarea' },
        ],
        initial: (r) => ({ marks: r.graded ? String(r.marks) : '', outOf: String(r.outOf), grade: r.grade, review: r.graded ? r.review : 'Reviewed', remarks: r.remarks }),
        validate: (v) => (Number(v.marks) > Number(v.outOf) ? { marks: 'Marks obtained cannot exceed the total' } : {}),
      },
      run: (r, v, ctx) => {
        const net = Math.max(0, v.marks - r.marksDeducted);
        ctx.update({ graded: true, marks: v.marks, outOf: v.outOf, grade: v.grade, review: v.review, remarks: v.remarks ?? '' });
        ctx.toast(`${studentName(r.studentId)}: ${net}/${v.outOf} · grade ${v.grade}`);
      },
    },
    {
      key: 'feedback',
      label: 'Teacher feedback',
      icon: 'message-square',
      form: {
        title: 'Teacher feedback',
        submitLabel: 'Send feedback',
        fields: [
          { key: 'type', label: 'Feedback Type', type: 'select', required: true, options: opts(FEEDBACK_TYPES) },
          { key: 'message', label: 'Message', type: 'textarea', required: true },
        ],
        initial: (r) => ({ type: r.feedbackType || 'Constructive', message: r.feedbackMessage }),
      },
      run: (r, v, ctx) => {
        ctx.update({ feedbackType: v.type, feedbackMessage: v.message, ...(v.type === 'Resubmit' ? { review: 'Returned' as const } : {}) });
        ctx.toast(v.type === 'Resubmit' ? `Returned to ${studentName(r.studentId)} for resubmission` : 'Feedback saved');
      },
    },
  ],
};

/* ================================ Late submissions ================================ */

const finalTone: Record<string, Tone> = { Accepted: 'success', Penalized: 'danger', 'Under Review': 'warning' };
const delayDays = (s: SubmissionRecord) => { const hw = homeworkOf(s.homeworkId); return hw ? Math.max(0, diffDays(hw.dueDate, s.submittedOn)) : 0; };

export const lateCfg: ResourceConfig<SubmissionRecord> = {
  entity: 'Late Submission',
  collection: 'homeworkSubmissions',
  rowScope: (r, user) => r.late && ownStudentScope(r, user),
  canCreate: false,
  canEdit: false,
  canDelete: false,
  searchPlaceholder: 'Search student, homework…',
  searchText: (r) => `${studentName(r.studentId)} ${hwTitle(r)} ${r.lateReason}`,
  code: (r) => getStudent(r.studentId)?.admissionNo,
  title: (r) => studentName(r.studentId),
  subtitle: (r) => `${hwTitle(r)} · ${classSection(getStudent(r.studentId))}`,
  status: (r) => ({ label: r.finalStatus || '—', tone: finalTone[r.finalStatus] ?? 'neutral' }),
  badges: (r) => [{ label: `${delayDays(r)} day${delayDays(r) === 1 ? '' : 's'} late`, tone: 'danger' }, { label: `Approval: ${r.lateApproval}`, tone: r.lateApproval === 'Approved' ? 'success' : r.lateApproval === 'Rejected' ? 'danger' : 'warning' }],
  facts: [
    { label: 'Due', value: (r) => { const hw = homeworkOf(r.homeworkId); return hw ? formatDate(hw.dueDate) : '—'; } },
    { label: 'Submitted on', value: (r) => formatDate(r.submittedOn) },
    { label: 'Reason', value: (r) => r.lateReason },
    { label: 'Marks deducted', value: (r) => (r.marksDeducted ? `−${r.marksDeducted}` : 'None') },
  ],
  detail: [
    { title: 'Late submission', items: [{ label: 'Student', value: (r) => studentName(r.studentId) }, { label: 'Homework', value: hwTitle }, { label: 'Subject', value: hwSubject }, { label: 'Due', value: (r) => { const hw = homeworkOf(r.homeworkId); return hw ? formatDate(hw.dueDate) : '—'; } }, { label: 'Submitted', value: (r) => formatDate(r.submittedOn) }, { label: 'Delay', value: (r) => `${delayDays(r)} day(s)` }, { label: 'Reason', value: (r) => r.lateReason }] },
    { title: 'Decision', items: [{ label: 'Approval', value: (r) => r.lateApproval }, { label: 'Marks deducted', value: (r) => (r.marksDeducted ? `−${r.marksDeducted}` : 'None') }, { label: 'Late penalty rule', value: (r) => { const hw = homeworkOf(r.homeworkId); return hw ? `${hw.latePenaltyPct}% of ${hw.maxMarks} marks` : '—'; } }, { label: 'Final status', value: (r) => r.finalStatus || '—' }] },
  ],
  stats: [
    { label: 'Late', value: (rows) => rows.length, icon: 'clock' },
    { label: 'Awaiting decision', value: (rows) => countBy(rows, (r) => r.lateApproval === 'Pending'), tone: 'warning', icon: 'help-circle' },
    { label: 'Penalised', value: (rows) => countBy(rows, (r) => r.finalStatus === 'Penalized'), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Marks deducted', value: (rows) => sum(rows, (r) => r.marksDeducted), tone: 'purple', icon: 'minus-circle' },
  ],
  views: [
    { key: 'all', label: 'All Late', match: () => true },
    { key: 'pending', label: 'Awaiting Approval', match: (r) => r.lateApproval === 'Pending' },
    { key: 'approved', label: 'Accepted', match: (r) => r.finalStatus === 'Accepted' },
    { key: 'penalized', label: 'Penalised', match: (r) => r.finalStatus === 'Penalized' },
  ],
  filters: [
    { key: 'class', label: 'Class', options: classOptionList, match: (r, v) => getStudent(r.studentId)?.classId === v },
    { key: 'subject', label: 'Subject', options: () => snapshot<SubjectRecord>('subjects').map((s) => ({ label: s.name, value: s.id })), match: (r, v) => homeworkOf(r.homeworkId)?.subjectId === v },
    { key: 'approval', label: 'Approval', options: opts(['Pending', 'Approved', 'Rejected']), match: (r, v) => r.lateApproval === v },
    { key: 'final', label: 'Final status', options: opts(['Accepted', 'Penalized', 'Under Review']), match: (r, v) => r.finalStatus === v },
    { key: 'reason', label: 'Reason', options: () => [...new Set(snapshot<SubmissionRecord>('homeworkSubmissions').filter((s) => s.late).map((s) => s.lateReason))].map((x) => ({ label: x, value: x })), match: (r, v) => r.lateReason === v },
  ],
  sorts: [
    { key: 'delay', label: 'Longest delay', compare: (a, b) => delayDays(b) - delayDays(a) },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
    { key: 'deducted', label: 'Marks deducted', compare: (a, b) => b.marksDeducted - a.marksDeducted },
    { key: 'final', label: 'Final status', compare: (a, b) => a.finalStatus.localeCompare(b.finalStatus) },
  ],
  form: [],
  actions: [
    {
      key: 'accept',
      label: 'Approve late submission',
      icon: 'check',
      tone: 'success',
      visible: (r) => r.lateApproval === 'Pending',
      confirm: 'Accept this late submission with no marks deducted?',
      run: (r, _v, ctx) => {
        ctx.update({ lateApproval: 'Approved', finalStatus: 'Accepted', marksDeducted: 0, ...(r.graded ? { grade: gradeFor((r.marks / r.outOf) * 100) } : {}) });
        ctx.toast('Late submission accepted');
      },
    },
    {
      key: 'penalize',
      label: 'Reject & apply penalty',
      icon: 'minus-circle',
      tone: 'danger',
      visible: (r) => r.lateApproval === 'Pending',
      confirm: 'Reject the excuse and deduct the homework’s late penalty from the marks?',
      run: (r, _v, ctx) => {
        const hw = homeworkOf(r.homeworkId);
        const deducted = hw ? latePenaltyMarks(hw.maxMarks, hw.latePenaltyPct) : 0;
        ctx.update({ lateApproval: 'Rejected', finalStatus: 'Penalized', marksDeducted: deducted, ...(r.graded ? { grade: gradeFor((Math.max(0, r.marks - deducted) / r.outOf) * 100) } : {}) });
        ctx.toast(`Penalty applied: −${deducted} marks`, 'info');
      },
    },
  ],
};
