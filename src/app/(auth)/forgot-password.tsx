import React, { useState } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { authApi } from '@/services/authApi';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (apiError) setApiError(null);
  };

  const validate = (): boolean => {
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Email address is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsSubmitting(true);
    setApiError(null);

    try {
      await authApi.forgotPassword({ email: email.trim() });
      setIsSuccess(true);
    } catch (err: any) {
      setApiError(
        err?.message || 'Unable to send reset instructions. Please check your email and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
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
        >
          {/* Logo Header */}
          <View className="items-center mb-6">
            <Image
              source={require('../../../assets/karkaii-logo.png')}
              style={{ width: 180, height: 46 }}
              resizeMode="contain"
            />
          </View>

          {/* Forgot Password Card */}
          <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-black/5">
            <View className="mb-5">
              <Text className="text-2xl font-bold text-[#202C4B]">Forgot Password?</Text>
              <Text className="mt-1 text-sm text-[#515B73] leading-5">
                If you forgot your password, well, then we’ll email you instructions to reset your
                password.
              </Text>
            </View>

            {/* Error Alert */}
            {apiError ? (
              <View className="mb-4 flex-row items-center rounded-xl border border-red-200 bg-red-50 p-3">
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 flex-1 text-xs font-medium text-red-700 leading-4">
                  {apiError}
                </Text>
              </View>
            ) : null}

            {/* Success Alert */}
            {isSuccess ? (
              <View className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5">
                <View className="flex-row items-center">
                  <Feather name="check-circle" size={16} color="#16a34a" />
                  <Text className="ml-2 text-xs font-bold text-emerald-800">Instructions Sent</Text>
                </View>
                <Text className="mt-1 text-xs text-emerald-700 leading-4">
                  We have sent reset instructions to <Text className="font-semibold">{email}</Text>.
                  Please check your inbox.
                </Text>
                <Pressable
                  onPress={() => router.push('/(auth)/reset-password')}
                  className="mt-3 flex-row items-center"
                >
                  <Text className="text-xs font-bold text-[#3D5EE1]">
                    Enter Reset Token / OTP →
                  </Text>
                </Pressable>
              </View>
            ) : null}

            {/* Email Field */}
            <View className="mb-5">
              <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Email Address</Text>
              <View
                className={`flex-row items-center rounded-xl border px-3.5 py-2.5 bg-white ${
                  emailError ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <Feather name="mail" size={16} color={emailError ? '#DC2626' : '#6A7287'} />
                <TextInput
                  value={email}
                  onChangeText={handleEmailChange}
                  placeholder="Enter your registered email"
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  className="ml-2.5 flex-1 text-sm text-[#202C4B] p-0"
                />
              </View>
              {emailError ? (
                <Text className="mt-1 text-xs text-red-600">{emailError}</Text>
              ) : null}
            </View>

            {/* Submit Button */}
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              className={`items-center justify-center rounded-xl bg-[#3D5EE1] py-3.5 shadow-sm shadow-[#3D5EE1]/30 active:bg-[#2F49B3] ${
                isSubmitting ? 'opacity-70' : ''
              }`}
            >
              {isSubmitting ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#ffffff" />
                  <Text className="ml-2 text-sm font-bold text-white">Sending…</Text>
                </View>
              ) : (
                <Text className="text-sm font-bold text-white">Send Reset Link</Text>
              )}
            </Pressable>

            {/* Return to Login */}
            <View className="mt-5 items-center">
              <Text className="text-xs text-slate-600">
                Return to{' '}
                <Text
                  onPress={() => router.push('/(auth)/login')}
                  className="font-bold text-[#3D5EE1]"
                >
                  Login
                </Text>
              </Text>
            </View>
          </View>

          {/* Copyright Line */}
          <View className="mt-8 items-center">
            <Text className="text-[11px] text-slate-400">Copyright © 2024 - Karkaii</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
