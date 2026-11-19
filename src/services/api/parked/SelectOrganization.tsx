import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '@/services/api/useRealAuth';
import type { OrganizationInfo } from '@/types/auth';

export default function SelectOrganizationScreen() {
  const { user, organizations, switchOrganization, isLoading } = useAuth();
  const [switchingSlug, setSwitchingSlug] = useState<string | null>(null);

  const handleSelect = async (org: OrganizationInfo) => {
    setSwitchingSlug(org.slug);
    try {
      await switchOrganization(org.slug);
      router.replace('/(app)');
    } catch {
      setSwitchingSlug(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#f4f6fb]">
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-5 pb-12 flex-grow justify-center"
      >
        {/* Logo */}
        <View className="items-center mb-6">
          <Image
            source={require('../../../assets/karkaii-logo.png')}
            style={{ width: 180, height: 46 }}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
        <View className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm shadow-black/5">
          <View className="mb-4">
            <Text className="text-xl font-bold text-[#202C4B]">Select School / Campus</Text>
            <Text className="mt-1 text-xs text-[#515B73]">
              You have access to multiple schools. Choose which campus you want to manage today.
            </Text>
          </View>

          {/* Organizations List */}
          <View className="gap-y-2.5">
            {organizations.length === 0 ? (
              <View className="py-6 items-center">
                <Text className="text-xs text-slate-500">
                  {user?.organization?.name || 'Your Default School Campus'}
                </Text>
                <Pressable
                  onPress={() => router.replace('/(app)')}
                  className="mt-3 rounded-xl bg-[#3D5EE1] px-4 py-2"
                >
                  <Text className="text-xs font-semibold text-white">Continue to Dashboard</Text>
                </Pressable>
              </View>
            ) : (
              organizations.map((org) => {
                const isCurrent = user?.organization?.slug === org.slug;
                const isSwitching = switchingSlug === org.slug;

                return (
                  <Pressable
                    key={org.slug}
                    onPress={() => handleSelect(org)}
                    disabled={Boolean(switchingSlug) || isLoading}
                    className={`flex-row items-center rounded-xl border p-4 active:bg-slate-50 ${
                      isCurrent
                        ? 'border-[#3D5EE1] bg-[#3D5EE1]/5'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <View
                      className={`h-10 w-10 items-center justify-center rounded-xl ${
                        isCurrent ? 'bg-[#3D5EE1]' : 'bg-slate-100'
                      }`}
                    >
                      <Feather
                        name="home"
                        size={18}
                        color={isCurrent ? '#ffffff' : '#64748b'}
                      />
                    </View>

                    <View className="ml-3 flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-sm font-bold text-[#202C4B]">{org.name}</Text>
                        {isCurrent ? (
                          <View className="ml-2 rounded-full bg-[#3D5EE1]/10 px-2 py-0.5">
                            <Text className="text-[10px] font-bold text-[#3D5EE1]">Active</Text>
                          </View>
                        ) : null}
                      </View>
                      <Text className="mt-0.5 text-xs text-slate-400 font-mono">
                        ID: {org.slug}
                      </Text>
                    </View>

                    {isSwitching ? (
                      <ActivityIndicator size="small" color="#3D5EE1" />
                    ) : (
                      <Feather
                        name="chevron-right"
                        size={18}
                        color={isCurrent ? '#3D5EE1' : '#94a3b8'}
                      />
                    )}
                  </Pressable>
                );
              })
            )}
          </View>

          {/* Skip / Close */}
          <Pressable
            onPress={() => router.replace('/(app)')}
            className="mt-5 items-center py-2"
          >
            <Text className="text-xs font-semibold text-slate-500">Go to Dashboard</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
