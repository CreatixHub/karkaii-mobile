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
import { TEACHER_DASHBOARD_DATA } from '@/data/adminDashboardMock';

interface TeacherDashboardViewProps {
  greeting: string;
  displayName?: string;
}

export default function TeacherDashboardView({ greeting, displayName }: TeacherDashboardViewProps) {
  const data = TEACHER_DASHBOARD_DATA;

  // Modal states
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Form states
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentClass, setAssignmentClass] = useState('Grade X-A');
  const [assignmentDue, setAssignmentDue] = useState('Tomorrow, 5:00 PM');

  const [marksStudent, setMarksStudent] = useState('Janet Daniel');
  const [marksScore, setMarksScore] = useState('98');
  const [marksMax, setMarksMax] = useState('100');

  const [announcementMsg, setAnnouncementMsg] = useState('');

  const handleMarkAttendanceSuccess = () => {
    Alert.alert('Attendance Marked', 'Daily attendance for Grade X-A submitted successfully! (37 Present, 1 Absent)');
    setIsAttendanceModalOpen(false);
  };

  const handleCreateAssignment = () => {
    if (!assignmentTitle.trim()) {
      Alert.alert('Required', 'Please enter assignment title');
      return;
    }
    Alert.alert('Assignment Created', `Assignment "${assignmentTitle}" published to ${assignmentClass}`);
    setIsAssignmentModalOpen(false);
    setAssignmentTitle('');
  };

  const handleSaveMarks = () => {
    Alert.alert('Marks Saved', `Score ${marksScore}/${marksMax} recorded for ${marksStudent}`);
    setIsMarksModalOpen(false);
  };

  const handleSendAnnouncement = () => {
    if (!announcementMsg.trim()) {
      Alert.alert('Required', 'Please enter announcement text');
      return;
    }
    Alert.alert('Broadcast Sent', 'Announcement broadcasted to Homeroom Grade X-A parents & students');
    setIsAnnouncementModalOpen(false);
    setAnnouncementMsg('');
  };

  return (
    <View>
      {/* 1. TEACHER HERO CARD & PROFILE CHIPS */}
      <View className="mb-4 rounded-3xl bg-white p-5 border border-slate-100 shadow-sm shadow-black/5">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#10b981]">
            <Feather name="book-open" size={24} color="#ffffff" />
          </View>
          <View className="ml-3.5 flex-1">
            <Text className="text-lg font-bold text-[#202C4B]">
              {greeting}, {displayName || data.profile.name}
            </Text>
            <Text className="mt-0.5 text-xs text-slate-500 font-medium">
              {data.profile.designation} • {data.profile.department}
            </Text>
          </View>
        </View>

        {/* Hero Chips (Teacher ID, Department, Designation, Homeroom Class) */}
        <View className="mt-3.5 flex-row flex-wrap gap-2">
          <View className="rounded-xl bg-slate-100 px-2.5 py-1 flex-row items-center">
            <Feather name="hash" size={11} color="#64748b" />
            <Text className="ml-1 text-[11px] font-semibold text-slate-700">
              {data.profile.teacherId}
            </Text>
          </View>
          <View className="rounded-xl bg-emerald-50 px-2.5 py-1 flex-row items-center">
            <Feather name="home" size={11} color="#059669" />
            <Text className="ml-1 text-[11px] font-semibold text-emerald-800">
              Homeroom: {data.profile.homeroomClass}
            </Text>
          </View>
          <View className="rounded-xl bg-indigo-50 px-2.5 py-1 flex-row items-center">
            <Feather name="award" size={11} color="#4338ca" />
            <Text className="ml-1 text-[11px] font-semibold text-indigo-800">
              {data.profile.department}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons Row */}
        <View className="mt-4 flex-row flex-wrap gap-2">
          <Pressable
            onPress={() => setIsAttendanceModalOpen(true)}
            className="flex-row items-center rounded-xl bg-[#10b981] px-3 py-2 active:bg-[#059669]"
          >
            <Feather name="check-square" size={13} color="#ffffff" />
            <Text className="ml-1.5 text-xs font-bold text-white">Take Attendance</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsAssignmentModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="plus-circle" size={13} color="#3D5EE1" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Create Assignment</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsMarksModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="award" size={13} color="#f59e0b" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Enter Marks</Text>
          </Pressable>

          <Pressable
            onPress={() => setIsAnnouncementModalOpen(true)}
            className="flex-row items-center rounded-xl border border-slate-200 bg-white px-3 py-2 active:bg-slate-50"
          >
            <Feather name="send" size={13} color="#8b5cf6" />
            <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">Announcement</Text>
          </Pressable>
        </View>
      </View>

      {/* 2. THE 10 TEACHER KPI TILES */}
      <View className="mb-4">
        <Text className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 px-1">
          TEACHING PULSE & METRICS (10 KPIs)
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

      {/* 3. WIDGET 1: TODAY'S TIMETABLE (Lesson Fields: Time, Duration, Subject, Grade, Room, Students, Status) */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              TIMETABLE
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">
              {"Today's Timetable"}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(app)/academic')}>
            <Text className="text-xs font-semibold text-[#10b981]">Full Routine →</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.todayTimetable.map((slot) => {
            const statusBg =
              slot.status === 'Live'
                ? 'bg-emerald-50 border-emerald-200'
                : slot.status === 'Next'
                ? 'bg-blue-50 border-blue-200'
                : slot.status === 'Done'
                ? 'bg-slate-50 border-slate-200'
                : 'bg-white border-slate-200';
            const statusTextColor =
              slot.status === 'Live'
                ? 'text-emerald-700'
                : slot.status === 'Next'
                ? 'text-blue-700'
                : slot.status === 'Done'
                ? 'text-slate-500'
                : 'text-slate-700';

            return (
              <View
                key={slot.id}
                className={`rounded-2xl border p-3.5 ${statusBg}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center">
                    <Feather name="clock" size={12} color="#64748b" />
                    <Text className="ml-1.5 text-xs font-bold text-[#202C4B]">{slot.time}</Text>
                    <Text className="ml-1 text-[10px] text-slate-400">({slot.duration})</Text>
                  </View>
                  <View className="rounded-full bg-white px-2.5 py-0.5 shadow-sm border border-slate-100">
                    <Text className={`text-[10px] font-bold ${statusTextColor}`}>
                      {slot.status === 'Live' ? '● LIVE NOW' : slot.status}
                    </Text>
                  </View>
                </View>

                <Text className="mt-2 text-sm font-bold text-[#202C4B]">{slot.subject}</Text>
                <View className="mt-1 flex-row items-center justify-between">
                  <Text className="text-xs font-medium text-slate-600">
                    {slot.grade} • {slot.room}
                  </Text>
                  <Text className="text-[11px] font-semibold text-slate-500">
                    {slot.students} Enrolled
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>

      {/* 4. WIDGET 2: AI INSIGHTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SMART ASSISTANT
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">AI Insights</Text>
          </View>
          <View className="rounded-full bg-pink-50 px-2.5 py-1 flex-row items-center">
            <Feather name="zap" size={12} color="#ec4899" />
            <Text className="ml-1 text-[11px] font-bold text-pink-700">AI Advisor</Text>
          </View>
        </View>

        <View className="gap-y-2.5">
          {data.aiInsights.map((tip, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{tip.title}</Text>
                <View className="rounded-full bg-indigo-50 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-indigo-700">{tip.tag}</Text>
                </View>
              </View>
              <Text className="mt-1 text-xs text-slate-600 leading-4">{tip.suggestion}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 5. WIDGET 3: CLASS PERFORMANCE */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          ACADEMIC BENCHMARK
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">
          Class Performance
        </Text>

        <View className="gap-y-3">
          {data.classPerformance.map((item, idx) => (
            <View key={idx}>
              <View className="flex-row justify-between mb-1">
                <Text className="text-xs font-bold text-[#202C4B]">
                  {item.className} • {item.subject}
                </Text>
                <Text className="text-xs font-bold text-emerald-700">Avg {item.avgScore}</Text>
              </View>
              <View className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <View className="h-full rounded-full bg-[#10b981]" style={{ width: `${item.syllabus}%` }} />
              </View>
              <View className="flex-row justify-between mt-1 text-[10px]">
                <Text className="text-[10px] text-slate-400">Syllabus: {item.syllabus}%</Text>
                <Text className="text-[10px] font-semibold text-slate-600">Pass Rate: {item.passRate}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 6. WIDGET 4: MY CLASSES */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              SECTIONS
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">My Classes</Text>
          </View>
          <Feather name="layers" size={16} color="#64748b" />
        </View>

        <View className="gap-y-2.5">
          {data.myClasses.map((cls, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{cls.name}</Text>
                <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                  <Text className="text-[10px] font-bold text-emerald-700">{cls.strength} Students</Text>
                </View>
              </View>
              <Text className="text-[11px] text-slate-500 mt-0.5">{cls.role}</Text>
              <View className="mt-1.5 flex-row items-center justify-between pt-1.5 border-t border-slate-100">
                <Text className="text-[10px] text-slate-400">Room: {cls.room}</Text>
                <Text className="text-[10px] font-semibold text-[#3D5EE1]">Next: {cls.nextClass}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 7. WIDGET 5: ASSIGNMENTS & HOMEWORK REVIEW */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              EVALUATION
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">Assignments</Text>
          </View>
          <Pressable onPress={() => setIsAssignmentModalOpen(true)}>
            <Text className="text-xs font-semibold text-[#10b981]">+ Create</Text>
          </Pressable>
        </View>

        <View className="gap-y-2.5">
          {data.assignments.map((item) => (
            <View key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3.5">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B] flex-1 mr-2" numberOfLines={1}>
                  {item.title}
                </Text>
                {item.urgent ? (
                  <View className="rounded-full bg-red-50 px-2 py-0.5">
                    <Text className="text-[10px] font-bold text-red-600">Urgent</Text>
                  </View>
                ) : null}
              </View>
              <View className="mt-1 flex-row items-center justify-between">
                <Text className="text-[11px] text-slate-500">{item.grade} • Due: {item.due}</Text>
                <Text className="text-[11px] font-bold text-[#3D5EE1]">
                  {item.submittedCount} / {item.totalCount} Submitted
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 8. WIDGET 6: EXAM GRADING */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          MARKING DESK
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">Exam Grading</Text>

        <View className="gap-y-3">
          {data.examGrading.map((item, idx) => (
            <View key={idx} className="rounded-2xl border border-slate-100 bg-slate-50/50 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{item.title}</Text>
                <Text className="text-[10px] font-bold" style={{ color: item.color }}>
                  {item.status}
                </Text>
              </View>
              <Text className="text-[10px] text-slate-400 mt-0.5">{item.grade}</Text>
              <View className="mt-2 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${(item.graded / item.total) * 100}%`,
                    backgroundColor: item.color,
                  }}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 9. WIDGET 7 & 8: ATTENDANCE CENTER & PARENT COMMUNICATION */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              HOMEROOM REGISTER
            </Text>
            <Text className="mt-0.5 text-base font-bold text-[#202C4B]">Attendance Center</Text>
          </View>
          <Pressable
            onPress={() => setIsAttendanceModalOpen(true)}
            className="rounded-full bg-emerald-50 px-2.5 py-1"
          >
            <Text className="text-xs font-bold text-emerald-700">Update Attendance</Text>
          </Pressable>
        </View>

        <View className="flex-row gap-2 mb-3">
          <View className="flex-1 rounded-xl bg-slate-50 p-2.5 items-center">
            <Text className="text-[10px] text-slate-500">Present</Text>
            <Text className="text-base font-bold text-emerald-700">
              {data.attendanceSummary.presentToday}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-slate-50 p-2.5 items-center">
            <Text className="text-[10px] text-slate-500">Absent</Text>
            <Text className="text-base font-bold text-red-600">
              {data.attendanceSummary.absentToday}
            </Text>
          </View>
          <View className="flex-1 rounded-xl bg-slate-50 p-2.5 items-center">
            <Text className="text-[10px] text-slate-500">Attendance Rate</Text>
            <Text className="text-base font-bold text-[#3D5EE1]">
              {data.attendanceSummary.attendanceRate}
            </Text>
          </View>
        </View>

        {/* Parent Communication */}
        <Text className="text-xs font-bold text-[#202C4B] mb-2 mt-2">Parent Inquiries</Text>
        <View className="gap-y-2">
          {data.parentQueries.map((pq) => (
            <View key={pq.id} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-bold text-[#202C4B]">{pq.parent}</Text>
                <Text className="text-[10px] text-slate-400">{pq.time}</Text>
              </View>
              <Text className="text-[10px] text-slate-500 mt-0.5">{pq.student}</Text>
              <Text className="text-xs text-slate-700 mt-1">{pq.topic}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 10. WIDGET 9 & 10: STUDENT INSIGHTS & ACHIEVEMENTS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          STUDENT INSIGHTS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">
          Class Spotlight
        </Text>

        <View className="gap-y-2">
          <View className="rounded-xl bg-emerald-50/50 p-2.5">
            <Text className="text-[10px] font-bold text-emerald-800">TOP PERFORMER</Text>
            <Text className="text-xs font-bold text-[#202C4B] mt-0.5">{data.studentInsights.topPerformer}</Text>
          </View>
          <View className="rounded-xl bg-blue-50/50 p-2.5">
            <Text className="text-[10px] font-bold text-blue-800">MOST IMPROVED</Text>
            <Text className="text-xs font-bold text-[#202C4B] mt-0.5">{data.studentInsights.mostImproved}</Text>
          </View>
          <View className="rounded-xl bg-amber-50/50 p-2.5">
            <Text className="text-[10px] font-bold text-amber-800">NEEDS ATTENTION</Text>
            <Text className="text-xs font-bold text-[#202C4B] mt-0.5">{data.studentInsights.needsAttention}</Text>
          </View>
        </View>

        {/* Teacher Achievements */}
        <Text className="text-xs font-bold text-[#202C4B] mb-2 mt-4">Faculty Achievements</Text>
        <View className="gap-y-2">
          {data.achievements.map((ach, idx) => (
            <View key={idx} className="flex-row items-center rounded-xl bg-slate-50 p-2.5">
              <Feather name="award" size={16} color="#f59e0b" />
              <View className="ml-2.5 flex-1">
                <Text className="text-xs font-bold text-[#202C4B]">{ach.title}</Text>
                <Text className="text-[10px] text-slate-400">{ach.date}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 11. WIDGET 11, 12, 13: CALENDAR, TIMELINE & NOTIFICATIONS */}
      <View className="mb-4 rounded-3xl border border-slate-100 bg-white p-5 shadow-sm shadow-black/5">
        <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          AGENDA & CIRCULARS
        </Text>
        <Text className="mt-0.5 text-base font-bold text-[#202C4B] mb-3">Calendar & Alerts</Text>

        <View className="gap-y-2 mb-3">
          {data.upcomingEvents.map((ev, idx) => (
            <View key={idx} className="rounded-xl bg-slate-50 p-2.5">
              <Text className="text-xs font-bold text-[#202C4B]">{ev.title}</Text>
              <Text className="text-[10px] text-slate-500 mt-0.5">{ev.date} • {ev.venue}</Text>
            </View>
          ))}
        </View>

        <Text className="text-xs font-bold text-[#202C4B] mb-2">School Circulars</Text>
        <View className="gap-y-2">
          {data.notifications.map((notif) => (
            <View key={notif.id} className="flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
              <View className="flex-1 mr-2">
                <Text className="text-xs font-semibold text-[#202C4B]">{notif.title}</Text>
                <Text className="text-[10px] text-slate-400">{notif.time}</Text>
              </View>
              {notif.urgent ? (
                <View className="rounded-full bg-red-100 px-2 py-0.5">
                  <Text className="text-[9px] font-bold text-red-700">Urgent</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </View>

      {/* MODAL 1: QUICK ATTENDANCE */}
      <Modal visible={isAttendanceModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Mark Daily Attendance</Text>
              <Pressable onPress={() => setIsAttendanceModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs text-slate-500 mb-3">
                Class: <Text className="font-bold text-[#202C4B]">Grade X - Section A</Text> • Total: 38
              </Text>

              <View className="rounded-2xl bg-emerald-50 p-3 mb-3">
                <Text className="text-xs font-bold text-emerald-800">Quick Bulk Mode</Text>
                <Text className="text-[11px] text-emerald-700 mt-0.5">
                  37 Students marked Present by default. Only 1 student absent on leave.
                </Text>
              </View>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Absent Student (Leave Logged)</Text>
              <TextInput
                value="Noah Miller (Medical Leave)"
                editable={false}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsAttendanceModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleMarkAttendanceSuccess}
                  className="flex-1 items-center rounded-xl bg-[#10b981] py-3"
                >
                  <Text className="text-xs font-bold text-white">Submit Register</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 2: CREATE ASSIGNMENT */}
      <Modal visible={isAssignmentModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Create New Assignment</Text>
              <Pressable onPress={() => setIsAssignmentModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Class Section</Text>
              <TextInput
                value={assignmentClass}
                onChangeText={setAssignmentClass}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Assignment Title *</Text>
              <TextInput
                placeholder="e.g. Quadratic Inequalities Problem Set"
                value={assignmentTitle}
                onChangeText={setAssignmentTitle}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Submission Deadline</Text>
              <TextInput
                value={assignmentDue}
                onChangeText={setAssignmentDue}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsAssignmentModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleCreateAssignment}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-xs font-bold text-white">Publish Assignment</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 3: ENTER MARKS */}
      <Modal visible={isMarksModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Enter Student Marks</Text>
              <Pressable onPress={() => setIsMarksModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Student</Text>
              <TextInput
                value={marksStudent}
                onChangeText={setMarksStudent}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Marks Obtained</Text>
              <TextInput
                keyboardType="numeric"
                value={marksScore}
                onChangeText={setMarksScore}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Maximum Marks</Text>
              <TextInput
                keyboardType="numeric"
                value={marksMax}
                onChangeText={setMarksMax}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsMarksModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveMarks}
                  className="flex-1 items-center rounded-xl bg-[#10b981] py-3"
                >
                  <Text className="text-xs font-bold text-white">Save Marks</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL 4: SEND ANNOUNCEMENT */}
      <Modal visible={isAnnouncementModalOpen} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Broadcast Announcement</Text>
              <Pressable onPress={() => setIsAnnouncementModalOpen(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Audience</Text>
              <Text className="text-xs text-slate-500 mb-3">Grade X - Section A (Students & Parents)</Text>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Announcement Message *</Text>
              <TextInput
                multiline
                numberOfLines={3}
                placeholder="Type notice message here..."
                value={announcementMsg}
                onChangeText={setAnnouncementMsg}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4 min-h-[80px]"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setIsAnnouncementModalOpen(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSendAnnouncement}
                  className="flex-1 items-center rounded-xl bg-[#8b5cf6] py-3"
                >
                  <Text className="text-xs font-bold text-white">Broadcast</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
