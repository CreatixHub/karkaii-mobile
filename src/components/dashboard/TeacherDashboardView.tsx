import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { TEACHER_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface TeacherDashboardViewProps {
  greeting: string;
}

export default function TeacherDashboardView({ greeting }: TeacherDashboardViewProps) {
  const data = TEACHER_DASHBOARD_DATA;

  return (
    <View>
      {/* 1. TEACHER WELCOME BANNER */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]">
            <Feather name="book-open" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B]">
              {greeting}, {data.profile.name}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">
              {data.profile.role} • {data.profile.classTeacherOf}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push('/(app)/academic')}
            className="flex-row items-center rounded-xl bg-[#10b981] px-3.5 py-2 active:bg-[#059669]"
          >
            <Feather name="check-square" size={14} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">Mark Attendance</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/academic')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="calendar" size={14} color="#10b981" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">My Timetable</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/reports')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="award" size={14} color="#10b981" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Enter Marks</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. TEACHER KPI TILES */}
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

      {/* 3. TODAY'S TEACHING SCHEDULE */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TIMETABLE
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              {"Today's Classes"}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/academic')}>
            <Text className="text-xs font-semibold text-[#10b981]">Full Schedule →</Text>
          </Pressable>
        </View>

        <View className="gap-y-3">
          {data.todaySchedule.map((slot) => {
            const isInProgress = slot.status === 'In Progress';
            return (
              <View
                key={slot.id}
                className={`rounded-2xl border p-3.5 ${
                  isInProgress
                    ? 'border-emerald-200 bg-emerald-50/40'
                    : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View
                      className="h-2 w-2 rounded-full mr-2"
                      style={{ backgroundColor: slot.color }}
                    />
                    <Text className="text-xs font-bold text-slate-800">{slot.period}</Text>
                    <Text className="mx-1.5 text-slate-300">•</Text>
                    <Text className="text-xs text-slate-500 font-medium">{slot.time}</Text>
                  </View>
                  <View
                    className={`rounded-full px-2 py-0.5 ${
                      isInProgress ? 'bg-emerald-100' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-[10px] font-bold ${
                        isInProgress ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {slot.status}
                    </Text>
                  </View>
                </View>

                <Text className="mt-2 text-sm font-bold text-[#202C4B]">{slot.subject}</Text>

                <View className="mt-2 flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Feather name="users" size={12} color="#64748b" />
                    <Text className="ml-1 text-[11px] font-semibold text-slate-600">
                      {slot.grade}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="map-pin" size={12} color="#64748b" />
                    <Text className="ml-1 text-[11px] font-medium text-slate-500">
                      {slot.room}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. CLASS PERFORMANCE & SYLLABUS COMPLETION */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ACADEMIC METRICS
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Class Progress & Pass Rate
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-emerald-600">97.3% Avg Pass</Text>
          </View>
        </View>

        <View className="gap-y-3.5">
          {data.classPerformance.map((item) => (
            <View key={item.className}>
              <View className="flex-row items-center justify-between mb-1.5">
                <View>
                  <Text className="text-xs font-bold text-slate-800">{item.className}</Text>
                  <Text className="text-[11px] text-slate-400">{item.subject}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-xs font-bold text-[#10b981]">{item.avgScore} Avg</Text>
                  <Text className="text-[10px] text-slate-400">Pass: {item.passRate}</Text>
                </View>
              </View>
              <View className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <View
                  style={{ width: `${item.syllabusCompleted}%` }}
                  className="h-full rounded-full bg-[#10b981]"
                />
              </View>
              <Text className="mt-1 text-[10px] text-slate-400 font-medium">
                Syllabus: {item.syllabusCompleted}% completed
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. RECENT SUBMISSIONS */}
      <View className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <Text className="text-base font-bold text-[#202C4B]">Recent Student Submissions</Text>
          <Pressable onPress={() => router.push('/(app)/academic')}>
            <Text className="text-xs font-semibold text-[#10b981]">View All →</Text>
          </Pressable>
        </View>

        <View className="gap-y-3">
          {data.recentSubmissions.map((sub) => (
            <View key={sub.id} className="flex-row items-center justify-between border-b border-slate-100 pb-2.5">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
                  {sub.title}
                </Text>
                <Text className="mt-0.5 text-[11px] text-slate-500">
                  {sub.student} • {sub.grade}
                </Text>
              </View>
              <View className="items-end">
                <View className="rounded-full bg-slate-100 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-slate-600">{sub.status}</Text>
                </View>
                <Text className="mt-0.5 text-[10px] text-slate-400">{sub.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
