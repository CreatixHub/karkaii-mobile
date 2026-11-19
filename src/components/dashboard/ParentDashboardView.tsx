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
import { PARENT_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface ParentDashboardViewProps {
  greeting: string;
  displayName?: string;
}

export default function ParentDashboardView({ greeting, displayName }: ParentDashboardViewProps) {
  const [activeChildKey, setActiveChildKey] = useState<'Emma' | 'Lucas'>('Emma');

  // Modals
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Leave form
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveDate, setLeaveDate] = useState('2026-11-20');

  // Contact teacher form
  const [messageText, setMessageText] = useState('');

  const child = PARENT_DASHBOARD_DATA.children[activeChildKey];

  const handleApplyLeave = () => {
    if (!leaveReason.trim()) {
      Alert.alert('Required', 'Please enter reason for student leave');
      return;
    }
    Alert.alert('Leave Submitted', `Leave application for ${child.name} on ${leaveDate} submitted to homeroom teacher.`);
    setIsLeaveModalOpen(false);
    setLeaveReason('');
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) {
      Alert.alert('Required', 'Please enter your message');
      return;
    }
    Alert.alert('Message Sent', `Your message was delivered to ${child.homeroomTeacher}.`);
    setIsContactModalOpen(false);
    setMessageText('');
  };

  const handlePayment = () => {
    Alert.alert('Payment Successful', `Term fee payment processed. Receipt #REC-2026-${Math.floor(1000 + Math.random() * 9000)} generated.`);
    setIsPayModalOpen(false);
  };

  return (
    <View>
      {/* 1. CHILD SWITCHER & PARENT HERO BANNER */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View className="flex-row items-center flex-1 mr-2">
            <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#8b5cf6]">
              <Feather name="users" size={24} color="#ffffff" />
            </View>
            <View className="ml-3.5 flex-1">
              <Text className="text-lg font-bold text-[#202C4B]">
                {greeting}, {displayName || `${PARENT_DASHBOARD_DATA.children.Emma.name.split(' ')[0]}'s Parent`}
              </Text>
              <Text className="mt-0.5 text-xs text-slate-500 font-medium">
                Parent Portal • 2 Wards Enrolled
              </Text>
            </View>
          </View>
        </View>

        {/* Child Switcher Pills */}
        <View className="mb-3.5 rounded-2xl bg-slate-100 p-1 flex-row">
          {(['Emma', 'Lucas'] as const).map((key) => {
            const isSelected = activeChildKey === key;
            const item = PARENT_DASHBOARD_DATA.children[key];
            return (
              <Pressable
                key={key}
                onPress={() => setActiveChildKey(key)}
                className={`flex-1 flex-row items-center justify-center rounded-xl py-2 ${
                  isSelected ? 'bg-white shadow-sm shadow-black/5' : ''
                }`}
              >
                <View
                  className={`h-2 w-2 rounded-full mr-2 ${
                    isSelected ? 'bg-[#8b5cf6]' : 'bg-slate-300'
                  }`}
                />
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-[#202C4B]' : 'text-slate-500'
                  }`}
                >
                  {item.name} ({item.grade.split(' - ')[0]})
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Selected Child Quick Bio */}
        <View className="flex-row flex-wrap gap-2 mb-3.5">
          <View className="rounded-xl bg-purple-50 px-2.5 py-1 flex-row items-center">
            <Feather name="book" size={11} color="#7c3aed" />
            <Text className="ml-1 text-[11px] font-semibold text-purple-900">
              {child.grade}
            </Text>
          </View>
          <View className="rounded-xl bg-emerald-50 px-2.5 py-1 flex-row items-center">
            <Feather name="check-circle" size={11} color="#059669" />
            <Text className="ml-1 text-[11px] font-semibold text-emerald-800">
              Attendance: {child.attendance}
            </Text>
          </View>
          <View className="rounded-xl bg-amber-50 px-2.5 py-1 flex-row items-center">
            <Feather name="star" size={11} color="#d97706" />
            <Text className="ml-1 text-[11px] font-semibold text-amber-800">
              GPA: {child.gpa} (Rating: {child.teacherRating})
            </Text>
          </View>
        </View>

        {/* Command Bar Quick Action Buttons */}
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setIsPayModalOpen(true)}
            className="flex-row items-center rounded-xl bg-[#8b5cf6] px-3 py-2 active:bg-[#7c3aed]"
          >
            <Feather name="credit-card" size={13} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">Pay Fees</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsReportModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="file-text" size={13} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Report Card</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsLeaveModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="send" size={13} color="#10b981" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Apply Leave</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsContactModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="message-circle" size={13} color="#f59e0b" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Teacher Msg</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. WIDGET 1: MY CHILDREN SUMMARY */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          STUDENT PROFILES
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">My Children</Text>

        <View className="gap-y-2.5">
          {(['Emma', 'Lucas'] as const).map((key) => {
            const ch = PARENT_DASHBOARD_DATA.children[key];
            const isCurrent = activeChildKey === key;
            return (
              <Pressable
                key={key}
                onPress={() => setActiveChildKey(key)}
                className={`rounded-2xl border p-3.5 ${
                  isCurrent ? 'border-[#8b5cf6] bg-purple-50/30' : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <View className="h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
                      <Feather name="user" size={18} color="#7c3aed" />
                    </View>
                    <View className="ml-2.5">
                      <Text className="text-xs font-bold text-[#202C4B]">{ch.name}</Text>
                      <Text className="text-[10px] text-slate-500">{ch.grade}</Text>
                    </View>
                  </View>
                  <View className="items-end">
                    <Text className="text-xs font-extrabold text-[#7c3aed]">GPA {ch.gpa}</Text>
                    <Text className="text-[10px] text-emerald-600 font-semibold">{ch.attendance} Att.</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 3. WIDGET 2: SUBJECT VITALS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ACADEMIC HEALTH
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Subject Vitals ({child.name.split(' ')[0]})
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2.5 py-1">
            <Text className="text-xs font-bold text-emerald-700">All Passing</Text>
          </View>
        </View>

        <View className="gap-y-2.5">
          {child.subjectVitals.map((v, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{v.subject}</Text>
                <View className="flex-row items-center">
                  <View className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 mr-1.5">
                    <Text className="text-[10px] font-bold text-[#8b5cf6]">{v.grade}</Text>
                  </View>
                  <Text className="text-xs font-extrabold text-[#202C4B]">{v.score}</Text>
                </View>
              </View>
              <Text className="text-[11px] text-slate-500 mt-1 leading-4">
                Teacher Note: &ldquo;{v.feedback}&rdquo;
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 4. WIDGET 3 & 4: CHILD TIMELINE & PARENT INSIGHTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DAILY TRACKER
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              {"Today's Journey"}
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2.5 py-1 flex-row items-center">
            <View className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1.5" />
            <Text className="text-[10px] font-bold text-emerald-700">On Campus</Text>
          </View>
        </View>

        <View className="gap-y-2.5 mb-3.5">
          {child.dailyTimeline.map((item, idx) => (
            <View key={idx} className="flex-row items-start">
              <View className="rounded-full bg-purple-100 px-2 py-0.5 mt-0.5">
                <Text className="text-[9px] font-bold text-purple-800">{item.time}</Text>
              </View>
              <Text className="ml-2.5 text-xs text-slate-700 flex-1 leading-5">
                {item.activity}
              </Text>
            </View>
          ))}
        </View>

        {/* Parent Insights */}
        <View className="pt-3 border-t border-slate-100">
          <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            AI Parent Insights
          </Text>
          <View className="rounded-xl bg-purple-50/50 p-3">
            <Text className="text-xs font-bold text-purple-900">{PARENT_DASHBOARD_DATA.parentInsights[0].title}</Text>
            <Text className="text-xs text-purple-800 mt-1 leading-4">
              {PARENT_DASHBOARD_DATA.parentInsights[0].desc}
            </Text>
          </View>
        </View>
      </View>

      {/* 5. WIDGET 5 & 6: COMMUNICATION HUB & LIVE BUS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SAFETY & TRANSIT
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">Live Bus Tracker</Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2.5 py-1">
            <Text className="text-[10px] font-bold text-emerald-700">{child.liveBus.status}</Text>
          </View>
        </View>

        <View className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-[#202C4B]">{child.liveBus.route}</Text>
            <Text className="text-[10px] font-bold text-[#8b5cf6]">{child.liveBus.busNo}</Text>
          </View>
          <Text className="text-[11px] text-slate-600 mt-1">
            Driver: {child.liveBus.driver} ({child.liveBus.driverContact})
          </Text>
          <Text className="text-[11px] text-slate-500 mt-0.5">
            Current Position: {child.liveBus.currentLocation}
          </Text>
          <View className="mt-2 pt-2 border-t border-slate-200/60 flex-row items-center justify-between">
            <Text className="text-[10px] text-slate-500">Scheduled Departure</Text>
            <Text className="text-xs font-bold text-[#3D5EE1]">{child.liveBus.etaPickup}</Text>
          </View>
        </View>

        {/* Communication Hub */}
        <Text className="text-xs font-bold text-[#202C4B] mb-2">Homeroom Contact</Text>
        <View className="flex-row items-center justify-between rounded-xl bg-slate-50 p-3">
          <View>
            <Text className="text-xs font-bold text-[#202C4B]">{child.homeroomTeacher}</Text>
            <Text className="text-[10px] text-slate-500">{child.teacherPhone}</Text>
          </View>
          <Pressable
            onPress={() => setIsContactModalOpen(true)}
            className="rounded-xl bg-[#8b5cf6] px-3 py-1.5"
          >
            <Text className="text-xs font-bold text-white">Send Message</Text>
          </Pressable>
        </View>
      </View>

      {/* 6. WIDGET 7 & 8: HOMEWORK BOARD & FEE TIMELINE */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              HOMEWORK & FEES
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Assignments & Fees
            </Text>
          </View>
          <Pressable onPress={() => setIsPayModalOpen(true)}>
            <Text className="text-xs font-semibold text-[#8b5cf6]">Pay Fees →</Text>
          </Pressable>
        </View>

        {/* Homework list */}
        <View className="gap-y-2 mb-3.5">
          {child.homework.map((hw, idx) => (
            <View key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-2.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{hw.title}</Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    hw.status === 'Completed' ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}
                >
                  <Text
                    className={`text-[9px] font-bold ${
                      hw.status === 'Completed' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {hw.status}
                  </Text>
                </View>
              </View>
              <Text className="text-[10px] text-slate-500 mt-0.5">{hw.subject} • Due: {hw.due}</Text>
            </View>
          ))}
        </View>

        {/* Fee Status Card */}
        <View className="rounded-2xl bg-emerald-50/60 p-3.5 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase text-emerald-800">FEES STATUS</Text>
            <Text className="text-xs font-bold text-[#202C4B] mt-0.5">{child.feeStatus.status}</Text>
            <Text className="text-[10px] text-slate-500">{child.feeStatus.dueAmount} Outstanding</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-extrabold text-emerald-700">{child.feeStatus.totalPaid}</Text>
            <Text className="text-[10px] text-emerald-600 font-semibold">Zero Balance</Text>
          </View>
        </View>
      </View>

      {/* 7. WIDGET 9, 10, 11, 12: EXAM HUB, ACHIEVEMENTS, AGENDA, SMART ALERTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          AGENDA & AWARDS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">Agenda & Honors</Text>

        <View className="gap-y-2 mb-3.5">
          {PARENT_DASHBOARD_DATA.agenda.map((ag, idx) => (
            <View key={idx} className="rounded-xl bg-slate-50 p-2.5">
              <Text className="text-xs font-bold text-[#202C4B]">{ag.event}</Text>
              <Text className="text-[10px] text-[#8b5cf6] mt-0.5">{ag.date}</Text>
            </View>
          ))}
        </View>

        <Text className="text-xs font-bold text-[#202C4B] mb-2">Recent Smart Alerts</Text>
        <View className="gap-y-2">
          {PARENT_DASHBOARD_DATA.smartNotifications.map((sn) => (
            <View key={sn.id} className="flex-row items-center rounded-xl bg-slate-50 p-2.5">
              <Feather name="bell" size={14} color="#8b5cf6" />
              <View className="ml-2 flex-1">
                <Text className="text-xs font-semibold text-[#202C4B]">{sn.title}</Text>
                <Text className="text-[10px] text-slate-400">{sn.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* MODAL 1: PAY FEES */}
      <Modal visible={isPayModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">School Fee Payment</Text>
              <Pressable onPress={() => setIsPayModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <View className="rounded-2xl bg-purple-50 p-4 mb-3">
                <Text className="text-xs font-bold text-purple-900">Student: {child.name}</Text>
                <Text className="text-[11px] text-purple-800 mt-0.5">{child.grade} • Roll No: {child.rollNo}</Text>
                <View className="mt-2 pt-2 border-t border-purple-200 flex-row justify-between">
                  <Text className="text-xs text-purple-900">Advance Term Fee Deposit:</Text>
                  <Text className="text-xs font-bold text-purple-900">$1,250.00</Text>
                </View>
              </View>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Select Payment Method</Text>
              <View className="gap-y-2 mb-4">
                <View className="rounded-xl border border-[#8b5cf6] bg-purple-50/30 p-3 flex-row items-center justify-between">
                  <Text className="text-xs font-bold text-[#202C4B]">Credit / Debit Card</Text>
                  <Feather name="check" size={16} color="#8b5cf6" />
                </View>
                <View className="rounded-xl border border-slate-200 p-3 flex-row items-center justify-between">
                  <Text className="text-xs text-slate-600">UPI / Net Banking</Text>
                </View>
              </View>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsPayModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handlePayment}
                  className="flex-1 items-center rounded-xl bg-[#8b5cf6] py-3"
                >
                  <Text className="text-xs font-bold text-white">Pay $1,250</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: APPLY LEAVE */}
      <Modal visible={isLeaveModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Apply Student Leave</Text>
              <Pressable onPress={() => setIsLeaveModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Student</Text>
              <Text className="text-xs text-slate-600 mb-3">{child.name} ({child.grade})</Text>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Leave Date</Text>
              <TextInput
                value={leaveDate}
                onChangeText={setLeaveDate}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</Text>
              <TextInput
                placeholder="Doctor appointment / family function..."
                value={leaveReason}
                onChangeText={setLeaveReason}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsLeaveModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleApplyLeave}
                  className="flex-1 items-center rounded-xl bg-[#10b981] py-3"
                >
                  <Text className="text-xs font-bold text-white">Submit Request</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CONTACT HOMEROOM TEACHER */}
      <Modal visible={isContactModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Message Homeroom Teacher</Text>
              <Pressable onPress={() => setIsContactModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs text-slate-500 mb-3">
                Recipient: <Text className="font-bold text-[#202C4B]">{child.homeroomTeacher}</Text>
              </Text>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Message Text *</Text>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Type your message to the teacher..."
                value={messageText}
                onChangeText={setMessageText}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4 min-h-[80px]"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsContactModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSendMessage}
                  className="flex-1 items-center rounded-xl bg-[#8b5cf6] py-3"
                >
                  <Text className="text-xs font-bold text-white">Send Message</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: REPORT CARD PREVIEW */}
      <Modal visible={isReportModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Term Report Card</Text>
              <Pressable onPress={() => setIsReportModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-3">
                <Text className="text-center text-xs font-bold text-[#202C4B] uppercase tracking-wider">
                  KARKKAII INTERNATIONAL SCHOOL
                </Text>
                <Text className="text-center text-[10px] text-slate-500">Progress Report • Term 1 2026-27</Text>

                <View className="mt-3 pt-3 border-t border-slate-200 gap-y-1">
                  <Text className="text-xs font-semibold text-slate-700">Student: {child.name}</Text>
                  <Text className="text-xs text-slate-600">Class: {child.grade} • Roll: {child.rollNo}</Text>
                  <Text className="text-xs text-slate-600">Attendance: {child.attendance} • GPA: {child.gpa}</Text>
                </View>

                <View className="mt-3 pt-3 border-t border-slate-200 gap-y-1.5">
                  {child.subjectVitals.map((sub, sIdx) => (
                    <View key={sIdx} className="flex-row justify-between text-xs">
                      <Text className="text-xs text-slate-700">{sub.subject}</Text>
                      <Text className="text-xs font-bold text-[#8b5cf6]">{sub.score} ({sub.grade})</Text>
                    </View>
                  ))}
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Alert.alert('Downloaded', `Official Report Card for ${child.name} saved to Downloads.`);
                  setIsReportModalOpen(false);
                }}
                className="items-center rounded-xl bg-[#8b5cf6] py-3 mt-2"
              >
                <Text className="text-xs font-bold text-white">Download PDF Report</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
