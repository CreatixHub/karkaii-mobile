import React, { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_DASHBOARD_DATA } from '@/data/adminDashboardMock';
import AdminDashboardView from '@/components/dashboard/AdminDashboardView';
import TeacherDashboardView from '@/components/dashboard/TeacherDashboardView';
import StudentDashboardView from '@/components/dashboard/StudentDashboardView';
import ParentDashboardView from '@/components/dashboard/ParentDashboardView';

type Kind = 'admin' | 'teacher' | 'student' | 'parent';

function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
}

/** One of the four role dashboards. Which ones a role may open is decided by access.ts, not here. */
export function DashboardPage({ kind }: { kind: Kind }) {
  const { user } = useAuth();
  const hello = useMemo(() => greeting(), []);
  const name = user?.name ?? 'User';
  const school = user?.school ?? ADMIN_DASHBOARD_DATA.schoolName;

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]" contentContainerClassName="p-4 pb-14" showsVerticalScrollIndicator={false}>
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#3D5EE1]/10">
            <Feather name="book-open" size={16} color="#3D5EE1" />
          </View>
          <View className="ml-2.5">
            <Text className="text-xs font-bold text-slate-800 dark:text-[#EFEFF2]" numberOfLines={1}>{school}</Text>
            <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">Academic Year: 2026 / 2027</Text>
          </View>
        </View>
        <View className="flex-row items-center rounded-full border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-2.5 py-1">
          <Feather name="calendar" size={12} color="#3D5EE1" />
          <Text className="ml-1 text-[11px] font-semibold text-slate-700 dark:text-[#d6d4de]">AY 2026-27</Text>
        </View>
      </View>

      {kind === 'admin' ? <AdminDashboardView data={ADMIN_DASHBOARD_DATA} greeting={hello} displayName={name} schoolName={school} /> : null}
      {kind === 'teacher' ? <TeacherDashboardView greeting={hello} displayName={name} /> : null}
      {kind === 'student' ? <StudentDashboardView greeting={hello} displayName={name} /> : null}
      {kind === 'parent' ? <ParentDashboardView greeting={hello} displayName={name} /> : null}
    </ScrollView>
  );
}
