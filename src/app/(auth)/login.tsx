import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/ui/basics';

/**
 * Sign-in against the backend: User ID (the email or username the school gave you) and password. The backend
 * checks them and says who you are; your role decides the dashboard. Only "is it filled in" is checked here.
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

  const submit = async () => {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = 'User ID is required';
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

            <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">User ID</Text>
            <View className={`mb-1 flex-row items-center rounded-xl border bg-white px-3.5 ${errors.identifier ? 'border-red-400' : 'border-slate-200'}`}>
              <Feather name="user" size={16} color="#6A7287" />
              <TextInput
                value={identifier}
                onChangeText={(t) => { setIdentifier(t); setErrors((e) => ({ ...e, identifier: undefined })); }}
                placeholder="Email or username"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                textContentType="username"
                accessibilityLabel="User ID"
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

          <View className="mt-8 items-center">
            <Text className="text-[11px] text-slate-400">Copyright © {new Date().getFullYear()} - Karkaii</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
