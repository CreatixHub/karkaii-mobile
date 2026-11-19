import React from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function ProfileScreen() {
  const { user, organizations, logout } = useAuth();

  const displayName = user?.name || 'School Staff';
  const roleLabel = (user?.role || 'admin').toUpperCase();
  const email = user?.email || 'user@karkaii-school.org';
  const username = user?.username || 'user';
  const phone = user?.phone || '+91 98450 12345';
  const schoolName = user?.organization?.name || 'Karkaii International Academy';

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out from your school account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Profile Header Hero Card */}
      <View className="rounded-3xl bg-white p-6 border border-slate-200 shadow-sm mb-4 items-center">
        <View className="relative mb-3">
          <View className="h-20 w-20 rounded-full bg-indigo-600 items-center justify-center border-4 border-indigo-100 shadow-sm">
            <Text className="text-3xl font-extrabold text-white">
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="absolute bottom-0 right-0 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
            <Feather name="check" size={10} color="#fff" />
          </View>
        </View>

        <Text className="text-xl font-bold text-slate-800 text-center">{displayName}</Text>
        <Text className="text-xs text-slate-500 mt-0.5">{email}</Text>

        <View className="mt-3 flex-row items-center gap-x-2">
          <View className="rounded-full bg-indigo-50 border border-indigo-200 px-3 py-1">
            <Text className="text-xs font-bold text-indigo-700">{roleLabel}</Text>
          </View>
          <View className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-xs font-bold text-emerald-700">Active</Text>
          </View>
        </View>

        <View className="mt-4 w-full pt-3 border-t border-slate-100 flex-row items-center justify-center">
          <Feather name="shield" size={13} color="#6366f1" />
          <Text className="text-xs font-medium text-slate-600 ml-1.5">{schoolName}</Text>
        </View>
      </View>

      {/* Account Details Card */}
      <View className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Personal Information
        </Text>

        <View className="space-y-3">
          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Feather name="user" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">Display Name</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">{displayName}</Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Feather name="at-sign" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">Username</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">@{username}</Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Feather name="mail" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">Email Address</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">{email}</Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Feather name="phone" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">Phone Contact</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">{phone}</Text>
          </View>
        </View>
      </View>

      {/* Campus Organization & Security */}
      <View className="rounded-2xl bg-white p-4 border border-slate-200 shadow-sm mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Campus Organization & Security
        </Text>

        <View className="space-y-3">
          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Feather name="book" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">School Campus</Text>
            </View>
            <Text className="text-xs font-semibold text-slate-800">{schoolName}</Text>
          </View>

          <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
            <View className="flex-row items-center">
              <Feather name="calendar" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">Academic Session</Text>
            </View>
            <Text className="text-xs font-semibold text-indigo-700">AY 2026–2027</Text>
          </View>

          <View className="flex-row items-center justify-between py-2">
            <View className="flex-row items-center">
              <Feather name="lock" size={15} color="#64748b" />
              <Text className="text-xs text-slate-500 ml-2.5">Session Security</Text>
            </View>
            <Text className="text-xs font-semibold text-emerald-600">Local Encrypted</Text>
          </View>
        </View>

        {organizations && organizations.length > 1 && (
          <Pressable
            onPress={() => router.push('/(auth)/select-organization')}
            className="mt-3 flex-row items-center justify-center bg-slate-50 border border-slate-200 py-2.5 rounded-xl active:bg-slate-100"
          >
            <Feather name="refresh-cw" size={13} color="#475569" />
            <Text className="text-xs font-semibold text-slate-700 ml-1.5">
              Switch Campus ({organizations.length} Available)
            </Text>
          </Pressable>
        )}
      </View>

      {/* Sign Out Action Button */}
      <Pressable
        onPress={handleSignOut}
        className="flex-row items-center justify-center bg-rose-50 border border-rose-200 py-3.5 rounded-2xl active:bg-rose-100"
      >
        <Feather name="log-out" size={16} color="#e11d48" />
        <Text className="text-xs font-bold text-rose-700 ml-2">Sign Out of Account</Text>
      </Pressable>
    </ScrollView>
  );
}
