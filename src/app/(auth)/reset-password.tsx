import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Button } from '@/ui/basics';
import { TextField } from '@/ui/Fields';
import { useToast } from '@/ui/Toast';

export default function ResetPasswordScreen() {
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});

  const submit = () => {
    const next: typeof errors = {};
    if (password.length < 8) next.password = 'Use at least 8 characters';
    else if (!/\d/.test(password) || !/[A-Za-z]/.test(password)) next.password = 'Include letters and numbers';
    if (confirm !== password) next.confirm = 'Passwords do not match';
    setErrors(next);
    if (Object.keys(next).length) return;
    toast('Password updated (mock mode: demo password is unchanged)', 'info');
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f6fb]">
      <View className="flex-1 justify-center p-5">
        <View className="rounded-2xl border border-slate-100 bg-white p-6">
          <Text className="text-xl font-bold text-[#202C4B]">Set a new password</Text>
          <Text className="mb-5 mt-1 text-sm text-[#515B73]">Choose a strong password you have not used before.</Text>
          <TextField label="New password" value={password} onChange={setPassword} secure error={errors.password} />
          <TextField label="Confirm password" value={confirm} onChange={setConfirm} secure error={errors.confirm} />
          <Button label="Update password" onPress={submit} />
        </View>
      </View>
    </SafeAreaView>
  );
}
