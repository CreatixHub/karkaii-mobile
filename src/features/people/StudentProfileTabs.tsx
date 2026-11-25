import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Share, Text, View } from 'react-native';
import { useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { repo } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { addDays, formatDate, relativeDay, todayISO } from '@/core/utils/date';
import { money, pct } from '@/core/utils/format';
import { gradeFor } from '@/core/academic';
import { slotLabel, DAYS, DAY_NAMES, BREAKS, type Day } from '@/core/schedule/scheduler';
import type { FeeInvoiceRecord, FeePaymentRecord } from '@/data/seed/finance';
import type { ClassSubjectRecord, HomeworkRecord, SubmissionRecord, TimetableEntryRecord } from '@/data/seed/academic';
import type { StudentAttendanceRecord } from '@/data/seed/hrm';
import type { StudentRecord } from '@/data/seed/master';
import type { UserRecord } from '@/data/seed/peopleAdmin';
import type { AchievementRecord, CommunicationRecord, DisciplineRecord, ExamResultRecord, HealthRecord, LoanRecord, StudentDocumentRecord, StudentLeaveRecord, StudentNoteRecord } from '@/data/seed/studentLife';
import { logAudit, type AuditRecord } from '@/features/common/audit';
import { classSection, teacherName } from '@/features/common/refs';
import { FormSheet, fromFormValues, toFormValues } from '@/features/engine/FormSheet';
import type { FieldDef } from '@/features/engine/types';
import { subjectName } from '@/features/academic/helpers';
import { balanceOf, isOverdue, netAmount } from '@/features/finance/configs';
import { attendancePct } from '@/features/hrm/configs';
import { Button, Card, EmptyState, KeyValue, Pill, ProgressBar } from '@/ui/basics';
import { SegmentedTabs, SummaryStrip, type StatTile } from '@/ui/ListChrome';
import { useToast } from '@/ui/Toast';
import { TONES, type Tone } from '@/ui/tone';
import { useAuth } from '@/hooks/useAuth';
import { KIND_TONE, defaultMonth, kindOf, monthLabel, recordsOf, summarise } from './attendanceHistory';
import { decideLeave, leaveDays } from './leaveLogic';
import { PASS_PERCENT, academicPercent, ageOf, behaviourLabel, behaviourScore, classTeacherOf, examPercent, examRank, examTotals, feeSummary, hostelOf, performanceIndex, rankInSection, transportOf } from './studentData';

export type TabKey = 'overview' | 'attendance' | 'academics' | 'exams' | 'fees' | 'timetable' | 'health' | 'library' | 'documents' | 'timeline' | 'achievements' | 'discipline' | 'communication' | 'notes' | 'audit';

export const PROFILE_TABS: { key: TabKey; label: string; staffOnly?: boolean }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'attendance', label: 'Attendance' },
  { key: 'academics', label: 'Academics' },
  { key: 'exams', label: 'Exams & Results' },
  { key: 'fees', label: 'Fees' },
  { key: 'timetable', label: 'Timetable' },
  { key: 'health', label: 'Health' },
  { key: 'library', label: 'Library' },
  { key: 'documents', label: 'Documents' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'achievements', label: 'Achievements' },
  { key: 'discipline', label: 'Discipline' },
  { key: 'communication', label: 'Communication' },
  { key: 'notes', label: 'Notes (staff)', staffOnly: true },
  { key: 'audit', label: 'Audit Trail', staffOnly: true },
];

interface PaneProps {
  student: StudentRecord;
  staff: boolean;
}

/* ----------------------------------- shared bits ----------------------------------- */

export const Block = ({ title, right, children }: { title: string; right?: React.ReactNode; children: React.ReactNode }) => (
  <View className="mb-4">
    <View className="mb-1.5 flex-row items-center justify-between">
      <Text className="text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1] dark:text-[#7d95f5]">{title}</Text>
      {right}
    </View>
    {children}
  </View>
);

export const Item = ({ title, sub, pill, tone = 'neutral', meta }: { title: string; sub?: string; pill?: string; tone?: Tone; meta?: string }) => (
  <Card style={{ marginBottom: 8 }}>
    <View className="flex-row items-start justify-between">
      <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{title}</Text>
      {pill ? <Pill label={pill} tone={tone} /> : null}
    </View>
    {sub ? <Text className="mt-1 text-[11px] leading-4 text-slate-500 dark:text-[#a29fb0]">{sub}</Text> : null}
    {meta ? <Text className="mt-1 text-[10px] text-slate-400 dark:text-[#8b879b]">{meta}</Text> : null}
  </Card>
);

export const AddButton = ({ label, onPress }: { label: string; onPress: () => void }) => (
  <Pressable onPress={onPress} className="flex-row items-center rounded-lg bg-[#E9EDFC] dark:bg-[#1d2450] px-2.5 py-1 active:opacity-80">
    <Feather name="plus" size={12} color="#3D5EE1" />
    <Text className="ml-1 text-[11px] font-bold text-[#3D5EE1] dark:text-[#7d95f5]">{label}</Text>
  </Pressable>
);

export const Empty = ({ text }: { text: string }) => <Text className="py-4 text-center text-xs text-slate-400 dark:text-[#8b879b]">{text}</Text>;

export function useRecordForm<T extends Record<string, any>>(fields: FieldDef[], initial: Record<string, any>, save: (v: T) => void, title: string) {
  const [open, setOpen] = useState(false);
  const node = (
    <FormSheet visible={open} title={title} fields={fields} initial={toFormValues(fields, initial)} onClose={() => setOpen(false)} onSubmit={(values) => { save(fromFormValues(fields, values) as T); setOpen(false); }} />
  );
  return { open: () => setOpen(true), node };
}

const dial = (n: string) => n.replace(/[^\d+]/g, '');

function useOpenLink() {
  const toast = useToast();
  return (url: string, what: string) => Linking.openURL(url).catch(() => toast(`Could not open ${what} on this device`, 'error'));
}

const IconBtn = ({ icon, onPress, label }: { icon: React.ComponentProps<typeof Feather>['name']; onPress: () => void; label: string }) => (
  <Pressable onPress={onPress} accessibilityLabel={label} className="ml-2 h-8 w-8 items-center justify-center rounded-full bg-[#E9EDFC] dark:bg-[#1d2450] active:opacity-70">
    <Feather name={icon} size={14} color="#3D5EE1" />
  </Pressable>
);

const ContactButtons = ({ phone, email, label }: { phone: string; email?: string; label: string }) => {
  const open = useOpenLink();
  return (
    <View className="flex-row">
      <IconBtn icon="phone" label={`Call ${label}`} onPress={() => open(`tel:${dial(phone)}`, 'the dialler')} />
      <IconBtn icon="message-circle" label={`WhatsApp ${label}`} onPress={() => open(`https://wa.me/${dial(phone).replace('+', '')}`, 'WhatsApp')} />
      {email ? <IconBtn icon="mail" label={`Email ${label}`} onPress={() => open(`mailto:${email}`, 'the mail app')} /> : null}
    </View>
  );
};

/* ------------------------------------- Overview ------------------------------------- */

export function OverviewPane({ student, staff }: PaneProps) {
  const users = useCollection<UserRecord>('users');
  const everyone = useCollection<StudentRecord>('students');
  const health = useCollection<HealthRecord>('healthRecords').find((h) => h.studentId === student.id);
  const siblings = (student.siblingIds ?? []).map((sid) => everyone.find((x) => x.id === sid)).filter((x): x is StudentRecord => !!x);
  const hasBank = !!(student.bankName || student.ifscNumber || student.bankBranch);
  const loans = useCollection<LoanRecord>('libraryLoans').filter((l) => l.studentId === student.id && (l.status === 'Issued' || l.status === 'Overdue'));
  useCollection<StudentAttendanceRecord>('studentAttendance');
  useCollection<ExamResultRecord>('examResults');
  useCollection<DisciplineRecord>('disciplineRecords');
  useCollection<FeeInvoiceRecord>('feeInvoices');
  const att = attendancePct(student.id);
  const acad = academicPercent(student.id);
  const beh = behaviourScore(student.id);
  const fee = feeSummary(student.id);
  const route = transportOf(student);
  const hostel = hostelOf(student);
  const own = users.find((u) => u.linkedType === 'student' && u.linkedId === student.id);
  const parent = users.find((u) => u.linkedType === 'parent' && u.linkedId === student.id);
  const rank = rankInSection(student);

  const tiles: StatTile[] = [
    { label: 'Attendance', value: pct(att), tone: att < 75 ? 'danger' : 'success', icon: 'check-square' },
    { label: 'Academic GPA', value: (Math.round(acad) / 10).toFixed(1), tone: 'primary', icon: 'award' },
    { label: 'Behaviour', value: `${beh}/100`, tone: 'teal', icon: 'smile' },
    { label: 'Fee status', value: fee.status, tone: fee.status === 'Paid' ? 'success' : fee.status === 'Overdue' ? 'danger' : 'warning', icon: 'dollar-sign' },
    { label: 'Transport', value: route ? route.code : 'Own', tone: 'info', icon: 'truck' },
    { label: 'Library', value: `${loans.length} book${loans.length === 1 ? '' : 's'}`, tone: 'purple', icon: 'book' },
    { label: 'Medical', value: health && health.conditions !== 'None' ? 'Note' : 'Fit', tone: health && health.conditions !== 'None' ? 'warning' : 'success', icon: 'heart' },
    { label: 'Last login', value: own ? relativeDay(own.lastLogin) : '—', tone: 'neutral', icon: 'log-in' },
    { label: 'Parent portal', value: parent ? parent.status : 'No account', tone: parent?.status === 'Active' ? 'success' : 'neutral', icon: 'users' },
    { label: 'Perf. index', value: `${performanceIndex(student.id)}/100`, tone: 'pink', icon: 'bar-chart-2' },
  ];

  // Rule-based insights from the student's own records.
  const latest = useCollection<ExamResultRecord>('examResults').filter((r) => r.studentId === student.id);
  const bySubject = latest.length
    ? Object.keys(latest[latest.length - 1].marks).map((sid) => ({ sid, p: (latest.reduce((n, r) => n + (r.marks[sid] ?? 0) / r.max, 0) / latest.length) * 100 })).sort((a, b) => b.p - a.p)
    : [];
  const first = latest[0] ? examPercent(latest[0]) : 0;
  const last = latest.length ? examPercent(latest[latest.length - 1]) : 0;
  const trend = last - first;
  const advice = [fee.overdue ? 'Clear the overdue fee' : '', att < 85 ? 'Meet the guardian about attendance' : '', bySubject.length ? `extra practice in ${subjectName(bySubject[bySubject.length - 1].sid)}` : ''].filter(Boolean);

  return (
    <View>
      <SummaryStrip items={tiles} />
      <Block title="Personal information">
        <KeyValue label="Full name" value={student.name} />
        <KeyValue label="Date of birth" value={`${formatDate(student.dob)} (${ageOf(student.dob)} yrs)`} />
        <KeyValue label="Gender" value={student.gender} />
        <KeyValue label="Nationality" value={student.nationality} />
        <KeyValue label="Religion" value={student.religion} />
        <KeyValue label="Blood group" value={student.bloodGroup} />
        <KeyValue label="Email" value={student.email} />
        <KeyValue label="Phone" value={student.phone} />
        <KeyValue label="Address" value={student.address} />
        {student.permanentAddress ? <KeyValue label="Permanent address" value={student.permanentAddress} /> : null}
        {student.category ? <KeyValue label="Category" value={student.category} /> : null}
        {student.caste ? <KeyValue label="Caste" value={student.caste} /> : null}
        {student.motherTongue ? <KeyValue label="Mother tongue" value={student.motherTongue} /> : null}
        {student.languagesKnown?.length ? <KeyValue label="Languages known" value={student.languagesKnown.join(', ')} /> : null}
      </Block>
      <Block title="Academic information">
        <KeyValue label="Admission no" value={student.admissionNo} />
        {student.academicYear ? <KeyValue label="Academic year" value={student.academicYear} /> : null}
        <KeyValue label="Roll no" value={student.rollNo} />
        <KeyValue label="Class / section" value={classSection(student)} />
        <KeyValue label="House" value={`${student.house} House`} />
        <KeyValue label="Class teacher" value={classTeacherOf(student)?.name} />
        <KeyValue label="Joined" value={formatDate(student.joinedOn)} />
        <KeyValue label="Previous school" value={student.previousSchool || '—'} />
        {student.previousSchoolAddress ? <KeyValue label="Previous school address" value={student.previousSchoolAddress} /> : null}
        <KeyValue label="Class rank" value={rank.of ? `#${rank.rank} of ${rank.of}` : '—'} />
      </Block>
      <Block title="Parents & guardians">
        <Card style={{ marginBottom: 8 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{student.parentName}</Text>
              <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">Father / guardian · {student.parentPhone}{student.fatherOccupation ? ` · ${student.fatherOccupation}` : ''}</Text>
              {student.fatherEmail ? <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{student.fatherEmail}</Text> : null}
            </View>
            <ContactButtons phone={student.parentPhone} email={student.fatherEmail || undefined} label="father" />
          </View>
        </Card>
        {student.motherName ? (
          <Card style={{ marginBottom: 8 }}>
            <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{student.motherName}</Text>
            <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">Mother{student.motherPhone ? ` · ${student.motherPhone}` : ''}{student.motherOccupation ? ` · ${student.motherOccupation}` : ''}</Text>
            {student.motherEmail ? <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{student.motherEmail}</Text> : null}
          </Card>
        ) : null}
        {student.guardianType && student.guardianType !== 'Parents' && student.guardianName ? (
          <Card style={{ marginBottom: 8 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{student.guardianName}</Text>
                <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{student.guardianType === 'Guardian' ? 'Guardian' : 'Other'}{student.guardianRelation ? ` · ${student.guardianRelation}` : ''} · {student.guardianPhone}</Text>
                {student.guardianAddress ? <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{student.guardianAddress}</Text> : null}
              </View>
              {student.guardianPhone ? <ContactButtons phone={student.guardianPhone} email={student.guardianEmail || undefined} label="guardian" /> : null}
            </View>
          </Card>
        ) : null}
        <Card style={{ marginBottom: 8 }}>
          <View className="flex-row items-center justify-between">
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">Emergency contact</Text>
              <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{student.emergencyPhone || '—'}</Text>
            </View>
            {student.emergencyPhone ? <ContactButtons phone={student.emergencyPhone} label="emergency contact" /> : null}
          </View>
        </Card>
      </Block>
      {siblings.length ? (
        <Block title="Siblings at this school">
          {siblings.map((sb) => (
            <Card key={sb.id} style={{ marginBottom: 8 }}>
              <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{sb.name}</Text>
              <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{sb.admissionNo} · {classSection(sb)} · Roll {sb.rollNo}</Text>
            </Card>
          ))}
        </Block>
      ) : null}
      <Block title="Transport">
        {route ? (
          <>
            <KeyValue label="Bus" value={route.bus} />
            <KeyValue label="Route" value={route.name} />
            <KeyValue label="Driver" value={`${route.driver} · ${route.phone}`} />
            <KeyValue label="Pick-up" value={`${route.pickup} · ${route.pickupTime}`} />
            <KeyValue label="Status" value={route.status} />
            <KeyValue label="Drop" value={`${route.pickup} · ${route.dropTime}`} />
          </>
        ) : (
          <Empty text={student.transport ? 'Waiting for a seat on a school bus.' : 'Uses own transport.'} />
        )}
      </Block>
      <Block title="Hostel">
        {hostel ? (
          <>
            <KeyValue label="Room" value={hostel.room} />
            <KeyValue label="Block" value={hostel.block} />
            <KeyValue label="Warden" value={hostel.warden} />
            <KeyValue label="Roommates" value={hostel.roommates.join(', ') || '—'} />
            <KeyValue label="Check-in" value={formatDate(hostel.checkIn)} />
          </>
        ) : (
          <Empty text="Day scholar." />
        )}
      </Block>
      {hasBank || student.otherInformation ? (
        <Block title="Other details">
          {student.bankName ? <KeyValue label="Bank" value={student.bankName} /> : null}
          {student.bankBranch ? <KeyValue label="Branch" value={student.bankBranch} /> : null}
          {student.ifscNumber ? <KeyValue label="IFSC" value={student.ifscNumber} /> : null}
          {student.otherInformation ? <KeyValue label="Other information" value={student.otherInformation} /> : null}
        </Block>
      ) : null}
      <Block title="Insights (from this student’s records)">
        <Item title="Attendance risk" pill={att < 75 ? 'High' : att < 85 ? 'Medium' : 'Low'} tone={att < 75 ? 'danger' : att < 85 ? 'warning' : 'success'} sub={att < 75 ? `Attendance is ${pct(att)}, below the 75% line. Speak to the guardian.` : `Attendance is ${pct(att)}. No intervention needed.`} />
        <Item title="Performance trend" pill={trend >= 0 ? 'Up' : 'Down'} tone={trend >= 0 ? 'success' : 'warning'} sub={latest.length ? `Exam average moved from ${pct(first)} to ${pct(last)} across ${latest.length} exams (${trend >= 0 ? '+' : ''}${trend.toFixed(1)} points).` : 'No exam results yet.'} />
        <Item title="Strengths & focus areas" sub={bySubject.length ? `Strongest: ${bySubject.slice(0, 2).map((s) => subjectName(s.sid)).join(', ')}. Focus on: ${bySubject.slice(-2).map((s) => subjectName(s.sid)).join(', ')}.` : 'No exam results yet.'} />
        <Item title="Recommended actions" sub={advice.length ? `${advice.join('; ')}.` : 'Keep up the good work.'} />
      </Block>
      {staff ? null : <Empty text="Notes and the audit trail are visible to staff only." />}
    </View>
  );
}

/* ------------------------------------ Attendance ------------------------------------ */

const LEAVE_TYPES = ['Sick Leave', 'Casual Leave', 'Medical', 'Other'];
const leaveTone: Record<string, Tone> = { Approved: 'success', Pending: 'warning', Rejected: 'danger' };

export function AttendancePane({ student, staff }: PaneProps) {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  useCollection<StudentAttendanceRecord>('studentAttendance');
  const leaves = useCollection<StudentLeaveRecord>('studentLeaves').filter((l) => l.studentId === student.id).sort((a, b) => b.from.localeCompare(a.from));
  const month = defaultMonth();
  const recs = recordsOf(student.id, month);
  const sum = summarise(recs);
  const fields: FieldDef[] = [
    { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: LEAVE_TYPES },
    { key: 'from', label: 'From', type: 'date', required: true },
    { key: 'to', label: 'To', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
  ];
  const form = useRecordForm<{ leaveType: StudentLeaveRecord['leaveType']; from: string; to: string; reason: string }>(
    fields,
    { from: todayISO(), to: todayISO() },
    (v) => {
      if (v.to < v.from) return toast('End date cannot be before the start date', 'error');
      if (leaves.some((l) => l.status !== 'Rejected' && l.from <= v.to && l.to >= v.from)) return toast('This overlaps an existing leave request', 'error');
      repo<StudentLeaveRecord>('studentLeaves').create({ studentId: student.id, leaveType: v.leaveType, from: v.from, to: v.to, days: leaveDays(v.from, v.to), status: 'Pending', reason: v.reason, appliedOn: todayISO(), decidedBy: '', decisionNote: '' });
      toast('Leave request submitted');
    },
    'Apply leave',
  );
  return (
    <View>
      <SummaryStrip items={[{ label: `${monthLabel(month).split(' ')[0]} attendance`, value: pct(sum.presentPct, 1), tone: 'success', icon: 'check-circle' }, { label: 'Present', value: sum.present, tone: 'success' }, { label: 'Absent', value: sum.absent, tone: 'danger' }, { label: 'Late', value: sum.late, tone: 'warning' }, { label: 'On leave', value: sum.leave, tone: 'info' }, { label: 'Overall', value: pct(attendancePct(student.id)), tone: attendancePct(student.id) < 75 ? 'danger' : 'primary' }]} />
      <Block title={`Recent days · ${monthLabel(month)}`}>
        <View className="flex-row flex-wrap gap-1.5">
          {recs.slice(0, 14).map((r) => {
            const t = TONES[KIND_TONE[kindOf(r.status)]];
            return (
              <View key={r.id} style={{ backgroundColor: t.bg, borderColor: t.border }} className="rounded-lg border px-2 py-1">
                <Text style={{ color: t.fg }} className="text-[10px] font-bold">{r.date.slice(8)} · {r.status}</Text>
              </View>
            );
          })}
          {recs.length === 0 ? <Empty text="No attendance recorded this month." /> : null}
        </View>
        <Pressable onPress={() => router.push(`/people/student-attendance-history?id=${student.id}` as Href)} className="mt-2 flex-row items-center">
          <Text className="text-xs font-bold text-[#3D5EE1] dark:text-[#7d95f5]">Full attendance history</Text>
          <Feather name="chevron-right" size={14} color="#3D5EE1" />
        </Pressable>
      </Block>
      <Block title="Leave requests" right={<AddButton label="Apply leave" onPress={form.open} />}>
        {leaves.length === 0 ? <Empty text="No leave requests." /> : null}
        {leaves.map((l) => (
          <Card key={l.id} style={{ marginBottom: 8 }}>
            <View className="flex-row items-start justify-between">
              <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{l.leaveType}</Text>
              <Pill label={l.status} tone={leaveTone[l.status]} />
            </View>
            <Text className="mt-1 text-[11px] text-slate-500 dark:text-[#a29fb0]">{formatDate(l.from)}{l.to !== l.from ? ` – ${formatDate(l.to)}` : ''} · {l.days} day{l.days > 1 ? 's' : ''}</Text>
            <Text className="mt-0.5 text-[11px] text-slate-500 dark:text-[#a29fb0]">{l.reason}</Text>
            {l.decisionNote ? <Text className="mt-0.5 text-[11px] italic text-slate-400 dark:text-[#8b879b]">{l.decisionNote}</Text> : null}
            {staff && l.status === 'Pending' ? (
              <View className="mt-2 flex-row gap-2">
                <Button small label="Approve" onPress={() => toast(`Approved · ${decideLeave(l, 'Approved', user?.name ?? 'Staff')} register day(s) marked On Leave`)} style={{ flex: 1 }} />
                <Button small variant="danger" label="Reject" onPress={() => { decideLeave(l, 'Rejected', user?.name ?? 'Staff', 'Not approved'); toast('Leave rejected', 'info'); }} style={{ flex: 1 }} />
              </View>
            ) : null}
          </Card>
        ))}
      </Block>
      {form.node}
    </View>
  );
}

/* ------------------------------------- Academics ------------------------------------- */

export function AcademicsPane({ student }: PaneProps) {
  const maps = useCollection<ClassSubjectRecord>('classSubjects').filter((m) => m.classId === student.classId);
  const results = useCollection<ExamResultRecord>('examResults').filter((r) => r.studentId === student.id);
  const subs = useCollection<SubmissionRecord>('homeworkSubmissions').filter((s) => s.studentId === student.id);
  const homework = useCollection<HomeworkRecord>('homework').filter((h) => h.sectionId === student.sectionId);
  const teacher = classTeacherOf(student);
  const pendingHw = homework.filter((h) => h.status !== 'Completed' && !subs.some((s) => s.homeworkId === h.id));
  return (
    <View>
      <SummaryStrip items={[{ label: 'Academic avg', value: pct(academicPercent(student.id), 1), tone: 'primary', icon: 'award' }, { label: 'Subjects', value: maps.length, tone: 'info', icon: 'book' }, { label: 'Homework submitted', value: subs.length, tone: 'success', icon: 'check' }, { label: 'Homework pending', value: pendingHw.length, tone: pendingHw.length ? 'warning' : 'neutral', icon: 'clock' }]} />
      <Block title="Class">
        <KeyValue label="Class teacher" value={teacher?.name} />
        <KeyValue label="Class / section" value={classSection(student)} />
      </Block>
      <Block title="Subjects">
        {maps.length === 0 ? <Empty text="No subjects are assigned to this class yet." /> : null}
        {maps.map((m) => {
          const ps = results.map((r) => ((r.marks[m.subjectId] ?? 0) / r.max) * 100);
          const avg = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
          const tch = teacherName(m.teacherId);
          return (
            <Card key={m.id} style={{ marginBottom: 8 }}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{subjectName(m.subjectId)}</Text>
                <Pill label={ps.length ? `${gradeFor(avg)} · ${pct(avg)}` : 'No marks'} tone={avg >= 75 ? 'success' : avg >= 50 ? 'warning' : 'danger'} />
              </View>
              <Text className="mb-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-[#a29fb0]">{tch} · {m.periodsPerWeek} periods a week</Text>
              <ProgressBar value={avg} tone={avg >= 75 ? 'success' : avg >= 50 ? 'warning' : 'danger'} />
            </Card>
          );
        })}
      </Block>
      <Block title="Homework">
        {homework.length === 0 ? <Empty text="No homework set for this section." /> : null}
        {homework.slice(0, 8).map((h) => {
          const s = subs.find((x) => x.homeworkId === h.id);
          return <Item key={h.id} title={h.title} sub={`${subjectName(h.subjectId)} · due ${formatDate(h.dueDate)}`} pill={s ? (s.late ? 'Submitted late' : 'Submitted') : h.dueDate < todayISO() ? 'Missing' : 'Pending'} tone={s ? (s.late ? 'warning' : 'success') : h.dueDate < todayISO() ? 'danger' : 'info'} />;
        })}
      </Block>
    </View>
  );
}

/* ------------------------------------ Exams & results ------------------------------------ */

export function ExamsPane({ student }: PaneProps) {
  const results = useCollection<ExamResultRecord>('examResults').filter((r) => r.studentId === student.id);
  const [examId, setExamId] = useState('');
  const current = results.find((r) => r.examId === examId) ?? results[results.length - 1];
  const toast = useToast();
  if (!current) return <EmptyState icon="file-text" title="No exam results yet" />;
  const t = examTotals(current);
  const percent = t.max ? (t.obtained / t.max) * 100 : 0;
  const rank = examRank(student, current.examId);
  const rows = Object.entries(current.marks);
  const passed = rows.every(([, m]) => (m / current.max) * 100 >= PASS_PERCENT);
  const share = () =>
    Share.share({ title: `${student.name} — ${current.examName}`, message: [`REPORT CARD — ${current.examName}`, `${student.name} (${student.admissionNo})`, '', ...rows.map(([sid, m]) => `${subjectName(sid)}: ${m}/${current.max} (${gradeFor((m / current.max) * 100)})`), '', `Total ${t.obtained}/${t.max} · ${pct(percent, 1)} · Grade ${gradeFor(percent)} · Rank ${rank.rank} of ${rank.of}`, `Result: ${passed ? 'PASS' : 'FAIL'}`].join('\n') }).catch(() => toast('Could not open the share sheet', 'error'));
  return (
    <View>
      <SegmentedTabs tabs={results.map((r) => ({ key: r.examId, label: r.examName }))} active={current.examId} onChange={setExamId} />
      <SummaryStrip items={[{ label: 'Percentage', value: pct(percent, 1), tone: 'primary', icon: 'percent' }, { label: 'Grade', value: gradeFor(percent), tone: 'purple', icon: 'award' }, { label: 'Rank', value: `${rank.rank} of ${rank.of}`, tone: 'info', icon: 'bar-chart' }, { label: 'Result', value: passed ? 'Pass' : 'Fail', tone: passed ? 'success' : 'danger', icon: 'check-circle' }, { label: 'Exams taken', value: results.length, tone: 'warning', icon: 'clipboard' }]} />
      <Block title={`${current.examName} · ${formatDate(current.date)}`} right={<Pressable onPress={share} hitSlop={8}><Feather name="share-2" size={15} color="#3D5EE1" /></Pressable>}>
        {rows.map(([sid, m]) => {
          const p = (m / current.max) * 100;
          return (
            <Card key={sid} style={{ marginBottom: 8 }}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{subjectName(sid)}</Text>
                <Text className="text-sm font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{m}/{current.max}</Text>
                <View className="ml-2"><Pill label={gradeFor(p)} tone={p >= PASS_PERCENT ? 'success' : 'danger'} /></View>
              </View>
              <View className="mt-1.5"><ProgressBar value={p} tone={p >= 75 ? 'success' : p >= PASS_PERCENT ? 'warning' : 'danger'} /></View>
            </Card>
          );
        })}
        <KeyValue label="Total" value={`${t.obtained} / ${t.max}`} />
      </Block>
      <Block title="Trend">
        {results.map((r) => (
          <View key={r.id} className="mb-1.5 flex-row items-center">
            <Text className="w-28 text-[11px] text-slate-500 dark:text-[#a29fb0]" numberOfLines={1}>{r.examName}</Text>
            <View className="flex-1"><ProgressBar value={examPercent(r)} tone="primary" /></View>
            <Text className="ml-2 w-12 text-right text-[11px] font-bold text-[#1b2240] dark:text-[#EFEFF2]">{pct(examPercent(r))}</Text>
          </View>
        ))}
      </Block>
    </View>
  );
}

/* ----------------------------------------- Fees ----------------------------------------- */

export function FeesPane({ student }: PaneProps) {
  const invoices = useCollection<FeeInvoiceRecord>('feeInvoices').filter((i) => i.studentId === student.id).sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  const payments = useCollection<FeePaymentRecord>('feePayments').filter((p) => p.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const f = feeSummary(student.id);
  return (
    <View>
      <SummaryStrip items={[{ label: 'Total fees', value: money(f.total), tone: 'primary', icon: 'dollar-sign' }, { label: 'Paid', value: money(f.paid), tone: 'success', icon: 'check' }, { label: 'Pending', value: money(f.balance), tone: f.balance ? 'danger' : 'neutral', icon: 'alert-circle' }, { label: 'Overdue invoices', value: f.overdue, tone: f.overdue ? 'danger' : 'neutral', icon: 'clock' }]} />
      <Block title="Invoices">
        {invoices.length === 0 ? <Empty text="No fees have been assigned." /> : null}
        {invoices.map((i) => (
          <Item key={i.id} title={i.invoiceNo} sub={`Due ${formatDate(i.dueDate)} · ${money(netAmount(i))} · paid ${money(i.paid)}`} pill={balanceOf(i) <= 0 ? 'Paid' : isOverdue(i) ? 'Overdue' : i.paid > 0 ? 'Partial' : 'Unpaid'} tone={balanceOf(i) <= 0 ? 'success' : isOverdue(i) ? 'danger' : 'warning'} />
        ))}
      </Block>
      <Block title="Payments">
        {payments.length === 0 ? <Empty text="No payments yet." /> : null}
        {payments.slice(0, 12).map((p) => (
          <Item key={p.id} title={`${p.receiptNo} · ${money(p.amount)}`} sub={`${formatDate(p.date)} · ${p.method}${p.reference ? ` · ${p.reference}` : ''}`} pill={p.status} tone={p.status === 'Cleared' ? 'success' : p.status === 'Pending Clearance' ? 'warning' : 'neutral'} />
        ))}
      </Block>
    </View>
  );
}

/* --------------------------------------- Timetable --------------------------------------- */

const todayDay = (): Day => {
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  return d === 'Sun' ? 'Mon' : (d as Day);
};

export function TimetablePane({ student }: PaneProps) {
  const entries = useCollection<TimetableEntryRecord>('timetableEntries').filter((e) => e.sectionId === student.sectionId);
  const [day, setDay] = useState<Day>(todayDay());
  if (!entries.length) return <EmptyState icon="calendar" title="No timetable yet" hint="This section’s timetable has not been generated. Use Academic → Class Timetable." />;
  const list = entries.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
  return (
    <View>
      <SegmentedTabs tabs={DAYS.map((d) => ({ key: d, label: d }))} active={day} onChange={(k) => setDay(k as Day)} />
      <Block title={DAY_NAMES[day]}>
        {list.length === 0 ? <Empty text="No periods on this day." /> : null}
        {list.map((e, i) => {
          const brk = BREAKS.find((b) => b.afterPeriod === list[i - 1]?.period);
          return (
            <View key={e.id}>
              {brk ? <Text className="text-[#202C4B] dark:text-[#EFEFF2] my-1 text-center text-[10px] font-bold uppercase text-slate-300">{brk.label}</Text> : null}
              <Item title={`${subjectName(e.subjectId)}`} sub={`${slotLabel(e.period)} · Room ${e.room} · ${teacherName(e.teacherId)}`} pill={`P${e.period}`} tone="primary" />
            </View>
          );
        })}
      </Block>
    </View>
  );
}

/* ----------------------------------------- Health ----------------------------------------- */

export function HealthPane({ student, staff }: PaneProps) {
  const record = useCollection<HealthRecord>('healthRecords').find((h) => h.studentId === student.id);
  const toast = useToast();
  const fields: FieldDef[] = [
    { key: 'heightCm', label: 'Height (cm)', type: 'number', required: true, min: 40, max: 230 },
    { key: 'weightKg', label: 'Weight (kg)', type: 'number', required: true, min: 5, max: 200 },
    { key: 'vision', label: 'Vision', type: 'select', options: ['6/6', '6/9', '6/12', '6/18'] },
    { key: 'dental', label: 'Dental', type: 'select', options: ['Good', 'Fair', 'Needs care'] },
    { key: 'allergies', label: 'Allergies', type: 'text' },
    { key: 'conditions', label: 'Conditions', type: 'text' },
    { key: 'doctor', label: 'Doctor', type: 'text' },
    { key: 'lastCheckup', label: 'Last Check-up', type: 'date', required: true },
    { key: 'note', label: 'Nurse note', type: 'textarea' },
  ];
  const form = useRecordForm<Partial<HealthRecord>>(fields, record ?? {}, (v) => {
    if (!record) return;
    repo<HealthRecord>('healthRecords').update(record.id, { ...v, nextCheckup: addDays(String(v.lastCheckup ?? record.lastCheckup), 365) });
    toast('Health record updated');
  }, 'Update health record');
  if (!record) return <EmptyState icon="heart" title="No health record" />;
  const bmi = record.weightKg / (record.heightCm / 100) ** 2;
  const bmiLabel = bmi < 14 ? 'Underweight' : bmi < 22 ? 'Normal' : bmi < 25 ? 'Overweight' : 'Obese';
  return (
    <View>
      <SummaryStrip items={[{ label: 'Height', value: `${record.heightCm} cm`, tone: 'danger', icon: 'maximize-2' }, { label: 'Weight', value: `${record.weightKg} kg`, tone: 'info', icon: 'activity' }, { label: `BMI · ${bmiLabel}`, value: bmi.toFixed(1), tone: bmiLabel === 'Normal' ? 'success' : 'warning', icon: 'heart' }, { label: 'Blood group', value: student.bloodGroup, tone: 'danger', icon: 'droplet' }, { label: 'Vision', value: record.vision, tone: 'warning', icon: 'eye' }, { label: 'Dental', value: record.dental, tone: record.dental === 'Good' ? 'success' : 'warning', icon: 'smile' }]} />
      <Block title="Medical record" right={staff ? <AddButton label="Update" onPress={form.open} /> : undefined}>
        <KeyValue label="Allergies" value={record.allergies} />
        <KeyValue label="Conditions" value={record.conditions} />
        {record.conditionStatus ? <KeyValue label="Medical condition" value={record.conditionStatus} /> : null}
        {record.medications ? <KeyValue label="Medications" value={record.medications} /> : null}
        <KeyValue label="Doctor" value={record.doctor} />
        <KeyValue label="Last check-up" value={formatDate(record.lastCheckup)} />
        <KeyValue label="Next check-up" value={formatDate(record.nextCheckup)} />
        <KeyValue label="Nurse note" value={record.note || '—'} />
      </Block>
      <Block title="Vaccinations">
        <View className="flex-row flex-wrap gap-1.5">
          {record.vaccinations.map((v) => <Pill key={v} label={v} tone="success" icon="check" />)}
        </View>
      </Block>
      {form.node}
    </View>
  );
}

/* ----------------------------------------- Library ----------------------------------------- */

const loanTone: Record<string, Tone> = { Issued: 'primary', Returned: 'success', Overdue: 'danger', Reserved: 'info' };

export function LibraryPane({ student }: PaneProps) {
  const loans = useCollection<LoanRecord>('libraryLoans').filter((l) => l.studentId === student.id).sort((a, b) => b.issued.localeCompare(a.issued));
  const n = (s: string) => loans.filter((l) => l.status === s).length;
  return (
    <View>
      <SummaryStrip items={[{ label: 'Issued', value: n('Issued'), tone: 'primary', icon: 'book' }, { label: 'Returned', value: n('Returned'), tone: 'success', icon: 'check' }, { label: 'Overdue', value: n('Overdue'), tone: n('Overdue') ? 'danger' : 'neutral', icon: 'alert-triangle' }, { label: 'Reserved', value: n('Reserved'), tone: 'info', icon: 'bookmark' }]} />
      <Block title="Loans">
        {loans.length === 0 ? <Empty text="No library activity." /> : null}
        {loans.map((l) => (
          <Item key={l.id} title={l.title} sub={`${l.author}${l.issued ? ` · issued ${formatDate(l.issued)} · due ${formatDate(l.due)}` : ' · reserved'}${l.returned ? ` · returned ${formatDate(l.returned)}` : ''}`} pill={l.status} tone={loanTone[l.status]} />
        ))}
      </Block>
    </View>
  );
}

/* ---------------------------------------- Documents ---------------------------------------- */

export function DocumentsPane({ student }: PaneProps) {
  const router = useRouter();
  const docs = useCollection<StudentDocumentRecord>('studentDocuments').filter((d) => d.studentId === student.id && !d.archived);
  const tone: Record<string, Tone> = { Verified: 'success', Pending: 'warning', Rejected: 'danger', Expired: 'danger' };
  return (
    <View>
      <SummaryStrip items={[{ label: 'Documents', value: docs.length, tone: 'primary', icon: 'folder' }, { label: 'Verified', value: docs.filter((d) => d.status === 'Verified').length, tone: 'success', icon: 'check-circle' }, { label: 'Pending', value: docs.filter((d) => d.status === 'Pending').length, tone: 'warning', icon: 'clock' }]} />
      <Block title="Documents" right={<AddButton label="Manage" onPress={() => router.push(`/people/student-documents?q=${student.admissionNo}` as Href)} />}>
        {docs.length === 0 ? <Empty text="No documents uploaded." /> : null}
        {docs.map((d) => <Item key={d.id} title={d.name} sub={`${d.category} · uploaded ${formatDate(d.uploadedOn)} by ${d.uploadedBy}`} pill={d.status} tone={tone[d.status]} meta={d.note || undefined} />)}
      </Block>
    </View>
  );
}

/* ---------------------------------------- Timeline ---------------------------------------- */

export function TimelinePane({ student }: PaneProps) {
  const ach = useCollection<AchievementRecord>('achievements');
  const dis = useCollection<DisciplineRecord>('disciplineRecords');
  const lv = useCollection<StudentLeaveRecord>('studentLeaves');
  const com = useCollection<CommunicationRecord>('communications');
  const pay = useCollection<FeePaymentRecord>('feePayments');
  const ex = useCollection<ExamResultRecord>('examResults');
  const events = useMemo(() => {
    const mine = <T extends { studentId: string }>(rows: T[]) => rows.filter((r) => r.studentId === student.id);
    const out: { at: string; icon: React.ComponentProps<typeof Feather>['name']; title: string; sub: string; tone: Tone }[] = [{ at: student.joinedOn, icon: 'log-in', title: 'Joined the school', sub: `Admission ${student.admissionNo}`, tone: 'primary' }];
    mine(ach).forEach((a) => out.push({ at: a.date, icon: 'award', title: a.title, sub: `${a.award} · ${a.level}`, tone: 'warning' }));
    mine(dis).forEach((d) => out.push({ at: d.date, icon: d.kind === 'Positive' ? 'thumbs-up' : 'alert-triangle', title: d.title, sub: `${d.kind}${d.points ? ` (${d.points > 0 ? '+' : ''}${d.points})` : ''}`, tone: d.kind === 'Positive' ? 'success' : d.kind === 'Counselling' ? 'info' : 'danger' }));
    mine(lv).forEach((l) => out.push({ at: l.from, icon: 'calendar', title: `${l.leaveType} (${l.days} day${l.days > 1 ? 's' : ''})`, sub: l.status, tone: 'info' }));
    mine(com).forEach((c) => out.push({ at: c.date, icon: 'message-circle', title: c.subject, sub: `${c.channel} · ${c.direction}`, tone: 'teal' }));
    mine(pay).forEach((p) => out.push({ at: p.date, icon: 'dollar-sign', title: `Paid ${money(p.amount)}`, sub: `${p.receiptNo} · ${p.method}`, tone: 'success' }));
    mine(ex).forEach((e) => out.push({ at: e.date, icon: 'file-text', title: `${e.examName} result`, sub: `${pct(examPercent(e))} · Grade ${gradeFor(examPercent(e))}`, tone: 'purple' }));
    return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
  }, [student, ach, dis, lv, com, pay, ex]);
  return (
    <Block title="Timeline">
      {events.map((e, i) => {
        const t = TONES[e.tone];
        return (
          <View key={`${e.at}-${i}`} className="flex-row">
            <View className="mr-3 items-center">
              <View style={{ backgroundColor: t.bg, borderColor: t.border }} className="h-7 w-7 items-center justify-center rounded-full border">
                <Feather name={e.icon} size={12} color={t.fg} />
              </View>
              {i < events.length - 1 ? <View className="my-0.5 w-px flex-1 bg-slate-200 dark:bg-[#322D46]" /> : null}
            </View>
            <View className="flex-1 pb-3">
              <Text className="text-xs font-bold text-[#1b2240] dark:text-[#EFEFF2]">{e.title}</Text>
              <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{formatDate(e.at)} · {e.sub}</Text>
            </View>
          </View>
        );
      })}
    </Block>
  );
}

/* --------------------------------------- Achievements --------------------------------------- */

const AWARDS = ['Gold', 'Silver', 'Bronze', 'Certificate', 'Badge'];

export function AchievementsPane({ student, staff }: PaneProps) {
  const list = useCollection<AchievementRecord>('achievements').filter((a) => a.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const toast = useToast();
  const fields: FieldDef[] = [
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ['Academic', 'Sports', 'Arts', 'Leadership', 'Community'] },
    { key: 'level', label: 'Level', type: 'select', required: true, options: ['School', 'District', 'State', 'National'] },
    { key: 'award', label: 'Award', type: 'select', required: true, options: AWARDS },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'description', label: 'Description', type: 'textarea' },
  ];
  const form = useRecordForm<Omit<AchievementRecord, 'id' | 'studentId'>>(fields, { date: todayISO() }, (v) => {
    if (v.date > todayISO()) return toast('The date cannot be in the future', 'error');
    repo<AchievementRecord>('achievements').create({ ...v, studentId: student.id });
    toast('Achievement added');
  }, 'Add achievement');
  const n = (a: string) => list.filter((x) => x.award === a).length;
  return (
    <View>
      <SummaryStrip items={[{ label: 'Total awards', value: list.length, tone: 'warning', icon: 'award' }, { label: 'Gold medals', value: n('Gold'), tone: 'danger', icon: 'star' }, { label: 'Certificates', value: n('Certificate'), tone: 'info', icon: 'file-text' }, { label: 'Badges', value: n('Badge'), tone: 'purple', icon: 'shield' }]} />
      <Block title="Achievements" right={staff ? <AddButton label="Add" onPress={form.open} /> : undefined}>
        {list.length === 0 ? <Empty text="No achievements recorded yet." /> : null}
        {list.map((a) => <Item key={a.id} title={a.title} sub={`${a.category} · ${a.level} level · ${formatDate(a.date)}${a.description ? `\n${a.description}` : ''}`} pill={a.award} tone={a.award === 'Gold' ? 'warning' : a.award === 'Silver' ? 'neutral' : a.award === 'Bronze' ? 'danger' : 'primary'} />)}
      </Block>
      {form.node}
    </View>
  );
}

/* ---------------------------------------- Discipline ---------------------------------------- */

const conductTone: Record<string, Tone> = { Positive: 'success', Warning: 'warning', Suspension: 'danger', Counselling: 'info' };

export function DisciplinePane({ student, staff }: PaneProps) {
  const list = useCollection<DisciplineRecord>('disciplineRecords').filter((d) => d.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const { user } = useAuth();
  const toast = useToast();
  const fields: FieldDef[] = [
    { key: 'kind', label: 'Type', type: 'select', required: true, options: ['Positive', 'Warning', 'Suspension', 'Counselling'] },
    { key: 'title', label: 'Title', type: 'text', required: true },
    { key: 'points', label: 'Points', type: 'number', min: 0, max: 50, default: 5, hint: 'Entered as a positive number; warnings and suspensions subtract it.' },
    { key: 'date', label: 'Date', type: 'date', required: true },
    { key: 'detail', label: 'Details', type: 'textarea' },
  ];
  const form = useRecordForm<{ kind: DisciplineRecord['kind']; title: string; points: number; date: string; detail: string }>(fields, { date: todayISO(), points: 5 }, (v) => {
    if (v.date > todayISO()) return toast('The date cannot be in the future', 'error');
    const signed = v.kind === 'Positive' ? Math.abs(v.points) : v.kind === 'Counselling' ? 0 : -Math.abs(v.points);
    repo<DisciplineRecord>('disciplineRecords').create({ studentId: student.id, kind: v.kind, title: v.title, points: signed, date: v.date, by: user?.name ?? 'Staff', detail: v.detail });
    logAudit({ entity: 'student', entityId: student.id, action: 'Action', summary: `${student.name}: ${v.kind.toLowerCase()} recorded — ${v.title}`, by: user?.name ?? 'Staff' });
    toast('Conduct record added');
  }, 'Add conduct record');
  const n = (k: string) => list.filter((d) => d.kind === k).length;
  const score = behaviourScore(student.id);
  return (
    <View>
      <SummaryStrip items={[{ label: 'Behaviour', value: `${score}/100`, tone: 'teal', icon: 'smile' }, { label: 'Positive points', value: list.filter((d) => d.kind === 'Positive').reduce((a, b) => a + b.points, 0), tone: 'success', icon: 'thumbs-up' }, { label: 'Warnings', value: n('Warning'), tone: 'warning', icon: 'alert-triangle' }, { label: 'Suspensions', value: n('Suspension'), tone: n('Suspension') ? 'danger' : 'neutral', icon: 'slash' }, { label: 'Counselling', value: n('Counselling'), tone: 'info', icon: 'message-square' }]} />
      <Text className="mb-2 text-center text-[11px] text-slate-400 dark:text-[#8b879b]">{behaviourLabel(score)} conduct</Text>
      <Block title="Conduct log" right={staff ? <AddButton label="Add" onPress={form.open} /> : undefined}>
        {list.length === 0 ? <Empty text="No conduct records." /> : null}
        {list.map((d) => <Item key={d.id} title={d.title} sub={`${formatDate(d.date)} · ${d.by}${d.detail ? `\n${d.detail}` : ''}`} pill={d.points ? `${d.points > 0 ? '+' : ''}${d.points} pts` : d.kind} tone={conductTone[d.kind]} />)}
      </Block>
      {form.node}
    </View>
  );
}

/* --------------------------------------- Communication --------------------------------------- */

export function CommunicationPane({ student }: PaneProps) {
  const list = useCollection<CommunicationRecord>('communications').filter((c) => c.studentId === student.id).sort((a, b) => b.date.localeCompare(a.date));
  const { user } = useAuth();
  const toast = useToast();
  const fields: FieldDef[] = [
    { key: 'channel', label: 'Channel', type: 'select', required: true, options: ['Message', 'Email', 'SMS', 'Call'] },
    { key: 'subject', label: 'Subject', type: 'text', required: true },
    { key: 'summary', label: 'Message / call summary', type: 'textarea', required: true },
  ];
  const form = useRecordForm<{ channel: CommunicationRecord['channel']; subject: string; summary: string }>(fields, { channel: 'Message' }, (v) => {
    repo<CommunicationRecord>('communications').create({ studentId: student.id, channel: v.channel, subject: v.subject, summary: v.summary, date: todayISO(), by: user?.name ?? 'Staff', direction: 'Outgoing' });
    toast(`${v.channel} to ${student.parentName} logged (mock: nothing is sent)`, 'info');
  }, 'Log communication');
  const n = (c: string) => list.filter((x) => x.channel === c).length;
  return (
    <View>
      <SummaryStrip items={[{ label: 'Emails', value: n('Email'), tone: 'info', icon: 'mail' }, { label: 'Messages', value: n('Message'), tone: 'success', icon: 'message-circle' }, { label: 'SMS', value: n('SMS'), tone: 'warning', icon: 'smartphone' }, { label: 'Calls', value: n('Call'), tone: 'teal', icon: 'phone' }]} />
      <Block title="Log" right={<AddButton label="New" onPress={form.open} />}>
        {list.length === 0 ? <Empty text="No communication logged." /> : null}
        {list.map((c) => <Item key={c.id} title={c.subject} sub={`${c.summary}`} pill={c.channel} tone="info" meta={`${formatDate(c.date)} · ${c.direction === 'Incoming' ? 'from' : 'by'} ${c.by}`} />)}
      </Block>
      {form.node}
    </View>
  );
}

/* ------------------------------------------- Notes ------------------------------------------- */

const NOTE_CATEGORIES = ['Counselling', 'Academic', 'Behaviour', 'Health'];

export function NotesPane({ student, staff }: PaneProps) {
  const all = useCollection<StudentNoteRecord>('studentNotes').filter((n) => n.studentId === student.id).sort((a, b) => b.at.localeCompare(a.at));
  const [cat, setCat] = useState('all');
  const { user } = useAuth();
  const toast = useToast();
  const fields: FieldDef[] = [
    { key: 'category', label: 'Category', type: 'select', required: true, options: NOTE_CATEGORIES },
    { key: 'text', label: 'Note', type: 'textarea', required: true },
  ];
  const form = useRecordForm<{ category: StudentNoteRecord['category']; text: string }>(fields, { category: 'Academic' }, (v) => {
    repo<StudentNoteRecord>('studentNotes').create({ studentId: student.id, category: v.category, text: v.text, by: user?.name ?? 'Staff', at: new Date().toISOString() });
    toast('Note saved');
  }, 'Add note');
  if (!staff) return <EmptyState icon="lock" title="Staff only" hint="Counsellor and teacher notes are not visible to students or parents." />;
  const list = all.filter((n) => cat === 'all' || n.category === cat);
  return (
    <View>
      <SegmentedTabs tabs={[{ key: 'all', label: 'All' }, ...NOTE_CATEGORIES.map((c) => ({ key: c, label: c }))]} active={cat} onChange={setCat} />
      <Block title="Staff notes" right={<AddButton label="Add note" onPress={form.open} />}>
        {list.length === 0 ? <Empty text="No notes." /> : null}
        {list.map((n) => <Item key={n.id} title={n.text} pill={n.category} tone="purple" meta={`${n.by} · ${formatDate(n.at.slice(0, 10))}`} />)}
      </Block>
      {form.node}
    </View>
  );
}

/* ----------------------------------------- Audit trail ----------------------------------------- */

const auditGroup = (summary: string): 'fees' | 'academic' | 'profile' => (/fee|paid|payment|collect/i.test(summary) ? 'fees' : /exam|marks|promot|class|section|leave|academic|attendance/i.test(summary) ? 'academic' : 'profile');

export function AuditPane({ student, staff }: PaneProps) {
  const logs = useCollection<AuditRecord>('auditLog').filter((a) => a.entity === 'student' && a.entityId === student.id).sort((a, b) => b.at.localeCompare(a.at));
  const [f, setF] = useState('all');
  if (!staff) return <EmptyState icon="lock" title="Staff only" hint="The audit trail is not visible to students or parents." />;
  const list = logs.filter((l) => f === 'all' || auditGroup(l.summary) === f);
  return (
    <View>
      <SummaryStrip items={[{ label: 'Total changes', value: logs.length, tone: 'info', icon: 'edit-2' }, { label: 'Editors', value: new Set(logs.map((l) => l.by)).size, tone: 'success', icon: 'user-check' }, { label: 'Last change', value: logs[0] ? relativeDay(logs[0].at).replace(/\s\d\d:\d\d$/, '') : '—', tone: 'warning', icon: 'clock' }]} />
      <SegmentedTabs tabs={[{ key: 'all', label: 'All' }, { key: 'profile', label: 'Profile' }, { key: 'fees', label: 'Fees' }, { key: 'academic', label: 'Academic' }]} active={f} onChange={setF} />
      <Block title="Changes">
        {list.length === 0 ? <Empty text="No changes recorded." /> : null}
        {list.map((l) => <Item key={l.id} title={l.summary} pill={l.action} tone={l.action === 'Deleted' ? 'danger' : l.action === 'Created' ? 'success' : 'primary'} meta={`${l.by} · ${formatDate(l.at.slice(0, 10))} ${l.at.slice(11, 16)}`} />)}
      </Block>
    </View>
  );
}

export const PANES: Record<TabKey, React.ComponentType<PaneProps>> = {
  overview: OverviewPane,
  attendance: AttendancePane,
  academics: AcademicsPane,
  exams: ExamsPane,
  fees: FeesPane,
  timetable: TimetablePane,
  health: HealthPane,
  library: LibraryPane,
  documents: DocumentsPane,
  timeline: TimelinePane,
  achievements: AchievementsPane,
  discipline: DisciplinePane,
  communication: CommunicationPane,
  notes: NotesPane,
  audit: AuditPane,
};
