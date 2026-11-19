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
import { STUDENT_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface StudentDashboardViewProps {
  greeting: string;
  displayName?: string;
}

export default function StudentDashboardView({ greeting, displayName }: StudentDashboardViewProps) {
  const data = STUDENT_DASHBOARD_DATA;

  // Local modals
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isHallTicketModalOpen, setIsHallTicketModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  const [selectedAssignment, setSelectedAssignment] = useState('Polynomial Factorization Set #4');
  const [submissionNotes, setSubmissionNotes] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState('Aaron Fox');
  const [meetingReason, setMeetingReason] = useState('');

  const handleSubmitAssignment = () => {
    Alert.alert('Assignment Submitted', `Your file for "${selectedAssignment}" was submitted successfully to teacher.`);
    setIsSubmitModalOpen(false);
    setSubmissionNotes('');
  };

  const handleBookMeeting = () => {
    if (!meetingReason.trim()) {
      Alert.alert('Required', 'Please enter a brief note for the teacher');
      return;
    }
    Alert.alert('Meeting Requested', `Appointment request sent to ${selectedTeacher}.`);
    setIsTeacherModalOpen(false);
    setMeetingReason('');
  };

  return (
    <View>
      {/* 1. STUDENT HERO & PROFILE CHIPS */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5EE1]">
            <Feather name="user" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B]">
              {greeting}, {displayName || data.profile.name}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">
              {data.profile.grade} • Roll No. {data.profile.rollNo}
            </Text>
          </View>
        </View>

        {/* Hero Chips (Admission no, Class & Section, Roll, House, Year, Tags) */}
        <View className="mt-3.5 flex-row flex-wrap gap-2">
          <View className="rounded-xl bg-slate-100 px-2.5 py-1 flex-row items-center">
            <Feather name="hash" size={11} color="#64748b" />
            <Text className="ml-1 text-[11px] font-semibold text-slate-700">
              {data.profile.admissionNo}
            </Text>
          </View>
          <View className="rounded-xl bg-blue-50 px-2.5 py-1 flex-row items-center">
            <Feather name="flag" size={11} color="#2563eb" />
            <Text className="ml-1 text-[11px] font-semibold text-blue-800">
              {data.profile.house}
            </Text>
          </View>
          <View className="rounded-xl bg-emerald-50 px-2.5 py-1 flex-row items-center">
            <Feather name="award" size={11} color="#059669" />
            <Text className="ml-1 text-[11px] font-semibold text-emerald-800">
              {data.profile.tags[0]}
            </Text>
          </View>
          <View className="rounded-xl bg-amber-50 px-2.5 py-1 flex-row items-center">
            <Feather name="map-pin" size={11} color="#d97706" />
            <Text className="ml-1 text-[11px] font-semibold text-amber-800">
              {data.profile.tags[1]}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons Row */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => router.push('/(app)/academic')}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 active:bg-[#2F49B3]"
          >
            <Feather name="calendar" size={13} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">View Timetable</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsSubmitModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="upload" size={13} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Submit Work</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsHallTicketModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="file-text" size={13} color="#10b981" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Hall Ticket</Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(app)/reports')}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="bar-chart-2" size={13} color="#8b5cf6" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Scorecard</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. THE 6 STUDENT KPI TILES */}
      <View className="mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
          ACADEMIC VITALS (6 KPIs)
        </Text>
        <View className="flex-row flex-wrap justify-between gap-y-2.5">
          {data.kpis.map((kpi) => (
            <View
              key={kpi.id}
              className="w-[48%] rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-black/5"
            >
              <View className="flex-row items-center justify-between">
                <View
                  className="h-8 w-8 items-center justify-center rounded-xl"
                  style={{ backgroundColor: kpi.iconBg }}
                >
                  <Feather name={kpi.icon as any} size={16} color={kpi.iconColor} />
                </View>
                <View className="rounded-full bg-slate-50 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-slate-600">{kpi.delta}</Text>
                </View>
              </View>
              <Text className="mt-2 text-lg font-extrabold text-[#202C4B]">{kpi.value}</Text>
              <Text className="mt-0.5 text-xs text-slate-500 font-medium">{kpi.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 3. WIDGET 1: TODAY'S SCHEDULE */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CLASSES TODAY
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              {"Today's Schedule"}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/academic')}>
            <Text className="text-xs font-semibold text-[#3D5EE1]">All Week →</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.todaySchedule.map((item) => (
            <View
              key={item.id}
              className={`rounded-2xl border p-3.5 ${
                item.active ? 'bg-indigo-50/60 border-indigo-200' : 'bg-slate-50/50 border-slate-100'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{item.subject}</Text>
                {item.active ? (
                  <View className="rounded-full bg-[#3D5EE1] px-2 py-0.5">
                    <Text className="text-[9px] font-bold text-white">CURRENT PERIOD</Text>
                  </View>
                ) : (
                  <Text className="text-[10px] text-slate-400 font-medium">{item.time}</Text>
                )}
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-xs text-slate-600">{item.teacher} • {item.room}</Text>
                {item.active ? <Text className="text-[10px] text-slate-500">{item.time}</Text> : null}
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. WIDGET 2: AI LEARNING INSIGHTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PERSONAL TUTOR
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">AI Learning Insights</Text>
          </View>
          <View className="rounded-full bg-pink-50 px-2.5 py-1 flex-row items-center">
            <Feather name="zap" size={12} color="#ec4899" />
            <Text className="ml-1 text-[11px] font-bold text-pink-700">AI Study Coach</Text>
          </View>
        </View>

        <View className="gap-y-2.5">
          {data.aiInsights.map((insight, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center">
                <Feather name={insight.icon as any} size={14} color="#ec4899" />
                <Text className="ml-2 text-xs font-bold text-[#202C4B]">{insight.title}</Text>
              </View>
              <Text className="mt-1 text-xs text-slate-600 leading-4">{insight.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. WIDGET 3: ACADEMIC PERFORMANCE (Subject Rows: Subject, Teacher, Percent, Class Avg, Grade, Delta) */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TERM SCORECARD
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              Academic Performance
            </Text>
          </View>
          <View className="rounded-full bg-emerald-50 px-2.5 py-1">
            <Text className="text-xs font-bold text-emerald-700">GPA 3.98 (A+)</Text>
          </View>
        </View>

        <View className="gap-y-2.5">
          {data.subjectPerformance.map((subj, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{subj.subject}</Text>
                <View className="flex-row items-center">
                  <View className="rounded-md bg-white border border-slate-200 px-1.5 py-0.5 mr-1.5">
                    <Text className="text-[10px] font-bold text-[#3D5EE1]">{subj.grade}</Text>
                  </View>
                  <Text className="text-xs font-extrabold text-[#202C4B]">{subj.percent}</Text>
                </View>
              </View>
              <View className="mt-1 flex-row items-center justify-between text-[11px]">
                <Text className="text-[11px] text-slate-500">{subj.teacher}</Text>
                <Text className="text-[10px] text-emerald-600 font-semibold">
                  {subj.delta} vs class avg ({subj.classAvg})
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 6. WIDGET 4: ASSIGNMENTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TASKS
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">Assignments</Text>
          </View>
          <Pressable onPress={() => setIsSubmitModalOpen(true)}>
            <Text className="text-xs font-semibold text-[#3D5EE1]">Submit Work →</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.assignments.map((asgn) => (
            <View key={asgn.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B] flex-1 mr-2" numberOfLines={1}>
                  {asgn.title}
                </Text>
                <View
                  className={`rounded-full px-2 py-0.5 ${
                    asgn.status === 'Submitted' ? 'bg-emerald-50' : 'bg-amber-50'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      asgn.status === 'Submitted' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {asgn.status}
                  </Text>
                </View>
              </View>
              <View className="mt-1 flex-row items-center justify-between text-[11px]">
                <Text className="text-[11px] text-slate-500">{asgn.subject}</Text>
                <Text className="text-[10px] text-slate-600 font-medium">Due: {asgn.due}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 7. WIDGET 5 & 6: EXAM CENTER & ATTENDANCE CENTER */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              ASSESSMENTS & ATTENDANCE
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">Exam & Presence</Text>
          </View>
          <Pressable onPress={() => setIsHallTicketModalOpen(true)}>
            <Text className="text-xs font-semibold text-[#10b981]">Hall Ticket →</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 rounded-xl bg-slate-50 p-2.5 items-center">
            <Text className="text-[10px] text-slate-500">Attendance</Text>
            <Text className="text-base font-bold text-emerald-700">{data.attendanceCenter.monthlyRate}</Text>
            <Text className="text-[9px] text-slate-400">{data.attendanceCenter.daysPresent} Days</Text>
          </View>
          <View className="flex-1 rounded-xl bg-slate-50 p-2.5 items-center">
            <Text className="text-[10px] text-slate-500">Absences</Text>
            <Text className="text-base font-bold text-slate-700">{data.attendanceCenter.daysAbsent} Days</Text>
            <Text className="text-[9px] text-slate-400">Excused</Text>
          </View>
          <View className="flex-1 rounded-xl bg-slate-50 p-2.5 items-center">
            <Text className="text-[10px] text-slate-500">Late</Text>
            <Text className="text-base font-bold text-emerald-700">0</Text>
            <Text className="text-[9px] text-slate-400">Punctual</Text>
          </View>
        </View>

        {/* Upcoming Exams */}
        <Text className="text-xs font-bold text-[#202C4B] mb-2">Upcoming Tests</Text>
        <View className="gap-y-2">
          {data.upcomingExams.map((ex, idx) => (
            <View key={idx} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{ex.title}</Text>
                <Text className="text-[10px] font-bold text-[#3D5EE1]">{ex.room}</Text>
              </View>
              <Text className="text-[10px] text-slate-500 mt-0.5">{ex.date} • Syllabus: {ex.syllabus}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 8. WIDGET 7 & 8: FEE SUMMARY & LEARNING PROGRESS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          ACCOUNT & SYLLABUS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">
          Fee & Learning Progress
        </Text>

        <View className="rounded-2xl bg-emerald-50/50 p-3.5 mb-3 flex-row items-center justify-between">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
              TUITION STATUS
            </Text>
            <Text className="text-sm font-bold text-[#202C4B] mt-0.5">{data.feeSummary.status}</Text>
            <Text className="text-[10px] text-slate-500">Receipt: {data.feeSummary.receiptNo}</Text>
          </View>
          <View className="items-end">
            <Text className="text-sm font-extrabold text-emerald-700">{data.feeSummary.amountPaid}</Text>
            <Text className="text-[10px] text-emerald-600 font-semibold">Zero Due</Text>
          </View>
        </View>

        {/* Learning progress per subject */}
        <Text className="text-xs font-bold text-[#202C4B] mb-2">Syllabus Coverage</Text>
        <View className="gap-y-2.5">
          {data.learningProgress.map((lp, idx) => (
            <View key={idx}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-semibold text-[#202C4B]">{lp.subject}</Text>
                <Text className="text-[10px] text-slate-500">{lp.topicsCovered} ({lp.progress}%)</Text>
              </View>
              <View className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <View className="h-full rounded-full bg-[#3D5EE1]" style={{ width: `${lp.progress}%` }} />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 9. WIDGET 9 & 10: GOALS & ACHIEVEMENTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          TARGETS & HONORS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">Goals & Awards</Text>

        <View className="gap-y-2 mb-3">
          {data.goals.map((goal, idx) => (
            <View key={idx} className="rounded-xl bg-slate-50 p-2.5">
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-bold text-[#202C4B]">{goal.title}</Text>
                <Text className="text-[10px] font-bold text-[#3D5EE1]">{goal.progress}%</Text>
              </View>
              <View className="h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <View className="h-full rounded-full bg-[#10b981]" style={{ width: `${goal.progress}%` }} />
              </View>
            </View>
          ))}
        </View>

        <Text className="text-xs font-bold text-[#202C4B] mb-2">Achievements & Medals</Text>
        <View className="gap-y-2">
          {data.achievements.map((ach, idx) => (
            <View key={idx} className="flex-row items-center rounded-xl bg-slate-50 p-2.5">
              <Feather name="award" size={16} color="#f59e0b" />
              <View className="ml-2.5 flex-1">
                <Text className="text-xs font-bold text-[#202C4B]">{ach.title}</Text>
                <Text className="text-[10px] text-slate-400">{ach.year}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 10. WIDGET 11, 12, 13, 14: MY TEACHERS, LIBRARY & TRANSPORT */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              CAMPUS LIFE
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">Teachers & Transit</Text>
          </View>
          <Pressable
            onPress={() => setIsTeacherModalOpen(true)}
            className="rounded-full bg-indigo-50 px-2.5 py-1"
          >
            <Text className="text-xs font-bold text-[#3D5EE1]">Contact Faculty</Text>
          </Pressable>
        </View>

        {/* Transport Card */}
        <View className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5 mb-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-bold text-[#202C4B]">
              {data.transportDetails.route}
            </Text>
            <View className="rounded-full bg-emerald-50 px-2 py-0.5">
              <Text className="text-[10px] font-bold text-emerald-700">Active</Text>
            </View>
          </View>
          <Text className="text-[11px] text-slate-500 mt-0.5">
            {data.transportDetails.busNumber} • Driver: {data.transportDetails.driverName}
          </Text>
          <Text className="text-[10px] text-slate-400 mt-1">
            Pickup: {data.transportDetails.pickupPoint}
          </Text>
        </View>

        {/* Library Card */}
        <Text className="text-xs font-bold text-[#202C4B] mb-2">Issued Library Books</Text>
        <View className="gap-y-2">
          {data.issuedBooks.map((bk, idx) => (
            <View key={idx} className="flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-[#202C4B]">{bk.title}</Text>
                <Text className="text-[10px] text-slate-400">Due: {bk.dueDate}</Text>
              </View>
              <View className="rounded-lg bg-emerald-50 px-2 py-0.5">
                <Text className="text-[10px] font-bold text-emerald-700">{bk.status}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 11. WIDGET 15 & 16: CALENDAR, TIMELINE & NOTICES */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          NOTICES & LOGS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">Calendar & Activity</Text>

        <View className="gap-y-2 mb-3">
          {data.calendarHighlights.map((ch, idx) => (
            <View key={idx} className="rounded-xl bg-slate-50 p-2.5">
              <Text className="text-xs font-bold text-[#202C4B]">{ch.event}</Text>
              <Text className="text-[10px] text-[#3D5EE1] mt-0.5">{ch.date}</Text>
            </View>
          ))}
        </View>

        <View className="gap-y-2">
          {data.activityTimeline.map((at, idx) => (
            <View key={idx} className="flex-row items-center rounded-xl bg-slate-50 p-2.5">
              <Feather name="check" size={14} color="#10b981" />
              <View className="ml-2 flex-1">
                <Text className="text-xs text-slate-700">{at.action}</Text>
                <Text className="text-[10px] text-slate-400">{at.time}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* MODAL 1: SUBMIT ASSIGNMENT */}
      <Modal visible={isSubmitModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Submit Assignment</Text>
              <Pressable onPress={() => setIsSubmitModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Select Assignment</Text>
              <TextInput
                value={selectedAssignment}
                onChangeText={setSelectedAssignment}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Attach File / Work Document</Text>
              <View className="rounded-2xl border border-dashed border-[#3D5EE1] bg-blue-50/40 p-4 items-center mb-3">
                <Feather name="file-text" size={24} color="#3D5EE1" />
                <Text className="mt-2 text-xs font-bold text-[#3D5EE1]">Attach solution_set.pdf</Text>
                <Text className="text-[10px] text-slate-400">PDF, DOCX, or PNG (Max 15MB)</Text>
              </View>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Notes for Teacher (Optional)</Text>
              <TextInput
                placeholder="Included step-by-step proofs for questions 4 and 5."
                value={submissionNotes}
                onChangeText={setSubmissionNotes}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsSubmitModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSubmitAssignment}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-xs font-bold text-white">Upload & Submit</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: HALL TICKET PREVIEW */}
      <Modal visible={isHallTicketModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Examination Hall Ticket</Text>
              <Pressable onPress={() => setIsHallTicketModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <View className="rounded-2xl border border-slate-200 bg-slate-50 p-4 mb-3">
                <Text className="text-center text-xs font-bold text-[#202C4B] uppercase tracking-wider">
                  KARKKAII INTERNATIONAL SCHOOL
                </Text>
                <Text className="text-center text-[10px] text-slate-500">Term 1 Midterm Examination 2026</Text>

                <View className="mt-3 pt-3 border-t border-slate-200 gap-y-1">
                  <Text className="text-xs font-semibold text-slate-700">Student: Janet Daniel</Text>
                  <Text className="text-xs text-slate-600">Admission No: AD1256589</Text>
                  <Text className="text-xs text-slate-600">Class: Grade X - Section A • Roll No: 35013</Text>
                  <Text className="text-xs text-slate-600">Exam Center: Block B - Hall A</Text>
                </View>

                <View className="mt-3 pt-3 border-t border-slate-200">
                  <Text className="text-[11px] font-bold text-[#202C4B] mb-1">Schedule:</Text>
                  <Text className="text-[10px] text-slate-600">• Nov 25: Advanced Mathematics (09:30 AM)</Text>
                  <Text className="text-[10px] text-slate-600">• Nov 28: Physics Practical Assessment (11:00 AM)</Text>
                  <Text className="text-[10px] text-slate-600">• Dec 01: Chemistry Theory (09:30 AM)</Text>
                </View>
              </View>

              <Pressable
                onPress={() => {
                  Alert.alert('Downloaded', 'Digital Hall Ticket PDF saved to your device.');
                  setIsHallTicketModalOpen(false);
                }}
                className="items-center rounded-xl bg-[#10b981] py-3 mt-2"
              >
                <Text className="text-xs font-bold text-white">Download PDF</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: CONTACT TEACHER */}
      <Modal visible={isTeacherModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Request Faculty Meeting</Text>
              <Pressable onPress={() => setIsTeacherModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Select Faculty Member</Text>
              <TextInput
                value={selectedTeacher}
                onChangeText={setSelectedTeacher}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Reason / Subject of Doubt</Text>
              <TextInput
                placeholder="Clarification on Calculus Integration limits"
                value={meetingReason}
                onChangeText={setMeetingReason}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsTeacherModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleBookMeeting}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-xs font-bold text-white">Request Meeting</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
