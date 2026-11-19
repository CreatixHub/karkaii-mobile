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
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { tokenStorage } from '@/services/tokenStorage';

export default function LoginScreen() {
  const { login, isLoggingIn, error, clearError } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [identifierError, setIdentifierError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Load remembered identifier if previously saved
  useEffect(() => {
    (async () => {
      const saved = await tokenStorage.getRememberedEmail();
      if (saved) {
        setIdentifier(saved);
        setRememberMe(true);
      }
    })();
  }, []);

  // Clear errors when fields change
  const handleIdentifierChange = (text: string) => {
    setIdentifier(text);
    if (identifierError) setIdentifierError(null);
    if (error) clearError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (error) clearError();
  };

  const validate = (): boolean => {
    let isValid = true;
    const cleanId = identifier.trim();

    if (!cleanId) {
      setIdentifierError('Email or phone number is required');
      isValid = false;
    } else {
      setIdentifierError(null);
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
        email: identifier.trim(),
        password,
        rememberMe,
      });

      // Navigate to app drawer
      router.replace('/(app)');
    } catch {
      // Error is caught and surfaced in context
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

            {/* Global API / Auth Error Alert */}
            {error ? (
              <View className="mb-4 flex-row items-center rounded-xl border border-red-200 bg-red-50 p-3">
                <Feather name="alert-circle" size={16} color="#DC2626" />
                <Text className="ml-2 flex-1 text-xs font-medium text-red-700 leading-4">
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Email or Phone Number Field */}
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">
                Email or Phone Number
              </Text>
              <View
                className={`flex-row items-center rounded-xl border px-3.5 py-2.5 bg-white ${
                  identifierError ? 'border-red-500 bg-red-50/20' : 'border-slate-200'
                }`}
              >
                <TextInput
                  value={identifier}
                  onChangeText={handleIdentifierChange}
                  placeholder="Email, phone number or admission no."
                  placeholderTextColor="#94a3b8"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="username"
                  className="flex-1 text-sm text-[#202C4B] p-0"
                />
                <Feather
                  name="user"
                  size={16}
                  color={identifierError ? '#DC2626' : '#6A7287'}
                  className="ml-2"
                />
              </View>
              {identifierError ? (
                <Text className="mt-1 text-xs text-red-600">{identifierError}</Text>
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
                <TextInput
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="Password"
                  placeholderTextColor="#94a3b8"
                  secureTextEntry={!isPasswordVisible}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="current-password"
                  className="flex-1 text-sm text-[#202C4B] p-0"
                />
                <Pressable
                  onPress={() => setIsPasswordVisible((prev) => !prev)}
                  hitSlop={10}
                  className="p-1 ml-2"
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

            {/* Campus Organization Explorer Link */}
            <View className="mt-5 items-center">
              <Text className="text-xs text-slate-600">
                School or Campus Administrator?{' '}
                <Text
                  onPress={() => router.push('/(auth)/select-organization')}
                  className="font-bold text-[#3D5EE1]"
                >
                  Explore Campuses
                </Text>
              </Text>
            </View>
          </View>

          {/* Copyright Line */}
          <View className="mt-8 items-center">
            <Text className="text-[11px] text-slate-400">
              Copyright © {new Date().getFullYear()} - Karkaii
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
