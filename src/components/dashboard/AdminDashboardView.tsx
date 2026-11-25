import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
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
  // Local modal states
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);

  // Form states for Add Class Routine
  const [routineClass, setRoutineClass] = useState('Grade X-A');
  const [routineSubject, setRoutineSubject] = useState('');
  const [routineTeacher, setRoutineTeacher] = useState('');
  const [routineDay, setRoutineDay] = useState('Monday');
  const [routineTime, setRoutineTime] = useState('09:00 - 09:45 AM');

  // Form states for Add Event
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState('Academic');
  const [eventDate, setEventDate] = useState('2026-11-25');
  const [eventVenue, setEventVenue] = useState('Main Auditorium');

  const handleSaveRoutine = () => {
    if (!routineSubject.trim()) {
      Alert.alert('Required', 'Please enter subject name');
      return;
    }
    Alert.alert('Success', `Routine for ${routineSubject} added successfully!`);
    setIsRoutineModalOpen(false);
    setRoutineSubject('');
    setRoutineTeacher('');
  };

  const handleSaveEvent = () => {
    if (!eventTitle.trim()) {
      Alert.alert('Required', 'Please enter event title');
      return;
    }
    Alert.alert('Success', `Event "${eventTitle}" scheduled successfully!`);
    setIsEventModalOpen(false);
    setEventTitle('');
  };

  return (
    <View>
      {/* 1. TOP WELCOME BANNER & COMMAND BAR */}
      <View className="mb-4 rounded-3xl bg-white dark:bg-[#131022] p-5 border border-slate-100 dark:border-[#262038] shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5EE1]">
            <Feather name="award" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B] dark:text-[#EFEFF2]">
              {greeting}, {displayName}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-[#a29fb0] font-medium">
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
            <Text className="text-[#202C4B] dark:text-[#EFEFF2] ml-1.5 text-xs font-bold text-white">New Admission</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/finance')}
            className="flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="credit-card" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">Collect Fees</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsRoutineModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="calendar" size={14} color="#10b981" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">+ Routine</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsEventModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="flag" size={14} color="#f59e0b" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">+ Event</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/reports')}
            className="flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="bar-chart-2" size={14} color="#8b5cf6" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">Report</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/communication')}
            className="flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3.5 py-2 active:bg-slate-50"
          >
            <Feather name="message-square" size={14} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">Notices</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. TOP KPI TILES */}
      <View className="mb-4 flex-row flex-wrap justify-between gap-y-2.5">
        {data.welcomeKpis.map((kpi) => (
          <View
            key={kpi.id}
            className="w-[48%] rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-3.5 shadow-sm shadow-black/5"
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
            <Text className="mt-2.5 text-xl font-extrabold text-[#202C4B] dark:text-[#EFEFF2]">{kpi.value}</Text>
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-[#a29fb0] font-medium">{kpi.label}</Text>
          </View>
        ))}
      </View>

      {/* 3. SPOTLIGHT CARDS (Top Performers & Recognition) */}
      <View className="mb-4">
        <View className="flex-row items-center justify-between mb-2.5 px-1">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
            CAMPUS SPOTLIGHTS
          </Text>
          <View className="flex-row items-center">
            <Feather name="star" size={12} color="#f59e0b" />
            <Text className="ml-1 text-[11px] font-semibold text-slate-600 dark:text-[#B9B7C0]">Top Honors</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-x-3">
          {data.spotlightCards.map((card) => (
            <View
              key={card.id}
              className="w-64 rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-4 shadow-sm shadow-black/5 mr-3"
            >
              <View className="flex-row items-center justify-between">
                <View
                  className="h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: card.avatarBg }}
                >
                  <Feather name={card.icon as any} size={16} color={card.badgeColor} />
                </View>
                <View className="rounded-full bg-amber-50 dark:bg-[#2e2616] px-2 py-0.5 flex-row items-center">
                  <Feather name="star" size={10} color="#f59e0b" />
                  <Text className="ml-1 text-[10px] font-bold text-amber-700 dark:text-amber-300">{card.rating.toFixed(1)}</Text>
                </View>
              </View>

              <Text className="mt-2 text-[10px] font-bold uppercase text-slate-400 dark:text-[#8b879b] tracking-wider">
                {card.category}
              </Text>
              <Text className="text-sm font-bold text-[#202C4B] dark:text-[#EFEFF2]" numberOfLines={1}>
                {card.name}
              </Text>
              <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]" numberOfLines={1}>
                {card.subtitle}
              </Text>

              <View className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#262038] flex-row items-center justify-between">
                <Text className="text-[11px] font-semibold text-slate-600 dark:text-[#B9B7C0]" numberOfLines={1}>
                  {card.achievement}
                </Text>
                <View className="rounded-lg bg-slate-50 dark:bg-[#1B1632] px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-[#3D5EE1] dark:text-[#7d95f5]">
                    {card.statValue}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 4. WIDGET 1: CLASS DISTRIBUTION */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              STUDENT INTELLIGENCE
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">
              Class Distribution
            </Text>
          </View>
          <View className="rounded-full bg-indigo-50 dark:bg-[#1d2450] px-2.5 py-1">
            <Text className="text-[11px] font-bold text-[#3D5EE1] dark:text-[#7d95f5]">
              {data.classDistribution.totalEnrolled} Students
            </Text>
          </View>
        </View>

        <View className="gap-y-3">
          {data.classDistribution.levels.map((item, idx) => (
            <View key={idx}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-semibold text-[#202C4B] dark:text-[#EFEFF2]">{item.name}</Text>
                <Text className="text-xs font-bold text-slate-600 dark:text-[#B9B7C0]">
                  {item.count} ({item.percent}%)
                </Text>
              </View>
              <View className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#1B1632] overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${item.percent}%`, backgroundColor: item.barColor }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 5. WIDGET 2: RISK MATRIX */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              ACADEMIC WELLBEING
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Risk Matrix</Text>
          </View>
          <View className="rounded-full bg-emerald-50 dark:bg-[#14291f] px-2.5 py-1">
            <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
              {data.riskMatrix.healthPercent}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-emerald-50 dark:bg-[#14291f] p-3 items-center">
            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">LOW RISK</Text>
            <Text className="mt-1 text-base font-extrabold text-emerald-800 dark:text-emerald-300">
              {data.riskMatrix.lowRisk.count}
            </Text>
            <Text className="text-[10px] text-emerald-600 dark:text-emerald-300">Healthy</Text>
          </View>

          <View className="flex-1 rounded-2xl bg-amber-50 dark:bg-[#2e2616] p-3 items-center">
            <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">MODERATE</Text>
            <Text className="mt-1 text-base font-extrabold text-amber-800 dark:text-amber-300">
              {data.riskMatrix.mediumRisk.count}
            </Text>
            <Text className="text-[10px] text-amber-600 dark:text-amber-300">Monitoring</Text>
          </View>

          <View className="flex-1 rounded-2xl bg-red-50 dark:bg-[#2e1a22] p-3 items-center">
            <Text className="text-[10px] font-bold text-red-700 dark:text-red-300">HIGH RISK</Text>
            <Text className="mt-1 text-base font-extrabold text-red-800 dark:text-red-300">
              {data.riskMatrix.highRisk.count}
            </Text>
            <Text className="text-[10px] text-red-600 dark:text-red-300">Remedial</Text>
          </View>
        </View>
      </View>

      {/* 6. WIDGET 3: ATTENDANCE HEATMAP */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              WEEKLY TRACKER
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Attendance Heatmap</Text>
          </View>
          <Text className="text-xs font-semibold text-[#3D5EE1] dark:text-[#7d95f5]">Mon - Sat</Text>
        </View>

        <View className="gap-y-2.5">
          {data.attendanceHeatmap.map((item, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 dark:border-[#262038] bg-slate-50/50 p-3">
              <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2] mb-2">{item.wing}</Text>
              <View className="flex-row justify-between">
                {[
                  { d: 'Mon', v: item.mon },
                  { d: 'Tue', v: item.tue },
                  { d: 'Wed', v: item.wed },
                  { d: 'Thu', v: item.thu },
                  { d: 'Fri', v: item.fri },
                  { d: 'Sat', v: item.sat },
                ].map((col, cIdx) => {
                  const isHigh = col.v >= 95;
                  return (
                    <View key={cIdx} className="items-center">
                      <View
                        className={`h-7 w-9 items-center justify-center rounded-lg ${
                          isHigh ? 'bg-emerald-500' : 'bg-emerald-400'
                        }`}
                      >
                        <Text className="text-[#202C4B] dark:text-[#EFEFF2] text-[10px] font-bold text-white">{col.v}%</Text>
                      </View>
                      <Text className="mt-1 text-[10px] text-slate-500 dark:text-[#a29fb0]">{col.d}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 7. WIDGET 4: ATTENDANCE BREAKDOWN */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
          DAILY REGISTER
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2] mb-3">
          Attendance Breakdown
        </Text>

        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-baseline">
            <Text className="text-3xl font-extrabold text-[#202C4B] dark:text-[#EFEFF2]">
              {data.attendanceBreakdown.overallPercentage}%
            </Text>
            <Text className="ml-1 text-xs text-slate-500 dark:text-[#a29fb0] font-medium">overall</Text>
          </View>
          <View className="rounded-full bg-emerald-50 dark:bg-[#14291f] px-2.5 py-1">
            <Text className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">Excellent</Text>
          </View>
        </View>

        <View className="gap-y-2">
          <View className="flex-row justify-between text-xs">
            <Text className="text-xs text-slate-600 dark:text-[#B9B7C0]">Present ({data.attendanceBreakdown.presentCount})</Text>
            <Text className="text-xs font-bold text-emerald-600 dark:text-emerald-300">94.8%</Text>
          </View>
          <View className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#1B1632] overflow-hidden">
            <View className="h-full rounded-full bg-emerald-500 w-[94.8%]" />
          </View>

          <View className="flex-row justify-between text-xs mt-1">
            <Text className="text-xs text-slate-600 dark:text-[#B9B7C0]">Absent ({data.attendanceBreakdown.absentCount})</Text>
            <Text className="text-xs font-bold text-red-600 dark:text-red-300">5.2%</Text>
          </View>
          <View className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-[#1B1632] overflow-hidden">
            <View className="h-full rounded-full bg-red-500 w-[5.2%]" />
          </View>
        </View>
      </View>

      {/* 8. WIDGET 5 & 6: COMMUNICATION TREND & PARENT ENGAGEMENT */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              DISPATCH & ENGAGEMENT
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">
              Communication Trend
            </Text>
          </View>
          <Text className="text-xs font-bold text-[#3D5EE1] dark:text-[#7d95f5]">
            {data.communicationTrend.totalMessages}
          </Text>
        </View>

        <View className="gap-y-2.5">
          {data.communicationTrend.channels.map((ch, idx) => (
            <View key={idx}>
              <View className="flex-row justify-between text-xs mb-1">
                <Text className="text-xs font-semibold text-[#202C4B] dark:text-[#EFEFF2]">{ch.channel}</Text>
                <Text className="text-xs font-bold text-slate-600 dark:text-[#B9B7C0]">
                  {ch.count} ({ch.percent}%)
                </Text>
              </View>
              <View className="h-2 w-full rounded-full bg-slate-100 dark:bg-[#1B1632] overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: `${ch.percent}%`, backgroundColor: ch.color }}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Parent Engagement Metrics */}
        <View className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262038]">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b] mb-2.5">
            Parent Response Rates
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
              <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Portal Logins</Text>
              <Text className="text-sm font-bold text-[#202C4B] dark:text-[#EFEFF2]">{data.parentEngagement.portalLoginRate}</Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
              <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Notice Reads</Text>
              <Text className="text-sm font-bold text-[#202C4B] dark:text-[#EFEFF2]">{data.parentEngagement.messageReadRate}</Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
              <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">PTM Attendance</Text>
              <Text className="text-sm font-bold text-[#202C4B] dark:text-[#EFEFF2]">{data.parentEngagement.ptmAttendanceRate}</Text>
            </View>
            <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
              <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Fee Response</Text>
              <Text className="text-sm font-bold text-[#202C4B] dark:text-[#EFEFF2]">{data.parentEngagement.feeResponseRate}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 9. WIDGET 7 & 8: RECENT ACTIVITIES & PARENT MESSAGES */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              REAL-TIME AUDIT
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Activity Timeline</Text>
          </View>
          <Feather name="clock" size={16} color="#94a3b8" />
        </View>

        <View className="gap-y-3">
          {data.recentActivities.map((act) => (
            <View key={act.id} className="flex-row items-start">
              <View
                className="mt-0.5 h-8 w-8 items-center justify-center rounded-xl"
                style={{ backgroundColor: `${act.color}15` }}
              >
                <Feather name={act.icon as any} size={14} color={act.color} />
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">{act.title}</Text>
                  <Text className="text-[10px] text-slate-400 dark:text-[#8b879b] font-medium">{act.time}</Text>
                </View>
                <Text className="mt-0.5 text-[11px] text-slate-500 dark:text-[#a29fb0] leading-4">{act.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 10. WIDGET 8: PARENT MESSAGES */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              INBOX
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Parent Messages</Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/communication')}>
            <Text className="text-xs font-semibold text-[#3D5EE1] dark:text-[#7d95f5]">View All →</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.parentMessages.map((msg) => (
            <View key={msg.id} className="rounded-2xl border border-slate-100 dark:border-[#262038] bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">{msg.parent}</Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    msg.status === 'Replied' ? 'bg-emerald-50 dark:bg-[#14291f]' : 'bg-amber-50 dark:bg-[#2e2616]'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      msg.status === 'Replied' ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {msg.status}
                  </Text>
                </View>
              </View>
              <Text className="mt-0.5 text-[10px] font-medium text-slate-400 dark:text-[#8b879b]">{msg.student}</Text>
              <Text className="mt-1 text-xs text-slate-600 dark:text-[#B9B7C0] leading-4">{msg.message}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 11. WIDGET 9 & 10: DELIVERY SUCCESS & ENROLLMENT TREND */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
          GATEWAY RELIABILITY
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2] mb-3">
          Delivery Success Rates
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {data.deliverySuccess.map((item, idx) => (
            <View key={idx} className="w-[48%] rounded-2xl bg-slate-50 dark:bg-[#1B1632] p-3">
              <Text className="text-xs font-semibold text-slate-600 dark:text-[#B9B7C0]">{item.channel}</Text>
              <Text className="mt-1 text-base font-extrabold" style={{ color: item.color }}>
                {item.successRate}
              </Text>
              <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">
                {item.sent.toLocaleString()} sent • {item.failed} failed
              </Text>
            </View>
          ))}
        </View>

        <View className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262038] flex-row items-center justify-between">
          <View>
            <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">Annual Net Growth</Text>
            <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">
              {data.enrollmentTrend.currentYearAdmissions} admissions • {data.enrollmentTrend.withdrawn} exits
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 dark:bg-[#14291f] px-2.5 py-1">
            <Text className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
              {data.enrollmentTrend.netGrowth}
            </Text>
          </View>
        </View>
      </View>

      {/* 12. WIDGET 11: GENDER DISTRIBUTION */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
          DEMOGRAPHICS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2] mb-3">Gender Ratio</Text>

        <View className="flex-row gap-2">
          <View className="flex-1 rounded-2xl bg-blue-50 dark:bg-[#162540] p-3.5 items-center">
            <Feather name="user" size={18} color="#3b82f6" />
            <Text className="mt-1.5 text-base font-extrabold text-blue-900 dark:text-blue-300">
              {data.genderDistribution.boysPercent}%
            </Text>
            <Text className="text-[10px] text-blue-700 dark:text-blue-300 font-medium">
              Boys ({data.genderDistribution.boysCount})
            </Text>
          </View>

          <View className="flex-1 rounded-2xl bg-pink-50 dark:bg-[#2e1a2a] p-3.5 items-center">
            <Feather name="user" size={18} color="#ec4899" />
            <Text className="mt-1.5 text-base font-extrabold text-pink-900 dark:text-pink-300">
              {data.genderDistribution.girlsPercent}%
            </Text>
            <Text className="text-[10px] text-pink-700 dark:text-pink-300 font-medium">
              Girls ({data.genderDistribution.girlsCount})
            </Text>
          </View>
        </View>
      </View>

      {/* 13. WIDGET 12, 13, 14, 15: LIBRARY ANALYTICS */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              LEARNING RESOURCES
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Library Circulation</Text>
          </View>
          <Feather name="book" size={18} color="#3D5EE1" />
        </View>

        <View className="flex-row flex-wrap gap-2 mb-3">
          <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
            <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Catalog Volume</Text>
            <Text className="text-sm font-bold text-[#202C4B] dark:text-[#EFEFF2]">
              {data.bookAvailability.totalCatalog.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
            <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Available in Stalls</Text>
            <Text className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
              {data.bookAvailability.availableInStalls.toLocaleString()}
            </Text>
          </View>
          <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
            <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Issued This Month</Text>
            <Text className="text-sm font-bold text-[#3D5EE1] dark:text-[#7d95f5]">{data.booksIssued.totalIssuedThisMonth}</Text>
          </View>
          <View className="flex-1 min-w-[45%] rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2.5">
            <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">Returned on Time</Text>
            <Text className="text-sm font-bold text-slate-700 dark:text-[#d6d4de]">{data.booksIssued.returnedOnTime}</Text>
          </View>
        </View>

        <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2] mb-2">Most Borrowed Titles</Text>
        <View className="gap-y-2">
          {data.mostBorrowedBooks.map((bk, idx) => (
            <View key={idx} className="flex-row items-center justify-between rounded-xl bg-slate-50 dark:bg-[#1B1632] p-2 px-3">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-semibold text-[#202C4B] dark:text-[#EFEFF2]" numberOfLines={1}>{bk.title}</Text>
                <Text className="text-[10px] text-slate-500 dark:text-[#a29fb0]">{bk.author} • {bk.category}</Text>
              </View>
              <View className="rounded-lg bg-white dark:bg-[#131022] border border-slate-200 dark:border-[#322D46] px-2 py-0.5">
                <Text className="text-[10px] font-bold text-[#3D5EE1] dark:text-[#7d95f5]">{bk.count}x</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 14. WIDGET 16, 17, 18, 19, 20: FLEET & TRANSPORT DASHBOARD */}
      <View className="mb-4 rounded-3xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#8b879b]">
              CAMPUS FLEET
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Transport & Routes</Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/campus')}>
            <Text className="text-xs font-semibold text-[#3D5EE1] dark:text-[#7d95f5]">View Routes →</Text>
          </Pressable>
        </View>

        {/* Fleet KPI Row */}
        <View className="flex-row gap-2 mb-3.5">
          <View className="flex-1 rounded-2xl bg-indigo-50 dark:bg-[#1d2450] p-3 items-center">
            <Text className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300">ACTIVE FLEET</Text>
            <Text className="mt-1 text-base font-extrabold text-indigo-900 dark:text-indigo-300">
              {data.fleetUtilization.activeOnRoad} / {data.fleetUtilization.totalFleet}
            </Text>
            <Text className="text-[10px] text-indigo-600 dark:text-indigo-300">On Road</Text>
          </View>

          <View className="flex-1 rounded-2xl bg-emerald-50 dark:bg-[#14291f] p-3 items-center">
            <Text className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">SEAT OCCUPANCY</Text>
            <Text className="mt-1 text-base font-extrabold text-emerald-900 dark:text-emerald-300">
              {data.fleetUtilization.occupancyRate}
            </Text>
            <Text className="text-[10px] text-emerald-600 dark:text-emerald-300">Optimized</Text>
          </View>

          <View className="flex-1 rounded-2xl bg-amber-50 dark:bg-[#2e2616] p-3 items-center">
            <Text className="text-[10px] font-bold text-amber-700 dark:text-amber-300">FUEL SPEND</Text>
            <Text className="mt-1 text-base font-extrabold text-amber-900 dark:text-amber-300">
              {data.fuelConsumption.monthlySpend}
            </Text>
            <Text className="text-[10px] text-amber-600 dark:text-amber-300">{data.fuelConsumption.avgEconomy}</Text>
          </View>
        </View>

        {/* Live Route Status */}
        <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2] mb-2">Live Route Progress</Text>
        <View className="gap-y-2">
          {data.liveRouteStatus.map((route, idx) => (
            <View key={idx} className="rounded-xl border border-slate-100 dark:border-[#262038] bg-slate-50/50 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B] dark:text-[#EFEFF2]">{route.route}</Text>
                <View
                  className="rounded-full px-2 py-0.5"
                  style={{ backgroundColor: `${route.color}15` }}
                >
                  <Text className="text-[10px] font-bold" style={{ color: route.color }}>
                    {route.status} ({route.delay})
                  </Text>
                </View>
              </View>
              <Text className="mt-0.5 text-[10px] text-slate-500 dark:text-[#a29fb0] font-medium">
                {route.vehicle} • Driver: {route.driver}
              </Text>
              <View className="mt-1 flex-row items-center">
                <Feather name="map-pin" size={10} color="#64748b" />
                <Text className="ml-1 text-[10px] text-slate-600 dark:text-[#B9B7C0]">Next: {route.nextStop}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Live Fleet Map & GPS Sync Pill */}
        <View className="mt-4 pt-3 border-t border-slate-100 dark:border-[#262038] flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-2 w-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-[11px] font-semibold text-slate-600 dark:text-[#B9B7C0]">
              {data.liveFleetMap.gpsSatelliteSync}
            </Text>
          </View>
          <View className="rounded-full bg-slate-100 dark:bg-[#1B1632] px-2.5 py-0.5">
            <Text className="text-[10px] font-bold text-slate-700 dark:text-[#d6d4de]">Depot: Main East Gate</Text>
          </View>
        </View>
      </View>

      {/* MODAL 1: ADD CLASS ROUTINE */}
      <Modal visible={isRoutineModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#131022] rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262038]">
              <Text className="text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Add Class Routine</Text>
              <Pressable onPress={() => setIsRoutineModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Class & Section</Text>
              <TextInput
                value={routineClass}
                onChangeText={setRoutineClass}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Subject Name *</Text>
              <TextInput
                placeholder="e.g. Mathematics"
                value={routineSubject}
                onChangeText={setRoutineSubject}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Assigned Teacher</Text>
              <TextInput
                placeholder="e.g. Aaron Fox"
                value={routineTeacher}
                onChangeText={setRoutineTeacher}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Day of Week</Text>
              <TextInput
                value={routineDay}
                onChangeText={setRoutineDay}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Period Time</Text>
              <TextInput
                value={routineTime}
                onChangeText={setRoutineTime}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsRoutineModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 dark:border-[#322D46] py-3"
                >
                  <Text className="text-xs font-bold text-slate-600 dark:text-[#B9B7C0]">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveRoutine}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-[#202C4B] dark:text-[#EFEFF2] text-xs font-bold text-white">Save Routine</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: ADD EVENT */}
      <Modal visible={isEventModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-[#131022] rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-[#262038]">
              <Text className="text-base font-bold text-[#202C4B] dark:text-[#EFEFF2]">Schedule School Event</Text>
              <Pressable onPress={() => setIsEventModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Event Title *</Text>
              <TextInput
                placeholder="e.g. Annual Sports Day 2026"
                value={eventTitle}
                onChangeText={setEventTitle}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Category</Text>
              <TextInput
                value={eventCategory}
                onChangeText={setEventCategory}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Date</Text>
              <TextInput
                value={eventDate}
                onChangeText={setEventDate}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 dark:text-[#d6d4de] mb-1">Location / Venue</Text>
              <TextInput
                value={eventVenue}
                onChangeText={setEventVenue}
                className="rounded-xl border border-slate-200 dark:border-[#322D46] px-3 py-2 text-xs text-[#202C4B] dark:text-[#EFEFF2] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsEventModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 dark:border-[#322D46] py-3"
                >
                  <Text className="text-xs font-bold text-slate-600 dark:text-[#B9B7C0]">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveEvent}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-[#202C4B] dark:text-[#EFEFF2] text-xs font-bold text-white">Schedule Event</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
