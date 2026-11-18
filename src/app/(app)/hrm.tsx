import React, { useMemo, useState } from 'react';
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
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_HOLIDAYS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PAYROLL,
  INITIAL_STAFF_ATTENDANCE,
  INITIAL_STUDENT_ATTENDANCE,
  INITIAL_TEACHER_ATTENDANCE,
} from '@/data/hrmMock';
import type {
  HolidayItem,
  LeaveRequestItem,
  PayrollItem,
  StaffAttendanceItem,
  StudentAttendanceItem,
  TeacherAttendanceItem,
} from '@/types/modules';

type MainHrmModule = 'holidays' | 'attendance' | 'leaves' | 'payroll_extra';
type AttendanceSubTab = 'student_att' | 'teacher_att' | 'staff_att';

export default function HrmScreen() {
  // Top-level Navigation
  const [activeModule, setActiveModule] = useState<MainHrmModule>('attendance');
  const [attendanceSubTab, setAttendanceSubTab] = useState<AttendanceSubTab>('student_att');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedDate] = useState('18 Nov 2026');

  // Local state for all 5 HRM pages + supplementary
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);
  const [studentAtt, setStudentAtt] = useState<StudentAttendanceItem[]>(INITIAL_STUDENT_ATTENDANCE);
  const [teacherAtt, setTeacherAtt] = useState<TeacherAttendanceItem[]>(INITIAL_TEACHER_ATTENDANCE);
  const [staffAtt, setStaffAtt] = useState<StaffAttendanceItem[]>(INITIAL_STAFF_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(INITIAL_LEAVE_REQUESTS);
  const [payroll] = useState<PayrollItem[]>(INITIAL_PAYROLL);

  // Modals state
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [showAddHolidayModal, setShowAddHolidayModal] = useState(false);
  const [selectedStudentForDetail, setSelectedStudentForDetail] = useState<StudentAttendanceItem | null>(null);

  // Form states
  const [formField1, setFormField1] = useState('');
  const [formField2, setFormField2] = useState('');
  const [formField3, setFormField3] = useState('');
  const [formField4, setFormField4] = useState('');
  const [formField5, setFormField5] = useState('');
  const [formField6, setFormField6] = useState('');

  const resetForms = () => {
    setFormField1('');
    setFormField2('');
    setFormField3('');
    setFormField4('');
    setFormField5('');
    setFormField6('');
  };

  // --- FILTERED DATASETS ---
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        h.title.toLowerCase().includes(q) ||
        (h.category && h.category.toLowerCase().includes(q)) ||
        (h.type && h.type.toLowerCase().includes(q)) ||
        (h.description && h.description.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter === 'Public') return h.category === 'Public';
      if (statusFilter === 'School') return h.category === 'School';
      if (statusFilter === 'Festival') return h.category === 'Festival';
      if (statusFilter === 'Examination') return h.category === 'Examination';
      return true;
    });
  }, [holidays, searchQuery, statusFilter]);

  const filteredStudentAtt = useMemo(() => {
    return studentAtt.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.studentName.toLowerCase().includes(q) ||
        s.rollNo.includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.className.toLowerCase().includes(q) ||
        s.guardianName.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && s.status !== statusFilter) return false;
      return true;
    });
  }, [studentAtt, searchQuery, statusFilter]);

  const filteredTeacherAtt = useMemo(() => {
    return teacherAtt.filter((t) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        t.name.toLowerCase().includes(q) ||
        t.employeeId.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q) ||
        t.designation.toLowerCase().includes(q) ||
        t.subjects.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      return true;
    });
  }, [teacherAtt, searchQuery, statusFilter]);

  const filteredStaffAtt = useMemo(() => {
    return staffAtt.filter((stf) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        stf.name.toLowerCase().includes(q) ||
        stf.staffId.toLowerCase().includes(q) ||
        stf.department.toLowerCase().includes(q) ||
        (stf.designation && stf.designation.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && stf.status !== statusFilter) return false;
      return true;
    });
  }, [staffAtt, searchQuery, statusFilter]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter((l) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        l.applicantName.toLowerCase().includes(q) ||
        l.leaveType.toLowerCase().includes(q) ||
        (l.department && l.department.toLowerCase().includes(q)) ||
        (l.reason && l.reason.toLowerCase().includes(q)) ||
        l.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;
      if (statusFilter !== 'All' && l.status !== statusFilter) return false;
      return true;
    });
  }, [leaveRequests, searchQuery, statusFilter]);

  // --- ACTIONS ---
  const handleToggleStudentStatus = (id: string) => {
    const nextMap: Record<StudentAttendanceItem['status'], StudentAttendanceItem['status']> = {
      Present: 'Late',
      Late: 'Absent',
      Absent: 'On Leave',
      'On Leave': 'Half Day',
      'Half Day': 'Present',
    };

    setStudentAtt((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: nextMap[s.status] } : s))
    );
  };

  const handleToggleTeacherStatus = (id: string) => {
    const nextMap: Record<TeacherAttendanceItem['status'], TeacherAttendanceItem['status']> = {
      Present: 'Late',
      Late: 'On Leave',
      'On Leave': 'Absent',
      Absent: 'Half Day',
      'Half Day': 'Present',
    };

    setTeacherAtt((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: nextMap[t.status] } : t))
    );
  };

  const handleToggleStaffStatus = (id: string) => {
    const nextMap: Record<StaffAttendanceItem['status'], StaffAttendanceItem['status']> = {
      Present: 'Late',
      Late: 'On Leave',
      'On Leave': 'Absent',
      Absent: 'Half Day',
      'Half Day': 'Present',
    };

    setStaffAtt((prev) =>
      prev.map((st) => (st.id === id ? { ...st, status: nextMap[st.status] } : st))
    );
  };

  const handleMarkAllStudentsPresent = () => {
    setStudentAtt((prev) =>
      prev.map((s) => ({ ...s, status: 'Present' as const, checkInTime: '08:00 AM' }))
    );
    Alert.alert('Attendance Updated', 'All students marked as Present for today.');
  };

  const handleApplyLeave = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter applicant name and leave reason.');
      return;
    }

    const daysCount = parseInt(formField5, 10) || 1;
    const newLeave: LeaveRequestItem = {
      id: `LV-${Date.now().toString().slice(-3)}`,
      applicantName: formField1,
      applicantRole: formField3 || 'Staff Member',
      department: formField4 || 'Academic Faculty',
      leaveType: formField2 || 'Casual Leave',
      fromDate: 'Upcoming',
      toDate: 'Upcoming',
      days: daysCount,
      reason: formField6 || 'Personal emergency and leave requirements.',
      status: 'Pending',
      appliedOn: 'Today',
      approver: 'HR Directorate',
    };

    setLeaveRequests([newLeave, ...leaveRequests]);
    resetForms();
    setShowApplyLeaveModal(false);
    Alert.alert('Leave Submitted', `Leave application for ${newLeave.applicantName} recorded.`);
  };

  const handleApproveRejectLeave = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setLeaveRequests((prev) =>
      prev.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    Alert.alert('Decision Recorded', `Application ${id} has been marked as ${newStatus}.`);
  };

  const handleCreateHoliday = () => {
    if (!formField1.trim() || !formField2.trim()) {
      Alert.alert('Required', 'Please enter holiday title and date.');
      return;
    }

    const durationNum = parseInt(formField4, 10) || 1;
    const newHol: HolidayItem = {
      id: `HOL-${Date.now().toString().slice(-3)}`,
      title: formField1,
      name: formField1,
      date: formField2,
      dayOfWeek: 'Monday',
      category: (formField3 as HolidayItem['category']) || 'Public',
      type: `${formField3 || 'Public'} Holiday`,
      durationDays: durationNum,
      duration: `${durationNum} day${durationNum > 1 ? 's' : ''}`,
      classes: formField5 || 'All Classes',
      branch: 'All Campuses',
      description: formField6 || 'Official academic calendar holiday.',
    };

    setHolidays([newHol, ...holidays]);
    resetForms();
    setShowAddHolidayModal(false);
    Alert.alert('Holiday Registered', `"${newHol.title}" added to academic calendar.`);
  };

  // Top Module Switcher List
  const modulesList = [
    {
      id: 'attendance',
      title: 'Attendance (P31–33)',
      icon: 'check-square',
      badge: studentAtt.length + teacherAtt.length + staffAtt.length,
    },
    {
      id: 'leaves',
      title: 'Leave List (P34)',
      icon: 'calendar',
      badge: leaveRequests.filter((l) => l.status === 'Pending').length,
    },
    {
      id: 'holidays',
      title: 'Holidays (P30)',
      icon: 'sun',
      badge: holidays.length,
    },
    {
      id: 'payroll_extra',
      title: 'Payroll & Master',
      icon: 'briefcase',
      badge: payroll.length,
    },
  ];

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Top Header & Main Module Tabs */}
      <View className="bg-white border-b border-slate-200">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-3 pt-3 pb-2"
        >
          {modulesList.map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <Pressable
                key={mod.id}
                onPress={() => {
                  setActiveModule(mod.id as MainHrmModule);
                  setSearchQuery('');
                  setStatusFilter('All');
                }}
                className={`mr-2.5 flex-row items-center rounded-xl px-3.5 py-2 ${
                  isActive
                    ? 'bg-[#3D5EE1]'
                    : 'bg-slate-50 border border-slate-200/80'
                }`}
              >
                <Feather
                  name={mod.icon as any}
                  size={14}
                  color={isActive ? '#ffffff' : '#64748b'}
                />
                <Text
                  className={`ml-1.5 text-xs font-bold ${
                    isActive ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {mod.title}
                </Text>
                <View
                  className={`ml-1.5 rounded-full px-1.5 py-0.2 ${
                    isActive ? 'bg-white/20' : 'bg-slate-200'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      isActive ? 'text-white' : 'text-slate-600'
                    }`}
                  >
                    {mod.badge}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Secondary Sub-Tabs for Attendance (Pages 31, 32, 33) */}
        {activeModule === 'attendance' && (
          <View className="px-3 pb-2.5 pt-1 border-t border-slate-100 flex-row items-center justify-between">
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row gap-x-2">
                {[
                  { id: 'student_att', label: 'Student Attendance (Page 31)', count: studentAtt.length },
                  { id: 'teacher_att', label: 'Teacher Attendance (Page 32)', count: teacherAtt.length },
                  { id: 'staff_att', label: 'Staff Attendance (Page 33)', count: staffAtt.length },
                ].map((st) => (
                  <Pressable
                    key={st.id}
                    onPress={() => {
                      setAttendanceSubTab(st.id as AttendanceSubTab);
                      setStatusFilter('All');
                    }}
                    className={`rounded-lg px-3 py-1.5 ${
                      attendanceSubTab === st.id
                        ? 'bg-blue-50 border border-[#3D5EE1]'
                        : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        attendanceSubTab === st.id ? 'text-[#3D5EE1]' : 'text-slate-600'
                      }`}
                    >
                      {st.label} ({st.count})
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {attendanceSubTab === 'student_att' && (
              <Pressable
                onPress={handleMarkAllStudentsPresent}
                className="ml-2 flex-row items-center rounded-xl bg-emerald-600 px-2.5 py-1.5 shadow-sm shadow-emerald-600/30"
              >
                <Feather name="check" size={13} color="#ffffff" />
                <Text className="ml-1 text-[11px] font-bold text-white">All Present</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Action Header for Holidays & Leaves */}
        {activeModule === 'holidays' && (
          <View className="px-3 pb-2.5 pt-1 border-t border-slate-100 flex-row items-center justify-between">
            <View className="rounded-lg bg-blue-50 px-3 py-1.5 border border-[#3D5EE1]">
              <Text className="text-xs font-bold text-[#3D5EE1]">
                Academic Holidays Calendar (Page 30) · {holidays.length} Events
              </Text>
            </View>
            <Pressable
              onPress={() => {
                resetForms();
                setShowAddHolidayModal(true);
              }}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-1.5 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={14} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Add Holiday</Text>
            </Pressable>
          </View>
        )}

        {activeModule === 'leaves' && (
          <View className="px-3 pb-2.5 pt-1 border-t border-slate-100 flex-row items-center justify-between">
            <View className="rounded-lg bg-blue-50 px-3 py-1.5 border border-[#3D5EE1]">
              <Text className="text-xs font-bold text-[#3D5EE1]">
                Leave Approval Queue (Page 34) · {leaveRequests.length} Applications
              </Text>
            </View>
            <Pressable
              onPress={() => {
                resetForms();
                setShowApplyLeaveModal(true);
              }}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-1.5 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={14} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Apply Leave</Text>
            </Pressable>
          </View>
        )}

        {/* Search Bar & Saved View Pills */}
        <View className="px-3 pb-3">
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search across ${
              activeModule === 'attendance'
                ? attendanceSubTab
                : activeModule === 'leaves'
                ? 'leave requests'
                : activeModule === 'holidays'
                ? 'holidays'
                : 'payroll records'
            }…`}
          />

          {/* Quick Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2">
            {(activeModule === 'holidays'
              ? ['All', 'Public', 'School', 'Festival', 'Examination']
              : activeModule === 'leaves'
              ? ['All', 'Pending', 'Approved', 'Forwarded', 'Rejected']
              : ['All', 'Present', 'Late', 'Absent', 'On Leave', 'Half Day']
            ).map((flt) => (
              <Pressable
                key={flt}
                onPress={() => setStatusFilter(flt)}
                className={`mr-1.5 rounded-full px-2.5 py-1 ${
                  statusFilter === flt
                    ? 'bg-slate-900'
                    : 'bg-white border border-slate-200'
                }`}
              >
                <Text
                  className={`text-[11px] font-semibold ${
                    statusFilter === flt ? 'text-white' : 'text-slate-600'
                  }`}
                >
                  {flt}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-16"
      >
        {/* ================================================================= */}
        {/* 1. HOLIDAYS (Page 30, §9.1) */}
        {/* ================================================================= */}
        {activeModule === 'holidays' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Holidays</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{holidays.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Public Holidays</Text>
                <Text className="text-lg font-bold text-rose-600 mt-0.5">
                  {holidays.filter((h) => h.category === 'Public').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">School Breaks</Text>
                <Text className="text-lg font-bold text-[#3D5EE1] mt-0.5">
                  {holidays.filter((h) => h.category === 'School').length}
                </Text>
              </View>
            </View>

            {filteredHolidays.map((hol) => (
              <View
                key={hol.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 border border-amber-200 mr-3">
                      <Feather name="calendar" size={20} color="#d97706" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-base font-bold text-slate-900">{hol.title}</Text>
                        <View className="rounded-md bg-blue-50 px-2 py-0.5 border border-blue-200">
                          <Text className="text-[10px] font-bold text-[#3D5EE1]">{hol.category}</Text>
                        </View>
                      </View>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {hol.date} ({hol.dayOfWeek}) · {hol.duration || `${hol.durationDays} days`}
                      </Text>
                    </View>
                  </View>
                  <View className="rounded-lg bg-slate-100 px-2.5 py-1">
                    <Text className="text-[11px] font-semibold text-slate-700">{hol.type}</Text>
                  </View>
                </View>

                {hol.description && (
                  <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                    <Text className="text-xs text-slate-600 leading-relaxed italic">
                      &ldquo;{hol.description}&rdquo;
                    </Text>
                  </View>
                )}

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Applicable: {hol.classes || 'All Cohorts'}
                  </Text>
                  <Text className="text-[11px] font-semibold text-indigo-700">
                    {hol.branch || 'All Campuses'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 2. STUDENT ATTENDANCE (Page 31, §9.2.1) */}
        {/* ================================================================= */}
        {activeModule === 'attendance' && attendanceSubTab === 'student_att' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Registered</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{studentAtt.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Present Today</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {studentAtt.filter((s) => s.status === 'Present').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Late / Absent</Text>
                <Text className="text-lg font-bold text-rose-600 mt-0.5">
                  {studentAtt.filter((s) => s.status === 'Absent' || s.status === 'Late').length}
                </Text>
              </View>
            </View>

            {/* Date Indicator Bar */}
            <View className="rounded-xl bg-blue-50/80 px-3.5 py-2 border border-blue-200 flex-row items-center justify-between">
              <View className="flex-row items-center">
                <Feather name="clock" size={13} color="#3D5EE1" />
                <Text className="ml-1.5 text-xs font-bold text-blue-900">
                  Daily Register · {selectedDate}
                </Text>
              </View>
              <Text className="text-xs text-blue-700 font-semibold">Grade III - Section A</Text>
            </View>

            {filteredStudentAtt.map((std) => (
              <View
                key={std.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">Roll #{std.rollNo}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{std.admissionNo}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{std.studentName}</Text>
                    <Text className="text-xs text-slate-500">
                      {std.className} ({std.section}) · YTD: <Text className="font-bold text-slate-800">{std.attendancePercent}%</Text>
                    </Text>
                  </View>
                  <StatusBadge status={std.status} />
                </View>

                {/* Check In / Out Data */}
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between text-xs">
                    <Text className="text-xs text-slate-500">
                      In: <Text className="font-semibold text-slate-800">{std.checkInTime}</Text>
                      {std.checkInGate ? ` (${std.checkInGate})` : ''}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      Out: <Text className="font-semibold text-slate-800">{std.checkOutTime}</Text>
                    </Text>
                  </View>
                  {std.notes && (
                    <Text className="mt-1.5 text-[11px] text-slate-600 italic">
                      &ldquo;{std.notes}&rdquo;
                    </Text>
                  )}
                </View>

                {/* Actions & Guardian details */}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="user" size={12} color="#64748b" />
                    <Text className="ml-1 text-[11px] text-slate-600">
                      {std.guardianName} ({std.guardianPhone})
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-x-2">
                    <Pressable
                      onPress={() => setSelectedStudentForDetail(std)}
                      className="rounded-lg bg-blue-50 px-2 py-1 border border-blue-200"
                    >
                      <Text className="text-[11px] font-bold text-[#3D5EE1]">Details</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleToggleStudentStatus(std.id)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 border border-slate-200"
                    >
                      <Text className="text-[11px] font-bold text-slate-700">Toggle</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 3. TEACHER ATTENDANCE (Page 32, §9.2.2) */}
        {/* ================================================================= */}
        {activeModule === 'attendance' && attendanceSubTab === 'teacher_att' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Teachers</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{teacherAtt.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Present</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {teacherAtt.filter((t) => t.status === 'Present').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">On Leave</Text>
                <Text className="text-lg font-bold text-amber-600 mt-0.5">
                  {teacherAtt.filter((t) => t.status === 'On Leave').length}
                </Text>
              </View>
            </View>

            {filteredTeacherAtt.map((tch) => (
              <View
                key={tch.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{tch.employeeId}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{tch.department}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{tch.name}</Text>
                    <Text className="text-xs text-slate-500">{tch.designation} · {tch.subjects}</Text>
                  </View>
                  <StatusBadge status={tch.status} />
                </View>

                {/* Duty & Shift timeline */}
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between text-xs">
                    <Text className="text-xs text-slate-600">
                      Check-In: <Text className="font-bold text-slate-800">{tch.checkInTime}</Text>
                    </Text>
                    <Text className="text-xs text-slate-600">
                      Check-Out: <Text className="font-bold text-slate-800">{tch.checkOutTime}</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-1 text-xs">
                    <Text className="text-[11px] text-slate-500">Working: {tch.workingHours}</Text>
                    <View className="flex-row items-center gap-1">
                      <Feather name="cpu" size={10} color="#64748b" />
                      <Text className="text-[11px] font-semibold text-slate-600">{tch.method}</Text>
                    </View>
                  </View>
                  {tch.notes && (
                    <Text className="mt-1.5 text-[11px] text-slate-600 italic">
                      &ldquo;{tch.notes}&rdquo;
                    </Text>
                  )}
                </View>

                {/* Toggle Action */}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Classes: {tch.classes}</Text>
                  <Pressable
                    onPress={() => handleToggleTeacherStatus(tch.id)}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 border border-slate-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">Change Status</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 4. STAFF ATTENDANCE (Page 33, §9.2.3) */}
        {/* ================================================================= */}
        {activeModule === 'attendance' && attendanceSubTab === 'staff_att' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Non-Teaching Staff</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{staffAtt.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Present</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {staffAtt.filter((s) => s.status === 'Present').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Late / Leave</Text>
                <Text className="text-lg font-bold text-amber-600 mt-0.5">
                  {staffAtt.filter((s) => s.status === 'Late' || s.status === 'On Leave').length}
                </Text>
              </View>
            </View>

            {filteredStaffAtt.map((stf) => (
              <View
                key={stf.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="flex-row items-center gap-1.5">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{stf.staffId}</Text>
                      <View className="rounded-md bg-slate-100 px-1.5 py-0.5">
                        <Text className="text-[10px] font-semibold text-slate-600">{stf.department}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{stf.name}</Text>
                    <Text className="text-xs text-slate-500">{stf.designation || 'Staff Member'}</Text>
                  </View>
                  <StatusBadge status={stf.status} />
                </View>

                {/* Shift & punch details */}
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between text-xs">
                    <Text className="text-xs text-slate-600">
                      In: <Text className="font-bold text-slate-800">{stf.checkInTime}</Text>
                    </Text>
                    <Text className="text-xs text-slate-600">
                      Out: <Text className="font-bold text-slate-800">{stf.checkOutTime}</Text>
                    </Text>
                  </View>
                  <View className="flex-row items-center justify-between mt-1 text-xs">
                    <Text className="text-[11px] text-slate-500">
                      Hours: {stf.workingHours || '--'} {stf.overtime ? `(+${stf.overtime})` : ''}
                    </Text>
                    <Text className="text-[11px] font-semibold text-slate-600">
                      Method: {stf.method || 'Biometric'}
                    </Text>
                  </View>
                </View>

                {/* Quick Toggle */}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Shift: {stf.shift || 'Morning'}</Text>
                  <Pressable
                    onPress={() => handleToggleStaffStatus(stf.id)}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 border border-slate-200"
                  >
                    <Text className="text-[11px] font-bold text-slate-700">Change Status</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* 5. LEAVE LIST (Page 34, §9.2.4) */}
        {/* ================================================================= */}
        {activeModule === 'leaves' && (
          <View className="gap-y-3">
            {/* KPI Strip */}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Total Leaves</Text>
                <Text className="text-lg font-bold text-slate-900 mt-0.5">{leaveRequests.length}</Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Pending Review</Text>
                <Text className="text-lg font-bold text-amber-600 mt-0.5">
                  {leaveRequests.filter((l) => l.status === 'Pending').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-200">
                <Text className="text-[11px] text-slate-500">Approved</Text>
                <Text className="text-lg font-bold text-emerald-600 mt-0.5">
                  {leaveRequests.filter((l) => l.status === 'Approved').length}
                </Text>
              </View>
            </View>

            {filteredLeaves.map((lv) => (
              <View
                key={lv.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{lv.id}</Text>
                      <View className="rounded-md bg-purple-50 px-2 py-0.5 border border-purple-200">
                        <Text className="text-[10px] font-bold text-purple-700">{lv.leaveType}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{lv.applicantName}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {lv.applicantRole} · {lv.department || 'Faculty'}
                    </Text>
                  </View>
                  <StatusBadge status={lv.status} />
                </View>

                {/* Duration & Reason */}
                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between text-xs mb-1">
                    <Text className="text-xs text-slate-500">Duration</Text>
                    <Text className="text-xs font-bold text-slate-800">
                      {lv.days} Day{lv.days > 1 ? 's' : ''} ({lv.fromDate} → {lv.toDate})
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-600 leading-relaxed italic mt-1">
                    &ldquo;{lv.reason}&rdquo;
                  </Text>
                </View>

                {/* Approver & Review Actions */}
                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">
                    Approver: <Text className="font-semibold text-slate-600">{lv.approver || 'HR Directorate'}</Text>
                  </Text>

                  {lv.status === 'Pending' ? (
                    <View className="flex-row items-center gap-x-2">
                      <Pressable
                        onPress={() => handleApproveRejectLeave(lv.id, 'Approved')}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5"
                      >
                        <Text className="text-xs font-bold text-white">Approve</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleApproveRejectLeave(lv.id, 'Rejected')}
                        className="rounded-lg bg-rose-50 px-3 py-1.5 border border-rose-200"
                      >
                        <Text className="text-xs font-bold text-rose-700">Reject</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="rounded-lg bg-slate-100 px-2.5 py-1">
                      <Text className="text-[11px] font-semibold text-slate-600">Decision Finalized</Text>
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================================================================= */}
        {/* SUPPLEMENTARY: PAYROLL & HR MASTER */}
        {/* ================================================================= */}
        {activeModule === 'payroll_extra' && (
          <View className="gap-y-3">
            <View className="rounded-2xl bg-indigo-50/70 p-3.5 border border-indigo-100">
              <Text className="text-xs font-bold text-indigo-900">
                HR Master Registers & Payroll Records
              </Text>
              <Text className="text-xs text-indigo-700 mt-0.5">
                Staff salary schedules, payslip distributions, and department budgets.
              </Text>
            </View>

            {payroll.map((pr) => (
              <View
                key={pr.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{pr.employeeId}</Text>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{pr.name}</Text>
                    <Text className="text-xs text-slate-500">{pr.role} · {pr.department}</Text>
                  </View>
                  <StatusBadge status={pr.status} />
                </View>
                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View>
                    <Text className="text-[11px] text-slate-500">Base Salary</Text>
                    <Text className="text-xs font-semibold text-slate-800">${pr.basicSalary}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Allowances</Text>
                    <Text className="text-xs font-semibold text-emerald-600">+${pr.allowances}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Deductions</Text>
                    <Text className="text-xs font-semibold text-rose-600">-${pr.deductions}</Text>
                  </View>
                  <View>
                    <Text className="text-[11px] text-slate-500">Net Pay</Text>
                    <Text className="text-sm font-bold text-slate-900">${pr.netSalary}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================================================================= */}
      {/* MODAL 1: APPLY LEAVE */}
      {/* ================================================================= */}
      <Modal
        visible={showApplyLeaveModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyLeaveModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Apply for Leave</Text>
              <Pressable onPress={() => setShowApplyLeaveModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Applicant Name *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Sarah Mitchell, Arthur Pendelton"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Leave Type *</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="Casual / Sick / Emergency"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Duration (Days)</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="1"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Role</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="Senior Faculty / Librarian"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Department</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="Science / Administration"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</Text>
                <TextInput
                  value={formField6}
                  onChangeText={setFormField6}
                  placeholder="Detailed justification for leave request..."
                  multiline
                  numberOfLines={2}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowApplyLeaveModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleApplyLeave}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Submit Leave</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 2: ADD HOLIDAY */}
      {/* ================================================================= */}
      <Modal
        visible={showAddHolidayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddHolidayModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Add Academic Holiday</Text>
              <Pressable onPress={() => setShowAddHolidayModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>
            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Holiday Title *</Text>
                <TextInput
                  value={formField1}
                  onChangeText={setFormField1}
                  placeholder="e.g. Founder's Commemoration Day"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Date *</Text>
                  <TextInput
                    value={formField2}
                    onChangeText={setFormField2}
                    placeholder="e.g. 15 Oct 2026"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Category</Text>
                  <TextInput
                    value={formField3}
                    onChangeText={setFormField3}
                    placeholder="Public / School / Festival"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View className="flex-row gap-x-2">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Duration (Days)</Text>
                  <TextInput
                    value={formField4}
                    onChangeText={setFormField4}
                    placeholder="1"
                    keyboardType="numeric"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Applicable Classes</Text>
                  <TextInput
                    value={formField5}
                    onChangeText={setFormField5}
                    placeholder="All Classes"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                  />
                </View>
              </View>
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Description</Text>
                <TextInput
                  value={formField6}
                  onChangeText={setFormField6}
                  placeholder="Official celebration and holiday details..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm"
                />
              </View>
            </View>
            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddHolidayModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateHoliday}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Holiday</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================================================================= */}
      {/* MODAL 3: STUDENT ATTENDANCE DETAILS */}
      {/* ================================================================= */}
      <Modal
        visible={!!selectedStudentForDetail}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedStudentForDetail(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View>
                <Text className="text-base font-bold text-slate-900">
                  {selectedStudentForDetail?.studentName}
                </Text>
                <Text className="text-xs text-slate-500">
                  Admission: {selectedStudentForDetail?.admissionNo} · Roll #{selectedStudentForDetail?.rollNo}
                </Text>
              </View>
              <Pressable onPress={() => setSelectedStudentForDetail(null)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View className="flex-row gap-2">
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Class & Sec</Text>
                  <Text className="text-sm font-bold text-slate-800 mt-0.5">
                    {selectedStudentForDetail?.className} - {selectedStudentForDetail?.section}
                  </Text>
                </View>
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">YTD Rate</Text>
                  <Text className="text-sm font-bold text-[#3D5EE1] mt-0.5">
                    {selectedStudentForDetail?.attendancePercent}%
                  </Text>
                </View>
                <View className="flex-1 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-[11px] text-slate-500">Current Status</Text>
                  <Text className="text-sm font-bold text-emerald-600 mt-0.5">
                    {selectedStudentForDetail?.status}
                  </Text>
                </View>
              </View>

              <View className="rounded-xl bg-blue-50/60 p-3 border border-blue-100">
                <Text className="text-xs font-bold text-blue-900 mb-1">Guardian Contact</Text>
                <Text className="text-xs text-blue-800">
                  {selectedStudentForDetail?.guardianName} ({selectedStudentForDetail?.guardianPhone})
                </Text>
              </View>

              {selectedStudentForDetail?.notes && (
                <View className="rounded-xl bg-slate-50 p-3 border border-slate-200">
                  <Text className="text-xs font-semibold text-slate-500 mb-0.5">Teacher Log / Remark</Text>
                  <Text className="text-xs text-slate-700 italic">
                    &ldquo;{selectedStudentForDetail.notes}&rdquo;
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={() => setSelectedStudentForDetail(null)}
              className="mt-6 items-center rounded-xl bg-slate-100 py-3"
            >
              <Text className="text-sm font-semibold text-slate-700">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}
