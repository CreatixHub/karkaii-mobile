import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DEMO_PASSWORD } from '@/core/auth/AuthProvider';
import { ROLES } from '@/core/auth/access';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/ui/basics';

export default function LoginScreen() {
  const { login, loginAs } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [demoOpen, setDemoOpen] = useState(true);

  const submit = async () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Enter a valid email address';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f6fb]">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <ScrollView contentContainerClassName="p-5 pb-12 flex-grow justify-center" keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <View className="mb-6 items-center">
            <Image source={require('../../../assets/karkaii-logo.png')} style={{ width: 180, height: 46 }} resizeMode="contain" />
          </View>

          <View className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm shadow-black/5">
            <Text className="text-2xl font-bold text-[#202C4B]">Welcome</Text>
            <Text className="mb-5 mt-1 text-sm text-[#515B73]">Please enter your details to sign in</Text>

            {error ? (
              <View className="mb-4 flex-row items-center rounded-xl border border-red-200 bg-red-50 p-3">
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 flex-1 text-xs font-medium text-red-700">{error}</Text>
              </View>
            ) : null}

            <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Email</Text>
            <View className={`mb-1 flex-row items-center rounded-xl border bg-white px-3.5 ${errors.email ? 'border-red-400' : 'border-slate-200'}`}>
              <TextInput
                value={email}
                onChangeText={(t) => { setEmail(t); setErrors((e) => ({ ...e, email: undefined })); }}
                placeholder="you@school.org"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                className="flex-1 py-3 text-sm text-[#202C4B]"
              />
              <Feather name="mail" size={16} color="#6A7287" />
            </View>
            {errors.email ? <Text className="mb-2 text-xs text-red-600">{errors.email}</Text> : <View className="mb-3" />}

            <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Password</Text>
            <View className={`mb-1 flex-row items-center rounded-xl border bg-white px-3.5 ${errors.password ? 'border-red-400' : 'border-slate-200'}`}>
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                className="flex-1 py-3 text-sm text-[#202C4B]"
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={16} color="#6A7287" />
              </Pressable>
            </View>
            {errors.password ? <Text className="mb-2 text-xs text-red-600">{errors.password}</Text> : <View className="mb-3" />}

            <Pressable onPress={() => router.push('/(auth)/forgot-password')} className="mb-5 self-end">
              <Text className="text-xs font-semibold text-[#E82646]">Forgot Password?</Text>
            </Pressable>

            <Button label="Sign In" onPress={submit} loading={busy} />
          </View>

          {/* Mock-mode helper: one account per role. Removed when the real API login is switched on. */}
          <View className="mt-5 rounded-2xl border border-dashed border-[#3D5EE1]/40 bg-[#E9EDFC]/60 p-4">
            <Pressable onPress={() => setDemoOpen((o) => !o)} className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-extrabold uppercase tracking-wide text-[#3D5EE1]">Demo accounts · mock mode</Text>
                <Text className="mt-0.5 text-[11px] text-slate-500">Tap a role to sign in. Password for all: {DEMO_PASSWORD}</Text>
              </View>
              <Feather name={demoOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#3D5EE1" />
            </Pressable>
            {demoOpen ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {ROLES.map((r) => (
                  <Pressable key={r.key} onPress={() => loginAs(r.key)} className="rounded-full border border-[#3D5EE1]/30 bg-white px-3 py-1.5 active:bg-[#E9EDFC]">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View className="mt-8 items-center">
            <Text className="text-[11px] text-slate-400">Copyright © {new Date().getFullYear()} - Karkaii</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
