import React, { useRef, useState } from 'react';
import {
  Alert,
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  admissionDecisions,
} from '@/services/api/admissionApi';

import type {
  LiveAdmissionRecord,
} from './admissionRecordAdapter';

interface Props {
  record: LiveAdmissionRecord;
  refresh: () => void;
  canManage: boolean;
}

export function AdmissionDecisionPanel({
  record,
  refresh,
  canManage,
}: Props) {
  const lock = useRef(false);

  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState('');

  const eligible = [
    'applied',
    'document_review',
    'shortlisted',
    'waitlisted',
    'offered',
  ].includes(record.backendStatus);

  if (!canManage || !eligible || completed) {
    return null;
  }

  async function execute(decision: 'accept' | 'reject') {
    if (lock.current || completed || !canManage || !eligible) {
      return;
    }

    if (decision === 'reject' && !reason.trim()) {
      Alert.alert(
        'Rejection reason',
        'Please enter a reason for rejection.'
      );
      return;
    }

    lock.current = true;
    setBusy(true);

    try {
      if (decision === 'accept') {
        const result =
          await admissionDecisions.acceptWithCredentials(
            record.id
          );

        setCompleted(true);
        refresh();

        if (result.login?.username && result.login?.password) {
          Alert.alert(
            'Admission successful',
            [
              `Student: ${record.name}`,
              `Admission No: ${result.student?.admissionNo ?? 'See student record'}`,
              `Username: ${result.login.username}`,
              `Initial password: ${result.login.password}`,
              '',
              'Share credentials securely with the student.',
              'Parent activation is separate.',
            ].join('\n')
          );
        } else {
          Alert.alert(
            'Admission accepted',
            'The server accepted the admission, but login details were not returned. Verify the student account before sharing credentials.'
          );
        }
      } else {
        await admissionDecisions.rejectWithReason(
          record.id,
          reason
        );

        setCompleted(true);
        setShowReject(false);
        setReason('');
        refresh();

        Alert.alert(
          'Application rejected',
          'The rejection has been saved successfully.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Unable to confirm decision',
        error instanceof Error
          ? error.message
          : 'Refresh the application and verify its status before retrying.'
      );

      refresh();
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }

  function confirmAdmission() {
    if (lock.current || completed) return;

    Alert.alert(
      'Confirm admission',
      `Admit ${record.name} and create a student login account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Admit',
          onPress: () => void execute('accept'),
        },
      ]
    );
  }

  return (
    <View className="mt-3 mb-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-[#322D46] dark:bg-[#131022]">

      <Text className="mb-1 text-base font-bold text-[#202C4B] dark:text-white">
        Admission Decision
      </Text>

      <Text className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        Review the application before making a final decision.
      </Text>

      {busy ? (
        <View className="items-center py-4">
          <ActivityIndicator size="small" color="#3D5EE1" />
          <Text className="mt-2 text-xs text-slate-500">
            Processing admission decision...
          </Text>
        </View>
      ) : (
        <>
          <View className="flex-row gap-3">

            <Pressable
              onPress={confirmAdmission}
              className="flex-1 items-center rounded-xl bg-green-600 px-4 py-3"
            >
              <Text className="font-bold text-white">
                Admit
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setShowReject(true)}
              className="flex-1 items-center rounded-xl border border-red-500 px-4 py-3"
            >
              <Text className="font-bold text-red-500">
                Reject
              </Text>
            </Pressable>

          </View>

          {showReject ? (
            <View className="mt-4">

              <Text className="mb-2 text-xs font-bold text-[#202C4B] dark:text-white">
                Rejection Reason *
              </Text>

              <TextInput
                value={reason}
                onChangeText={setReason}
                placeholder="Enter rejection reason"
                placeholderTextColor="#94a3b8"
                multiline
                maxLength={500}
                textAlignVertical="top"
                className="min-h-[90px] rounded-xl border border-slate-300 p-3 text-[#202C4B] dark:border-[#322D46] dark:text-white"
              />

              <View className="mt-3 flex-row gap-3">

                <Pressable
                  onPress={() => {
                    setShowReject(false);
                    setReason('');
                  }}
                  className="flex-1 items-center rounded-xl bg-slate-200 py-3"
                >
                  <Text className="font-semibold text-slate-700">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  disabled={!reason.trim()}
                  onPress={() => {
                    Alert.alert(
                      'Confirm rejection',
                      `Reject the application of ${record.name}?`,
                      [
                        { text: 'Cancel', style: 'cancel' },
                        {
                          text: 'Reject',
                          style: 'destructive',
                          onPress: () => void execute('reject'),
                        },
                      ]
                    );
                  }}
                  className={`flex-1 items-center rounded-xl bg-red-600 py-3 ${
                    !reason.trim() ? 'opacity-50' : ''
                  }`}
                >
                  <Text className="font-bold text-white">
                    Confirm Reject
                  </Text>
                </Pressable>

              </View>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}