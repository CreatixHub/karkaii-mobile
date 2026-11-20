import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useCollection } from '@/core/store/useCollection';
import { formatDate, formatTime } from '@/core/utils/date';
import { pct } from '@/core/utils/format';
import type { StudentAttendanceRecord } from '@/data/seed/hrm';
import { classSection } from '@/features/common/refs';
import { Card, EmptyState, Pill } from '@/ui/basics';
import { SegmentedTabs, SummaryStrip } from '@/ui/ListChrome';
import { TONES } from '@/ui/tone';
import { KIND_LABEL, KIND_TONE, addMonths, defaultMonth, kindOf, monthGrid, monthLabel, recordsOf, summarise, weekdayShort, type DayKind } from './attendanceHistory';
import { StudentPicker, useSelectedStudent } from './StudentPicker';
import { classTeacherOf } from './studentData';

const WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const FILTERS = [{ key: 'all', label: 'All' }, { key: 'present', label: 'Present' }, { key: 'absent', label: 'Absent' }, { key: 'late', label: 'Late' }, { key: 'leave', label: 'Leave' }];

/** One student's attendance by month: totals, calendar and a day-by-day list. */
export function StudentAttendanceHistory({ breadcrumb }: { breadcrumb: string }) {
  const { student, setId, options, locked } = useSelectedStudent();
  useCollection<StudentAttendanceRecord>('studentAttendance'); // re-render when the register changes
  const [month, setMonth] = useState(defaultMonth());
  const [filter, setFilter] = useState('all');

  const records = useMemo(() => (student ? recordsOf(student.id, month) : []), [student, month]);
  const summary = useMemo(() => summarise(records), [records]);
  const weeks = useMemo(() => monthGrid(month, records), [month, records]);
  const shown = useMemo(() => records.filter((r) => filter === 'all' || kindOf(r.status) === filter || (filter === 'present' && kindOf(r.status) === 'half')), [records, filter]);
  const latest = records[0];

  if (!student) return <EmptyState icon="user-x" title="No student to show" hint="There is no student record linked to this account." />;

  const share = () =>
    Share.share({
      title: `${student.name} — attendance ${monthLabel(month)}`,
      message: [`ATTENDANCE — ${student.name} (${student.admissionNo}) · ${classSection(student)}`, monthLabel(month), `Present ${summary.present} · Late ${summary.late} · Half day ${summary.half} · Absent ${summary.absent} · Leave ${summary.leave}`, `Attendance ${pct(summary.presentPct, 1)} of ${summary.counted} counted days`, '', ...records.map((r) => `${formatDate(r.date)}  ${r.status}${r.checkIn ? `  in ${r.checkIn}` : ''}${r.remark ? `  (${r.remark})` : ''}`)].join('\n'),
    }).catch(() => {});

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400" numberOfLines={1}>{breadcrumb}</Text>
        <StudentPicker student={student} options={options} onChange={setId} locked={locked} />
        <View className="mb-3 flex-row items-center">
          <Pressable onPress={() => setMonth(addMonths(month, -1))} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-50">
            <Feather name="chevron-left" size={18} color="#1b2240" />
          </Pressable>
          <Pressable onPress={() => setMonth(defaultMonth())} className="mx-2 h-10 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white">
            <Text className="text-xs font-bold text-[#1b2240]">{monthLabel(month)}</Text>
          </Pressable>
          <Pressable onPress={() => setMonth(addMonths(month, 1))} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-50">
            <Feather name="chevron-right" size={18} color="#1b2240" />
          </Pressable>
          <Pressable onPress={share} hitSlop={6} className="ml-2 h-10 w-10 items-center justify-center rounded-xl bg-[#E9EDFC] active:opacity-80">
            <Feather name="share-2" size={16} color="#3D5EE1" />
          </Pressable>
        </View>
      </View>

      <SummaryStrip
        items={[
          { label: 'Latest day', value: latest ? latest.status : '—', tone: latest ? KIND_TONE[kindOf(latest.status)] : 'neutral', icon: 'calendar' },
          { label: 'Attended', value: `${summary.attended % 1 ? summary.attended.toFixed(1) : summary.attended} / ${summary.counted}`, tone: 'info', icon: 'check-square' },
          { label: 'Present %', value: pct(summary.presentPct, 1), tone: 'success', icon: 'check-circle' },
          { label: 'Absent %', value: pct(summary.absentPct, 1), tone: 'danger', icon: 'x-circle' },
          { label: 'Late', value: summary.late, tone: 'warning', icon: 'clock' },
          { label: 'Leave', value: summary.leave, tone: 'info', icon: 'calendar' },
        ]}
      />

      <View className="px-4">
        <Card>
          <View className="mb-2 flex-row justify-between">
            {WEEK.map((d, i) => (
              <Text key={i} className="w-[13%] text-center text-[10px] font-bold text-slate-400">{d}</Text>
            ))}
          </View>
          {records.length === 0 ? <Text className="mb-2 text-center text-[11px] text-slate-400">No attendance has been recorded for {monthLabel(month)}.</Text> : null}
          {weeks.map((week, wi) => (
            <View key={wi} className="mb-1.5 flex-row justify-between">
              {week.map((cell, ci) => {
                if (!cell) return <View key={ci} className="h-9 w-[13%]" />;
                const t = cell.kind && cell.kind !== 'none' ? TONES[KIND_TONE[cell.kind]] : null;
                return (
                  <View key={ci} style={t ? { backgroundColor: t.bg, borderColor: t.border } : undefined} className={`h-9 w-[13%] items-center justify-center rounded-lg ${t ? 'border' : ''}`}>
                    <Text style={t ? { color: t.fg } : undefined} className={`text-xs font-bold ${t ? '' : 'text-slate-400'}`}>{cell.day}</Text>
                  </View>
                );
              })}
            </View>
          ))}
          <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
            {(['present', 'absent', 'late', 'half', 'leave'] as DayKind[]).map((k) => (
              <View key={k} className="flex-row items-center">
                <View style={{ backgroundColor: TONES[KIND_TONE[k]].fg }} className="mr-1 h-2 w-2 rounded-full" />
                <Text className="text-[10px] text-slate-500">{KIND_LABEL[k]}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View className="mt-3">
        <SegmentedTabs tabs={FILTERS.map((f) => ({ ...f, count: f.key === 'all' ? records.length : undefined }))} active={filter} onChange={setFilter} />
      </View>

      <View className="gap-2 px-4">
        {shown.length === 0 ? <Text className="py-6 text-center text-xs text-slate-400">No days match this filter.</Text> : null}
        {shown.map((r) => (
          <Card key={r.id}>
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-bold text-[#1b2240]">{weekdayShort(r.date)}, {formatDate(r.date)}</Text>
              <Pill label={r.status} tone={KIND_TONE[kindOf(r.status)]} />
            </View>
            <Text className="mt-1.5 text-[11px] text-slate-500">
              {r.checkIn ? `In ${formatTime(r.checkIn)}` : 'No check-in'}
              {r.checkOut ? ` · Out ${formatTime(r.checkOut)}` : ''}
              {r.lateMinutes ? ` · ${r.lateMinutes} min late` : ''}
              {` · ${classTeacherOf(student)?.name ?? 'Class teacher'}`}
            </Text>
            {r.remark || r.leaveNote ? <Text className="mt-1 text-[11px] text-slate-500">{r.leaveNote || r.remark}</Text> : null}
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}
