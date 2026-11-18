import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { PARENT_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface ParentDashboardViewProps {
  greeting: string;
}

export default function ParentDashboardView({ greeting }: ParentDashboardViewProps) {
  const data = PARENT_DASHBOARD_DATA;

  return (
    <View>
      {/* 1. PARENT WELCOME BANNER */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#8b5cf6]">
            <Feather name="users" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B]">
              {greeting}, {data.profile.parentName}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">
              Ward: {data.profile.wardName} • {data.profile.grade}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push('/(app)/finance')}
            className="flex-row items-center rounded-xl bg-[#8b5cf6] px-3.5 py-2 active:bg-[#7c3aed]"
          >
            <Feather name="credit-card" size={14} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">Pay Fees</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/academic')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="calendar" size={14} color="#8b5cf6" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Attendance</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/campus')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="send" size={14} color="#8b5cf6" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Leave Request</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. PARENT KPI TILES */}
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

      {/* 3. TODAY'S CAMPUS & TRANSIT STATUS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SAFETY & TRACKING
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              {"Today's Campus Status"}
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2.5 py-0.5 flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-[10px] font-bold text-emerald-700">On Campus</Text>
          </View>
        </View>

        <View className="gap-y-2.5">
          <View className="flex-row items-center rounded-2xl bg-slate-50 p-3">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 mr-3">
              <Feather name="check" size={16} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800">Campus Check-In: {data.dailyStatus.checkInTime}</Text>
              <Text className="text-[11px] text-slate-500">{data.dailyStatus.gate}</Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-2xl bg-slate-50 p-3">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-blue-100 mr-3">
              <Feather name="navigation" size={16} color="#2563eb" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800">Transport: {data.dailyStatus.transport}</Text>
              <Text className="text-[11px] text-slate-500">Driver Contact: Available in Transit Tab</Text>
            </View>
          </View>

          <View className="flex-row items-center rounded-2xl bg-slate-50 p-3">
            <View className="h-8 w-8 items-center justify-center rounded-xl bg-amber-100 mr-3">
              <Feather name="coffee" size={16} color="#d97706" />
            </View>
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-800">{data.dailyStatus.lunchStatus}</Text>
              <Text className="text-[11px] text-slate-500">Dietary requirements recorded</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 4. ACADEMIC SNAPSHOT & TEACHER REMARKS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PERFORMANCE
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Academic Report Card
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2 py-0.5">
            <Text className="text-[10px] font-bold text-emerald-600">
              {data.academicReport.overallPercentage}
            </Text>
          </View>
        </View>

        <View className="rounded-2xl bg-slate-50 p-3.5">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-slate-800">Overall Grade</Text>
            <Text className="text-xs font-bold text-[#8b5cf6]">
              {data.academicReport.grade}
            </Text>
          </View>
          <View className="mt-2 flex-row items-center justify-between">
            <Text className="text-xs text-slate-600">Conduct / Behavior</Text>
            <Text className="text-xs font-semibold text-emerald-600">
              {data.academicReport.behaviorScore}
            </Text>
          </View>
          <View className="mt-3 border-t border-slate-200/60 pt-2.5">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Class Teacher Remarks
            </Text>
            <Text className="mt-1 text-xs text-slate-600 leading-4">
              &ldquo;{data.academicReport.teacherRemarks}&rdquo;
            </Text>
            <Text className="mt-1 text-[10px] text-slate-400 font-medium">
              — {data.profile.classTeacher} (Class Teacher)
            </Text>
          </View>
        </View>
      </View>

      {/* 5. FEE PAYMENT HISTORY */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <Text className="text-base font-bold text-[#202C4B]">Recent Fee Payments</Text>
          <Pressable onPress={() => router.push('/(app)/finance')}>
            <Text className="text-xs font-semibold text-[#8b5cf6]">View Receipts →</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.feeHistory.map((fee) => (
            <View
              key={fee.id}
              className="flex-row items-center justify-between border-b border-slate-100 pb-2.5"
            >
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-slate-800">{fee.term}</Text>
                <Text className="mt-0.5 text-[11px] text-slate-400">
                  {fee.date} • {fee.receipt}
                </Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-slate-800">{fee.amount}</Text>
                <View className="mt-0.5 rounded bg-emerald-50 px-1.5 py-0.5">
                  <Text className="text-[10px] font-bold text-emerald-600">{fee.status}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 6. SCHOOL NOTICES FOR PARENTS */}
      <View className="rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <Text className="text-base font-bold text-[#202C4B]">Important Notices</Text>
          <Pressable onPress={() => router.push('/(app)/reports')}>
            <Text className="text-xs font-semibold text-[#8b5cf6]">All Notices →</Text>
          </Pressable>
        </View>

        <View className="gap-y-3">
          {data.notices.map((nt) => (
            <View key={nt.id} className="border-b border-slate-100 pb-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-slate-800 flex-1 mr-2">{nt.title}</Text>
                <Text className="text-[10px] text-slate-400">{nt.date}</Text>
              </View>
              <Text className="mt-1 text-xs text-slate-500 leading-4">{nt.desc}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}
