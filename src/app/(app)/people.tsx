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
  INITIAL_STUDENTS,
  INITIAL_ADMISSIONS,
  INITIAL_TEACHERS,
  INITIAL_STAFF,
  INITIAL_USERS,
} from '@/data/peopleMock';
import type {
  AdmissionRecord,
  StudentRecord,
  StaffRecord,
  TeacherRecord,
  UserAccount,
} from '@/types/modules';

type SubmoduleTab = 'students' | 'admissions' | 'teachers' | 'staff' | 'users';

export default function PeopleScreen() {
  const [activeTab, setActiveTab] = useState<SubmoduleTab>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Local state for mock CRUD operations
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>(INITIAL_ADMISSIONS);
  const [teachers, setTeachers] = useState<TeacherRecord[]>(INITIAL_TEACHERS);
  const [staff, setStaff] = useState<StaffRecord[]>(INITIAL_STAFF);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);

  // Modal State for Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMeta, setFormMeta] = useState(''); // Grade / Department / Role

  // Tab configurations
  const tabs = useMemo(
    () => [
      { id: 'students', label: 'Students', badge: students.length },
      { id: 'admissions', label: 'Admissions', badge: admissions.length },
      { id: 'teachers', label: 'Teachers', badge: teachers.length },
      { id: 'staff', label: 'Staff', badge: staff.length },
      { id: 'users', label: 'User Accounts', badge: users.length },
    ],
    [students.length, admissions.length, teachers.length, staff.length, users.length]
  );

  // Filtered datasets
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.admissionNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.grade.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchQuery, statusFilter]);

  const filteredAdmissions = useMemo(() => {
    return admissions.filter((a) => {
      const matchesSearch =
        a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.applicationNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.appliedGrade.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [admissions, searchQuery, statusFilter]);

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch =
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [teachers, searchQuery, statusFilter]);

  const filteredStaff = useMemo(() => {
    return staff.filter((st) => {
      const matchesSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || st.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [staff, searchQuery, statusFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [users, searchQuery, statusFilter]);

  // Handlers for Add
  const handleAddNewRecord = () => {
    if (!formName.trim()) {
      Alert.alert('Required Field', 'Please enter a name.');
      return;
    }

    if (activeTab === 'students') {
      const newStd: StudentRecord = {
        id: `std-${Date.now()}`,
        admissionNo: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
        rollNo: `${Math.floor(110 + Math.random() * 50)}`,
        name: formName,
        grade: formMeta || 'Grade X',
        section: 'A',
        gender: 'Male',
        dob: '2010-01-01',
        parentName: 'Guardian Name',
        phone: formPhone || '+1 555-0000',
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@school.com`,
        address: 'Oxford, United Kingdom',
        status: 'Active',
        attendancePercent: 100,
      };
      setStudents([newStd, ...students]);
      Alert.alert('Success', `Student ${formName} added successfully.`);
    } else if (activeTab === 'admissions') {
      const newAdm: AdmissionRecord = {
        id: `adm-${Date.now()}`,
        applicationNo: `APP-2026-${Math.floor(150 + Math.random() * 500)}`,
        studentName: formName,
        appliedGrade: formMeta || 'Grade I',
        guardianName: 'Guardian',
        phone: formPhone || '+1 555-0000',
        email: formEmail || 'admission@mail.com',
        submissionDate: 'Today',
        status: 'Under Review',
        feesPaid: true,
      };
      setAdmissions([newAdm, ...admissions]);
      Alert.alert('Success', `Admission application for ${formName} created.`);
    } else if (activeTab === 'teachers') {
      const newTch: TeacherRecord = {
        id: `tch-${Date.now()}`,
        employeeId: `EMP-T-0${teachers.length + 1}`,
        name: formName,
        department: formMeta || 'General Sciences',
        subjects: ['Science'],
        designation: 'Faculty Instructor',
        qualification: 'M.Sc., B.Ed.',
        phone: formPhone || '+1 555-1100',
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@karkaii.com`,
        rating: 4.8,
        passPercentage: 95,
        totalStudents: 150,
        status: 'Active',
      };
      setTeachers([newTch, ...teachers]);
      Alert.alert('Success', `Teacher ${formName} profile created.`);
    } else if (activeTab === 'staff') {
      const newStf: StaffRecord = {
        id: `stf-${Date.now()}`,
        staffId: `EMP-S-0${staff.length + 1}`,
        name: formName,
        role: formMeta || 'Administration Officer',
        department: 'Operations',
        phone: formPhone || '+1 555-2000',
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@karkaii.com`,
        joinDate: '2026-11-17',
        status: 'Active',
      };
      setStaff([newStf, ...staff]);
      Alert.alert('Success', `Staff member ${formName} added.`);
    } else if (activeTab === 'users') {
      const newUsr: UserAccount = {
        id: `usr-${Date.now()}`,
        username: formName.toLowerCase().replace(/\s+/g, '.'),
        name: formName,
        email: formEmail || `${formName.toLowerCase().replace(/\s+/g, '.')}@karkaii.com`,
        role: formMeta || 'Teacher',
        lastLogin: 'Never',
        status: 'Active',
      };
      setUsers([newUsr, ...users]);
      Alert.alert('Success', `User account ${newUsr.username} created.`);
    }

    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormMeta('');
    setShowAddModal(false);
  };

  // Handlers for Delete
  const handleDeleteStudent = (id: string, name: string) => {
    Alert.alert('Delete Student', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setStudents(students.filter((s) => s.id !== id)),
      },
    ]);
  };

  const handleDeleteTeacher = (id: string, name: string) => {
    Alert.alert('Delete Teacher', `Are you sure you want to remove ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setTeachers(teachers.filter((t) => t.id !== id)),
      },
    ]);
  };

  const handleUpdateAdmissionStatus = (id: string, newStatus: AdmissionRecord['status']) => {
    setAdmissions(
      admissions.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    Alert.alert('Updated', `Application marked as ${newStatus}`);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Submodule Tab Bar */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as SubmoduleTab);
          setSearchQuery('');
          setStatusFilter('All');
        }}
      />

      {/* Action Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900 capitalize">
              {activeTab} Directory
            </Text>
            <Text className="text-xs text-slate-500">
              {activeTab === 'students' && `${filteredStudents.length} enrolled students`}
              {activeTab === 'admissions' && `${filteredAdmissions.length} active applications`}
              {activeTab === 'teachers' && `${filteredTeachers.length} teaching faculty`}
              {activeTab === 'staff' && `${filteredStaff.length} non-teaching staff`}
              {activeTab === 'users' && `${filteredUsers.length} system accounts`}
            </Text>
          </View>

          <Pressable
            onPress={() => setShowAddModal(true)}
            className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
          >
            <Feather name="plus" size={15} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">Add New</Text>
          </Pressable>
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab} by name or code…`}
        />

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
          {['All', 'Active', 'Inactive'].map((pill) => (
            <Pressable
              key={pill}
              onPress={() => setStatusFilter(pill)}
              className={`mr-2 rounded-full px-3 py-1 ${
                statusFilter === pill
                  ? 'bg-slate-900'
                  : 'bg-slate-100 border border-slate-200'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  statusFilter === pill ? 'text-white' : 'text-slate-600'
                }`}
              >
                {pill}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <View className="gap-y-3">
            {filteredStudents.map((std) => (
              <View
                key={std.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-[#3D5EE1]/10">
                      <Text className="text-sm font-bold text-[#3D5EE1]">
                        {std.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-slate-900">{std.name}</Text>
                      <Text className="text-xs text-slate-500">
                        {std.grade} ({std.section}) · Roll #{std.rollNo}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={std.status} />
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Adm. Number</Text>
                    <Text className="text-xs font-semibold text-slate-800">{std.admissionNo}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Parent / Guardian</Text>
                    <Text className="text-xs font-medium text-slate-800">{std.parentName}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Attendance</Text>
                    <Text className="text-xs font-bold text-emerald-600">{std.attendancePercent}%</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="flex-row items-center">
                    <Feather name="phone" size={13} color="#64748b" />
                    <Text className="ml-1 text-xs text-slate-600">{std.phone}</Text>
                  </View>

                  <View className="flex-row items-center gap-x-2">
                    <Pressable
                      onPress={() =>
                        Alert.alert('Student Profile', `Name: ${std.name}\nEmail: ${std.email}\nAddress: ${std.address}`)
                      }
                      className="rounded-lg bg-slate-100 px-2.5 py-1"
                    >
                      <Text className="text-xs font-semibold text-slate-700">View</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleDeleteStudent(std.id, std.name)}
                      className="rounded-lg bg-red-50 px-2.5 py-1"
                    >
                      <Text className="text-xs font-semibold text-red-600">Delete</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ADMISSIONS TAB */}
        {activeTab === 'admissions' && (
          <View className="gap-y-3">
            {filteredAdmissions.map((adm) => (
              <View
                key={adm.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xs font-semibold text-[#3D5EE1]">
                      {adm.applicationNo}
                    </Text>
                    <Text className="mt-0.5 text-sm font-bold text-slate-900">
                      {adm.studentName}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      Applying for: <Text className="font-semibold text-slate-700">{adm.appliedGrade}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={adm.status} />
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Guardian Name</Text>
                    <Text className="text-xs font-medium text-slate-800">{adm.guardianName}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Contact</Text>
                    <Text className="text-xs font-medium text-slate-800">{adm.phone}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Application Fee</Text>
                    <Text className={`text-xs font-bold ${adm.feesPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {adm.feesPaid ? 'Paid' : 'Unpaid'}
                    </Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-end gap-x-2 border-t border-slate-100 pt-2.5">
                  <Pressable
                    onPress={() => handleUpdateAdmissionStatus(adm.id, 'Accepted')}
                    className="rounded-lg bg-emerald-50 px-3 py-1.5"
                  >
                    <Text className="text-xs font-bold text-emerald-700">Accept</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleUpdateAdmissionStatus(adm.id, 'Interview Scheduled')}
                    className="rounded-lg bg-blue-50 px-3 py-1.5"
                  >
                    <Text className="text-xs font-bold text-blue-700">Interview</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => handleUpdateAdmissionStatus(adm.id, 'Rejected')}
                    className="rounded-lg bg-red-50 px-3 py-1.5"
                  >
                    <Text className="text-xs font-bold text-red-600">Reject</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* TEACHERS TAB */}
        {activeTab === 'teachers' && (
          <View className="gap-y-3">
            {filteredTeachers.map((tch) => (
              <View
                key={tch.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
                      <Feather name="book" size={18} color="#059669" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-slate-900">{tch.name}</Text>
                      <Text className="text-xs text-slate-500">
                        {tch.designation} · {tch.department}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={tch.status} />
                </View>

                {tch.award ? (
                  <View className="mt-2.5 flex-row items-center rounded-lg bg-amber-50 px-2.5 py-1 border border-amber-200">
                    <Feather name="award" size={13} color="#d97706" />
                    <Text className="ml-1.5 text-xs font-bold text-amber-800">
                      {tch.award}
                    </Text>
                  </View>
                ) : null}

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <View className="items-center flex-1">
                    <Text className="text-[10px] text-slate-400">Rating</Text>
                    <Text className="text-xs font-bold text-amber-600">{tch.rating} ★</Text>
                  </View>
                  <View className="h-6 w-px bg-slate-200" />
                  <View className="items-center flex-1">
                    <Text className="text-[10px] text-slate-400">Pass Rate</Text>
                    <Text className="text-xs font-bold text-emerald-600">{tch.passPercentage}%</Text>
                  </View>
                  <View className="h-6 w-px bg-slate-200" />
                  <View className="items-center flex-1">
                    <Text className="text-[10px] text-slate-400">Students</Text>
                    <Text className="text-xs font-bold text-slate-800">{tch.totalStudents}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">
                    ID: <Text className="font-semibold text-slate-700">{tch.employeeId}</Text>
                  </Text>
                  <Pressable
                    onPress={() => handleDeleteTeacher(tch.id, tch.name)}
                    className="rounded-lg bg-red-50 px-2.5 py-1"
                  >
                    <Text className="text-xs font-semibold text-red-600">Delete</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <View className="gap-y-3">
            {filteredStaff.map((stf) => (
              <View
                key={stf.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-sm font-bold text-slate-900">{stf.name}</Text>
                    <Text className="text-xs text-slate-500">
                      {stf.role} · {stf.department}
                    </Text>
                  </View>
                  <StatusBadge status={stf.status} />
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Employee ID</Text>
                    <Text className="text-xs font-semibold text-slate-800">{stf.staffId}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Phone</Text>
                    <Text className="text-xs font-medium text-slate-800">{stf.phone}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Joined</Text>
                    <Text className="text-xs font-medium text-slate-800">{stf.joinDate}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <View className="gap-y-3">
            {filteredUsers.map((usr) => (
              <View
                key={usr.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                      <Feather name="user-check" size={16} color="#4f46e5" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-sm font-bold text-slate-900">{usr.name}</Text>
                      <Text className="text-xs text-slate-500">@{usr.username}</Text>
                    </View>
                  </View>
                  <StatusBadge status={usr.status} />
                </View>

                <View className="mt-2.5 rounded-xl bg-slate-50 p-2.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">System Role</Text>
                    <Text className="text-xs font-bold text-[#3D5EE1]">{usr.role}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Email</Text>
                    <Text className="text-xs font-medium text-slate-800">{usr.email}</Text>
                  </View>
                  <View className="mt-1 flex-row items-center justify-between">
                    <Text className="text-xs text-slate-500">Last Active</Text>
                    <Text className="text-xs text-slate-600">{usr.lastLogin}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Add New Record Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900 capitalize">
                Add New {activeTab.slice(0, -1)}
              </Text>
              <Pressable onPress={() => setShowAddModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Full Name *</Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Alexander Clark"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Email Address</Text>
                <TextInput
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="name@school.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Phone Number</Text>
                <TextInput
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="+1 555-0123"
                  keyboardType="phone-pad"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'students' && 'Grade (e.g. Grade XI)'}
                  {activeTab === 'admissions' && 'Applied Grade (e.g. Grade I)'}
                  {activeTab === 'teachers' && 'Department (e.g. Mathematics)'}
                  {activeTab === 'staff' && 'Role / Designation (e.g. Librarian)'}
                  {activeTab === 'users' && 'System Role (e.g. Teacher, Admin)'}
                </Text>
                <TextInput
                  value={formMeta}
                  onChangeText={setFormMeta}
                  placeholder="Enter details..."
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddNewRecord}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Record</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
