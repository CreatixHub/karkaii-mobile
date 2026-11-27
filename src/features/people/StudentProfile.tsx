import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, Share, Text, View } from 'react-native';
import { formatDate } from '@/core/utils/date';
import { useAuth } from '@/hooks/useAuth';
import { computeAgeYears, type StudentProfileBundle } from '@/services/api/studentProfileApi';
import { Button, Card, EmptyState, Pill } from '@/ui/basics';
import { SegmentedTabs, SummaryStrip } from '@/ui/ListChrome';
import { useToast } from '@/ui/Toast';
import type { Tone } from '@/ui/tone';
import { StudentPicker } from './StudentPicker';
import { PANES, PROFILE_TABS, type TabKey } from './StudentProfileTabs';
import { useStudentProfile } from './useStudentProfile';

const statusTone: Record<string, Tone> = {
  Active: 'success',
  'On Leave': 'warning',
  Inactive: 'neutral',
  Transferred: 'info',
  Graduated: 'purple',
  Expelled: 'danger',
};

function buildShareText(profile: StudentProfileBundle): string {
  const { student, attendanceSummary, fees } = profile;
  const age = student.ageYears ?? computeAgeYears(student.dob);
  return [
    'KARKAII INTERNATIONAL SCHOOL — STUDENT PROFILE',
    '================================================',
    `Name: ${student.name}`,
    `Admission No: ${student.admissionNo}${student.rollNo ? `   Roll No: ${student.rollNo}` : ''}`,
    `Class: ${student.classLabel || '—'}${student.houseName ? `   House: ${student.houseName}` : ''}`,
    `DOB: ${formatDate(student.dob)}${age !== null ? ` (${age} yrs)` : ''}${student.bloodGroup ? `   Blood group: ${student.bloodGroup}` : ''}`,
    `Guardian: ${student.primaryGuardianName || '—'}${student.primaryGuardianPhone ? ` (${student.primaryGuardianPhone})` : ''}`,
    `Attendance: ${attendanceSummary.percent !== null ? `${Math.round(attendanceSummary.percent)}%` : '—'}`,
    `Fees: ${fees.available ? `${fees.status}${fees.balance > 0 ? ` ($${Math.round(fees.balance).toLocaleString('en-US')} outstanding)` : ''}` : '—'}`,
  ].join('\n');
}

export function StudentProfile({ breadcrumb }: { breadcrumb: string }) {
  const { canManage, role, isAuthenticated, user } = useAuth();
  const toast = useToast();
  const { profile, options, selectedId, setSelectedId, locked, isLoading, error, emptyReason, reload } = useStudentProfile(
    role,
    isAuthenticated,
    user?.id,
  );
  const [tab, setTab] = useState<TabKey>('overview');
  const staff = canManage && role !== 'student' && role !== 'parent';
  const tabs = useMemo(() => PROFILE_TABS.filter((t) => staff || !t.staffOnly), [staff]);

  if (isLoading && !profile) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f6fb] dark:bg-[#0F0C1C] px-6">
        <ActivityIndicator size="large" color="#3D5EE1" />
        <Text className="mt-3 text-xs font-medium text-slate-500 dark:text-[#a29fb0]">Loading student profile…</Text>
      </View>
    );
  }

  if (error && !profile) {
    return (
      <View className="flex-1 justify-center bg-[#f4f6fb] dark:bg-[#0F0C1C] px-4">
        <EmptyState icon="alert-circle" title="Could not load student profile" hint={error} />
        <View className="mt-2 items-center">
          <Button label="Retry" icon="refresh-cw" onPress={reload} />
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
        <EmptyState
          icon="user-x"
          title="No student to show"
          hint={emptyReason || 'There is no student record linked to this account.'}
        />
      </View>
    );
  }

  const { student, attendanceSummary, fees, transport, homework } = profile;
  const activeTab = tabs.some((t) => t.key === tab) ? tab : 'overview';
  const Pane = PANES[activeTab];
  const attPct = attendanceSummary.percent;
  const submittedHw = homework.filter((h) => h.subStatus !== 'not_submitted').length;
  const subtitle = [
    student.admissionNo,
    student.rollNo ? `Roll ${student.rollNo}` : '',
    student.classLabel,
  ]
    .filter(Boolean)
    .join(' · ');

  const callGuardian = () => {
    const phone = student.primaryGuardianPhone.replace(/[^\d+]/g, '');
    if (!phone) {
      toast('No guardian phone number on file.', 'info');
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => toast('Could not open the dialler', 'error'));
  };

  const share = () => Share.share({ title: `${student.name} — profile`, message: buildShareText(profile) }).catch(() => {});

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>{breadcrumb}</Text>
        <StudentPicker
          value={selectedId}
          options={options}
          onChange={(id) => {
            setSelectedId(id);
            setTab('overview');
          }}
          locked={locked}
        />
        <Card>
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-2">
              <Text className="text-lg font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{student.name}</Text>
              <Text className="mt-0.5 text-xs text-slate-500 dark:text-[#a29fb0]">{subtitle || 'Student record'}</Text>
            </View>
            <Pill label={student.statusLabel} tone={statusTone[student.statusLabel] ?? 'neutral'} />
          </View>
          <View className="mt-2 flex-row flex-wrap gap-1.5">
            {student.houseName ? <Pill label={`${student.houseName} House`} tone="neutral" icon="home" /> : null}
            {student.bloodGroup ? <Pill label={`Blood ${student.bloodGroup}`} tone="danger" icon="droplet" /> : null}
            {transport.length > 0 ? <Pill label="Transport" tone="info" icon="truck" /> : null}
          </View>
          <Text className="mb-1 mt-3 text-[10px] font-semibold uppercase text-slate-400 dark:text-[#8b879b]">Profile completeness · {student.completion}%</Text>
          <View className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1B1632]">
            <View style={{ width: `${student.completion}%` }} className="h-full rounded-full bg-[#3D5EE1]" />
          </View>
          <View className="mt-3 flex-row gap-2">
            <Button small variant="secondary" icon="phone" label="Call guardian" onPress={callGuardian} style={{ flex: 1 }} />
            <Button small variant="secondary" icon="share-2" label="Share profile" onPress={share} style={{ flex: 1 }} />
          </View>
        </Card>
      </View>

      <View className="mt-3">
        <SummaryStrip
          items={[
            {
              label: 'Attendance',
              value: attPct !== null ? `${Math.round(attPct)}%` : '—',
              tone: attPct !== null && attPct < 75 ? 'danger' : 'success',
              icon: 'check-square',
            },
            {
              label: 'Homework',
              value: homework.length ? `${submittedHw}/${homework.length}` : '—',
              tone: 'primary',
              icon: 'award',
            },
            {
              label: 'Fees',
              value: fees.available ? fees.status : '—',
              tone: fees.status === 'Paid' ? 'success' : fees.status === 'Overdue' ? 'danger' : fees.status === 'Due' ? 'warning' : 'neutral',
              icon: 'bar-chart-2',
            },
          ]}
        />
        <SegmentedTabs tabs={tabs.map((t) => ({ key: t.key, label: t.label }))} active={activeTab} onChange={(k) => setTab(k as TabKey)} />
      </View>

      <View className="px-4">
        <Pane profile={profile} staff={staff} onReload={reload} />
      </View>
    </ScrollView>
  );
}
