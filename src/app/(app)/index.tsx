import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_DASHBOARD_DATA } from '@/data/adminDashboardMock';
import AdminDashboardView from '@/components/dashboard/AdminDashboardView';
import TeacherDashboardView from '@/components/dashboard/TeacherDashboardView';
import StudentDashboardView from '@/components/dashboard/StudentDashboardView';
import ParentDashboardView from '@/components/dashboard/ParentDashboardView';

type DashboardRole = 'admin' | 'teacher' | 'student' | 'parent';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const userRole = (user?.role || '').toLowerCase();
  const initialRole: DashboardRole =
    userRole === 'teacher' || userRole === 'student' || userRole === 'parent'
      ? (userRole as DashboardRole)
      : 'admin';
  const [activeRole, setActiveRole] = useState<DashboardRole>(initialRole);
  const [searchQuery, setSearchQuery] = useState('');

  const greeting = useMemo(() => getGreeting(), []);
  const data = ADMIN_DASHBOARD_DATA;

  const displayName = user?.name || 'Administrator';
  const schoolName = user?.organization?.name || data.schoolName;

  return (
    <ScrollView
      className="flex-1 bg-[#f4f6fb]"
      contentContainerClassName="p-4 pb-14"
      showsVerticalScrollIndicator={false}
    >
      {/* Top Academic Year & School Identity Pill */}
      <View className="mb-3 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-[#3D5EE1]/10">
            <Feather name="book-open" size={16} color="#3D5EE1" />
          </View>
          <View className="ml-2.5">
            <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
              {schoolName}
            </Text>
            <Text className="text-[10px] text-slate-400">Academic Year: 2026 / 2027</Text>
          </View>
        </View>

        <View className="rounded-full bg-white border border-slate-200 px-2.5 py-1 flex-row items-center shadow-sm shadow-black/5">
          <Feather name="calendar" size={12} color="#3D5EE1" />
          <Text className="ml-1 text-[11px] font-semibold text-slate-700">AY 2026-27</Text>
        </View>
      </View>

      {/* Global Quick Search Bar */}
      <View className="mb-4 flex-row items-center rounded-2xl border border-slate-200 bg-white px-3.5 py-2.5 shadow-sm shadow-black/5">
        <Feather name="search" size={16} color="#94a3b8" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search students, staff, invoices…"
          placeholderTextColor="#94a3b8"
          className="ml-2.5 flex-1 text-xs text-[#202C4B] p-0"
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
            <Feather name="x-circle" size={15} color="#94a3b8" />
          </Pressable>
        ) : null}
      </View>

      {/* Dashboard Role View Switcher */}
      <View style={styles.roleContainer}>
        {(['admin', 'teacher', 'student', 'parent'] as DashboardRole[]).map((role) => {
          const isActive = activeRole === role;
          const label =
            role === 'admin'
              ? 'Admin'
              : role === 'teacher'
                ? 'Teacher'
                : role === 'student'
                  ? 'Student'
                  : 'Parent';
          return (
            <Pressable
              key={role}
              onPress={() => setActiveRole(role)}
              style={[styles.roleTab, isActive && styles.activeRoleTab]}
            >
              <Text style={[styles.roleTabText, isActive && styles.activeRoleTabText]}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Role-Specific Dashboard Views */}
      {activeRole === 'admin' && (
        <AdminDashboardView
          data={data}
          greeting={greeting}
          displayName={displayName}
          schoolName={schoolName}
        />
      )}

      {activeRole === 'teacher' && <TeacherDashboardView greeting={greeting} displayName={displayName} />}

      {activeRole === 'student' && <StudentDashboardView greeting={greeting} displayName={displayName} />}

      {activeRole === 'parent' && <ParentDashboardView greeting={greeting} displayName={displayName} />}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  roleContainer: {
    marginBottom: 16,
    flexDirection: 'row',
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
    padding: 4,
  },
  roleTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 8,
  },
  activeRoleTab: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  roleTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  activeRoleTabText: {
    color: '#3D5EE1',
    fontWeight: '700',
  },
});
