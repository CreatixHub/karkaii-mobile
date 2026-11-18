import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import type { ADMIN_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface AdminDashboardViewProps {
  data: typeof ADMIN_DASHBOARD_DATA;
  greeting: string;
  displayName: string;
  schoolName: string;
}

export default function AdminDashboardView({
  data,
  greeting,
  displayName,
  schoolName,
}: AdminDashboardViewProps) {
  return (
    <View>
      {/* 1. WELCOME BANNER */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5EE1]">
            <Feather name="award" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B]">
              {greeting}, {displayName}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">
              {schoolName} • {data.dateFormatted}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push('/(app)/people')}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3.5 py-2 active:bg-[#2F49B3]"
          >
            <Feather name="plus-circle" size={14} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">New Admission</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/finance')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="credit-card" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Collect Fees</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/reports')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="bar-chart-2" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Report</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/communication')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="message-square" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Notice Board</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. TOP KPI TILES */}
      <View className="mb-4 flex-row flex-wrap justify-between gap-y-2.5">
        {data.welcomeKpis.map((kpi) => (
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
              <View className="flex-row items-center">
                <Feather
                  name={kpi.deltaDirection === 'up' ? 'arrow-up-right' : 'clock'}
                  size={12}
                  color={kpi.deltaDirection === 'up' ? '#10b981' : '#8b5cf6'}
                />
                <Text
                  className="ml-0.5 text-[10px] font-bold"
                  style={{ color: kpi.deltaDirection === 'up' ? '#10b981' : '#8b5cf6' }}
                >
                  {kpi.delta}
                </Text>
              </View>
            </View>
            <Text className="mt-2.5 text-xl font-extrabold text-[#202C4B]">{kpi.value}</Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* 3. PERFORMER SPOTLIGHT CARDS */}
      <View className="mb-4 gap-y-3">
        {/* Best Teacher Green Card */}
        <View className="rounded-3xl bg-[#10b981] p-5 shadow-sm shadow-emerald-500/20">
          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-white/20 px-2.5 py-1 flex-row items-center">
              <Feather name="award" size={12} color="#ffffff" />
              <Text className="ml-1 text-[10px] font-bold text-white">Best Teacher</Text>
            </View>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather key={s} name="star" size={12} color="#fef08a" style={{ marginRight: 2 }} />
              ))}
            </View>
          </View>

          <Text className="mt-3 text-lg font-bold text-white">{data.bestTeacher.name}</Text>
          <Text className="text-xs text-white/80">{data.bestTeacher.department}</Text>

          <View className="mt-2.5 self-start rounded-full bg-white/15 px-3 py-1">
            <Text className="text-[11px] font-semibold text-white">
              🏅 {data.bestTeacher.award}
            </Text>
          </View>

          <View className="mt-4 flex-row border-t border-white/20 pt-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{data.bestTeacher.rating}</Text>
              <Text className="text-[10px] text-white/75">Rating</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{data.bestTeacher.passRate}</Text>
              <Text className="text-[10px] text-white/75">Pass</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{data.bestTeacher.totalStudents}</Text>
              <Text className="text-[10px] text-white/75">Students</Text>
            </View>
          </View>
        </View>

        {/* Top Student Blue Card */}
        <View className="rounded-3xl bg-[#3D5EE1] p-5 shadow-sm shadow-[#3D5EE1]/20">
          <View className="flex-row items-center justify-between">
            <View className="rounded-full bg-white/20 px-2.5 py-1 flex-row items-center">
              <Feather name="user-check" size={12} color="#ffffff" />
              <Text className="ml-1 text-[10px] font-bold text-white">Top Student</Text>
            </View>
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather key={s} name="star" size={12} color="#fef08a" style={{ marginRight: 2 }} />
              ))}
            </View>
          </View>

          <Text className="mt-3 text-lg font-bold text-white">{data.topStudent.name}</Text>
          <Text className="text-xs text-white/80">{data.topStudent.grade}</Text>

          <View className="mt-2.5 self-start rounded-full bg-white/15 px-3 py-1">
            <Text className="text-[11px] font-semibold text-white">
              🥇 {data.topStudent.award}
            </Text>
          </View>

          <View className="mt-4 flex-row border-t border-white/20 pt-3">
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{data.topStudent.gpa}</Text>
              <Text className="text-[10px] text-white/75">GPA</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{data.topStudent.rank}</Text>
              <Text className="text-[10px] text-white/75">Rank</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-bold text-white">{data.topStudent.attendance}</Text>
              <Text className="text-[10px] text-white/75">Attendance</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4. CLASS-WISE DISTRIBUTION */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CAPACITY
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Class-Wise Distribution
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-emerald-600">
              {data.classDistribution.yoyGrowth}
            </Text>
          </View>
        </View>

        <Text className="mt-3 text-2xl font-black text-[#202C4B]">
          {data.classDistribution.totalEnrolled.toLocaleString()}
          <Text className="text-xs font-normal text-slate-400"> Total Enrolled</Text>
        </Text>

        <View className="mt-4 gap-y-3">
          {data.classDistribution.levels.map((lvl) => (
            <View key={lvl.name}>
              <View className="flex-row items-center justify-between mb-1.5">
                <Text className="text-xs font-semibold text-slate-700">{lvl.name}</Text>
                <Text className="text-xs font-bold text-slate-500">
                  {lvl.count} · {lvl.percent}%
                </Text>
              </View>
              <View className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <View
                  style={{ width: `${lvl.percent * 2.5}%`, backgroundColor: lvl.barColor }}
                  className="h-full rounded-full"
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 5. PERFORMANCE RISK MATRIX */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">HEAT</Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Performance Risk Matrix
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2.5 py-0.5">
            <Text className="text-[10px] font-bold text-emerald-600">
              {data.riskMatrix.healthPercent}
            </Text>
          </View>
        </View>

        <Text className="mt-3 text-2xl font-black text-[#202C4B]">
          {data.riskMatrix.totalAssessed.toLocaleString()}
          <Text className="text-xs font-normal text-slate-400"> Students Assessed</Text>
        </Text>

        {/* Multi-segment Risk Bar */}
        <View className="mt-3.5 h-2.5 w-full flex-row rounded-full bg-slate-100 overflow-hidden">
          <View style={{ width: `${data.riskMatrix.lowRisk.percent}%`, backgroundColor: '#10b981' }} />
          <View style={{ width: `${data.riskMatrix.mediumRisk.percent}%`, backgroundColor: '#f59e0b' }} />
          <View style={{ width: `${data.riskMatrix.highRisk.percent}%`, backgroundColor: '#ef4444' }} />
        </View>

        {/* Legend */}
        <View className="mt-3 flex-row justify-between">
          <View className="flex-row items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-xs text-slate-600 font-medium">
              Low: {data.riskMatrix.lowRisk.count} ({data.riskMatrix.lowRisk.percent}%)
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-amber-500 mr-1.5" />
            <Text className="text-xs text-slate-600 font-medium">
              Medium: {data.riskMatrix.mediumRisk.count} ({data.riskMatrix.mediumRisk.percent}%)
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="h-2.5 w-2.5 rounded-full bg-red-500 mr-1.5" />
            <Text className="text-xs text-slate-600 font-medium">
              High: {data.riskMatrix.highRisk.count} ({data.riskMatrix.highRisk.percent}%)
            </Text>
          </View>
        </View>
      </View>

      {/* 6. RECENT ACTIVITY AUDIT TRAIL */}
      <View className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-base font-bold text-[#202C4B]">Recent Activity</Text>
          <Pressable onPress={() => router.push('/(app)/reports')}>
            <Text className="text-xs font-semibold text-[#3D5EE1]">View All →</Text>
          </Pressable>
        </View>

        <View className="gap-y-3.5">
          {data.recentActivities.map((act) => (
            <View key={act.id} className="flex-row items-start">
              <View
                className="h-8 w-8 items-center justify-center rounded-xl mr-3"
                style={{ backgroundColor: `${act.color}15` }}
              >
                <Feather name={act.icon as any} size={15} color={act.color} />
              </View>
              <View className="flex-1">
                <Text className="text-xs font-bold text-slate-800">{act.title}</Text>
                <Text className="mt-0.5 text-[11px] text-slate-500 leading-4">{act.detail}</Text>
              </View>
              <Text className="text-[10px] text-slate-400 font-medium">{act.time}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
