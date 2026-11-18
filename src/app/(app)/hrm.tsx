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
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_HOLIDAYS,
  INITIAL_LEAVE_REQUESTS,
  INITIAL_PAYROLL,
  INITIAL_PAYSLIPS,
  INITIAL_STAFF_ATTENDANCE,
} from '@/data/hrmMock';
import type {
  DepartmentItem,
  DesignationItem,
  HolidayItem,
  LeaveRequestItem,
  PayrollItem,
  PayslipItem,
  StaffAttendanceItem,
} from '@/types/modules';

type HrmTab = 'attendance' | 'leaves' | 'payroll' | 'holidays' | 'departments' | 'designations';

export default function HrmScreen() {
  const [activeTab, setActiveTab] = useState<HrmTab>('attendance');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Local state for HRM records
  const [attendance, setAttendance] = useState<StaffAttendanceItem[]>(INITIAL_STAFF_ATTENDANCE);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequestItem[]>(INITIAL_LEAVE_REQUESTS);
  const [payroll, setPayroll] = useState<PayrollItem[]>(INITIAL_PAYROLL);
  const [payslips] = useState<PayslipItem[]>(INITIAL_PAYSLIPS);
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS);
  const [departments] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [designations] = useState<DesignationItem[]>(INITIAL_DESIGNATIONS);

  // Leave Modal State
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applicantName, setApplicantName] = useState('');
  const [leaveType, setLeaveType] = useState<LeaveRequestItem['leaveType']>('Casual Leave');
  const [leaveDays, setLeaveDays] = useState('1');
  const [leaveReason, setLeaveReason] = useState('');

  // Add Holiday Modal State
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayTitle, setHolidayTitle] = useState('');
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDays, setHolidayDays] = useState('1');

  const tabs = useMemo(
    () => [
      { id: 'attendance', label: 'Attendance', badge: attendance.length },
      { id: 'leaves', label: 'Leaves', badge: leaveRequests.filter((l) => l.status === 'Pending').length },
      { id: 'payroll', label: 'Payroll', badge: payroll.length },
      { id: 'holidays', label: 'Holidays', badge: holidays.length },
      { id: 'departments', label: 'Departments', badge: departments.length },
      { id: 'designations', label: 'Designations', badge: designations.length },
    ],
    [attendance.length, leaveRequests, payroll.length, holidays.length, departments.length, designations.length]
  );

  // Filtered queries
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.staffId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [attendance, searchQuery, statusFilter]);

  const filteredLeaves = useMemo(() => {
    return leaveRequests.filter(
      (l) =>
        l.applicantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.applicantRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.leaveType.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [leaveRequests, searchQuery]);

  const filteredPayroll = useMemo(() => {
    return payroll.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [payroll, searchQuery]);

  const filteredHolidays = useMemo(() => {
    return holidays.filter(
      (h) =>
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [holidays, searchQuery]);

  // Actions
  const handleToggleAttendanceStatus = (id: string) => {
    setAttendance(
      attendance.map((a) => {
        if (a.id !== id) return a;
        const nextStatus: StaffAttendanceItem['status'] =
          a.status === 'Present' ? 'On Leave' : a.status === 'On Leave' ? 'Absent' : 'Present';
        return { ...a, status: nextStatus };
      })
    );
  };

  const handleUpdateLeaveStatus = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setLeaveRequests(
      leaveRequests.map((l) => (l.id === id ? { ...l, status: newStatus } : l))
    );
    Alert.alert('Status Updated', `Leave application has been marked as ${newStatus}.`);
  };

  const handleApplyLeave = () => {
    if (!applicantName.trim()) {
      Alert.alert('Required Field', 'Please enter your staff name.');
      return;
    }

    const newReq: LeaveRequestItem = {
      id: `lv-${Date.now()}`,
      applicantName,
      applicantRole: 'Staff Member',
      leaveType,
      fromDate: 'Upcoming',
      toDate: 'Upcoming',
      days: parseInt(leaveDays) || 1,
      reason: leaveReason || 'Personal commitments.',
      status: 'Pending',
      appliedOn: 'Today',
    };

    setLeaveRequests([newReq, ...leaveRequests]);
    Alert.alert('Application Submitted', 'Your leave request has been sent for principal approval.');
    setApplicantName('');
    setLeaveReason('');
    setShowApplyModal(false);
  };

  const handleAddHoliday = () => {
    if (!holidayTitle.trim()) {
      Alert.alert('Required Field', 'Please enter holiday title.');
      return;
    }

    const newHol: HolidayItem = {
      id: `hol-${Date.now()}`,
      title: holidayTitle,
      date: holidayDate || 'Upcoming Date',
      dayOfWeek: 'Monday',
      type: 'School Holiday',
      durationDays: parseInt(holidayDays) || 1,
    };

    setHolidays([...holidays, newHol]);
    Alert.alert('Holiday Registered', `${holidayTitle} added to school calendar.`);
    setHolidayTitle('');
    setHolidayDate('');
    setShowHolidayModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Bar */}
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
            <Text className="text-base font-bold text-slate-900">
              Human Resource Management
            </Text>
            <Text className="text-xs text-slate-500">
              Faculty attendance, leaves, payroll & staff departments
            </Text>
          </View>

          <Pressable
            onPress={() => {
              if (activeTab === 'holidays') setShowHolidayModal(true);
              else setShowApplyModal(true);
            }}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={15} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">
              {activeTab === 'holidays' ? 'New Holiday' : 'Apply Leave'}
            </Text>
          </Pressable>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />

        {/* Status Filter for Attendance */}
        {activeTab === 'attendance' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
            {['All', 'Present', 'Late', 'On Leave', 'Absent'].map((status) => (
              <Pressable
                key={status}
                onPress={() => setStatusFilter(status)}
                className={`mr-2 rounded-xl px-3 py-1.5 ${
                  statusFilter === status
                    ? 'bg-[#3D5EE1]'
                    : 'bg-slate-100 border border-slate-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    statusFilter === status ? 'text-white' : 'text-slate-700'
                  }`}
                >
                  {status}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-14"
      >
        {/* ATTENDANCE TAB */}
        {activeTab === 'attendance' && (
          <View className="gap-y-3">
            {filteredAttendance.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{item.staffId}</Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{item.name}</Text>
                    <Text className="text-xs text-slate-500">{item.department}</Text>
                  </View>
                  <Text className="text-xs font-semibold text-slate-400">{item.date}</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center">
                    <Feather name="log-in" size={13} color="#0ca678" />
                    <Text className="ml-1.5 text-xs text-slate-700">Check In: {item.checkInTime}</Text>
                  </View>
                  <View className="flex-row items-center">
                    <Feather name="log-out" size={13} color="#64748b" />
                    <Text className="ml-1.5 text-xs text-slate-700">Check Out: {item.checkOutTime}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-end border-t border-slate-100 pt-2.5">
                  <Pressable
                    onPress={() => handleToggleAttendanceStatus(item.id)}
                    className="rounded-lg bg-slate-100 px-3 py-1.5"
                  >
                    <Text className="text-xs font-semibold text-[#3D5EE1]">Cycle Status</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* LEAVE REQUESTS */}
        {activeTab === 'leaves' && (
          <View className="gap-y-3">
            {filteredLeaves.map((req) => (
              <View
                key={req.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-indigo-50 px-2 py-0.5 border border-indigo-200">
                        <Text className="text-[10px] font-bold text-indigo-700">{req.leaveType}</Text>
                      </View>
                      <StatusBadge status={req.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{req.applicantName}</Text>
                    <Text className="text-xs text-slate-500">{req.applicantRole}</Text>
                  </View>
                  <View className="rounded-lg bg-slate-100 px-2.5 py-1">
                    <Text className="text-xs font-bold text-slate-700">{req.days} Day(s)</Text>
                  </View>
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-700 leading-relaxed italic">
                    &ldquo;{req.reason}&rdquo;
                  </Text>
                  <Text className="text-[11px] text-slate-400 mt-1.5">
                    Period: {req.fromDate} → {req.toDate} · Applied: {req.appliedOn}
                  </Text>
                </View>

                {req.status === 'Pending' && (
                  <View className="mt-3 flex-row items-center justify-end gap-x-2 border-t border-slate-100 pt-2.5">
                    <Pressable
                      onPress={() => handleUpdateLeaveStatus(req.id, 'Rejected')}
                      className="rounded-lg bg-rose-50 px-3 py-1.5 border border-rose-200"
                    >
                      <Text className="text-xs font-bold text-rose-700">Reject</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleUpdateLeaveStatus(req.id, 'Approved')}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5"
                    >
                      <Text className="text-xs font-bold text-white">Approve</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* PAYROLL & SALARIES */}
        {activeTab === 'payroll' && (
          <View className="gap-y-3">
            <View className="rounded-2xl bg-indigo-50/60 p-4 border border-indigo-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-2">
                  <Text className="text-sm font-bold text-indigo-900">
                    Staff Payroll & Disbursement Summary
                  </Text>
                  <Text className="text-xs text-indigo-700 mt-0.5">
                    Monthly automated salary structures, allowances & statutory deduction records.
                  </Text>
                </View>
                <View className="rounded-lg bg-indigo-100 px-2 py-1">
                  <Text className="text-[10px] font-bold text-indigo-800">{payslips.length} Payslips</Text>
                </View>
              </View>
            </View>

            {filteredPayroll.map((item) => (
              <View
                key={item.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{item.employeeId}</Text>
                      <StatusBadge status={item.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{item.name}</Text>
                    <Text className="text-xs text-slate-500">{item.role}</Text>
                  </View>
                  <View className="items-end">
                    <Text className="text-base font-bold text-emerald-600">
                      ${item.netSalary.toLocaleString()}
                    </Text>
                    <Text className="text-[10px] text-slate-400">Net Take-Home</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View>
                    <Text className="text-[10px] text-slate-400">Basic Pay</Text>
                    <Text className="text-xs font-bold text-slate-800">${item.basicSalary}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-slate-400">Allowances</Text>
                    <Text className="text-xs font-bold text-emerald-600">+${item.allowances}</Text>
                  </View>
                  <View>
                    <Text className="text-[10px] text-slate-400">Deductions</Text>
                    <Text className="text-xs font-bold text-rose-600">-${item.deductions}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">Date: {item.paymentDate}</Text>
                  <View className="flex-row gap-x-2">
                    {item.status !== 'Paid' && (
                      <Pressable
                        onPress={() => {
                          setPayroll(
                            payroll.map((p) =>
                              p.id === item.id ? { ...p, status: 'Paid', paymentDate: 'Today' } : p
                            )
                          );
                          Alert.alert('Payment Disbursed', `Salary of $${item.netSalary} disbursed to ${item.name}.`);
                        }}
                        className="rounded-lg bg-emerald-600 px-2.5 py-1"
                      >
                        <Text className="text-xs font-bold text-white">Disburse</Text>
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() =>
                        Alert.alert('Payslip Generated', `Downloading official PDF payslip for ${item.name}.`)
                      }
                      className="flex-row items-center rounded-lg bg-slate-100 px-2.5 py-1"
                    >
                      <Feather name="file-text" size={13} color="#3D5EE1" />
                      <Text className="ml-1 text-xs font-bold text-[#3D5EE1]">Payslip</Text>
                    </Pressable>
                  </View>
                </View>
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
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-amber-50 px-2 py-0.5 border border-amber-200">
                        <Text className="text-[10px] font-bold text-amber-700">{hol.type}</Text>
                      </View>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{hol.title}</Text>
                    <Text className="text-xs text-slate-500">
                      {hol.dayOfWeek} · {hol.durationDays} Day(s) Break
                    </Text>
                  </View>
                  <View className="rounded-xl bg-slate-100 px-3 py-2 items-center">
                    <Feather name="calendar" size={14} color="#3D5EE1" />
                    <Text className="text-xs font-bold text-slate-800 mt-1">{hol.date}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DEPARTMENTS */}
        {activeTab === 'departments' && (
          <View className="gap-y-3">
            {departments.map((dept) => (
              <View
                key={dept.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{dept.name}</Text>
                    <Text className="text-xs text-slate-500">
                      Head of Dept: <Text className="font-semibold text-slate-800">{dept.headOfDept}</Text>
                    </Text>
                  </View>
                  <View className="rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{dept.staffCount} Staff</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">Annual Department Budget</Text>
                  <Text className="text-xs font-bold text-slate-900">{dept.budgetAllocated}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* DESIGNATIONS */}
        {activeTab === 'designations' && (
          <View className="gap-y-3">
            {designations.map((des) => (
              <View
                key={des.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="rounded-md bg-slate-100 px-2 py-0.5 self-start mb-1">
                      <Text className="text-[10px] font-semibold text-slate-600">{des.level} Level</Text>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{des.title}</Text>
                    <Text className="text-xs text-slate-500">{des.department}</Text>
                  </View>
                  <View className="rounded-lg bg-indigo-50 px-2.5 py-1 border border-indigo-200">
                    <Text className="text-xs font-bold text-indigo-700">{des.totalHolders} Active</Text>
                  </View>
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
              <Text className="text-base font-bold text-slate-900">Apply for Staff Leave</Text>
              <Pressable onPress={() => setShowApplyModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Staff Member Name *</Text>
                <TextInput
                  value={applicantName}
                  onChangeText={setApplicantName}
                  placeholder="e.g. Sarah Mitchell"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Leave Type</Text>
                <View className="flex-row gap-2">
                  {(['Casual Leave', 'Sick Leave', 'Emergency Leave'] as const).map((t) => (
                    <Pressable
                      key={t}
                      onPress={() => setLeaveType(t)}
                      className={`rounded-xl px-2.5 py-2 border ${
                        leaveType === t
                          ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-bold ${
                          leaveType === t ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {t}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Duration (Days)</Text>
                <TextInput
                  value={leaveDays}
                  onChangeText={setLeaveDays}
                  keyboardType="numeric"
                  placeholder="1"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Reason *</Text>
                <TextInput
                  value={leaveReason}
                  onChangeText={setLeaveReason}
                  placeholder="Provide reason for absence…"
                  multiline
                  numberOfLines={3}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900 text-top min-h-[70px]"
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
                <Text className="text-sm font-bold text-white">Submit Application</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Holiday Modal */}
      <Modal
        visible={showHolidayModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowHolidayModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">Add Academic Holiday</Text>
              <Pressable onPress={() => setShowHolidayModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Holiday Title *</Text>
                <TextInput
                  value={holidayTitle}
                  onChangeText={setHolidayTitle}
                  placeholder="e.g. Founders Day Celebration"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Holiday Date *</Text>
                <TextInput
                  value={holidayDate}
                  onChangeText={setHolidayDate}
                  placeholder="e.g. 24 Feb 2027"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Number of Days</Text>
                <TextInput
                  value={holidayDays}
                  onChangeText={setHolidayDays}
                  keyboardType="numeric"
                  placeholder="1"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowHolidayModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddHoliday}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Holiday</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
