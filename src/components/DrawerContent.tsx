import React, { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router, usePathname, type Href } from 'expo-router';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { useAuth } from '@/hooks/useAuth';
import { roleLabel, visibleMenu } from '@/core/auth/access';
import { pageHref } from '@/core/nav/menu';

/** Sections already rebuilt on the new engine expand to their pages; the rest still open their legacy screen. */
export const REBUILT_SECTIONS = new Set(['dashboard', 'people', 'academic', 'hrm', 'finance']);
const LEGACY_EXTRAS = [
  { key: 'communication', label: 'Communication', icon: 'message-square' as const },
  { key: 'administration', label: 'Administration', icon: 'settings' as const },
];

export default function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const { user, role, logout } = useAuth();
  const pathname = usePathname();
  const menu = visibleMenu(role);
  const activeSection = pathname.split('/')[1] || 'dashboard';
  const [open, setOpen] = useState<string | null>(activeSection);

  const go = (href: string) => {
    navigation.closeDrawer();
    router.push(href as Href);
  };

  const signOut = () =>
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="px-5 pb-3 pt-2">
        <Image source={require('../../assets/icon.png')} className="h-10 w-10 rounded-xl" resizeMode="contain" />
        <Text className="mt-3 text-base font-bold text-slate-900" numberOfLines={1}>{user?.school ?? 'Karkaii'}</Text>
        <Pressable onPress={() => go('/profile')} className="mt-2.5 flex-row items-center rounded-xl border border-slate-100 bg-slate-50 p-2 active:bg-slate-100">
          <View className="h-9 w-9 items-center justify-center rounded-full bg-[#3D5EE1]">
            <Text className="text-sm font-bold text-white">{(user?.name ?? '?').charAt(0).toUpperCase()}</Text>
          </View>
          <View className="ml-2.5 flex-1">
            <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>{user?.name}</Text>
            <Text className="text-[10px] font-medium text-indigo-600">{roleLabel(role)} · View Profile</Text>
          </View>
          <Feather name="chevron-right" size={14} color="#94a3b8" />
        </Pressable>
      </View>
      <View className="h-px bg-slate-100" />

      <ScrollView className="flex-1 px-3 pt-2" showsVerticalScrollIndicator={false}>
        {menu.map((section) => {
          const expanded = open === section.key;
          const rebuilt = REBUILT_SECTIONS.has(section.key);
          const isActive = activeSection === section.key;
          return (
            <View key={section.key} className="mb-1">
              <Pressable
                onPress={() => (rebuilt ? setOpen(expanded ? null : section.key) : go(`/${section.key}`))}
                className={`flex-row items-center rounded-xl px-3 py-2.5 ${isActive ? 'bg-[#3D5EE11A]' : ''}`}
              >
                <View style={{ backgroundColor: `${section.color}1A` }} className="h-7 w-7 items-center justify-center rounded-lg">
                  <Feather name={section.icon} size={14} color={section.color} />
                </View>
                <Text className={`ml-3 flex-1 text-sm ${isActive ? 'font-bold text-[#1b2240]' : 'font-semibold text-slate-700'}`}>{section.label}</Text>
                {rebuilt ? <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={15} color="#94a3b8" /> : <Text className="text-[9px] font-bold text-amber-600">LEGACY</Text>}
              </Pressable>

              {rebuilt && expanded
                ? section.modules.map((m) => (
                    <View key={m.label} className="ml-5 mt-1 border-l border-slate-100 pl-3">
                      {m.pages.length > 1 ? <Text className="mb-0.5 mt-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">{m.label}</Text> : null}
                      {m.pages.map((p) => {
                        const href = pageHref(section.key, p.key);
                        const on = pathname === href;
                        return (
                          <Pressable key={p.key} onPress={() => go(href)} className={`flex-row items-center rounded-lg px-2 py-2 ${on ? 'bg-[#3D5EE11A]' : 'active:bg-slate-50'}`}>
                            <Feather name={p.icon} size={13} color={on ? '#3D5EE1' : '#6A7287'} />
                            <Text className={`ml-2.5 flex-1 text-[13px] ${on ? 'font-bold text-[#3D5EE1]' : 'text-slate-600'}`} numberOfLines={1}>{p.label}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  ))
                : null}
            </View>
          );
        })}

        {role === 'admin' ? (
          <View className="mt-2 border-t border-slate-100 pt-2">
            <Text className="mb-1 px-3 text-[10px] font-extrabold uppercase tracking-wide text-slate-400">Additional modules</Text>
            {LEGACY_EXTRAS.map((x) => (
              <Pressable key={x.key} onPress={() => go(`/${x.key}`)} className="flex-row items-center rounded-xl px-3 py-2.5 active:bg-slate-50">
                <Feather name={x.icon} size={16} color="#6A7287" />
                <Text className="ml-3 flex-1 text-sm text-slate-600">{x.label}</Text>
                <Text className="text-[9px] font-bold text-amber-600">LEGACY</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </ScrollView>

      <View className="border-t border-slate-100 px-4 py-3">
        <Pressable onPress={() => go('/profile')} className="flex-row items-center rounded-xl px-3 py-2.5 active:bg-slate-50">
          <Feather name="user" size={17} color="#6A7287" />
          <Text className="ml-3 text-sm text-slate-600">My Profile</Text>
        </Pressable>
        <Pressable onPress={signOut} className="flex-row items-center rounded-xl px-3 py-2.5 active:bg-red-50">
          <Feather name="log-out" size={17} color="#DC2626" />
          <Text className="ml-3 text-sm font-semibold text-red-600">Sign Out</Text>
        </Pressable>
        <Text className="mt-1 px-3 text-[10px] text-slate-400">Karkaii Mobile · v1.0.0 · mock data</Text>
      </View>
    </SafeAreaView>
  );
}
