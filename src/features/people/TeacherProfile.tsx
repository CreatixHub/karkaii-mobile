import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, Share, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { repo } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { addDays, formatDate, formatTime, relativeDay, todayISO } from '@/core/utils/date';
import { money, pct } from '@/core/utils/format';
import { BREAKS, DAYS, DAY_NAMES, slotLabel, type Day } from '@/core/schedule/scheduler';
import type { ClassSubjectRecord, TimetableEntryRecord } from '@/data/seed/academic';
import type { TeacherAttendanceRecord } from '@/data/seed/hrm';
import type { SectionRecord, TeacherRecord } from '@/data/seed/master';
import { TEACHER_LEAVE_TYPES, type TeacherLeaveRecord, type TeacherLoanRecord } from '@/data/seed/teacherLife';
import { getClass } from '@/features/common/refs';
import { subjectName, sectionLabel } from '@/features/academic/helpers';
import type { FieldDef } from '@/features/engine/types';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, EmptyState, KeyValue, Pill } from '@/ui/basics';
import { SelectField } from '@/ui/Fields';
import { SegmentedTabs, SummaryStrip } from '@/ui/ListChrome';
import { useToast } from '@/ui/Toast';
import type { Tone } from '@/ui/tone';
import { AddButton, Block, Empty, Item, useRecordForm } from './StudentProfileTabs';
import { attendanceSummaryOf, classesOfTeacher, homeSectionsOf, leaveBalancesOf, mappingsOfTeacher, payrollOf, payslipsOf, periodsPerWeek, userOfTeacher } from './teacherData';
import { decideTeacherLeave } from './teacherLogic';

type Tab = 'details' | 'routine' | 'leave' | 'salary' | 'library';
const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'routine', label: 'Routine' },
  { key: 'leave', label: 'Leave & Attendance' },
  { key: 'salary', label: 'Salary' },
  { key: 'library', label: 'Library' },
];

interface PaneProps {
  teacher: TeacherRecord;
  /** Staff roles may manage; pay details are limited to the teacher themself, admin and accountant. */
  staff: boolean;
  canSeePay: boolean;
}

const statusTone: Record<string, Tone> = { Active: 'success', 'On Leave': 'warning', Inactive: 'neutral' };
const leaveTone: Record<string, Tone> = { Approved: 'success', Pending: 'warning', Rejected: 'danger' };
const dutyTone: Record<string, Tone> = { Present: 'success', Late: 'warning', 'Half Day': 'teal', Absent: 'danger', 'On Leave': 'info', Pending: 'neutral' };
const dial = (n: string) => n.replace(/[^\d+]/g, '');

/* -------------------------------------- Details -------------------------------------- */

function DetailsPane({ teacher: t, staff, canSeePay }: PaneProps) {
  const router = useRouter();
  const toast = useToast();
  const maps = useCollection<ClassSubjectRecord>('classSubjects').filter((m) => m.teacherId === t.id);
  const homes = homeSectionsOf(t.id);
  const account = userOfTeacher(t.id);
  const classes = classesOfTeacher(t.id);
  return (
    <View>
      <Block title="Personal">
        <KeyValue label="Teacher ID" value={t.employeeId} />
        <KeyValue label="Gender" value={t.gender} />
        <KeyValue label="Date of birth" value={formatDate(t.dob)} />
        <KeyValue label="Marital status" value={t.maritalStatus} />
        <KeyValue label="Blood group" value={t.bloodGroup} />
        <KeyValue label="Languages" value={t.languages.join(', ')} />
        <KeyValue label="Father" value={t.fatherName} />
        <KeyValue label="Mother" value={t.motherName} />
      </Block>
      <Block title="Professional">
        <KeyValue label="Department" value={t.department} />
        <KeyValue label="Designation" value={t.designation} />
        <KeyValue label="Campus" value={t.campus} />
        <KeyValue label="Joined" value={formatDate(t.joinedOn)} />
        <KeyValue label="Qualification" value={t.qualification} />
        <KeyValue label="Experience" value={`${t.experienceYears} years`} />
        <KeyValue label="Previous school" value={t.previousSchool || '—'} />
        <KeyValue label="Contract" value={`${t.contractType} · ${t.workShift} shift`} />
        <KeyValue label="Subjects" value={t.subjects.join(', ')} />
      </Block>
      <Block title="Classes & subjects (from the class mapping)">
        <KeyValue label="Class teacher of" value={homes.length ? homes.map((s) => sectionLabel(s.id)).join(', ') : '—'} />
        <KeyValue label="Teaches in" value={classes.map((c) => c.name).join(', ') || '—'} />
        {maps.length === 0 ? <Empty text="No class subjects are assigned yet. Use Academic → Classes → Assign subject." /> : null}
        {maps.map((m) => <Item key={m.id} title={subjectName(m.subjectId)} sub={`${getClass(m.classId)?.name ?? '—'} · ${m.periodsPerWeek} periods a week`} />)}
      </Block>
      <Block title="Contact">
        <KeyValue label="Phone" value={t.phone} />
        <KeyValue label="Email" value={t.email} />
        <KeyValue label="Address" value={t.address} />
        <KeyValue label="Permanent address" value={t.permanentAddress} />
        <View className="mt-2 flex-row gap-2">
          <Button small variant="secondary" icon="phone" label="Call" onPress={() => Linking.openURL(`tel:${dial(t.phone)}`).catch(() => toast('Could not open the dialler', 'error'))} style={{ flex: 1 }} />
          <Button small variant="secondary" icon="mail" label="Email" onPress={() => Linking.openURL(`mailto:${t.email}`).catch(() => toast('Could not open the mail app', 'error'))} style={{ flex: 1 }} />
        </View>
      </Block>
      {canSeePay ? (
        <Block title="Bank & payroll">
          <KeyValue label="Account" value={`${t.accountName} · ${t.bankName}`} />
          <KeyValue label="Account number" value={t.accountNumber} />
          <KeyValue label="IFSC / branch" value={`${t.ifscCode} · ${t.branchName}`} />
          <KeyValue label="EPF no" value={t.epfNo} />
          <KeyValue label="PAN / ID" value={t.panId} />
        </Block>
      ) : null}
      {t.route || t.hostel ? (
        <Block title="Transport & hostel">
          <KeyValue label="Route" value={t.route || '—'} />
          <KeyValue label="Vehicle" value={t.vehicleNumber || '—'} />
          <KeyValue label="Pick-up" value={t.pickupPoint || '—'} />
          <KeyValue label="Hostel / room" value={t.hostel ? `${t.hostel} · ${t.roomNo}` : '—'} />
        </Block>
      ) : null}
      <Block title="Documents & social">
        <KeyValue label="Resume" value={t.resume || '—'} />
        <KeyValue label="Joining letter" value={t.joiningLetter || '—'} />
        <KeyValue label="LinkedIn" value={t.linkedin || '—'} />
        {t.notes ? <KeyValue label="Notes" value={t.notes} /> : null}
      </Block>
      <Block title="Login">
        <KeyValue label="Account" value={account ? `${account.status} · last sign-in ${relativeDay(account.lastLogin)}` : 'No login account'} />
        {staff ? <Button small variant="secondary" icon="edit-2" label="Edit teacher" onPress={() => router.push(`/people/add-teacher?id=${t.id}` as Href)} style={{ marginTop: 8 }} /> : null}
      </Block>
    </View>
  );
}


/* -------------------------------------- Routine -------------------------------------- */

const todayDay = (): Day => {
  const d = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date().getDay()];
  return d === 'Sun' ? 'Mon' : (d as Day);
};

function RoutinePane({ teacher: t }: PaneProps) {
  const router = useRouter();
  const entries = useCollection<TimetableEntryRecord>('timetableEntries').filter((e) => e.teacherId === t.id);
  const sections = useCollection<SectionRecord>('sections');
  const [day, setDay] = useState<Day>(todayDay());
  const list = entries.filter((e) => e.day === day).sort((a, b) => a.period - b.period);
  const days = new Set(entries.map((e) => e.day)).size;
  return (
    <View>
      <SummaryStrip items={[{ label: 'Periods a week', value: entries.length, tone: 'primary', icon: 'clock' }, { label: 'Teaching days', value: days, tone: 'info', icon: 'calendar' }, { label: `${DAY_NAMES[day]}`, value: `${list.length} periods`, tone: 'success', icon: 'sun' }, { label: 'Class sections', value: new Set(entries.map((e) => e.sectionId).filter(Boolean)).size, tone: 'purple', icon: 'users' }]} />
      {entries.length === 0 ? <EmptyState icon="calendar" title="No periods yet" hint="This teacher has no timetable entries. Generate timetables from Academic → Classes." /> : null}
      <SegmentedTabs tabs={DAYS.map((d) => ({ key: d, label: d, count: entries.filter((e) => e.day === d).length }))} active={day} onChange={(k) => setDay(k as Day)} />
      <Block title={DAY_NAMES[day]}>
        {entries.length > 0 && list.length === 0 ? <Empty text="No periods on this day." /> : null}
        {list.map((e, i) => {
          const brk = BREAKS.find((b) => b.afterPeriod === list[i - 1]?.period);
          const sec = sections.find((s) => s.id === e.sectionId);
          return (
            <View key={e.id}>
              {brk ? <Text className="my-1 text-center text-[10px] font-bold uppercase text-slate-300">{brk.label}</Text> : null}
              <Item title={`${subjectName(e.subjectId)}${sec ? ` · ${sectionLabel(sec.id)}` : ' · Staff meeting'}`} sub={`${slotLabel(e.period)} · Room ${e.room}${e.mode !== 'Teaching' ? ` · ${e.mode}` : ''}`} pill={`P${e.period}`} tone="primary" meta={e.originalTeacherId ? 'Substitute period' : undefined} />
            </View>
          );
        })}
      </Block>
      <Button small variant="secondary" icon="grid" label="Open the full teacher timetable" onPress={() => router.push('/academic/teacher-timetable' as Href)} />
    </View>
  );
}

/* -------------------------------- Leave & attendance -------------------------------- */

function LeavePane({ teacher: t, staff }: PaneProps) {
  const toast = useToast();
  const { user } = useAuth();
  useCollection<TeacherAttendanceRecord>('teacherAttendance');
  const leaves = useCollection<TeacherLeaveRecord>('teacherLeaves').filter((l) => l.teacherId === t.id).sort((a, b) => b.from.localeCompare(a.from));
  const duty = useCollection<TeacherAttendanceRecord>('teacherAttendance').filter((a) => a.teacherId === t.id).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10);
  const sum = attendanceSummaryOf(t.id);
  const balances = leaveBalancesOf(t);
  const fields: FieldDef[] = [
    { key: 'leaveType', label: 'Leave Type', type: 'select', required: true, options: TEACHER_LEAVE_TYPES },
    { key: 'from', label: 'From', type: 'date', required: true },
    { key: 'to', label: 'To', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
  ];
  const form = useRecordForm<{ leaveType: TeacherLeaveRecord['leaveType']; from: string; to: string; reason: string }>(fields, { from: todayISO(), to: todayISO() }, (v) => {
    if (v.to < v.from) return toast('End date cannot be before the start date', 'error');
    if (leaves.some((l) => l.status !== 'Rejected' && l.from <= v.to && l.to >= v.from)) return toast('This overlaps an existing leave request', 'error');
    const days = Math.round((new Date(v.to).getTime() - new Date(v.from).getTime()) / 86400000) + 1;
    const bal = balances.find((b) => b.type === v.leaveType);
    if (bal && days > bal.available) return toast(`Only ${bal.available} ${v.leaveType.toLowerCase()} day(s) left this year`, 'error');
    repo<TeacherLeaveRecord>('teacherLeaves').create({ teacherId: t.id, leaveType: v.leaveType, from: v.from, to: v.to, days, appliedOn: todayISO(), status: 'Pending', reason: v.reason, decidedBy: '', decisionNote: '' });
    toast('Leave request submitted');
  }, 'Apply leave');
  const n = (s: string) => leaves.filter((l) => l.status === s).length;
  return (
    <View>
      <SummaryStrip items={[{ label: 'Leave requests', value: leaves.length, tone: 'primary', icon: 'calendar' }, { label: 'Approved', value: n('Approved'), tone: 'success', icon: 'check' }, { label: 'Pending', value: n('Pending'), tone: 'warning', icon: 'clock' }, { label: 'Rejected', value: n('Rejected'), tone: 'danger', icon: 'x' }, { label: 'Attendance', value: pct(sum.pct), tone: sum.pct < 90 ? 'warning' : 'success', icon: 'check-square' }]} />
      <Block title="Leave balance (this year)">
        {balances.filter((b) => b.allowed > 0).map((b) => (
          <View key={b.type} className="flex-row border-b border-slate-100 py-2">
            <Text className="flex-1 text-xs font-semibold text-slate-700">{b.type}</Text>
            <Text className="text-xs text-slate-500">{b.used} used · </Text>
            <Text className="text-xs font-bold text-[#1b2240]">{b.available} of {b.allowed} left</Text>
          </View>
        ))}
      </Block>
      <Block title="Leave requests" right={<AddButton label="Apply" onPress={form.open} />}>
        {leaves.length === 0 ? <Empty text="No leave requests." /> : null}
        {leaves.map((l) => (
          <Card key={l.id} style={{ marginBottom: 8 }}>
            <View className="flex-row items-start justify-between">
              <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240]">{l.leaveType}</Text>
              <Pill label={l.status} tone={leaveTone[l.status]} />
            </View>
            <Text className="mt-1 text-[11px] text-slate-500">{formatDate(l.from)}{l.to !== l.from ? ` – ${formatDate(l.to)}` : ''} · {l.days} day{l.days > 1 ? 's' : ''} · applied {formatDate(l.appliedOn)}</Text>
            <Text className="mt-0.5 text-[11px] text-slate-500">{l.reason}</Text>
            {l.decisionNote ? <Text className="mt-0.5 text-[11px] italic text-slate-400">{l.decisionNote}</Text> : null}
            {staff && l.status === 'Pending' ? (
              <View className="mt-2 flex-row gap-2">
                <Button small label="Approve" onPress={() => toast(`Approved · ${decideTeacherLeave(l, 'Approved', user?.name ?? 'Admin')} register day(s) marked On Leave`)} style={{ flex: 1 }} />
                <Button small variant="danger" label="Reject" onPress={() => { decideTeacherLeave(l, 'Rejected', user?.name ?? 'Admin', 'Not approved'); toast('Leave rejected', 'info'); }} style={{ flex: 1 }} />
              </View>
            ) : null}
          </Card>
        ))}
      </Block>
      <Block title="Attendance (latest register days)">
        {duty.length === 0 ? <Empty text="No attendance recorded." /> : null}
        {duty.map((a) => <Item key={a.id} title={formatDate(a.date)} sub={`${a.checkIn ? `In ${formatTime(a.checkIn)}` : 'No check-in'}${a.checkOut ? ` · Out ${formatTime(a.checkOut)}` : ''} · ${a.method}`} pill={a.status} tone={dutyTone[a.status]} />)}
      </Block>
      {form.node}
    </View>
  );
}

/* --------------------------------------- Salary --------------------------------------- */

function SalaryPane({ teacher: t, canSeePay }: PaneProps) {
  const toast = useToast();
  if (!canSeePay) return <EmptyState icon="lock" title="Pay details are private" hint="Salary is visible to the teacher, the administrator and accounts." />;
  const p = payrollOf(t);
  const slips = payslipsOf(t);
  const share = (i: number) => {
    const s = slips[i];
    Share.share({ title: `Payslip ${s.salaryFor}`, message: `PAYSLIP — ${s.salaryFor}\n${t.name} (${t.employeeId})\nGross ${money(p.gross)} · Deductions ${money(p.deductions)}\nNet pay ${money(s.net)} (${s.method}) paid ${formatDate(s.paidOn)}` }).catch(() => toast('Could not open the share sheet', 'error'));
  };
  return (
    <View>
      <SummaryStrip items={[{ label: 'Net salary', value: money(p.net), tone: 'primary', icon: 'dollar-sign' }, { label: 'Gross salary', value: money(p.gross), tone: 'success', icon: 'briefcase' }, { label: 'Deductions', value: money(p.deductions), tone: 'warning', icon: 'minus-circle' }, { label: 'Unpaid days', value: p.unpaidDays, tone: p.unpaidDays ? 'danger' : 'neutral', icon: 'calendar' }]} />
      <Block title="This month (illustrative)">
        <KeyValue label="Basic" value={money(p.basic)} />
        <KeyValue label="House rent (20%)" value={money(p.hra)} />
        <KeyValue label="Transport (10%)" value={money(p.transport)} />
        <KeyValue label="Special (5%)" value={money(p.special)} />
        <KeyValue label="Gross" value={money(p.gross)} />
        <KeyValue label="EPF (12% of basic)" value={`− ${money(p.epf)}`} />
        <KeyValue label="Tax (4% of gross)" value={`− ${money(p.tax)}`} />
        <KeyValue label="Absent-day deduction" value={`− ${money(p.leaveDeduction)} (${p.unpaidDays} day${p.unpaidDays === 1 ? '' : 's'})`} />
        <KeyValue label="Net pay" value={money(p.net)} />
        <Text className="mt-1 text-[10px] text-slate-400">Worked out from the stored basic salary. Payroll processing is not one of the app’s pages.</Text>
      </Block>
      <Block title="Payslips">
        {slips.map((s, i) => (
          <View key={s.payrollId}>
            <Item title={`${s.salaryFor} · ${money(s.net)}`} sub={`Payroll ${s.payrollId} · ${s.method} · paid ${formatDate(s.paidOn)}`} />
            <Button small variant="ghost" icon="share-2" label={`Share ${s.salaryFor} payslip`} onPress={() => share(i)} style={{ marginBottom: 6 }} />
          </View>
        ))}
      </Block>
    </View>
  );
}

/* --------------------------------------- Library --------------------------------------- */

const loanTone: Record<string, Tone> = { Issued: 'primary', Returned: 'success', Overdue: 'danger' };

function LibraryPane({ teacher: t, staff }: PaneProps) {
  const loans = useCollection<TeacherLoanRecord>('teacherLoans').filter((l) => l.teacherId === t.id).sort((a, b) => b.issued.localeCompare(a.issued));
  const toast = useToast();
  const fields: FieldDef[] = [{ key: 'title', label: 'Book title', type: 'text', required: true }, { key: 'author', label: 'Author', type: 'text', required: true }];
  const form = useRecordForm<{ title: string; author: string }>(fields, {}, (v) => {
    if (loans.some((l) => l.status !== 'Returned' && l.title.toLowerCase() === v.title.trim().toLowerCase())) return toast('This book is already issued to this teacher', 'error');
    repo<TeacherLoanRecord>('teacherLoans').create({ teacherId: t.id, title: v.title.trim(), author: v.author.trim(), issued: todayISO(), due: addDays(todayISO(), 30), returned: '', status: 'Issued' });
    toast('Book issued for 30 days');
  }, 'Issue book');
  const n = (s: string) => loans.filter((l) => l.status === s).length;
  return (
    <View>
      <SummaryStrip items={[{ label: 'Issued', value: n('Issued'), tone: 'primary', icon: 'book' }, { label: 'Returned', value: n('Returned'), tone: 'success', icon: 'check' }, { label: 'Overdue', value: n('Overdue'), tone: n('Overdue') ? 'danger' : 'neutral', icon: 'alert-triangle' }]} />
      <Block title="Loans" right={staff ? <AddButton label="Issue" onPress={form.open} /> : undefined}>
        {loans.length === 0 ? <Empty text="No library activity." /> : null}
        {loans.map((l) => (
          <View key={l.id}>
            <Item title={l.title} sub={`${l.author} · issued ${formatDate(l.issued)} · due ${formatDate(l.due)}${l.returned ? ` · returned ${formatDate(l.returned)}` : ''}`} pill={l.status} tone={loanTone[l.status]} />
            {staff && l.status !== 'Returned' ? <Button small variant="secondary" icon="corner-down-left" label="Mark returned" onPress={() => { repo<TeacherLoanRecord>('teacherLoans').update(l.id, { returned: todayISO(), status: 'Returned' }); toast(`${l.title} returned`); }} style={{ marginBottom: 8 }} /> : null}
          </View>
        ))}
      </Block>
      {form.node}
    </View>
  );
}

/* --------------------------------------- Shell --------------------------------------- */

const PANES: Record<Tab, React.ComponentType<PaneProps>> = { details: DetailsPane, routine: RoutinePane, leave: LeavePane, salary: SalaryPane, library: LibraryPane };

export function TeacherProfile({ breadcrumb, initialTab = 'details' }: { breadcrumb: string; initialTab?: Tab }) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, role, canManage } = useAuth();
  const all = useCollection<TeacherRecord>('teachers');
  const [picked, setPicked] = useState<string | undefined>(typeof id === 'string' ? id : user?.teacherId);
  const [tab, setTab] = useState<Tab>(initialTab);
  const teacher = all.find((t) => t.id === picked) ?? all[0];
  const options = useMemo(() => all.map((t) => ({ label: t.name, value: t.id, hint: `${t.employeeId} · ${t.department}` })), [all]);
  if (!teacher) return <EmptyState icon="user-x" title="No teacher to show" />;
  const staff = canManage && role !== 'student' && role !== 'parent';
  const canSeePay = role === 'admin' || role === 'accountant' || (role === 'teacher' && user?.teacherId === teacher.id);
  const Pane = PANES[tab];
  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400" numberOfLines={1}>{breadcrumb}</Text>
        <SelectField label="Teacher" value={teacher.id} options={options} onChange={(v) => setPicked(v)} />
        <Card>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-extrabold text-[#1b2240]">{teacher.name}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">{teacher.employeeId} · {teacher.designation} · {teacher.department}</Text>
            </View>
            <Pill label={teacher.status} tone={statusTone[teacher.status]} />
          </View>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <Pill label={teacher.campus} tone="neutral" icon="map-pin" />
            <Pill label={teacher.contractType} tone={teacher.contractType === 'Permanent' ? 'success' : 'warning'} />
            {homeSectionsOf(teacher.id).map((s) => <Pill key={s.id} label={`Class teacher ${sectionLabel(s.id)}`} tone="primary" />)}
          </View>
          <Text className="mt-2 text-[11px] text-slate-500">{teacher.subjects.join(', ')} · {periodsPerWeek(teacher.id)} periods a week · {mappingsOfTeacher(teacher.id).length} class-subject assignments</Text>
        </Card>
      </View>
      <View className="mt-3">
        <SegmentedTabs tabs={TABS} active={tab} onChange={(k) => setTab(k as Tab)} />
      </View>
      <View className="px-4">
        <Pane teacher={teacher} staff={staff} canSeePay={canSeePay} />
      </View>
    </ScrollView>
  );
}

export const TeacherRoutine = ({ breadcrumb }: { breadcrumb: string }) => <TeacherProfile breadcrumb={breadcrumb} initialTab="routine" />;
