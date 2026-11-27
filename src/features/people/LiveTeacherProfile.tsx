import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
} from 'react-native';

import {
  useFocusEffect,
  useLocalSearchParams,
} from 'expo-router';

import { useAuth } from '@/hooks/useAuth';
import { staffApi } from '@/services/api/staffApi';
import type { BackendStaff } from '@/services/api/staffApi';

import {
  Button,
  Card,
  EmptyState,
  KeyValue,
  Pill,
} from '@/ui/basics';

import { SelectField } from '@/ui/Fields';
import { SegmentedTabs } from '@/ui/ListChrome';
import { Block } from './StudentProfileTabs';

type Tab =
  | 'details'
  | 'routine'
  | 'leave'
  | 'salary'
  | 'library';

const TABS: { key: Tab; label: string }[] = [
  { key: 'details', label: 'Details' },
  { key: 'routine', label: 'Routine' },
  { key: 'leave', label: 'Leave & Attendance' },
  { key: 'salary', label: 'Salary' },
  { key: 'library', label: 'Library' },
];

const nameOf = (t: BackendStaff) =>
  t.fullName?.trim() ||
  [t.firstName, t.lastName].filter(Boolean).join(' ') ||
  'Name unavailable';

const display = (value: unknown) =>
  value == null || value === ''
    ? '-'
    : String(value);

const label = (value: string) =>
  value.replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const assigned = (values?: string[]) =>
  Array.isArray(values) && values.length
    ? values.join(', ')
    : 'Not assigned';

export function LiveTeacherProfile({
  breadcrumb,
}: {
  breadcrumb: string;
}) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, role, canManage } = useAuth();

  const requestedId =
    typeof id === 'string' ? id : undefined;

  const allowed =
    !!user &&
    canManage &&
    role !== 'student' &&
    role !== 'parent' &&
    role !== 'teacher';

  const [result, setResult] = useState<{
    owner: typeof user;
    rows: BackendStaff[];
  } | null>(null);

  const [picked, setPicked] = useState<string>();
  const [tab, setTab] = useState<Tab>('details');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      setResult(null);
      setError('');
      setLoading(true);
      setPicked(requestedId);

      if (!allowed) {
        setLoading(false);
        return;
      }

      staffApi.fetchTeachers('active')
        .then((rows) => {
          if (!active) return;

          const teachers = rows
            .filter((t) =>
              t.staffType === 'teaching' &&
              t.status === 'active'
            )
            .sort((a, b) =>
              nameOf(a).localeCompare(nameOf(b))
            );

          setResult({
            owner: user,
            rows: teachers,
          });
        })
        .catch((e) => {
          if (!active) return;

          setError(
            e instanceof Error
              ? e.message
              : 'Unable to load active teachers'
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [user, allowed, requestedId, reload])
  );

  if (!allowed) {
    return (
      <EmptyState
        icon="lock"
        title="Teacher directory unavailable"
        hint="This profile directory requires authorized staff access."
      />
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-slate-500">
          Loading active teachers...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="p-4">
        <EmptyState
          icon="alert-triangle"
          title="Unable to load teachers"
          hint={error}
        />
        <Button
          label="Retry"
          onPress={() => setReload((n) => n + 1)}
        />
      </View>
    );
  }

  const teachers =
    result?.owner === user
      ? result.rows
      : [];

  const options = teachers.map((t) => ({
    label: nameOf(t),
    value: String(t.id),
    hint: t.employeeNo,
  }));

  const teacher = picked
    ? teachers.find((t) => String(t.id) === picked)
    : teachers[0];

  if (teachers.length === 0) {
    return (
      <View className="p-4">
        <EmptyState
          icon="user-x"
          title="No active teachers found"
        />
        <Button
          label="Refresh"
          onPress={() => setReload((n) => n + 1)}
        />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="px-4 pt-3">
        <Text className="mb-2 text-[11px] text-slate-400">
          {breadcrumb}
        </Text>

        <SelectField
          label="Active Teacher"
          value={teacher ? String(teacher.id) : ''}
          options={options}
          onChange={(v) => setPicked(v)}
        />

        <Text className="mb-2 text-xs text-slate-500">
          {teachers.length} active teachers
        </Text>

        <Button
          small
          variant="secondary"
          label="Refresh"
          onPress={() => setReload((n) => n + 1)}
          style={{ marginBottom: 10 }}
        />

        {!teacher ? (
          <EmptyState
            icon="user-x"
            title="Selected teacher is unavailable"
            hint="Select an active teacher from the list."
          />
        ) : (
          <>
            <Card>
              <View className="flex-row items-center">
                <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <Text className="text-base font-bold text-blue-700">
                    {nameOf(teacher)
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1">
                  <Text className="text-lg font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">
                    {nameOf(teacher)}
                  </Text>

                  <Text className="text-xs text-slate-500">
                    {teacher.employeeNo}
                  </Text>
                </View>

                <Pill label="Active" tone="success" />
              </View>

              <View className="mt-3">
                <Pill
                  label={label(teacher.employmentType || 'Unknown')}
                  tone="neutral"
                />

                <Text className="mt-2 text-xs text-slate-500">
                  {assigned(teacher.teaching?.subjects)}
                </Text>
              </View>
            </Card>

            <View className="my-3">
              <SegmentedTabs
                tabs={TABS}
                active={tab}
                onChange={(k) => setTab(k as Tab)}
              />
            </View>

            {tab === 'details' ? (
              <View>
                <Block title="Personal">
                  <KeyValue
                    label="Teacher ID"
                    value={display(teacher.employeeNo)}
                  />
                  <KeyValue
                    label="Name"
                    value={nameOf(teacher)}
                  />
                  <KeyValue
                    label="Gender"
                    value={display(teacher.gender)}
                  />
                  <KeyValue
                    label="Date of birth"
                    value={display(teacher.dob)}
                  />
                  <KeyValue
                    label="Blood group"
                    value={display(teacher.bloodGroup)}
                  />
                </Block>

                <Block title="Professional">
                  <KeyValue
                    label="Employment"
                    value={label(teacher.employmentType || 'Unknown')}
                  />
                  <KeyValue
                    label="Qualification"
                    value={display(teacher.qualification)}
                  />
                  <KeyValue
                    label="Experience"
                    value={
                      teacher.experienceYears == null
                        ? '-'
                        : `${teacher.experienceYears} years`
                    }
                  />
                  <KeyValue
                    label="Joined"
                    value={display(teacher.joinedOn)}
                  />
                </Block>

                <Block title="Classes & Subjects">
                  <KeyValue
                    label="Classes"
                    value={assigned(teacher.teaching?.classes)}
                  />
                  <KeyValue
                    label="Sections"
                    value={assigned(teacher.teaching?.sections)}
                  />
                  <KeyValue
                    label="Subjects"
                    value={assigned(teacher.teaching?.subjects)}
                  />
                </Block>

                <Block title="Contact">
                  <KeyValue
                    label="Phone"
                    value={display(teacher.phone)}
                  />
                  <KeyValue
                    label="Email"
                    value={display(teacher.email)}
                  />
                  <KeyValue
                    label="Address"
                    value={
                      [
                        teacher.addressLine1,
                        teacher.addressLine2,
                        teacher.postalCode,
                      ].filter(Boolean).join(', ') || '-'
                    }
                  />
                </Block>
              </View>
            ) : (
              <EmptyState
                icon="clock"
                title="Live integration pending"
                hint="This section will be available after its backend API is connected."
              />
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}