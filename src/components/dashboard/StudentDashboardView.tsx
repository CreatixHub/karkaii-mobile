import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { STUDENT_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface StudentDashboardViewProps {
  greeting: string;
}

export default function StudentDashboardView({ greeting }: StudentDashboardViewProps) {
  const data = STUDENT_DASHBOARD_DATA;

  return (
    <View>
      {/* 1. STUDENT WELCOME BANNER */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5EE1]">
            <Feather name="user" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B]">
              {greeting}, {data.profile.name}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">
              {data.profile.grade} • Roll No. {data.profile.rollNo} • {data.profile.stream}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push('/(app)/academic')}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3.5 py-2 active:bg-[#2F49B3]"
          >
            <Feather name="calendar" size={14} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">My Schedule</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/academic')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="file-text" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Assignments</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/finance')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="credit-card" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Fee Status</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. STUDENT KPI TILES */}
      <View className="mb-4 flex-row flex-wrap justify-between gap-y-2.5">
        {data.kpis.map((kpi) => (
          <View
            key={kpi.id}
            className="w-[48%] rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-black/5"
          >
            <View className="flex-row items-center justify-between">
              <View
                className="h-9 w-9 items-center justify-center rounded-xl"
                style={{ backgroundColor: kpi.iconBg }}
              >
                <Feather name={kpi.icon as any} size={18} color={kpi.iconColor} />
              </View>
              <View className="rounded-full bg-slate-100 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-slate-600">{kpi.delta}</Text>
              </View>
            </View>
            <Text className="mt-2.5 text-xl font-extrabold text-[#202C4B]">{kpi.value}</Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* 3. TODAY'S CLASSES */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLASSES
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              {"Today's Lectures"}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/academic')}>
            <Text className="text-xs font-semibold text-[#3D5EE1]">Timetable →</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.todayClasses.map((cls) => (
            <View
              key={cls.id}
              className={`rounded-2xl border p-3.5 ${
                cls.active
                  ? 'border-[#3D5EE1]/30 bg-[#3D5EE1]/5'
                  : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-bold text-[#202C4B]">{cls.subject}</Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    cls.active ? 'bg-[#3D5EE1]' : 'bg-slate-200'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      cls.active ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {cls.time}
                  </Text>
                </View>
              </View>

              <View className="mt-2 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Feather name="user-check" size={12} color="#64748b" />
                  <Text className="ml-1 text-[11px] text-slate-600 font-medium">
                    {cls.teacher}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Feather name="map-pin" size={12} color="#64748b" />
                  <Text className="ml-1 text-[11px] text-slate-500 font-medium">
                    {cls.room}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. RECENT GRADES & TEST SCORES */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ACADEMICS
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Recent Test Scores
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/reports')}>
            <Text className="text-xs font-semibold text-[#3D5EE1]">All Results →</Text>
          </Pressable>
        </View>

        <View className="gap-y-3">
          {data.recentGrades.map((grade) => (
            <View
              key={grade.subject}
              className="flex-row items-center justify-between border-b border-slate-100 pb-2.5"
            >
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-slate-800">{grade.subject}</Text>
                <Text className="mt-0.5 text-[11px] text-slate-400">
                  {grade.date} • {grade.remark}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-[#3D5EE1]">{grade.score}</Text>
                <View className="mt-0.5 rounded bg-emerald-50 px-1.5 py-0.5">
                  <Text className="text-[10px] font-bold text-emerald-600">{grade.grade}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 5. HOMEWORK & ASSIGNMENTS */}
      <View className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <Text className="text-base font-bold text-[#202C4B]">Assignments & Tasks</Text>
          <Pressable onPress={() => router.push('/(app)/academic')}>
            <Text className="text-xs font-semibold text-[#3D5EE1]">View All →</Text>
          </Pressable>
        </View>

        <View className="gap-y-3">
          {data.homework.map((hw) => (
            <View
              key={hw.id}
              className="flex-row items-center justify-between border-b border-slate-100 pb-2.5"
            >
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                  {hw.title}
                </Text>
                <Text className="mt-0.5 text-[11px] text-slate-500">
                  {hw.subject} • Due: {hw.due}
                </Text>
              </View>
              <View
                className={`rounded-full px-2 py-0.5 ${
                  hw.status === 'Done'
                    ? 'bg-emerald-100'
                    : hw.urgent
                      ? 'bg-red-100'
                      : 'bg-amber-100'
                }`}
              >
                <Text
                  className={`text-[10px] font-bold ${
                    hw.status === 'Done'
                      ? 'text-emerald-700'
                      : hw.urgent
                        ? 'text-red-700'
                        : 'text-amber-700'
                  }`}
                >
                  {hw.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
