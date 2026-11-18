import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
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

const ROLES = [
  { value: '', label: 'My main role (automatic)' },
  { value: 'admin', label: 'Admin' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'student', label: 'Student' },
  { value: 'parent', label: 'Parent' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'librarian', label: 'Librarian' },
  { value: 'warden', label: 'Warden' },
  { value: 'transport_manager', label: 'Transport manager' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'security', label: 'Security' },
];

export default function LoginScreen() {
  const { login, isLoggingIn, error, clearError } = useAuth();

  const [selectedRole, setSelectedRole] = useState('');
  const [isRolePickerOpen, setIsRolePickerOpen] = useState(false);
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
        role: selectedRole || undefined,
        rememberMe,
      });

      // Navigate to app drawer
      router.replace('/(app)');
    } catch {
      // Error is caught and surfaced in context
    }
  };

  const currentRoleLabel =
    ROLES.find((r) => r.value === selectedRole)?.label || 'My main role (automatic)';

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

            {/* Sign in as (Role Selector) */}
            <View className="mb-4">
              <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">Sign in as</Text>
              <Pressable
                onPress={() => setIsRolePickerOpen(true)}
                className="flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-3 active:bg-slate-50"
              >
                <Text className="text-sm text-[#202C4B]" numberOfLines={1}>
                  {currentRoleLabel}
                </Text>
                <Feather name="chevron-down" size={16} color="#6A7287" />
              </Pressable>
            </View>

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

            {/* Quick Demo Role Logins */}
            <View className="mt-5 border-t border-slate-100 pt-4">
              <Text className="text-center text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                Quick Demo Access (Static Data Mode)
              </Text>
              <View className="flex-row flex-wrap justify-between gap-2">
                {[
                  { role: 'admin', label: 'Admin', icon: 'shield', color: '#3D5EE1' },
                  { role: 'teacher', label: 'Teacher', icon: 'user', color: '#0ca678' },
                  { role: 'student', label: 'Student', icon: 'book', color: '#f39c12' },
                  { role: 'parent', label: 'Parent', icon: 'heart', color: '#e83e8c' },
                ].map((demo) => (
                  <Pressable
                    key={demo.role}
                    onPress={async () => {
                      try {
                        await login({
                          email: `${demo.role}@karkaii.com`,
                          password: 'password123',
                          role: demo.role,
                          rememberMe: true,
                        });
                        router.replace('/(app)');
                      } catch (e) {
                        console.warn(e);
                      }
                    }}
                    className="flex-1 min-w-[45%] flex-row items-center justify-center rounded-xl bg-slate-50 border border-slate-200 py-2.5 px-2 active:bg-slate-100"
                  >
                    <Feather name={demo.icon as any} size={13} color={demo.color} />
                    <Text className="ml-1.5 text-xs font-semibold text-slate-700">
                      {demo.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Sign Up Link */}
            <View className="mt-5 items-center">
              <Text className="text-xs text-slate-600">
                Don’t have an account?{' '}
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

      {/* Role Selection Modal */}
      <Modal
        visible={isRolePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRolePickerOpen(false)}
      >
        <Pressable
          onPress={() => setIsRolePickerOpen(false)}
          className="flex-1 justify-end bg-black/40"
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="rounded-t-3xl bg-white p-5 max-h-[70%]"
          >
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Sign in as</Text>
              <Pressable onPress={() => setIsRolePickerOpen(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-2" showsVerticalScrollIndicator={false}>
              {ROLES.map((role) => {
                const isSelected = selectedRole === role.value;
                return (
                  <Pressable
                    key={role.value || 'auto'}
                    onPress={() => {
                      setSelectedRole(role.value);
                      setIsRolePickerOpen(false);
                    }}
                    className={`flex-row items-center justify-between py-3 px-3 rounded-xl mb-1 ${
                      isSelected ? 'bg-[#3D5EE1]/10' : 'active:bg-slate-50'
                    }`}
                  >
                    <Text
                      className={`text-sm ${
                        isSelected ? 'font-bold text-[#3D5EE1]' : 'text-slate-700'
                      }`}
                    >
                      {role.label}
                    </Text>
                    {isSelected ? (
                      <Feather name="check" size={16} color="#3D5EE1" />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
