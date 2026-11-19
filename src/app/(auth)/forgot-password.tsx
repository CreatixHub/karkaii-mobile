import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MOCK_USERS } from '@/core/auth/AuthProvider';
import { Button } from '@/ui/basics';
import { TextField } from '@/ui/Fields';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string>();
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address');
      return;
    }
    setError(undefined);
    setSent(true);
  };

  const known = MOCK_USERS.some((u) => u.email === email.trim().toLowerCase());

  return (
    <SafeAreaView className="flex-1 bg-[#f4f6fb]">
      <View className="flex-1 justify-center p-5">
        <View className="rounded-2xl border border-slate-100 bg-white p-6">
          <Text className="text-xl font-bold text-[#202C4B]">Forgot password?</Text>
          <Text className="mb-5 mt-1 text-sm text-[#515B73]">Enter your email and we will send reset instructions.</Text>
          {sent ? (
            <>
              <View className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3">
                <Text className="text-xs font-medium text-green-800">
                  If an account exists for {email.trim()}, reset instructions have been sent. (Mock mode: no email is actually sent.)
                </Text>
              </View>
              {known ? <Button label="Continue to reset password" onPress={() => router.push('/(auth)/reset-password')} style={{ marginBottom: 10 }} /> : null}
              <Button label="Back to sign in" variant="secondary" onPress={() => router.replace('/(auth)/login')} />
            </>
          ) : (
            <>
              <TextField label="Email" value={email} onChange={setEmail} keyboard="email-address" error={error} placeholder="you@school.org" />
              <Button label="Send reset link" onPress={submit} />
              <Button label="Back to sign in" variant="ghost" onPress={() => router.back()} style={{ marginTop: 8 }} />
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
