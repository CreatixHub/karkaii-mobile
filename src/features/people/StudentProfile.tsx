import React, { useMemo, useState } from 'react';
import { Linking, ScrollView, Share, Text, View } from 'react-native';
import { useCollection } from '@/core/store/useCollection';
import type { StudentRecord } from '@/data/seed/master';
import type { UserRecord } from '@/data/seed/peopleAdmin';
import { classSection } from '@/features/common/refs';
import { attendancePct } from '@/features/hrm/configs';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, EmptyState, Pill } from '@/ui/basics';
import { SegmentedTabs, SummaryStrip } from '@/ui/ListChrome';
import type { Tone } from '@/ui/tone';
import { StudentPicker, useSelectedStudent } from './StudentPicker';
import { PANES, PROFILE_TABS, type TabKey } from './StudentProfileTabs';
import { academicPercent, performanceIndex, profileText } from './studentData';

const statusTone: Record<string, Tone> = { Active: 'success', 'On Leave': 'warning', Inactive: 'neutral', Transfer: 'info', Graduated: 'purple', Suspended: 'danger' };

/** How much of the student's profile is filled in (shown on the hero card). */
export const completionOf = (s: StudentRecord): number => {
  const fields = [s.phone, s.email, s.address, s.bloodGroup, s.religion, s.nationality, s.motherName, s.emergencyPhone, s.parentPhone, s.dob];
  return Math.round((fields.filter((f) => !!String(f ?? '').trim()).length / fields.length) * 100);
};

export function StudentProfile({ breadcrumb }: { breadcrumb: string }) {
  const { student, setId, options, locked } = useSelectedStudent();
  const { canManage, role } = useAuth();
  const users = useCollection<UserRecord>('users');
  const [tab, setTab] = useState<TabKey>('overview');
  const staff = canManage && role !== 'student' && role !== 'parent';
  const tabs = useMemo(() => PROFILE_TABS.filter((t) => staff || !t.staffOnly), [staff]);

  if (!student) return <EmptyState icon="user-x" title="No student to show" hint="There is no student record linked to this account." />;

  const Pane = PANES[tab];
  const portal = users.find((u) => u.linkedType === 'parent' && u.linkedId === student.id);
  const att = attendancePct(student.id);
  const share = () => Share.share({ title: `${student.name} — profile`, message: profileText(student) }).catch(() => {});

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>{breadcrumb}</Text>
        <StudentPicker student={student} options={options} onChange={(id) => { setId(id); setTab('overview'); }} locked={locked} />
        <Card>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{student.name}</Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-[#a29fb0]">{student.admissionNo} · Roll {student.rollNo} · {classSection(student)}</Text>
            </View>
            <Pill label={student.status} tone={statusTone[student.status]} />
          </View>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            <Pill label={`${student.house} House`} tone="neutral" icon="home" />
            <Pill label={`Blood ${student.bloodGroup}`} tone="danger" icon="droplet" />
            {student.scholar ? <Pill label="Scholarship" tone="warning" icon="award" /> : null}
            {student.transport ? <Pill label="Transport" tone="info" icon="truck" /> : null}
            {student.hostel ? <Pill label="Hostel" tone="purple" icon="home" /> : null}
            {portal ? <Pill label="Parent portal" tone="teal" icon="users" /> : null}
          </View>
          <Text className="mb-1 mt-3 text-[10px] font-semibold uppercase text-slate-400 dark:text-[#8b879b]">Profile completeness · {completionOf(student)}%</Text>
          <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1B1632]">
            <View style={{ width: `${completionOf(student)}%` }} className="h-full rounded-full bg-[#3D5EE1]" />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Button small variant="secondary" icon="phone" label="Call guardian" onPress={() => Linking.openURL(`tel:${student.parentPhone.replace(/[^\d+]/g, '')}`).catch(() => {})} style={{ flex: 1 }} />
            <Button small variant="secondary" icon="share-2" label="Share profile" onPress={share} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>

      <View className="mt-3">
        <SummaryStrip items={[{ label: 'Attendance', value: `${Math.round(att)}%`, tone: att < 75 ? 'danger' : 'success', icon: 'check-square' }, { label: 'Academic', value: (Math.round(academicPercent(student.id)) / 10).toFixed(1), tone: 'primary', icon: 'award' }, { label: 'Perf. index', value: performanceIndex(student.id), tone: 'purple', icon: 'bar-chart-2' }]} />
        <SegmentedTabs tabs={tabs.map((t) => ({ key: t.key, label: t.label }))} active={tab} onChange={(k) => setTab(k as TabKey)} />
      </View>

      <View className="px-4">
        <Pane student={student} staff={staff} />
      </View>
    </ScrollView>
  );
}
