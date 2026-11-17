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
import TabNavigation from '@/components/common/TabNavigation';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_STAFF_ATTENDANCE,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_HOLIDAYS,
  INITIAL_DEPARTMENTS,
} from '@/data/hrmMock';
import type {
  DepartmentItem,
  HolidayItem,
  LeaveRequestItem,
  StaffAttendanceItem,
} from '@/types/modules';

type HrmTab = 'attendance' | 'leaves' | 'holidays' | 'departments';

export default function HrmScreen() {
  const [activeTab, setActiveTab] = useState<HrmTab>('attendance');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state for HRM records
  const [attendance] = useState<StaffAttendanceItem[]>(INITIAL_STAFF_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(INITIAL_LEAVE_REQUESTS);
  const [holidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);
  const [departments] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);

  // Leave Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveRequestItem['leaveType']>('Casual Leave');
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'attendance', label: 'Staff Attendance', badge: attendance.length },
      { id: 'leaves', label: 'Leave Requests', badge: leaveRequests.filter((l) => l.status === 'Pending').length },
      { id: 'holidays', label: 'Holidays', badge: holidays.length },
      { id: 'departments', label: 'Departments', badge: departments.length },
    ],
    [attendance.length, leaveRequests, holidays.length, departments.length]
  );

  // Filtered queries
  const filteredAttendance = useMemo(() => {
    return attendance.filter(
      (a) =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [attendance, searchQuery]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(
      (l) =>
        l.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.leaveType.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.status.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaveRequests, searchQuery]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter(
      (h) =>
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [holidays, searchQuery]);

  const filteredDepartments = useMemo(() => {
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.headOfDept.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [departments, searchQuery]);

  // Actions
  const handleLeaveDecision = (id: string, decision: 'Approved' | 'Rejected') => {
    setLeaveRequests(
      leaveRequests.map((l) => (l.id === id ? { ...l, status: decision } : l))
    );
    Alert.alert('Status Updated', `Leave request has been marked as ${decision}.`);
  };

  const handleApplyLeave = () => {
    if (!applicantName.trim() || !leaveReason.trim()) {
      Alert.alert('Validation Error', 'Please enter your name and reason for leave.');
      return;
    }

    const newLeave: LeaveRequestItem = {
      id: `lv-${Date.now()}`,
      applicantName,
      applicantRole: 'Faculty Staff',
      leaveType,
      fromDate: 'Tomorrow',
      toDate: 'Tomorrow',
      days: parseInt(leaveDays, 10) || 1,
      reason: leaveReason,
      status: 'Pending',
      appliedOn: 'Today',
    };

    setLeaveRequests([newLeave, ...leaveRequests]);
    Alert.alert('Submitted', 'Your leave request has been submitted for approval.');
    setApplicantName('');
    setLeaveReason('');
    setLeaveDays('1');
    setShowApplyModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Submodule Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as HrmTab);
          setSearchQuery('');
        }}
      />

      {/* Action Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900 capitalize">
              Human Resource Management
            </Text>
            <Text className="text-xs text-slate-500">
              Staff attendance, leave approvals, holidays & departments
            </Text>
          </View>

          {activeTab === 'leaves' && (
            <Pressable
              onPress={() => setShowApplyModal(true)}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Apply Leave</Text>
            </Pressable>
          )}
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />
      </View>

      {/* Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        {/* STAFF ATTENDANCE */}
        {activeTab === 'attendance' && (
          <View className="gap-y-3">
            {/* Quick KPI stats */}
            <View className="flex-row gap-x-2">
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 items-center">
                <Text className="text-xs text-slate-500">Present</Text>
                <Text className="mt-1 text-lg font-bold text-emerald-600">
                  {attendance.filter((a) => a.status === 'Present').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 items-center">
                <Text className="text-xs text-slate-500">Late</Text>
                <Text className="mt-1 text-lg font-bold text-amber-600">
                  {attendance.filter((a) => a.status === 'Late').length}
                </Text>
              </View>
              <View className="flex-1 rounded-2xl border border-slate-200 bg-white p-3 items-center">
                <Text className="text-xs text-slate-500">On Leave</Text>
                <Text className="mt-1 text-lg font-bold text-blue-600">
                  {attendance.filter((a) => a.status === 'On Leave').length}
                </Text>
              </View>
            </View>

            {filteredAttendance.map((att) => (
              <View
                key={att.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{att.name}</Text>
                    <Text className="text-xs text-slate-500">
                      ID: {att.staffId} · {att.department}
                    </Text>
                  </View>
                  <StatusBadge status={att.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="log-in" size={13} color="#059669" />
                    <Text className="ml-1.5 text-xs text-slate-600">In: {att.checkInTime}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="log-out" size={13} color="#dc2626" />
                    <Text className="ml-1.5 text-xs text-slate-600">Out: {att.checkOutTime}</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">{att.date}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* LEAVE REQUESTS */}
        {activeTab === 'leaves' && (
          <View className="gap-y-3">
            {filteredLeaves.map((lv) => (
              <View
                key={lv.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{lv.applicantName}</Text>
                    <Text className="text-xs text-slate-500">
                      {lv.applicantRole} · Applied: {lv.appliedOn}
                    </Text>
                  </View>
                  <StatusBadge status={lv.status} />
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs font-semibold text-[#3D5EE1]">{lv.leaveType}</Text>
                    <Text className="text-xs font-bold text-slate-800">{lv.days} Day(s)</Text>
                  </View>
                  <Text className="mt-1 text-xs text-slate-500">
                    Period: {lv.fromDate} → {lv.toDate}
                  </Text>
                  <Text className="mt-1.5 text-xs text-slate-700 italic">
                    &ldquo;{lv.reason}&rdquo;
                  </Text>
                </View>

                {lv.status === 'Pending' && (
                  <View className="mt-3 flex-row items-center justify-end gap-x-2 border-t border-slate-100 pt-2.5">
                    <Pressable
                      onPress={() => handleLeaveDecision(lv.id, 'Approved')}
                      className="rounded-xl bg-emerald-600 px-4 py-2 shadow-sm shadow-emerald-600/30"
                    >
                      <Text className="text-xs font-bold text-white">Approve</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleLeaveDecision(lv.id, 'Rejected')}
                      className="rounded-xl bg-red-50 px-4 py-2 border border-red-200"
                    >
                      <Text className="text-xs font-bold text-red-600">Reject</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* HOLIDAYS CALENDAR */}
        {activeTab === 'holidays' && (
          <View className="gap-y-3">
            {filteredHolidays.map((hol) => (
              <View
                key={hol.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{hol.title}</Text>
                    <Text className="text-xs text-slate-500">
                      {hol.dayOfWeek} · {hol.date}
                    </Text>
                  </View>
                  <View className="rounded-full bg-blue-50 px-2.5 py-1 border border-blue-200">
                    <Text className="text-[10px] font-bold text-blue-700">{hol.type}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="calendar" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-600">
                      Duration: {hol.durationDays} Day(s)
                    </Text>
                  </View>
                  <Text className="text-xs font-bold text-emerald-600">Upcoming Holiday</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DEPARTMENTS */}
        {activeTab === 'departments' && (
          <View className="gap-y-3">
            {filteredDepartments.map((dep) => (
              <View
                key={dep.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{dep.name}</Text>
                    <Text className="text-xs text-slate-500">
                      Head: <Text className="font-semibold text-slate-800">{dep.headOfDept}</Text>
                    </Text>
                  </View>
                  <View className="rounded-lg bg-emerald-50 px-2.5 py-1 border border-emerald-200">
                    <Text className="text-xs font-bold text-emerald-700">{dep.budgetAllocated}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="users" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-600">
                      {dep.staffCount} Staff Members
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-400">Department Active</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Apply Leave Modal */}
      <Modal
        visible={showApplyModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowApplyModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Apply for Leave</Text>
              <Pressable onPress={() => setShowApplyModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Applicant Name *</Text>
                <TextInput
                  value={applicantName}
                  onChangeText={setApplicantName}
                  placeholder="e.g. Sarah Mitchell"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Leave Type</Text>
                <View className="flex-row gap-x-2">
                  {(['Casual Leave', 'Sick Leave', 'Emergency Leave'] as LeaveRequestItem['leaveType'][]).map(
                    (lt) => (
                      <Pressable
                        key={lt}
                        onPress={() => setLeaveType(lt)}
                        className={`flex-1 items-center rounded-xl py-2 border ${
                          leaveType === lt
                            ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <Text
                          className={`text-[11px] font-semibold ${
                            leaveType === lt ? 'text-white' : 'text-slate-700'
                          }`}
                        >
                          {lt.replace(' Leave', '')}
                        </Text>
                      </Pressable>
                    )
                  )}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Number of Days</Text>
                <TextInput
                  value={leaveDays}
                  onChangeText={setLeaveDays}
                  keyboardType="numeric"
                  placeholder="1"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Reason for Leave *</Text>
                <TextInput
                  value={leaveReason}
                  onChangeText={setLeaveReason}
                  placeholder="Brief explanation..."
                  multiline
                  numberOfLines={3}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowApplyModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleApplyLeave}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Submit Request</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
