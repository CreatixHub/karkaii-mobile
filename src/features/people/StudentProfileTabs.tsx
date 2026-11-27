import React, { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { formatDate, formatTime, todayISO } from '@/core/utils/date';
import { money, pct } from '@/core/utils/format';
import { DAYS, DAY_NAMES, type Day } from '@/core/schedule/scheduler';
import { FormSheet, fromFormValues, toFormValues } from '@/features/engine/FormSheet';
import type { FieldDef } from '@/features/engine/types';
import { applyStudentLeave, type StudentProfileBundle } from '@/services/api/studentProfileApi';
import { Card, EmptyState, KeyValue, Pill, ProgressBar } from '@/ui/basics';
import { SegmentedTabs, SummaryStrip, type StatTile } from '@/ui/ListChrome';
import { useToast } from '@/ui/Toast';
import { TONES, type Tone } from '@/ui/tone';

export type TabKey =
  | 'overview'
  | 'attendance'
  | 'academics'
  | 'exams'
  | 'fees'
  | 'timetable'
  | 'health'
  | 'library'
  | 'documents'
  | 'timeline'
  | 'achievements'
  | 'discipline'
  | 'communication'
  | 'notes'
  | 'audit';

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

export interface PaneProps {
  profile: StudentProfileBundle;
  staff: boolean;
  onReload?: () => void;
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

export function useRecordForm<T extends Record<string, any>>(fields: FieldDef[], initial: Record<string, any>, save: (v: T) => void | Promise<void>, title: string) {
  const [open, setOpen] = useState(false);
  const node = (
    <FormSheet
      visible={open}
      title={title}
      fields={fields}
      initial={toFormValues(fields, initial)}
      onClose={() => setOpen(false)}
      onSubmit={async (values) => {
        await save(fromFormValues(fields, values) as T);
        setOpen(false);
      }}
    />
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

const ContactButtons = ({ phone, email, label }: { phone?: string; email?: string; label: string }) => {
  const open = useOpenLink();
  if (!phone && !email) return null;
  return (
    <View className="flex-row">
      {phone ? <IconBtn icon="phone" label={`Call ${label}`} onPress={() => open(`tel:${dial(phone)}`, 'the dialler')} /> : null}
      {phone ? <IconBtn icon="message-circle" label={`WhatsApp ${label}`} onPress={() => open(`https://wa.me/${dial(phone).replace('+', '')}`, 'WhatsApp')} /> : null}
      {email ? <IconBtn icon="mail" label={`Email ${label}`} onPress={() => open(`mailto:${email}`, 'the mail app')} /> : null}
    </View>
  );
};

const humanize = (s: string) => s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ------------------------------------- Overview ------------------------------------- */

export function OverviewPane({ profile, staff }: PaneProps) {
  const { student, attendanceSummary, fees, library, transport } = profile;
  const activeLoans = library.filter((l) => l.status === 'issued' || l.status === 'overdue');
  const att = attendanceSummary.percent;

  const tiles: StatTile[] = [
    { label: 'Attendance', value: att !== null ? pct(att) : '—', tone: att !== null && att < 75 ? 'danger' : 'success', icon: 'check-square' },
    { label: 'Fee status', value: fees.available ? fees.status : '—', tone: fees.status === 'Paid' ? 'success' : fees.status === 'Overdue' ? 'danger' : fees.status === 'Due' ? 'warning' : 'neutral', icon: 'dollar-sign' },
    { label: 'Transport', value: transport[0] ? transport[0].routeCode : 'Own', tone: 'info', icon: 'truck' },
    { label: 'Library', value: `${activeLoans.length} book${activeLoans.length === 1 ? '' : 's'}`, tone: 'purple', icon: 'book' },
    { label: 'Documents', value: student.documents.length, tone: 'primary', icon: 'folder' },
  ];

  const people = useMemo(() => {
    const out: { key: string; name: string; sub: string; phone?: string; email?: string; role: string }[] = [];
    const seen = new Set<string>();
    student.guardians.forEach((g, idx) => {
      seen.add(g.fullName.toLowerCase());
      const roleText = humanize(g.relation || 'guardian');
      const bits = [roleText, g.occupation, g.phone].filter(Boolean);
      if (g.isPrimary) bits.unshift('Primary');
      out.push({
        key: `g-${g.id}-${idx}`,
        name: g.fullName,
        sub: bits.join(' · '),
        phone: g.phone || undefined,
        email: g.email || undefined,
        role: roleText.toLowerCase(),
      });
    });

    const addParent = (roleLabel: string, name: string, phone: string, email: string, occupation: string) => {
      if (!name || seen.has(name.toLowerCase())) return;
      seen.add(name.toLowerCase());
      out.push({
        key: `p-${roleLabel.toLowerCase()}`,
        name,
        sub: [roleLabel, occupation, phone].filter(Boolean).join(' · '),
        phone: phone || undefined,
        email: email || undefined,
        role: roleLabel.toLowerCase(),
      });
    };

    addParent('Father', student.fatherName, student.fatherPhone, student.fatherEmail, student.fatherOccupation);
    addParent('Mother', student.motherName, student.motherPhone, student.motherEmail, student.motherOccupation);
    return out;
  }, [student]);

  const dobText = student.dob
    ? `${formatDate(student.dob)}${student.ageYears !== null ? ` (${student.ageYears} yrs)` : ''}`
    : '—';

  return (
    <View>
      <SummaryStrip items={tiles} />
      <Block title="Personal information">
        <KeyValue label="Full name" value={student.name} />
        <KeyValue label="Date of birth" value={dobText} />
        <KeyValue label="Gender" value={student.gender} />
        <KeyValue label="Blood group" value={student.bloodGroup} />
        {student.socialCategory ? <KeyValue label="Category" value={student.socialCategory} /> : null}
        <KeyValue label="Address" value={student.address} />
        <KeyValue label="Status" value={student.statusLabel} />
      </Block>

      <Block title="Academic information">
        <KeyValue label="Admission no" value={student.admissionNo} />
        {student.rollNo ? <KeyValue label="Roll no" value={student.rollNo} /> : null}
        <KeyValue label="Class / section" value={student.classLabel} />
        <KeyValue label="House" value={student.houseName ? `${student.houseName} House` : ''} />
        <KeyValue label="Admitted on" value={student.admittedOn ? formatDate(student.admittedOn) : ''} />
        {student.admission?.applicationNo ? <KeyValue label="Application no" value={student.admission.applicationNo} /> : null}
        <KeyValue label="Previous school" value={student.previousSchool} />
      </Block>

      <Block title="Parents & guardians">
        {people.length === 0 ? <Empty text="No guardian information recorded." /> : null}
        {people.map((person) => (
          <Card key={person.key} style={{ marginBottom: 8 }}>
            <View className="flex-row items-center justify-between">
              <View className="flex-1 pr-2">
                <Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{person.name}</Text>
                {person.sub ? <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{person.sub}</Text> : null}
                {person.email ? <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">{person.email}</Text> : null}
              </View>
              <ContactButtons phone={person.phone} email={person.email} label={person.role} />
            </View>
          </Card>
        ))}
      </Block>

      <Block title="Transport">
        {transport.length > 0 ? (
          transport.map((t) => (
            <Card key={t.id} style={{ marginBottom: 8 }}>
              <KeyValue label="Route" value={`${t.routeCode} · ${t.routeName}`} />
              <KeyValue label="Pick-up point" value={t.pickupPointName} />
              <KeyValue label="Direction" value={humanize(t.direction)} />
              <KeyValue label="Status" value={humanize(t.status)} />
            </Card>
          ))
        ) : (
          <Empty text="No transport route assigned." />
        )}
      </Block>

      {staff ? null : <Empty text="Notes and the audit trail are visible to staff only." />}
    </View>
  );
}

/* ------------------------------------ Attendance ------------------------------------ */

const attStatusTone: Record<string, Tone> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  excused: 'info',
};

const leaveStatusTone: Record<string, Tone> = {
  approved: 'success',
  pending: 'warning',
  rejected: 'danger',
  cancelled: 'neutral',
};

export function AttendancePane({ profile, staff, onReload }: PaneProps) {
  const { student, attendanceSummary, attendanceRecords, leaveTypes, leaveRequests } = profile;
  const toast = useToast();

  const leaveOptions = leaveTypes.map((lt) => ({ label: lt.name, value: lt.id }));
  const fields: FieldDef[] = [
    { key: 'leaveTypeId', label: 'Leave Type', type: 'select', required: true, options: leaveOptions },
    { key: 'fromDate', label: 'From', type: 'date', required: true },
    { key: 'toDate', label: 'To', type: 'date', required: true },
    { key: 'reason', label: 'Reason', type: 'textarea', required: true },
  ];

  const form = useRecordForm<{ leaveTypeId: string; fromDate: string; toDate: string; reason: string }>(
    fields,
    { leaveTypeId: leaveOptions[0]?.value ?? '', fromDate: todayISO(), toDate: todayISO() },
    async (v) => {
      if (v.toDate < v.fromDate) {
        toast('End date cannot be before start date', 'error');
        return;
      }
      try {
        await applyStudentLeave({
          studentId: student.id,
          leaveTypeId: v.leaveTypeId,
          fromDate: v.fromDate,
          toDate: v.toDate,
          reason: v.reason,
        });
        toast('Leave request submitted');
        onReload?.();
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Unable to submit leave request', 'error');
      }
    },
    'Apply leave',
  );

  return (
    <View>
      <SummaryStrip
        items={[
          {
            label: 'Overall',
            value: attendanceSummary.percent !== null ? pct(attendanceSummary.percent, 1) : '—',
            tone: attendanceSummary.percent !== null && attendanceSummary.percent < 75 ? 'danger' : 'success',
            icon: 'check-circle',
          },
          { label: 'Present', value: attendanceSummary.present, tone: 'success' },
          { label: 'Absent', value: attendanceSummary.absent, tone: 'danger' },
          { label: 'Late', value: attendanceSummary.late, tone: 'warning' },
          { label: 'Excused', value: attendanceSummary.excused, tone: 'info' },
        ]}
      />

      <Block title="Recent attendance">
        {attendanceRecords.length === 0 ? <Empty text="No attendance records found." /> : null}
        {attendanceRecords.slice(0, 15).map((r) => (
          <Item
            key={r.id}
            title={`${r.subjectName || 'Session'} · ${formatDate(r.attendanceDate)}`}
            sub={[r.slotName, r.startsAt && r.endsAt ? `${formatTime(r.startsAt)}–${formatTime(r.endsAt)}` : '', r.teacherName]
              .filter(Boolean)
              .join(' · ')}
            pill={humanize(r.status)}
            tone={attStatusTone[r.status] ?? 'neutral'}
            meta={r.remarks || undefined}
          />
        ))}
      </Block>

      <Block
        title="Leave requests"
        right={!staff && leaveOptions.length > 0 ? <AddButton label="Apply leave" onPress={form.open} /> : undefined}
      >
        {leaveRequests.length === 0 ? <Empty text="No leave requests." /> : null}
        {leaveRequests.map((l) => (
          <Card key={l.id} style={{ marginBottom: 8 }}>
            <View className="flex-row items-start justify-between">
              <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{l.typeName}</Text>
              <Pill label={humanize(l.status)} tone={leaveStatusTone[l.status] ?? 'neutral'} />
            </View>
            <Text className="mt-1 text-[11px] text-slate-500 dark:text-[#a29fb0]">
              {formatDate(l.fromDate)}
              {l.toDate !== l.fromDate ? ` – ${formatDate(l.toDate)}` : ''} · {l.days} day{l.days > 1 ? 's' : ''}
            </Text>
            <Text className="mt-0.5 text-[11px] text-slate-500 dark:text-[#a29fb0]">{l.reason}</Text>
            {l.decisionNotes ? <Text className="mt-0.5 text-[11px] italic text-slate-400 dark:text-[#8b879b]">{l.decisionNotes}</Text> : null}
          </Card>
        ))}
      </Block>
      {form.node}
    </View>
  );
}

/* ------------------------------------- Academics ------------------------------------- */

export function AcademicsPane({ profile }: PaneProps) {
  const { student, attendanceSummary, homework, timetable } = profile;
  const subjectsFromTt = useMemo(() => {
    const names = new Set<string>();
    timetable.entries.forEach((e) => {
      if (e.subjectName) names.add(e.subjectName);
    });
    return [...names];
  }, [timetable.entries]);

  const submittedCount = homework.filter((h) => h.subStatus !== 'not_submitted').length;
  const pendingCount = homework.length - submittedCount;

  return (
    <View>
      <SummaryStrip
        items={[
          { label: 'Attendance', value: attendanceSummary.percent !== null ? pct(attendanceSummary.percent, 1) : '—', tone: 'primary', icon: 'award' },
          { label: 'Subjects', value: Math.max(attendanceSummary.bySubject.length, subjectsFromTt.length), tone: 'info', icon: 'book' },
          { label: 'Homework done', value: submittedCount, tone: 'success', icon: 'check' },
          { label: 'Pending', value: pendingCount, tone: pendingCount ? 'warning' : 'neutral', icon: 'clock' },
        ]}
      />

      <Block title="Class">
        <KeyValue label="Class / section" value={student.classLabel} />
        <KeyValue label="House" value={student.houseName ? `${student.houseName} House` : ''} />
        <KeyValue label="Previous school" value={student.previousSchool} />
      </Block>

      <Block title="Subjects">
        {attendanceSummary.bySubject.length === 0 && subjectsFromTt.length === 0 ? (
          <Empty text="No subject records available yet." />
        ) : null}
        {attendanceSummary.bySubject.map((sub) => {
          const p = sub.percent ?? 0;
          return (
            <Card key={sub.subjectId} style={{ marginBottom: 8 }}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{sub.subjectName}</Text>
                <Pill
                  label={sub.percent !== null ? pct(sub.percent, 1) : `${sub.periods} periods`}
                  tone={sub.percent === null ? 'neutral' : p >= 75 ? 'success' : p >= 50 ? 'warning' : 'danger'}
                />
              </View>
              <Text className="mb-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-[#a29fb0]">
                {sub.present} present · {sub.absent} absent · {sub.late} late ({sub.periods} periods)
              </Text>
              {sub.percent !== null ? <ProgressBar value={p} tone={p >= 75 ? 'success' : p >= 50 ? 'warning' : 'danger'} /> : null}
            </Card>
          );
        })}
        {attendanceSummary.bySubject.length === 0 &&
          subjectsFromTt.map((name) => <Item key={name} title={name} pill="Enrolled" tone="primary" />)}
      </Block>

      <Block title="Homework">
        {homework.length === 0 ? <Empty text="No homework records found." /> : null}
        {homework.slice(0, 10).map((h) => {
          const submitted = h.subStatus !== 'not_submitted';
          const pillLabel = h.gradeLabel ? `${humanize(h.subStatus)} · ${h.gradeLabel}` : humanize(h.subStatus);
          return (
            <Item
              key={h.id}
              title={h.title}
              sub={`${h.subjectName}${h.dueAt ? ` · due ${formatDate(h.dueAt)}` : ''}`}
              pill={pillLabel}
              tone={submitted ? 'success' : h.dueAt && h.dueAt < todayISO() ? 'danger' : 'info'}
              meta={h.score !== null && h.maxMarks !== null ? `Score: ${h.score}/${h.maxMarks}` : h.feedback || undefined}
            />
          );
        })}
      </Block>
    </View>
  );
}

/* ------------------------------------ Exams & results ------------------------------------ */

export function ExamsPane(_props: PaneProps) {
  return <EmptyState icon="file-text" title="No exam results yet" hint="Exam results are not available from the server yet." />;
}

/* ----------------------------------------- Fees ----------------------------------------- */

const invoiceTone: Record<string, Tone> = {
  paid: 'success',
  overdue: 'danger',
  partially_paid: 'warning',
  issued: 'info',
};

const paymentTone: Record<string, Tone> = {
  cleared: 'success',
  pending: 'warning',
  rejected: 'danger',
  failed: 'danger',
};

export function FeesPane({ profile }: PaneProps) {
  const { fees } = profile;
  if (!fees.available) {
    return <EmptyState icon="dollar-sign" title="Fee details unavailable" hint="Your account does not have permission to view fee invoices." />;
  }

  return (
    <View>
      <SummaryStrip
        items={[
          { label: 'Total fees', value: money(fees.billed), tone: 'primary', icon: 'dollar-sign' },
          { label: 'Paid', value: money(fees.paid), tone: 'success', icon: 'check' },
          { label: 'Pending', value: money(fees.balance), tone: fees.balance > 0 ? 'danger' : 'neutral', icon: 'alert-circle' },
          { label: 'Overdue invoices', value: fees.overdueCount, tone: fees.overdueCount > 0 ? 'danger' : 'neutral', icon: 'clock' },
        ]}
      />
      <Block title="Invoices">
        {fees.invoices.length === 0 ? <Empty text="No fees have been assigned." /> : null}
        {fees.invoices.map((i) => (
          <Item
            key={i.id}
            title={i.number}
            sub={`Due ${formatDate(i.dueOn)} · ${money(i.total)} · paid ${money(i.paid)}`}
            pill={humanize(i.status)}
            tone={invoiceTone[i.status] ?? 'neutral'}
          />
        ))}
      </Block>
      <Block title="Payments">
        {fees.payments.length === 0 ? <Empty text="No payments yet." /> : null}
        {fees.payments.slice(0, 15).map((p) => (
          <Item
            key={p.id}
            title={`${p.receiptNo} · ${money(p.amount)}`}
            sub={`${formatDate(p.receivedAt)} · ${humanize(p.method)}${p.referenceNo ? ` · ${p.referenceNo}` : ''}`}
            pill={humanize(p.status)}
            tone={paymentTone[p.status] ?? 'neutral'}
          />
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

const DAY_NUMBER: Record<Day, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

export function TimetablePane({ profile }: PaneProps) {
  const { timetable } = profile;
  const [day, setDay] = useState<Day>(todayDay());

  if (!timetable.entries.length) {
    return (
      <EmptyState
        icon="calendar"
        title="No timetable yet"
        hint={timetable.message || 'This student’s section timetable is not available yet.'}
      />
    );
  }

  const dayNum = DAY_NUMBER[day];
  const list = timetable.entries
    .filter((e) => e.dayOfWeek === dayNum)
    .sort((a, b) => a.slotSequence - b.slotSequence);

  return (
    <View>
      <SegmentedTabs tabs={DAYS.map((d) => ({ key: d, label: d }))} active={day} onChange={(k) => setDay(k as Day)} />
      <Block title={DAY_NAMES[day]}>
        {list.length === 0 ? <Empty text="No periods on this day." /> : null}
        {list.map((e) => (
          <Item
            key={e.id}
            title={e.subjectName}
            sub={[
              e.startsAt && e.endsAt ? `${formatTime(e.startsAt)}–${formatTime(e.endsAt)}` : e.slotName,
              e.classroomCode ? `Room ${e.classroomCode}` : '',
              e.teacherName,
            ]
              .filter(Boolean)
              .join(' · ')}
            pill={e.slotName}
            tone="primary"
          />
        ))}
      </Block>
    </View>
  );
}

/* ----------------------------------------- Health ----------------------------------------- */

export function HealthPane({ profile }: PaneProps) {
  const { student } = profile;
  if (!student.bloodGroup) {
    return <EmptyState icon="heart" title="No health record" hint="No health metrics are recorded on the server yet." />;
  }
  return (
    <View>
      <SummaryStrip items={[{ label: 'Blood group', value: student.bloodGroup, tone: 'danger', icon: 'droplet' }]} />
      <Block title="Medical record">
        <KeyValue label="Blood group" value={student.bloodGroup} />
      </Block>
    </View>
  );
}

/* ----------------------------------------- Library ----------------------------------------- */

const loanTone: Record<string, Tone> = {
  issued: 'primary',
  returned: 'success',
  overdue: 'danger',
};

export function LibraryPane({ profile }: PaneProps) {
  const loans = profile.library;
  const countStatus = (s: string) => loans.filter((l) => l.status === s).length;
  const totalFine = loans.reduce((sum, l) => sum + l.fine, 0);

  return (
    <View>
      <SummaryStrip
        items={[
          { label: 'Issued', value: countStatus('issued'), tone: 'primary', icon: 'book' },
          { label: 'Returned', value: countStatus('returned'), tone: 'success', icon: 'check' },
          { label: 'Overdue', value: countStatus('overdue'), tone: countStatus('overdue') ? 'danger' : 'neutral', icon: 'alert-triangle' },
          { label: 'Fines', value: money(totalFine), tone: totalFine > 0 ? 'warning' : 'neutral', icon: 'dollar-sign' },
        ]}
      />
      <Block title="Loans">
        {loans.length === 0 ? <Empty text="No library activity." /> : null}
        {loans.map((l) => (
          <Item
            key={l.id}
            title={l.bookTitle}
            sub={[
              l.issuedOn ? `issued ${formatDate(l.issuedOn)}` : '',
              l.dueOn ? `due ${formatDate(l.dueOn)}` : '',
              l.returnedOn ? `returned ${formatDate(l.returnedOn)}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
            pill={humanize(l.status)}
            tone={loanTone[l.status] ?? 'neutral'}
            meta={l.fine > 0 ? `Fine: ${money(l.fine)}` : l.remarks || undefined}
          />
        ))}
      </Block>
    </View>
  );
}

/* ---------------------------------------- Documents ---------------------------------------- */

const docTone: Record<string, Tone> = {
  verified: 'success',
  pending: 'warning',
  rejected: 'danger',
};

export function DocumentsPane({ profile }: PaneProps) {
  const docs = profile.student.documents;
  return (
    <View>
      <SummaryStrip
        items={[
          { label: 'Documents', value: docs.length, tone: 'primary', icon: 'folder' },
          { label: 'Verified', value: docs.filter((d) => d.verifiedStatus === 'verified').length, tone: 'success', icon: 'check-circle' },
          { label: 'Pending', value: docs.filter((d) => d.verifiedStatus === 'pending').length, tone: 'warning', icon: 'clock' },
        ]}
      />
      <Block title="Documents">
        {docs.length === 0 ? <Empty text="No documents uploaded." /> : null}
        {docs.map((d) => (
          <Item
            key={d.id}
            title={humanize(d.documentType)}
            sub={[
              d.documentNo ? `No. ${d.documentNo}` : '',
              d.issuedOn ? `issued ${formatDate(d.issuedOn)}` : '',
              d.verifiedByName ? `verified by ${d.verifiedByName}` : '',
            ]
              .filter(Boolean)
              .join(' · ')}
            pill={humanize(d.verifiedStatus)}
            tone={docTone[d.verifiedStatus] ?? 'neutral'}
            meta={d.remarks || undefined}
          />
        ))}
      </Block>
    </View>
  );
}

/* ---------------------------------------- Timeline ---------------------------------------- */

export function TimelinePane({ profile }: PaneProps) {
  const { student, leaveRequests, fees, library } = profile;
  const events = useMemo(() => {
    const out: { at: string; icon: React.ComponentProps<typeof Feather>['name']; title: string; sub: string; tone: Tone }[] = [];
    if (student.admittedOn) {
      out.push({
        at: student.admittedOn,
        icon: 'log-in',
        title: 'Joined the school',
        sub: `Admission ${student.admissionNo}`,
        tone: 'primary',
      });
    }
    if (student.admission?.appliedOn) {
      out.push({
        at: student.admission.appliedOn,
        icon: 'file-text',
        title: 'Admission application submitted',
        sub: student.admission.applicationNo || humanize(student.admission.status),
        tone: 'info',
      });
    }
    leaveRequests.forEach((l) => {
      if (l.fromDate) {
        out.push({
          at: l.fromDate,
          icon: 'calendar',
          title: `${l.typeName} (${l.days} day${l.days > 1 ? 's' : ''})`,
          sub: humanize(l.status),
          tone: 'info',
        });
      }
    });
    fees.payments.forEach((p) => {
      if (p.receivedAt) {
        out.push({
          at: p.receivedAt,
          icon: 'dollar-sign',
          title: `Paid ${money(p.amount)}`,
          sub: `${p.receiptNo} · ${humanize(p.method)}`,
          tone: 'success',
        });
      }
    });
    library.forEach((l) => {
      if (l.issuedOn) {
        out.push({
          at: l.issuedOn,
          icon: 'book',
          title: `Borrowed ${l.bookTitle}`,
          sub: humanize(l.status),
          tone: l.status === 'overdue' ? 'danger' : 'purple',
        });
      }
    });
    return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 40);
  }, [student, leaveRequests, fees.payments, library]);

  return (
    <Block title="Timeline">
      {events.length === 0 ? <Empty text="No timeline events recorded yet." /> : null}
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

export function AchievementsPane(_props: PaneProps) {
  return <EmptyState icon="award" title="No achievements yet" hint="Student achievement records are not available on the server yet." />;
}

/* ---------------------------------------- Discipline ---------------------------------------- */

export function DisciplinePane(_props: PaneProps) {
  return <EmptyState icon="shield" title="No conduct records" hint="Discipline records are not available on the server yet." />;
}

/* --------------------------------------- Communication --------------------------------------- */

export function CommunicationPane(_props: PaneProps) {
  return <EmptyState icon="message-circle" title="No communication log" hint="Communication logs are not available on the server yet." />;
}

/* ------------------------------------------- Notes ------------------------------------------- */

export function NotesPane({ staff }: PaneProps) {
  if (!staff) return <EmptyState icon="lock" title="Staff only" hint="Counsellor and teacher notes are not visible to students or parents." />;
  return <EmptyState icon="edit-3" title="No staff notes yet" hint="Staff notes for students are not available on the server yet." />;
}

/* ----------------------------------------- Audit trail ----------------------------------------- */

export function AuditPane({ staff }: PaneProps) {
  if (!staff) return <EmptyState icon="lock" title="Staff only" hint="The audit trail is not visible to students or parents." />;
  return <EmptyState icon="activity" title="No audit trail yet" hint="Student profile change logs are not available on the server yet." />;
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
