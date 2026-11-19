import React from 'react';
import { Alert, Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useAuth } from '@/hooks/useAuth';
import { MENU_ITEMS } from '@/data/menu';

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const activeRouteName = state.routeNames[state.index];
  const { user, organizations, logout } = useAuth();

  const schoolName = user?.organization?.name || 'Karkaii Demo School';
  const userName = user?.name || 'School Staff';
  const userRole = user?.role ? user.role.toUpperCase() : 'ADMIN';
  const hasMultipleOrgs = organizations && organizations.length > 1;

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
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      {/* School Brand & User Profile Header */}
      <View className="px-5 pb-4 pt-2">
        <Image
          source={require('../../assets/icon.png')}
          className="h-10 w-10 rounded-xl"
          resizeMode="contain"
        />
        <View className="mt-3 flex-row items-center justify-between">
          <Text className="text-base font-bold text-slate-900 flex-1" numberOfLines={1}>
            {schoolName}
          </Text>
          {hasMultipleOrgs ? (
            <Pressable
              onPress={() => router.push('/(auth)/select-organization')}
              className="ml-2 rounded-lg bg-slate-100 px-2 py-1"
            >
              <Text className="text-[10px] font-bold text-[#3D5EE1]">Switch</Text>
            </Pressable>
          ) : null}
        </View>

        <Pressable
          onPress={() => navigation.navigate('profile')}
          className="mt-2.5 flex-row items-center p-2 rounded-xl bg-slate-50 border border-slate-100 active:bg-slate-100"
        >
          <View className="h-9 w-9 items-center justify-center rounded-full bg-[#3D5EE1]">
            <Text className="text-sm font-bold text-white">
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
              {userName}
            </Text>
            <Text className="text-[10px] font-medium text-indigo-600">
              {userRole} · View Profile
            </Text>
          </View>
          <Feather name="chevron-right" size={14} color="#94a3b8" />
        </Pressable>
      </View>

      <View className="h-px bg-slate-100" />

      {/* Navigation Links */}
      <View className="flex-1 px-3 pt-3">
        {MENU_ITEMS.map((item) => {
          const isActive =
            activeRouteName === item.key ||
            (item.key === 'dashboard' && activeRouteName === 'index');
          return (
            <Pressable
              key={item.key}
              onPress={() =>
                navigation.navigate(item.key === 'dashboard' ? 'index' : item.key)
              }
              className={`mb-1 flex-row items-center rounded-xl px-3 py-2.5 ${
                isActive ? 'bg-[#3D5EE11A]' : ''
              }`}
            >
              <Feather
                name={item.icon as any}
                size={18}
                color={isActive ? '#3D5EE1' : '#6A7287'}
              />
              <Text
                className={`ml-3 text-sm ${
                  isActive ? 'font-semibold text-[#3D5EE1]' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => navigation.navigate('profile')}
          className={`mb-1 flex-row items-center rounded-xl px-3 py-2.5 ${
            activeRouteName === 'profile' ? 'bg-[#3D5EE11A]' : ''
          }`}
        >
          <Feather
            name="user"
            size={18}
            color={activeRouteName === 'profile' ? '#3D5EE1' : '#6A7287'}
          />
          <Text
            className={`ml-3 text-sm ${
              activeRouteName === 'profile' ? 'font-semibold text-[#3D5EE1]' : 'text-slate-600'
            }`}
          >
            My Profile
          </Text>
        </Pressable>
      </View>

      {/* Sign Out Button & Version Footer */}
      <View className="border-t border-slate-100 px-4 py-3">
        <Pressable
          onPress={handleSignOut}
          className="flex-row items-center rounded-xl px-3 py-2.5 active:bg-red-50"
        >
          <Feather name="log-out" size={17} color="#DC2626" />
          <Text className="ml-3 text-sm font-semibold text-red-600">Sign Out</Text>
        </Pressable>

        <Text className="mt-2 px-3 text-[10px] text-slate-400">
          Karkaii Mobile · v1.0.0
        </Text>
      </View>
    </SafeAreaView>
  );
}
