import React, { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BREAKS, DAYS, DAY_NAMES, PERIOD_MINUTES, TIME_SLOTS, slotLabel, type Day } from '@/core/schedule/scheduler';
import { snapshot } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { formatDate, formatTime, todayISO } from '@/core/utils/date';
import type { ClassroomRecord, EntryMode, SubjectRecord, TimetableEntryRecord } from '@/data/seed/academic';
import type { SectionRecord, TeacherRecord } from '@/data/seed/master';
import { useAuth } from '@/hooks/useAuth';
import { getStudent, getTeacher, teacherName } from '@/features/common/refs';
import { FormSheet } from '@/features/engine/FormSheet';
import type { FieldDef, FieldErrors, FormValues } from '@/features/engine/types';
import { Button, EmptyState, KeyValue, Pill, ProgressBar } from '@/ui/basics';
import { OptionSheet, type Option } from '@/ui/Fields';
import { SegmentedTabs } from '@/ui/ListChrome';
import { Sheet } from '@/ui/Sheet';
import { useToast } from '@/ui/Toast';
import { TONES, type Tone } from '@/ui/tone';
import { sectionLabel, subjectName } from './helpers';
import {
  addEntry,
  assignRoom,
  checkPlacement,
  generateForSection,
  isClassMode,
  removeEntry,
  roomLabel,
  subjectsForSection,
  substituteTeacher,
  swapOrMove,
  teacherLoad,
  updateEntry,
} from './timetableLogic';

type Mode = 'class' | 'teacher';
type FormKind = { kind: 'add'; day: Day; period: number } | { kind: 'edit'; id: string } | { kind: 'replace'; id: string } | { kind: 'swap'; id: string } | { kind: 'room'; id: string } | { kind: 'generate' };

const TONE_CYCLE: Tone[] = ['primary', 'success', 'warning', 'danger', 'info', 'purple', 'pink', 'teal'];
const MODE_LABEL: Record<EntryMode, string> = { Teaching: 'Lesson', 'Lab Session': 'Lab session', 'Exam Duty': 'Exam duty', 'Staff Meeting': 'Staff meeting' };
const dayOptions: Option[] = DAYS.map((d) => ({ label: DAY_NAMES[d], value: d }));
const periodOptions: Option[] = TIME_SLOTS.map((s) => ({ label: `Period ${s.period}`, value: String(s.period), hint: slotLabel(s.period) }));

function todayDay(): Day {
  const i = new Date().getDay();
  return i >= 1 && i <= 6 ? DAYS[i - 1] : 'Mon';
}

export function TimetableScreen({ mode, breadcrumb }: { mode: Mode; breadcrumb: string }) {
  const { user, role, canManage } = useAuth();
  const toast = useToast();
  const entries = useCollection<TimetableEntryRecord>('timetableEntries');
  const isClassView = mode === 'class';

  /* ---- who/what can be selected, by role ---- */
  const sections = useMemo<SectionRecord[]>(() => {
    const all = snapshot<SectionRecord>('sections');
    if (role === 'student') return all.filter((s) => s.id === getStudent(user?.studentId)?.sectionId);
    if (role === 'parent') return all.filter((s) => (user?.childIds ?? []).some((id) => getStudent(id)?.sectionId === s.id));
    return all;
  }, [role, user]);
  const teachers = snapshot<TeacherRecord>('teachers');

  const defaultSection = (): string => {
    if (sections.length === 1) return sections[0].id;
    if (role === 'teacher') return sections.find((s) => s.classTeacherId === user?.teacherId)?.id ?? 'sec-10-A';
    return sections.find((s) => s.id === 'sec-10-A')?.id ?? sections[0]?.id ?? '';
  };
  const [sel, setSel] = useState<string>(() => (isClassView ? defaultSection() : user?.teacherId ?? teachers[0]?.id ?? ''));
  const [day, setDay] = useState<Day | 'week'>(todayDay());
  const [view, setView] = useState<string>('full');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [entryId, setEntryId] = useState<string | null>(null);
  const [form, setForm] = useState<FormKind | null>(null);

  const mine = useMemo(() => entries.filter((e) => (isClassView ? e.sectionId === sel : e.teacherId === sel)), [entries, sel, isClassView]);
  const subjects = snapshot<SubjectRecord>('subjects');
  const toneOf = (subjectId: string): Tone => TONE_CYCLE[Math.max(0, subjects.findIndex((s) => s.id === subjectId)) % TONE_CYCLE.length];
  const cell = (d: Day, p: number) => mine.filter((e) => e.day === d && e.period === p);
  const entry = entryId ? entries.find((e) => e.id === entryId) : undefined;
  const section = isClassView ? snapshot<SectionRecord>('sections').find((s) => s.id === sel) : undefined;
  const teacher = !isClassView ? getTeacher(sel) : undefined;

  const demand = isClassView ? subjectsForSection(sel).reduce((n, x) => n + x.mapping.periodsPerWeek, 0) : 0;
  const scheduled = mine.filter((e) => isClassMode(e.mode)).length;
  const load = !isClassView ? teacherLoad(sel) : null;

  const pickerOptions: Option[] = isClassView
    ? sections.map((s) => ({ label: sectionLabel(s.id), value: s.id, hint: `Class teacher: ${teacherName(s.classTeacherId)}` }))
    : teachers.map((t) => ({ label: t.name, value: t.id, hint: `${t.department} · ${t.employeeId}` }));

  /* ---- form plumbing ---- */
  const teacherOpts: Option[] = teachers.map((t) => ({ label: t.name, value: t.id, hint: t.department }));
  const roomOpts: Option[] = snapshot<ClassroomRecord>('classrooms').filter((r) => r.status !== 'Inactive').map((r) => ({ label: r.type === 'Classroom' ? `Room ${r.roomNo}` : r.name, value: r.roomNo, hint: r.type }));

  const sectionIdOf = (vals: FormValues) => (isClassView ? sel : vals.sectionId ?? '');
  const teacherIdOf = (vals: FormValues) => (isClassView ? vals.teacherId : sel);

  const baseFields = (): FieldDef[] => {
    const f: FieldDef[] = [];
    if (!isClassView) {
      f.push({ key: 'mode', label: 'Type', type: 'select', required: true, options: ['Teaching', 'Lab Session', 'Exam Duty', 'Staff Meeting'], default: 'Teaching' });
      f.push({ key: 'sectionId', label: 'Class & Section', type: 'select', required: true, hidden: (v) => v.mode === 'Staff Meeting', optionsFrom: { collection: 'sections', label: (s: SectionRecord) => sectionLabel(s.id) }, onChange: () => ({ subjectId: '' }) });
    }
    f.push({
      key: 'subjectId',
      label: 'Subject',
      type: 'select',
      required: true,
      hidden: (v) => !isClassView && (v.mode === 'Exam Duty' || v.mode === 'Staff Meeting'),
      optionsFrom: {
        collection: 'subjects',
        label: (s: SubjectRecord) => s.name,
        hint: (s: SubjectRecord) => s.code,
        filter: (s: SubjectRecord, vals) => !vals.sectionId && !isClassView ? true : subjectsForSection(sectionIdOf(vals)).some((x) => x.subject.id === s.id),
      },
      onChange: (id, vals) => {
        const m = subjectsForSection(sectionIdOf(vals)).find((x) => x.subject.id === id);
        return m ? { ...(isClassView ? { teacherId: m.mapping.teacherId } : {}), mode: m.subject.department === 'Computer Science' ? 'Lab Session' : 'Teaching' } : undefined;
      },
    });
    if (isClassView) f.push({ key: 'teacherId', label: 'Teacher', type: 'select', required: true, options: teacherOpts });
    f.push({ key: 'day', label: 'Day', type: 'select', required: true, options: dayOptions });
    f.push({ key: 'period', label: 'Period', type: 'select', required: true, options: periodOptions, hint: `Each period is ${PERIOD_MINUTES} minutes.` });
    f.push({ key: 'room', label: 'Room', type: 'select', required: true, options: roomOpts });
    if (isClassView) f.push({ key: 'mode', label: 'Type', type: 'select', required: true, options: ['Teaching', 'Lab Session'], default: 'Teaching' });
    f.push({ key: 'note', label: 'Note', type: 'text' });
    return f;
  };

  const candidateOf = (v: FormValues) => ({
    sectionId: v.mode === 'Staff Meeting' ? '' : sectionIdOf(v),
    day: v.day as Day,
    period: Number(v.period),
    teacherId: teacherIdOf(v) as string,
    room: v.room as string,
    mode: v.mode as EntryMode,
  });

  const validateEntry = (v: FormValues, ignoreId?: string): FieldErrors => {
    const err = checkPlacement(candidateOf(v), ignoreId ? [ignoreId] : []);
    return err ? { period: err } : {};
  };

  const formConfig = (): { title: string; fields: FieldDef[]; initial: FormValues; submitLabel: string; validate?: (v: FormValues) => FieldErrors; submit: (v: FormValues) => void } | null => {
    if (!form) return null;
    const done = (msg: string) => { setForm(null); setEntryId(null); toast(msg); };
    const fail = (msg: string | null, ok: string) => { if (msg) toast(msg, 'error'); else done(ok); };

    if (form.kind === 'add') {
      const homeRoom = section?.roomNo ?? '';
      return {
        title: 'Add period',
        fields: baseFields(),
        initial: { day: form.day, period: String(form.period), room: homeRoom, mode: 'Teaching' },
        submitLabel: 'Add period',
        validate: (v) => validateEntry(v),
        submit: (v) => {
          addEntry({ ...candidateOf(v), subjectId: v.subjectId ?? '', note: v.note, effectiveFrom: todayISO() });
          done('Period added');
        },
      };
    }
    const e = entries.find((x) => x.id === (form as { id: string }).id);
    if (!e) return null;
    if (form.kind === 'edit') {
      return {
        title: 'Edit period',
        fields: baseFields(),
        initial: { subjectId: e.subjectId, teacherId: e.teacherId, day: e.day, period: String(e.period), room: e.room, mode: e.mode, sectionId: e.sectionId, note: e.note },
        submitLabel: 'Save',
        validate: (v) => validateEntry(v, e.id),
        submit: (v) => fail(updateEntry(e.id, { ...candidateOf(v), subjectId: v.subjectId ?? '', note: v.note }), 'Period updated'),
      };
    }
    if (form.kind === 'replace') {
      return {
        title: 'Replace teacher',
        fields: [
          { key: 'current', label: 'Current Teacher', type: 'select', options: teacherOpts, readOnly: () => true },
          { key: 'replaceWith', label: 'Replace With', type: 'select', required: true, options: teacherOpts.filter((t) => t.value !== e.teacherId) },
          { key: 'reason', label: 'Reason', type: 'textarea', required: true },
        ],
        initial: { current: e.teacherId },
        submitLabel: 'Replace',
        validate: (v) => {
          const err = checkPlacement({ sectionId: e.sectionId, day: e.day, period: e.period, teacherId: v.replaceWith, room: e.room, mode: e.mode }, [e.id]);
          return err && v.replaceWith ? { replaceWith: err } : {};
        },
        submit: (v) => fail(substituteTeacher(e.id, v.replaceWith, v.reason), `${teacherName(v.replaceWith)} will take this period`),
      };
    }
    if (form.kind === 'swap') {
      return {
        title: 'Swap period',
        fields: [
          { key: 'day', label: 'Swap With Day', type: 'select', required: true, options: dayOptions },
          { key: 'period', label: 'Swap With Period', type: 'select', required: true, options: periodOptions },
        ],
        initial: { day: e.day, period: String(e.period) },
        submitLabel: 'Swap',
        submit: (v) => fail(swapOrMove(e.id, v.day as Day, Number(v.period)), 'Schedule updated'),
      };
    }
    if (form.kind === 'room') {
      return {
        title: 'Assign classroom',
        fields: [{ key: 'room', label: 'Classroom', type: 'select', required: true, options: roomOpts }],
        initial: { room: e.room },
        submitLabel: 'Assign',
        submit: (v) => fail(assignRoom(e.id, v.room), `Moved to ${roomLabel(v.room)}`),
      };
    }
    return null;
  };

  const generateConfig = () => ({
    title: 'Generate timetable',
    fields: [
      { key: 'days', label: 'Week', type: 'select', required: true, options: ['Mon–Sat', 'Mon–Fri'], default: 'Mon–Sat', hint: `Seven ${PERIOD_MINUTES}-minute periods a day.` },
      { key: 'effectiveFrom', label: 'Starts from', type: 'date', required: true },
      { key: 'avoidClashes', label: 'Avoid teacher clashes across sections', type: 'switch', default: true },
    ] as FieldDef[],
    initial: { effectiveFrom: todayISO() } as FormValues,
  });

  const runGenerate = (v: FormValues) => {
    const go = () => {
      const days = v.days === 'Mon–Fri' ? DAYS.slice(0, 5) : DAYS;
      const res = generateForSection(sel, { days, effectiveFrom: v.effectiveFrom, avoidClashes: v.avoidClashes !== false });
      const missing = res.unplaced.reduce((n, u) => n + u.missing, 0);
      setForm(null);
      toast(missing ? `${res.placed} periods placed; ${missing} could not be fitted: ${res.unplaced.map((u) => subjectName(u.subjectId)).join(', ')}.` : `${res.placed} periods scheduled for ${sectionLabel(sel)}`, missing ? 'info' : 'success');
    };
    if (scheduled > 0) Alert.alert('Replace current timetable?', `${sectionLabel(sel)} already has ${scheduled} scheduled periods. Generating will replace them.`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Replace', style: 'destructive', onPress: go }]);
    else go();
  };

  const confirmDelete = (id: string) =>
    Alert.alert('Remove this period?', 'It will be taken off the timetable.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { removeEntry(id); setEntryId(null); toast('Period removed'); } },
    ]);

  /* ---- rendering pieces ---- */
  const entryTitle = (e: TimetableEntryRecord) => (e.mode === 'Staff Meeting' ? 'Staff meeting' : e.mode === 'Exam Duty' ? 'Exam invigilation' : subjectName(e.subjectId));
  const entryLine2 = (e: TimetableEntryRecord) => (isClassView ? teacherName(e.teacherId) : e.sectionId ? sectionLabel(e.sectionId) : e.note || 'All staff');
  const entryTone = (e: TimetableEntryRecord): Tone => (e.mode === 'Exam Duty' ? 'danger' : e.mode === 'Staff Meeting' ? 'neutral' : toneOf(e.subjectId));

  const periodCard = (d: Day, p: number) => {
    const here = cell(d, p);
    const first = here[0];
    if (!first) {
      const addable = canManage && (isClassView ? !!sel : !!sel);
      return (
        <Pressable disabled={!addable} onPress={() => setForm({ kind: 'add', day: d, period: p })} className="mx-4 mb-2 flex-row items-center rounded-2xl border border-dashed border-slate-200 dark:border-[#322D46] bg-white/60 px-3.5 py-3">
          <View className="w-[88px]">
            <Text className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#8b879b]">Period {p}</Text>
            <Text className="text-[11px] text-slate-400 dark:text-[#8b879b]">{slotLabel(p).replace(' – ', '–')}</Text>
          </View>
          <Text className="flex-1 text-xs text-slate-400 dark:text-[#8b879b]">{isClassView ? 'No class scheduled' : 'Free period'}</Text>
          {addable ? <Feather name="plus-circle" size={16} color="#94a3b8" /> : null}
        </Pressable>
      );
    }
    const tone = entryTone(first);
    return (
      <Pressable onPress={() => setEntryId(first.id)} className="mx-4 mb-2 flex-row overflow-hidden rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] active:opacity-90">
        <View style={{ backgroundColor: TONES[tone].fg }} className="w-1.5" />
        <View className="w-[88px] justify-center px-3 py-3">
          <Text className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#8b879b]">Period {p}</Text>
          <Text className="text-[11px] font-semibold text-slate-600 dark:text-[#B9B7C0]">{slotLabel(p).replace(' – ', '–')}</Text>
        </View>
        <View className="flex-1 py-2.5 pr-3">
          <View className="flex-row items-center justify-between">
            <Text style={{ color: TONES[tone].fg }} className="flex-1 pr-2 text-sm font-extrabold" numberOfLines={1}>{entryTitle(first)}</Text>
            {here.length > 1 ? <Text className="text-[10px] font-bold text-slate-400 dark:text-[#8b879b]">+{here.length - 1} more</Text> : null}
          </View>
          <Text className="text-xs text-slate-600 dark:text-[#B9B7C0]" numberOfLines={1}>{entryLine2(first)}</Text>
          <View className="mt-1.5 flex-row flex-wrap items-center gap-1.5">
            <Text className="text-[11px] text-slate-400 dark:text-[#8b879b]">{roomLabel(first.room)}</Text>
            {first.mode !== 'Teaching' ? <Pill label={MODE_LABEL[first.mode]} tone={first.mode === 'Lab Session' ? 'info' : first.mode === 'Exam Duty' ? 'danger' : 'neutral'} /> : null}
            {first.originalTeacherId ? <Pill label={`Sub for ${teacherName(first.originalTeacherId).split(' ')[0]}`} tone="warning" /> : null}
          </View>
        </View>
      </Pressable>
    );
  };

  const breakRow = (label: string, start: string, end: string) => (
    <View className="mx-4 mb-2 flex-row items-center justify-center rounded-xl bg-amber-50 dark:bg-[#2e2616] py-1.5">
      <Feather name="coffee" size={11} color="#B45309" />
      <Text className="ml-1.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
        {label} · {formatTime(start)} – {formatTime(end)}
      </Text>
    </View>
  );

  const dayList = (d: Day) => (
    <View>
      {TIME_SLOTS.map((s) => {
        const br = BREAKS.find((b) => b.afterPeriod === s.period);
        return (
          <View key={s.period}>
            {periodCard(d, s.period)}
            {br ? breakRow(br.label, br.start, br.end) : null}
          </View>
        );
      })}
    </View>
  );

  const weekGrid = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
      <View>
        <View className="flex-row">
          <View className="w-10" />
          {DAYS.map((d) => (
            <Text key={d} className="w-[58px] pb-1 text-center text-[11px] font-extrabold text-slate-500 dark:text-[#a29fb0]">{d}</Text>
          ))}
        </View>
        {TIME_SLOTS.map((s) => (
          <View key={s.period} className="mb-1.5 flex-row">
            <View className="w-10 justify-center">
              <Text className="text-[10px] font-bold text-slate-400 dark:text-[#8b879b]">P{s.period}</Text>
            </View>
            {DAYS.map((d) => {
              const e = cell(d, s.period)[0];
              const tone = e ? entryTone(e) : 'neutral';
              return (
                <Pressable
                  key={d}
                  onPress={() => (e ? setEntryId(e.id) : canManage ? setForm({ kind: 'add', day: d, period: s.period }) : undefined)}
                  style={e ? { backgroundColor: TONES[tone].bg, borderColor: TONES[tone].border } : undefined}
                  className={`mr-1 h-12 w-[54px] items-center justify-center rounded-lg border px-0.5 ${e ? '' : 'border-dashed border-slate-200 dark:border-[#322D46] bg-white/60'}`}
                >
                  {e ? (
                    <>
                      <Text style={{ color: TONES[tone].fg }} className="text-[10px] font-extrabold" numberOfLines={1}>{(e.mode === 'Staff Meeting' ? 'Meet' : e.mode === 'Exam Duty' ? 'Exam' : subjectName(e.subjectId)).slice(0, 7)}</Text>
                      <Text className="text-[9px] text-slate-500 dark:text-[#a29fb0]" numberOfLines={1}>{isClassView ? teacherName(e.teacherId).split(' ')[0] : e.sectionId ? sectionLabel(e.sectionId).replace('Grade ', '') : ''}</Text>
                    </>
                  ) : (
                    <Text className="text-[#202C4B] dark:text-[#EFEFF2] text-[10px] text-slate-300">—</Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const grouped = (by: 'teacher' | 'room') => {
    const groups = new Map<string, TimetableEntryRecord[]>();
    for (const e of mine) {
      const k = by === 'teacher' ? e.teacherId : e.room;
      groups.set(k, [...(groups.get(k) ?? []), e]);
    }
    const list = [...groups.entries()].sort((a, b) => b[1].length - a[1].length);
    if (!list.length) return <EmptyState icon="calendar" title="Nothing scheduled" />;
    return (
      <View>
        {list.map(([k, es]) => (
          <View key={k} className="mx-4 mb-3 rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3.5">
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="flex-1 text-sm font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{by === 'teacher' ? teacherName(k) : roomLabel(k)}</Text>
              <Pill label={`${es.length} periods`} tone="primary" />
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              {[...es].sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period).map((e) => (
                <Pressable key={e.id} onPress={() => setEntryId(e.id)} style={{ backgroundColor: TONES[entryTone(e)].bg }} className="rounded-lg px-2 py-1">
                  <Text style={{ color: TONES[entryTone(e)].fg }} className="text-[10px] font-bold">{e.day} P{e.period} · {by === 'teacher' ? subjectName(e.subjectId) : sectionLabel(e.sectionId)}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  const freePeriods = () => (
    <View>
      {DAYS.map((d) => {
        const free = TIME_SLOTS.filter((s) => !cell(d, s.period).length);
        return (
          <View key={d} className="mx-4 mb-2.5 rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3.5">
            <View className="mb-1.5 flex-row items-center justify-between">
              <Text className="text-sm font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{DAY_NAMES[d]}</Text>
              <Pill label={`${free.length} free`} tone={free.length ? 'success' : 'neutral'} />
            </View>
            <View className="flex-row flex-wrap gap-1.5">
              {free.length ? free.map((s) => (
                <Pressable key={s.period} disabled={!canManage} onPress={() => setForm({ kind: 'add', day: d, period: s.period })} className="rounded-lg bg-emerald-50 dark:bg-[#14291f] px-2 py-1">
                  <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">P{s.period} · {slotLabel(s.period).split(' – ')[0]}</Text>
                </Pressable>
              )) : <Text className="text-xs text-slate-400 dark:text-[#8b879b]">Fully booked</Text>}
            </View>
          </View>
        );
      })}
    </View>
  );

  const specialDuties = () => {
    const list = mine.filter((e) => e.mode === 'Exam Duty' || e.mode === 'Staff Meeting').sort((a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.period - b.period);
    if (!list.length) return <EmptyState icon="shield" title="No exam duties or meetings" hint="Invigilation and staff meetings assigned to this teacher appear here." />;
    return <View>{list.map((e) => (<Pressable key={e.id} onPress={() => setEntryId(e.id)} className="mx-4 mb-2 flex-row items-center rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3.5"><Feather name={e.mode === 'Exam Duty' ? 'shield' : 'users'} size={18} color={TONES[entryTone(e)].fg} /><View className="ml-3 flex-1"><Text className="text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{entryTitle(e)}</Text><Text className="text-xs text-slate-500 dark:text-[#a29fb0]">{DAY_NAMES[e.day]} · {slotLabel(e.period)} · {roomLabel(e.room)}</Text>{e.note ? <Text className="text-[11px] text-slate-400 dark:text-[#8b879b]">{e.note}</Text> : null}</View></Pressable>))}</View>;
  };

  const cfg = formConfig();
  const viewTabs = isClassView
    ? [{ key: 'full', label: 'Full Week' }, { key: 'teacher', label: 'By Teacher' }, { key: 'room', label: 'By Room' }]
    : [{ key: 'full', label: 'Full Week' }, { key: 'free', label: 'Free Periods Only' }, { key: 'exam', label: 'Exam Duties' }];
  const showDays = view === 'full';

  if (!sel) return <EmptyState icon="calendar" title="No timetable available" hint={isClassView ? 'There is no class for your account.' : 'Pick a teacher.'} />;

  return (
    <View className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View className="px-4 pb-2 pt-3">
          <Text className="mb-2 text-[11px] text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>{breadcrumb}</Text>
          <Pressable onPress={() => setPickerOpen(true)} disabled={pickerOptions.length < 2} className="flex-row items-center rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#E9EDFC] dark:bg-[#1d2450]">
              <Feather name={isClassView ? 'columns' : 'user'} size={18} color="#3D5EE1" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] font-bold uppercase text-slate-400 dark:text-[#8b879b]">{isClassView ? 'Class & section' : 'Teacher'}</Text>
              <Text className="text-base font-extrabold text-[#1b2240] dark:text-[#EFEFF2]" numberOfLines={1}>{isClassView ? sectionLabel(sel) : teacher?.name}</Text>
              <Text className="text-xs text-slate-500 dark:text-[#a29fb0]" numberOfLines={1}>
                {isClassView ? `Class teacher: ${teacherName(section?.classTeacherId)} · Room ${section?.roomNo}` : `${teacher?.department} · ${teacher?.designation} · ${teacher?.status}`}
              </Text>
            </View>
            {pickerOptions.length > 1 ? <Feather name="chevron-down" size={18} color="#94a3b8" /> : null}
          </Pressable>

          {isClassView ? (
            <View className="mt-3 rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3.5">
              <View className="mb-1.5 flex-row justify-between">
                <Text className="text-xs font-semibold text-slate-600 dark:text-[#B9B7C0]">Periods scheduled</Text>
                <Text className="text-xs font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{scheduled} / {demand}</Text>
              </View>
              <ProgressBar value={scheduled} max={Math.max(1, demand)} tone={scheduled >= demand ? 'success' : scheduled ? 'warning' : 'danger'} />
              {scheduled === 0 ? <Text className="mt-2 text-xs text-slate-400 dark:text-[#8b879b]">No timetable yet.{canManage ? ' Tap Generate to build one from the class’s subjects.' : ''}</Text> : null}
            </View>
          ) : (
            <View className="mt-3 flex-row gap-2">
              {[
                { label: 'Weekly teaching', value: `${Math.round(((load?.teachingPeriods ?? 0) * PERIOD_MINUTES) / 6) / 10} hrs`, tone: 'primary' as Tone, icon: 'clock' as const },
                { label: 'Available', value: `${Math.round(((load?.freePeriods ?? 0) * PERIOD_MINUTES) / 6) / 10} hrs`, tone: 'success' as Tone, icon: 'coffee' as const },
                { label: 'Classes', value: String(load?.classes ?? 0), tone: 'info' as Tone, icon: 'users' as const },
              ].map((s) => (
                <View key={s.label} className="flex-1 rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3">
                  <Feather name={s.icon} size={14} color={TONES[s.tone].fg} />
                  <Text style={{ color: TONES[s.tone].fg }} className="mt-1 text-base font-extrabold">{s.value}</Text>
                  <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          {canManage ? (
            <View className="mt-3 flex-row gap-2">
              <Button label="Add period" icon="plus" small onPress={() => setForm({ kind: 'add', day: day === 'week' ? todayDay() : day, period: 1 })} />
              {isClassView ? <Button label="Generate" icon="zap" small variant="secondary" onPress={() => setForm({ kind: 'generate' })} /> : null}
            </View>
          ) : null}
        </View>

        <SegmentedTabs tabs={viewTabs} active={view} onChange={setView} />

        {showDays ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-3">
            {([...DAYS, 'week'] as const).map((d) => {
              const on = day === d;
              const count = d === 'week' ? mine.length : mine.filter((e) => e.day === d).length;
              return (
                <Pressable key={d} onPress={() => setDay(d)} className={`items-center rounded-2xl border px-3.5 py-2 ${on ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022]'}`}>
                  <Text className={`text-xs font-extrabold ${on ? 'text-white' : 'text-slate-700 dark:text-[#d6d4de]'}`}>{d === 'week' ? 'Week' : d}</Text>
                  <Text className={`text-[10px] ${on ? 'text-white/80' : 'text-slate-400 dark:text-[#8b879b]'}`}>{count} {count === 1 ? 'period' : 'periods'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}

        {view === 'full' ? (day === 'week' ? weekGrid() : dayList(day)) : null}
        {view === 'teacher' ? grouped('teacher') : null}
        {view === 'room' ? grouped('room') : null}
        {view === 'free' ? freePeriods() : null}
        {view === 'exam' ? specialDuties() : null}

        {!canManage ? <Text className="mt-2 px-6 text-center text-[11px] text-slate-400 dark:text-[#8b879b]">View-only access for your role.</Text> : null}
      </ScrollView>

      <OptionSheet visible={pickerOpen} title={isClassView ? 'Choose class & section' : 'Choose teacher'} options={pickerOptions} selected={[sel]} onClose={() => setPickerOpen(false)} onPick={(v) => { setSel(v); setPickerOpen(false); }} />

      {/* Period detail */}
      <Sheet visible={!!entry && !form} title={entry ? entryTitle(entry) : ''} onClose={() => setEntryId(null)} tall>
        {entry ? (
          <View>
            <View className="mb-3 flex-row flex-wrap gap-1.5">
              <Pill label={MODE_LABEL[entry.mode]} tone={entry.mode === 'Teaching' ? 'primary' : entry.mode === 'Lab Session' ? 'info' : entry.mode === 'Exam Duty' ? 'danger' : 'neutral'} />
              <Pill label={entry.format} tone="neutral" />
              {entry.originalTeacherId ? <Pill label={`Substitute for ${teacherName(entry.originalTeacherId)}`} tone="warning" /> : null}
            </View>
            {entry.mode !== 'Staff Meeting' && entry.mode !== 'Exam Duty' ? <KeyValue label="Subject" value={subjectName(entry.subjectId)} /> : null}
            {entry.sectionId ? <KeyValue label="Class" value={sectionLabel(entry.sectionId)} /> : null}
            <KeyValue label="Teacher" value={teacherName(entry.teacherId)} />
            <KeyValue label="Day" value={DAY_NAMES[entry.day]} />
            <KeyValue label="Time" value={`Period ${entry.period} · ${slotLabel(entry.period)}`} />
            <KeyValue label="Duration" value={`${PERIOD_MINUTES} min`} />
            <KeyValue label="Room" value={roomLabel(entry.room)} />
            <KeyValue label="Effective from" value={formatDate(entry.effectiveFrom)} />
            <KeyValue label="Note" value={entry.note} />
            {canManage ? (
              <View className="mt-4 gap-2.5 pb-2">
                <Button label="Edit period" icon="edit-2" onPress={() => setForm({ kind: 'edit', id: entry.id })} />
                <Button label="Replace teacher" icon="user" variant="secondary" onPress={() => setForm({ kind: 'replace', id: entry.id })} />
                {isClassMode(entry.mode) ? <Button label="Swap schedule" icon="repeat" variant="secondary" onPress={() => setForm({ kind: 'swap', id: entry.id })} /> : null}
                {isClassMode(entry.mode) ? <Button label="Assign classroom" icon="home" variant="secondary" onPress={() => setForm({ kind: 'room', id: entry.id })} /> : null}
                <Button label="Remove period" icon="trash-2" variant="danger" onPress={() => confirmDelete(entry.id)} />
              </View>
            ) : null}
          </View>
        ) : null}
      </Sheet>

      {cfg ? <FormSheet visible title={cfg.title} fields={cfg.fields} initial={cfg.initial} submitLabel={cfg.submitLabel} validate={cfg.validate} isEdit={form?.kind === 'edit'} onSubmit={cfg.submit} onClose={() => setForm(null)} /> : null}
      {form?.kind === 'generate' ? (() => { const g = generateConfig(); return <FormSheet visible title={g.title} fields={g.fields} initial={g.initial} submitLabel="Generate" onSubmit={runGenerate} onClose={() => setForm(null)} />; })() : null}
    </View>
  );
}
