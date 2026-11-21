import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { DEMO_PASSWORD, MOCK_USERS } from '@/core/auth/AuthProvider';
import { ROLES } from '@/core/auth/access';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/ui/basics';

/**
 * Same sign-in as the web app: one "Email or Phone Number" field (an admission number works too), a password,
 * "Remember Me" and "Forgot Password?". Like the web page, only "is it filled in" is checked here: whether the
 * account exists is decided at sign-in, and the account's role decides which profile and dashboard you land on.
 */
export default function LoginScreen() {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ identifier?: string; password?: string }>({});
  const [demoOpen, setDemoOpen] = useState(false);

  const submit = async () => {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = 'Email or phone number is required';
    if (!password) next.password = 'Password is required';
    setErrors(next);
    setError(null);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(identifier, password, rememberMe);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    } finally {
      setBusy(false);
    }
  };

  /** Demo helper: fill the form with a role's account, then sign in the normal way. */
  const fill = (role: string) => {
    const account = MOCK_USERS.find((u) => u.role === role);
    if (!account) return;
    setIdentifier(account.email);
    setPassword(DEMO_PASSWORD);
    setShowPassword(true);
    setErrors({});
    setError(null);
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

            <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Email or Phone Number</Text>
            <View className={`mb-1 flex-row items-center rounded-xl border bg-white px-3.5 ${errors.identifier ? 'border-red-400' : 'border-slate-200'}`}>
              <Feather name="user" size={16} color="#6A7287" />
              <TextInput
                value={identifier}
                onChangeText={(t) => { setIdentifier(t); setErrors((e) => ({ ...e, identifier: undefined })); }}
                placeholder="Email, phone number or admission no."
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                accessibilityLabel="Email or phone number"
                className="ml-2.5 flex-1 py-3 text-sm text-[#202C4B]"
              />
            </View>
            {errors.identifier ? <Text className="mb-2 text-xs text-red-600">{errors.identifier}</Text> : <View className="mb-3" />}

            <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Password</Text>
            <View className={`mb-1 flex-row items-center rounded-xl border bg-white px-3.5 ${errors.password ? 'border-red-400' : 'border-slate-200'}`}>
              <TextInput
                value={password}
                onChangeText={(t) => { setPassword(t); setErrors((e) => ({ ...e, password: undefined })); }}
                placeholder="Password"
                placeholderTextColor="#94a3b8"
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                accessibilityLabel="Password"
                onSubmitEditing={submit}
                className="flex-1 py-3 text-sm text-[#202C4B]"
              />
              <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={10} accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
                <Feather name={showPassword ? 'eye' : 'eye-off'} size={16} color="#6A7287" />
              </Pressable>
            </View>
            {errors.password ? <Text className="mb-2 text-xs text-red-600">{errors.password}</Text> : <View className="mb-3" />}

            <View className="mb-5 flex-row items-center justify-between">
              <Pressable onPress={() => setRememberMe((r) => !r)} hitSlop={8} className="flex-row items-center" accessibilityRole="checkbox" accessibilityState={{ checked: rememberMe }}>
                <View className={`h-[18px] w-[18px] items-center justify-center rounded border ${rememberMe ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-300 bg-white'}`}>
                  {rememberMe ? <Feather name="check" size={12} color="#fff" /> : null}
                </View>
                <Text className="ml-2 text-xs text-[#515B73]">Remember Me</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/forgot-password')} hitSlop={8}>
                <Text className="text-xs font-semibold text-[#E82646]">Forgot Password?</Text>
              </Pressable>
            </View>

            <Button label={busy ? 'Signing in...' : 'Sign In'} onPress={submit} loading={busy} />
          </View>

          {/* Mock-mode helper: fills the form with one account per role. Removed when the real API login is switched on. */}
          <View className="mt-5 rounded-2xl border border-dashed border-[#3D5EE1]/40 bg-[#E9EDFC]/60 p-4">
            <Pressable onPress={() => setDemoOpen((o) => !o)} className="flex-row items-center justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-xs font-extrabold uppercase tracking-wide text-[#3D5EE1]">Demo accounts · mock mode</Text>
                <Text className="mt-0.5 text-[11px] text-slate-500">Tap a role to fill the form, then Sign In. Password for all: {DEMO_PASSWORD}</Text>
              </View>
              <Feather name={demoOpen ? 'chevron-up' : 'chevron-down'} size={16} color="#3D5EE1" />
            </Pressable>
            {demoOpen ? (
              <>
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {ROLES.map((r) => (
                    <Pressable key={r.key} onPress={() => fill(r.key)} className="rounded-full border border-[#3D5EE1]/30 bg-white px-3 py-1.5 active:bg-[#E9EDFC]">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{r.label}</Text>
                    </Pressable>
                  ))}
                </View>
                <Text className="mt-3 text-[11px] text-slate-500">
                  The role comes from the account you sign in with. Any person on the Users page can sign in by email or phone number, and students also by admission number.
                </Text>
              </>
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
