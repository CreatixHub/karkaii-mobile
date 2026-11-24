import React from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { signInIds } from '@/core/auth/accounts';
import { roleLabel } from '@/core/auth/access';
import { resetAllData } from '@/core/store/store';
import { useAuth } from '@/hooks/useAuth';
import { Button, Card, KeyValue } from '@/ui/basics';
import { useToast } from '@/ui/Toast';

/** The profile follows the account you signed in with: its name, role and what that role may manage. */
export default function ProfileScreen() {
  const { user, role, logout, canManage } = useAuth();
  const toast = useToast();
  const roleName = user?.roleName ?? roleLabel(role);

  const reset = () =>
    Alert.alert('Reset demo data?', 'All records you added, edited or deleted will be restored to the original sample data.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: () => { resetAllData(); toast('Demo data restored'); } },
    ]);

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerClassName="p-4 pb-12">
      <View className="mb-4 items-center rounded-2xl border border-slate-100 bg-white p-5">
        <View className="h-16 w-16 items-center justify-center rounded-full bg-[#3D5EE1]">
          <Text className="text-2xl font-bold text-white">{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text className="mt-3 text-lg font-bold text-[#1b2240]">{user?.name}</Text>
        <Text className="text-xs text-slate-500">{user?.title}</Text>
        <View className="mt-2 flex-row items-center rounded-full bg-[#E9EDFC] px-3 py-1">
          <Feather name={canManage ? 'edit-3' : 'eye'} size={11} color="#3D5EE1" />
          <Text className="ml-1.5 text-[11px] font-bold text-[#3D5EE1]">{roleName} · {canManage ? 'can manage data' : 'view only'}</Text>
        </View>
      </View>

      <Card style={{ marginBottom: 16 }}>
        <KeyValue label="Email" value={user?.email} />
        <KeyValue label="Phone" value={user?.phone} />
        <KeyValue label="School" value={user?.school} />
        <KeyValue label="Role" value={roleName} />
        {user ? <KeyValue label="Sign in with" value={signInIds(user).join('  ·  ')} /> : null}
      </Card>

      <View className="gap-3">
        <Button label="Reset demo data" icon="refresh-ccw" variant="secondary" onPress={reset} />
        <Button label="Sign out" icon="log-out" variant="danger" onPress={() => logout()} />
      </View>
    </ScrollView>
  );
}
