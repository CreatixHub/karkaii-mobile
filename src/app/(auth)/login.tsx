import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/services/tokenStorage';

export default function LoginScreen() {
  const { login, isLoggingIn, error, clearError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load remembered email if previously checked
  useEffect(() => {
    (async () => {
      const savedEmail = await tokenStorage.getRememberedEmail();
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    })();
  }, []);

  // Clear errors when fields change
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (error) clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (error) clearError();
  };

  const validate = (): boolean => {
    let isValid = true;
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      isValid = false;
    } else {
      setEmailError(null);
    }

    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else {
      setPasswordError(null);
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    try {
      await login({
        email: email.trim(),
        password,
        rememberMe,
      });

      // Role-based or default navigation to (app)
      router.replace('/(app)');
    } catch {
      // Error is caught and surfaced in context
    }
  };

  const fillDemoAccount = (roleEmail: string, rolePass = 'Password123!') => {
    setEmail(roleEmail);
    setPassword(rolePass);
    if (emailError) setEmailError(null);
    if (passwordError) setPasswordError(null);
    if (error) clearError();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f6fb]">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="p-5 pb-12 flex-grow justify-center"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Brand Logo Header */}
          <View className="items-center mb-6">
            <Image
              source={require('../../../assets/karkaii-logo.png')}
              style={{ width: 180, height: 46 }}
              resizeMode="contain"
            />
          </View>

          {/* Login Card */}
          <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-black/5">
            {/* Title & Subtitle */}
            <View className="mb-5">
              <Text className="text-2xl font-bold text-[#202C4B]">Welcome</Text>
              <Text className="mt-1 text-sm text-[#515B73]">
                Please enter your details to sign in
              </Text>
            </View>

            {/* Google OAuth Button */}
            <Pressable
              onPress={() => {}}
              className="flex-row items-center justify-center rounded-xl border border-slate-200 bg-white py-3 active:bg-slate-50"
            >
              <FontAwesome name="google" size={18} color="#EA4335" />
              <Text className="ml-2.5 text-xs font-semibold text-[#202C4B]">
                Sign in with Google
              </Text>
            </Pressable>

            {/* "Or" Divider */}
            <View className="my-5 flex-row items-center">
              <View className="flex-1 h-px bg-slate-200" />
              <Text className="mx-3 text-xs uppercase font-medium text-slate-400">Or</Text>
              <View className="flex-1 h-px bg-slate-200" />
            </View>

            {/* Global API / Auth Error Alert */}
            {error ? (
              <View className="mb-4 flex-row items-center rounded-xl border border-red-200 bg-red-50 p-3">
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 flex-1 text-xs font-medium text-red-700 leading-4">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email Field */}
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">
                Email Address
              </Text>
              <View
                className={`flex-row items-center rounded-xl border px-3.5 py-2.5 bg-white ${
                  emailError ? 'border-red-500 bg-red-50/20' : 'border-slate-200 focus:border-[#3D5EE1]'
                }`}
              >
                <Feather name="mail" size={16} color={emailError ? '#DC2626' : '#6A7287'} />
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your email address"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  autoComplete="email"
                  className="ml-2.5 flex-1 text-sm text-[#202C4B] p-0"
                />
              </View>
              {emailError ? (
                <Text className="mt-1 text-xs text-red-600">{emailError}</Text>
              ) : null}
            </View>

            {/* Password Field */}
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Password</Text>
              <View
                className={`flex-row items-center rounded-xl border px-3.5 py-2.5 bg-white ${
                  passwordError ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <Feather name="lock" size={16} color={passwordError ? '#DC2626' : '#6A7287'} />
                <TextInput
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Enter your password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  className="ml-2.5 flex-1 text-sm text-[#202C4B] p-0"
                />
                <Pressable
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  hitSlop={10}
                  className="p-1"
                >
                  <Feather
                    name={isPasswordVisible ? 'eye' : 'eye-off'}
                    size={16}
                    color="#6A7287"
                  />
                </Pressable>
              </View>
              {passwordError ? (
                <Text className="mt-1 text-xs text-red-600">{passwordError}</Text>
              ) : null}
            </View>

            {/* Remember Me & Forgot Password Row */}
            <View className="mb-6 flex-row items-center justify-between">
              <Pressable
                onPress={() => setRememberMe((prev) => !prev)}
                className="flex-row items-center"
              >
                <View
                  className={`h-4 w-4 items-center justify-center rounded border ${
                    rememberMe ? 'bg-[#3D5EE1] border-[#3D5EE1]' : 'border-slate-300 bg-white'
                  }`}
                >
                  {rememberMe ? <Feather name="check" size={11} color="#ffffff" /> : null}
                </View>
                <Text className="ml-2 text-xs font-medium text-slate-700">Remember Me</Text>
              </Pressable>

              <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
                <Text className="text-xs font-semibold text-[#E82646]">Forgot Password?</Text>
              </Pressable>
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isLoggingIn}
              className={`items-center justify-center rounded-xl bg-[#3D5EE1] py-3.5 shadow-sm shadow-[#3D5EE1]/30 active:bg-[#2F49B3] ${
                isLoggingIn ? 'opacity-70' : ''
              }`}
            >
              {isLoggingIn ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="ml-2 text-sm font-bold text-white">Signing in…</Text>
                </View>
              ) : (
                <Text className="text-sm font-bold text-white">Sign In</Text>
              )}
            </Pressable>

            {/* Sign Up Link */}
            <View className="mt-5 items-center">
              <Text className="text-xs text-slate-600">
                Don’t have an account?{' '}
                <Text
                  onPress={() => {}}
                  className="font-bold text-[#3D5EE1]"
                >
                  Create Account
                </Text>
              </Text>
            </View>
          </View>

          {/* Quick Demo Pre-fill for Testing */}
          <View className="mt-4 rounded-xl border border-slate-200/80 bg-white/70 p-3">
            <Text className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 text-center">
              Quick Test Accounts
            </Text>
            <View className="flex-row justify-center gap-2">
              <Pressable
                onPress={() => fillDemoAccount('admin@karkaii.com', 'Password123!')}
                className="rounded-lg bg-slate-100 px-2.5 py-1"
              >
                <Text className="text-[11px] font-medium text-slate-700">Admin</Text>
              </Pressable>
              <Pressable
                onPress={() => fillDemoAccount('teacher@karkaii.com', 'Password123!')}
                className="rounded-lg bg-slate-100 px-2.5 py-1"
              >
                <Text className="text-[11px] font-medium text-slate-700">Teacher</Text>
              </Pressable>
              <Pressable
                onPress={() => fillDemoAccount('parent@karkaii.com', 'Password123!')}
                className="rounded-lg bg-slate-100 px-2.5 py-1"
              >
                <Text className="text-[11px] font-medium text-slate-700">Parent</Text>
              </Pressable>
            </View>
          </View>

          {/* Copyright Line */}
          <View className="mt-8 items-center">
            <Text className="text-[11px] text-slate-400">
              Copyright © 2024 - Karkaii
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
