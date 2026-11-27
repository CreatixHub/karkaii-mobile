import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { staffApi } from '@/services/api/staffApi';
import type { TeacherStatus } from '@/services/api/staffApi';

interface Props {
  teacherId: string;
  teacherName: string;
  currentStatus: string;
  canManage: boolean;
  refresh: () => void;
}

const OPTIONS: {
  value: TeacherStatus;
  label: string;
  description: string;
}[] = [
  {
    value: 'active',
    label: 'Active',
    description: 'Restore normal employment access',
  },
  {
    value: 'inactive',
    label: 'Inactive',
    description: 'Disable school access and attendance marking',
  },
  {
    value: 'on_leave',
    label: 'On Leave',
    description: 'Temporarily unavailable for regular duties',
  },
  {
    value: 'suspended',
    label: 'Suspended',
    description: 'Restrict school access and attendance marking',
  },
  {
    value: 'left',
    label: 'Left School',
    description: 'Preserve records and restrict school access',
  },
];

export function TeacherStatusPanel({
  teacherId,
  teacherName,
  currentStatus,
  canManage,
  refresh,
}: Props) {
  const [savedStatus, setSavedStatus] = useState(currentStatus);
  const [selected, setSelected] = useState(currentStatus);
  const [leftOn, setLeftOn] = useState('');
  const [leftReason, setLeftReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const busy = useRef(false);

  useEffect(() => {
    setSavedStatus(currentStatus);
    setSelected(currentStatus);
    setLeftOn('');
    setLeftReason('');
    setError('');
    setSuccess('');
  }, [teacherId, currentStatus]);

  if (!canManage) return null;

  const option = OPTIONS.find(
    (item) => item.value === selected
  );

  const changed = selected !== savedStatus;

  const blocked =
    selected === 'inactive' ||
    selected === 'suspended' ||
    selected === 'left';

  async function saveStatus() {
    if (
      busy.current ||
      !option ||
      !changed ||
      !canManage
    ) return;

    busy.current = true;
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const latest = await staffApi.fetchTeacherById(teacherId);

      if (latest.status !== savedStatus) {
        setSavedStatus(latest.status);
        setSelected(latest.status);
        refresh();

        throw new Error(
          'Teacher status has changed. Review the latest status and try again.'
        );
      }

      const updated = await staffApi.updateTeacherStatus(
        teacherId,
        {
          status: option.value,
          ...(option.value === 'left'
            ? {
                leftOn: leftOn.trim(),
                leftReason: leftReason.trim() || null,
              }
            : {}),
        }
      );

      setSavedStatus(updated.status);
      setSelected(updated.status);

      setSuccess('Teacher status updated successfully');

      refresh();

    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to update teacher status'
      );
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  function confirmUpdate() {
    if (!option || !changed || busy.current) return;

    if (
      selected === 'left' &&
      !/^\d{4}-\d{2}-\d{2}$/.test(leftOn.trim())
    ) {
      setError('Enter last working date as YYYY-MM-DD');
      return;
    }

    Alert.alert(
      'Confirm Status Change',
      `Change ${teacherName}'s employment status to ${option.label}?` +
        (blocked
          ? '\n\nSchool access and attendance marking will be restricted.'
          : ''),
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: blocked ? 'destructive' : 'default',
          onPress: () => {
            void saveStatus();
          },
        },
      ]
    );
  }

  return (
    <View className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">

      <Text className="text-base font-bold text-slate-900">
        Employment Status
      </Text>

      <Text className="mt-1 text-sm text-slate-500">
        Manage teacher employment and school access.
      </Text>

      <View className="mt-3 rounded-xl bg-slate-100 p-3">
        <Text className="text-xs text-slate-500">
          Current Status
        </Text>

        <Text className="mt-1 font-semibold capitalize text-slate-900">
          {savedStatus.replace(/_/g, ' ')}
        </Text>
      </View>

      <View className="mt-4 gap-2">
        {OPTIONS.map((item) => {
          const checked = selected === item.value;

          return (
            <Pressable
              key={item.value}
              disabled={saving}
              accessibilityRole="radio"
              accessibilityState={{
                checked,
                disabled: saving,
              }}
              onPress={() => {
                setSelected(item.value);
                setError('');
                setSuccess('');
              }}
              className={
                checked
                  ? 'rounded-xl border border-blue-600 bg-blue-50 p-3'
                  : 'rounded-xl border border-slate-200 bg-white p-3'
              }
            >
              <View className="flex-row items-center gap-3">
                <View
                  className={
                    checked
                      ? 'h-5 w-5 items-center justify-center rounded-full border-2 border-blue-600'
                      : 'h-5 w-5 rounded-full border-2 border-slate-300'
                  }
                >
                  {checked && (
                    <View className="h-2.5 w-2.5 rounded-full bg-blue-600" />
                  )}
                </View>

                <View className="flex-1">
                  <Text className="font-semibold text-slate-900">
                    {item.label}
                  </Text>

                  <Text className="mt-1 text-xs text-slate-500">
                    {item.description}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {selected === 'left' && changed && (
        <View className="mt-4 gap-2">

          <Text className="text-sm font-semibold text-slate-700">
            Last Working Date *
          </Text>

          <TextInput
            value={leftOn}
            onChangeText={setLeftOn}
            editable={!saving}
            placeholder="YYYY-MM-DD"
            maxLength={10}
            autoCapitalize="none"
            className="rounded-xl border border-slate-300 p-3 text-slate-900"
          />

          <Text className="mt-2 text-sm font-semibold text-slate-700">
            Leaving Reason (Optional)
          </Text>

          <TextInput
            value={leftReason}
            onChangeText={setLeftReason}
            editable={!saving}
            placeholder="Enter leaving reason"
            multiline
            maxLength={300}
            className="min-h-20 rounded-xl border border-slate-300 p-3 text-slate-900"
          />

        </View>
      )}

      {blocked && changed && (
        <View className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Text className="font-semibold text-amber-800">
            Important
          </Text>

          <Text className="mt-1 text-xs text-amber-800">
            School access and attendance marking will be restricted.
            Existing teacher records will be preserved.
          </Text>
        </View>
      )}

      {!!error && (
        <Text className="mt-3 text-sm text-red-600">
          {error}
        </Text>
      )}

      {!!success && (
        <Text className="mt-3 text-sm text-green-700">
          {success}
        </Text>
      )}

      <Pressable
        disabled={!changed || saving || !option}
        onPress={confirmUpdate}
        accessibilityRole="button"
        className={
          !changed || saving || !option
            ? 'mt-4 items-center rounded-xl bg-slate-300 p-3'
            : 'mt-4 items-center rounded-xl bg-blue-600 p-3'
        }
      >
        {saving ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-white">
            Update Status
          </Text>
        )}
      </Pressable>

    </View>
  );
}