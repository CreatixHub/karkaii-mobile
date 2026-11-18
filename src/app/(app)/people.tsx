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
  INITIAL_ADMISSIONS,
  INITIAL_ALUMNI,
  INITIAL_PROMOTIONS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_USERS,
} from '@/data/peopleMock';
import type {
  AdmissionRecord,
  AlumniRecord,
  StaffRecord,
  StudentPromotionItem,
  StudentRecord,
  TeacherRecord,
  UserAccount,
} from '@/types/modules';

type SubmoduleTab = 'students' | 'admissions' | 'teachers' | 'staff' | 'promotions' | 'alumni' | 'users';

export default function PeopleScreen() {
  const [activeTab, setActiveTab] = useState<SubmoduleTab>('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  // Local state for mock CRUD operations
  const [students, setStudents] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>(INITIAL_ADMISSIONS);
  const [teachers, setTeachers] = useState<TeacherRecord[]>(INITIAL_TEACHERS);
  const [staff, setStaff] = useState<StaffRecord[]>(INITIAL_STAFF);
  const [promotions] = useState<StudentPromotionItem[]>(INITIAL_PROMOTIONS);
  const [alumni] = useState<AlumniRecord[]>(INITIAL_ALUMNI);
  const [users, setUsers] = useState<UserAccount[]>(INITIAL_USERS);

  // Student Profile Detail Modal
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);

  // Modal State for Add
  const [showAddModal, setShowAddModal] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formMeta, setFormMeta] = useState('');

  // Tab configurations
  const tabs = useMemo(
    () => [
      { id: 'students', label: 'Students', badge: students.length },
      { id: 'admissions', label: 'Admissions', badge: admissions.filter((a) => a.status === 'Under Review').length },
      { id: 'teachers', label: 'Teachers', badge: teachers.length },
      { id: 'staff', label: 'Staff', badge: staff.length },
      { id: 'promotions', label: 'Promotions', badge: promotions.length },
      { id: 'alumni', label: 'Alumni', badge: alumni.length },
      { id: 'users', label: 'Users', badge: users.length },
    ],
    [
      students.length,
      admissions,
      teachers.length,
      staff.length,
      promotions.length,
      alumni.length,
      users.length,
    ]
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
      return matchesStatus && matchesSearch;
    });
  }, [teachers, searchQuery, statusFilter]);

  const filteredStaff = useMemo(() => {
    return staff.filter((st) => {
      const matchesSearch =
        st.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        st.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'All' || st.status === statusFilter;
      return matchesStatus && matchesSearch;
    });
  }, [staff, searchQuery, statusFilter]);

  const filteredPromotions = useMemo(() => {
    return promotions.filter(
      (p) =>
        p.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.currentGrade.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.promotedGrade.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [promotions, searchQuery]);

  const filteredAlumni = useMemo(() => {
    return alumni.filter(
      (al) =>
        al.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        al.graduatingBatch.toLowerCase().includes(searchQuery.toLowerCase()) ||
        al.higherEducation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        al.currentProfession.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [alumni, searchQuery]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [users, searchQuery]);

  // Actions
  const handleAddNewItem = () => {
    if (!formName.trim()) {
      Alert.alert('Required Field', 'Please enter a name.');
      return;
    }

    if (activeTab === 'students') {
      const newStudent: StudentRecord = {
        id: `std-${Date.now()}`,
        admissionNo: `ADM-2026-${Math.floor(100 + Math.random() * 900)}`,
        rollNo: `${Math.floor(110 + Math.random() * 50)}`,
        name: formName,
        grade: formMeta || 'Grade X',
        section: 'A',
        gender: 'Female',
        dob: '2010-01-01',
        parentName: 'Guardian Contact',
        phone: formPhone || '+1 555-0199',
        email: formEmail || 'student@school.com',
        address: 'Oxford Campus Residence',
        status: 'Active',
        attendancePercent: 95,
      };
      setStudents([newStudent, ...students]);
      Alert.alert('Success', `Student ${formName} enrolled.`);
    } else if (activeTab === 'admissions') {
      const newAdm: AdmissionRecord = {
        id: `adm-${Date.now()}`,
        applicationNo: `APP-2026-${Math.floor(200 + Math.random() * 800)}`,
        studentName: formName,
        appliedGrade: formMeta || 'Grade IX',
        guardianName: 'Parent Contact',
        phone: formPhone || '+1 555-0999',
        email: formEmail || 'parent@gmail.com',
        submissionDate: 'Today',
        status: 'Under Review',
        feesPaid: true,
      };
      setAdmissions([newAdm, ...admissions]);
      Alert.alert('Success', `Application for ${formName} registered.`);
    } else if (activeTab === 'teachers') {
      const newTeacher: TeacherRecord = {
        id: `tch-${Date.now()}`,
        employeeId: `EMP-T-${Math.floor(100 + Math.random() * 900)}`,
        name: formName,
        department: formMeta || 'Mathematics',
        subjects: ['Mathematics'],
        designation: 'Faculty Educator',
        qualification: 'M.Sc, B.Ed',
        phone: formPhone || '+1 555-4001',
        email: formEmail || 'faculty@karkaii.com',
        rating: 4.8,
        passPercentage: 98,
        totalStudents: 120,
        status: 'Active',
      };
      setTeachers([newTeacher, ...teachers]);
      Alert.alert('Success', `Teacher ${formName} appointed.`);
    } else if (activeTab === 'staff') {
      const newStaff: StaffRecord = {
        id: `stf-${Date.now()}`,
        staffId: `EMP-S-${Math.floor(100 + Math.random() * 900)}`,
        name: formName,
        role: formMeta || 'Administrative Officer',
        department: 'Operations',
        phone: formPhone || '+1 555-2010',
        email: formEmail || 'staff@karkaii.com',
        joinDate: 'Today',
        status: 'Active',
      };
      setStaff([newStaff, ...staff]);
      Alert.alert('Success', `Staff member ${formName} registered.`);
    }

    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormMeta('');
    setShowAddModal(false);
  };

  const handleUpdateAdmissionStatus = (id: string, newStatus: AdmissionRecord['status']) => {
    setAdmissions(
      admissions.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    );
    Alert.alert('Admission Updated', `Application status changed to ${newStatus}.`);
  };

  const handleToggleUserStatus = (id: string) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
      )
    );
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Navigation */}
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
            <Text className="text-base font-bold text-slate-900">
              People & Admission
            </Text>
            <Text className="text-xs text-slate-500">
              Students, faculty members, staff, alumni & user accounts
            </Text>
          </View>

          {activeTab !== 'promotions' && activeTab !== 'alumni' && activeTab !== 'users' && (
            <Pressable
              onPress={() => setShowAddModal(true)}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Create</Text>
            </Pressable>
          )}
        </View>

        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={`Search ${activeTab}…`}
        />

        {/* Filter Pills for Status */}
        {activeTab === 'students' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-2.5">
            {['All', 'Active', 'Inactive', 'Transferred'].map((status) => (
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
        {/* STUDENTS TAB */}
        {activeTab === 'students' && (
          <View className="gap-y-3">
            {filteredStudents.map((student) => (
              <Pressable
                key={student.id}
                onPress={() => setSelectedStudent(student)}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5 active:bg-slate-50"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="h-10 w-10 items-center justify-center rounded-full bg-[#3D5EE1]/10">
                      <Text className="text-sm font-bold text-[#3D5EE1]">
                        {student.name.charAt(0)}
                      </Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-slate-900">{student.name}</Text>
                      <Text className="text-xs text-slate-500">
                        {student.grade} ({student.section}) · Roll: {student.rollNo}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={student.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-600">
                    Attendance:{' '}
                    <Text className="font-bold text-emerald-600">
                      {student.attendancePercent}%
                    </Text>
                  </Text>
                  <View className="flex-row items-center">
                    <Text className="text-xs font-bold text-[#3D5EE1]">View Profile</Text>
                    <Feather name="chevron-right" size={14} color="#3D5EE1" className="ml-1" />
                  </View>
                </View>
              </Pressable>
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
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{adm.applicationNo}</Text>
                      <StatusBadge status={adm.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{adm.studentName}</Text>
                    <Text className="text-xs text-slate-500">
                      Target: {adm.appliedGrade} · Guardian: {adm.guardianName}
                    </Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">{adm.submissionDate}</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">{adm.phone}</Text>
                  {adm.status === 'Under Review' ? (
                    <View className="flex-row gap-x-2">
                      <Pressable
                        onPress={() => handleUpdateAdmissionStatus(adm.id, 'Rejected')}
                        className="rounded-lg bg-rose-50 px-2.5 py-1 border border-rose-200"
                      >
                        <Text className="text-xs font-bold text-rose-700">Reject</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleUpdateAdmissionStatus(adm.id, 'Accepted')}
                        className="rounded-lg bg-emerald-600 px-3 py-1"
                      >
                        <Text className="text-xs font-bold text-white">Accept</Text>
                      </Pressable>
                    </View>
                  ) : (
                    <View className="rounded-md bg-slate-100 px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-slate-600">Decision Recorded</Text>
                    </View>
                  )}
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
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <Text className="text-xs font-bold text-[#3D5EE1]">{tch.employeeId}</Text>
                      <StatusBadge status={tch.status} />
                    </View>
                    <Text className="text-base font-bold text-slate-900">{tch.name}</Text>
                    <Text className="text-xs text-slate-500">
                      {tch.designation} · {tch.department}
                    </Text>
                  </View>
                  <View className="flex-row items-center rounded-lg bg-amber-50 px-2 py-1 border border-amber-200">
                    <Feather name="star" size={12} color="#f59e0b" />
                    <Text className="ml-1 text-xs font-bold text-amber-700">{tch.rating}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-600">
                    Pass Rate: <Text className="font-bold text-emerald-600">{tch.passPercentage}%</Text>
                  </Text>
                  <Text className="text-xs font-bold text-slate-800">
                    {tch.totalStudents} Active Students
                  </Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">{tch.phone}</Text>
                  <Text className="text-xs font-semibold text-slate-700">
                    Subjects: {tch.subjects.join(', ')}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* STAFF TAB */}
        {activeTab === 'staff' && (
          <View className="gap-y-3">
            {filteredStaff.map((st) => (
              <View
                key={st.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{st.staffId}</Text>
                    <Text className="text-base font-bold text-slate-900 mt-0.5">{st.name}</Text>
                    <Text className="text-xs text-slate-500">{st.role} · {st.department}</Text>
                  </View>
                  <StatusBadge status={st.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-500">{st.phone}</Text>
                  <Text className="text-[11px] text-slate-400">Joined: {st.joinDate}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* PROMOTIONS TAB */}
        {activeTab === 'promotions' && (
          <View className="gap-y-3">
            {filteredPromotions.map((prm) => (
              <View
                key={prm.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{prm.studentName}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {prm.currentGrade} → <Text className="font-bold text-[#3D5EE1]">{prm.promotedGrade}</Text>
                    </Text>
                  </View>
                  <StatusBadge status={prm.promotionStatus} />
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-xs text-slate-600">
                    Cumulative GPA: <Text className="font-bold">{prm.gpa}</Text>
                  </Text>
                  <Text className="text-xs font-bold text-slate-700">{prm.academicYear}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ALUMNI TAB */}
        {activeTab === 'alumni' && (
          <View className="gap-y-3">
            {filteredAlumni.map((alm) => (
              <View
                key={alm.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <View className="rounded-md bg-purple-50 px-2 py-0.5 self-start mb-1 border border-purple-200">
                      <Text className="text-[10px] font-bold text-purple-700">{alm.graduatingBatch}</Text>
                    </View>
                    <Text className="text-base font-bold text-slate-900">{alm.name}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">{alm.higherEducation}</Text>
                  </View>
                </View>

                <View className="mt-3 rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-500">Current Career</Text>
                  <Text className="text-xs font-bold text-slate-800 mt-0.5">{alm.currentProfession}</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">{alm.contactEmail}</Text>
                  <Text className="text-xs font-semibold text-[#3D5EE1]">{alm.phone}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <View className="gap-y-3">
            {filteredUsers.map((u) => (
              <View
                key={u.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{u.name}</Text>
                    <Text className="text-xs text-slate-500">{u.email}</Text>
                  </View>
                  <StatusBadge status={u.status} />
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <View className="rounded-lg bg-blue-50 px-2 py-0.5">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{u.role}</Text>
                  </View>
                  <Pressable
                    onPress={() => handleToggleUserStatus(u.id)}
                    className="rounded-lg bg-slate-100 px-3 py-1"
                  >
                    <Text className="text-xs font-semibold text-slate-700">
                      {u.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Student Profile Detail Modal */}
      <Modal
        visible={Boolean(selectedStudent)}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedStudent(null)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8 max-h-[85%]">
            {selectedStudent && (
              <>
                <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
                  <View>
                    <Text className="text-lg font-bold text-slate-900">{selectedStudent.name}</Text>
                    <Text className="text-xs text-slate-500">{selectedStudent.admissionNo}</Text>
                  </View>
                  <Pressable onPress={() => setSelectedStudent(null)} hitSlop={10}>
                    <Feather name="x" size={20} color="#64748b" />
                  </Pressable>
                </View>

                <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
                  <View className="flex-row items-center justify-between rounded-xl bg-slate-50 p-3 mb-3">
                    <View>
                      <Text className="text-xs text-slate-400">Class & Section</Text>
                      <Text className="text-sm font-bold text-slate-900">
                        {selectedStudent.grade} ({selectedStudent.section})
                      </Text>
                    </View>
                    <View>
                      <Text className="text-xs text-slate-400">Roll Number</Text>
                      <Text className="text-sm font-bold text-slate-900">{selectedStudent.rollNo}</Text>
                    </View>
                    <View>
                      <Text className="text-xs text-slate-400">Attendance</Text>
                      <Text className="text-sm font-bold text-emerald-600">
                        {selectedStudent.attendancePercent}%
                      </Text>
                    </View>
                  </View>

                  <View className="gap-y-3">
                    <View className="rounded-xl border border-slate-200 p-3">
                      <Text className="text-xs font-bold text-slate-800 mb-1">Guardian Contact</Text>
                      <Text className="text-xs text-slate-600">
                        Parent: <Text className="font-semibold">{selectedStudent.parentName}</Text>
                      </Text>
                      <Text className="text-xs text-slate-600 mt-0.5">Phone: {selectedStudent.phone}</Text>
                      <Text className="text-xs text-slate-600 mt-0.5">Email: {selectedStudent.email}</Text>
                      <Text className="text-xs text-slate-600 mt-0.5">Address: {selectedStudent.address}</Text>
                    </View>

                    <View className="rounded-xl border border-slate-200 p-3">
                      <Text className="text-xs font-bold text-slate-800 mb-1">Documents on File</Text>
                      {['Birth Certificate (Verified)', 'Previous Report Card (Verified)', 'Immunization Record (Verified)'].map(
                        (doc) => (
                          <View key={doc} className="flex-row items-center py-1">
                            <Feather name="check-circle" size={13} color="#059669" />
                            <Text className="ml-2 text-xs text-slate-700">{doc}</Text>
                          </View>
                        )
                      )}
                    </View>
                  </View>

                  <Pressable
                    onPress={() => setSelectedStudent(null)}
                    className="mt-6 items-center rounded-xl bg-[#3D5EE1] py-3"
                  >
                    <Text className="text-sm font-bold text-white">Close Profile</Text>
                  </Pressable>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Add / Create Modal */}
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
                New {activeTab === 'students' ? 'Student' : activeTab === 'teachers' ? 'Teacher' : activeTab === 'staff' ? 'Staff Member' : 'Application'}
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
                  placeholder="e.g. Liam Gallagher"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">
                  {activeTab === 'students' || activeTab === 'admissions' ? 'Grade / Class' : 'Department / Role'}
                </Text>
                <TextInput
                  value={formMeta}
                  onChangeText={setFormMeta}
                  placeholder="e.g. Grade XI, Science, Mathematics"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View className="flex-row gap-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Phone</Text>
                  <TextInput
                    value={formPhone}
                    onChangeText={setFormPhone}
                    placeholder="+1 555-0199"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Email</Text>
                  <TextInput
                    value={formEmail}
                    onChangeText={setFormEmail}
                    placeholder="contact@school.com"
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
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
                onPress={handleAddNewItem}
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
