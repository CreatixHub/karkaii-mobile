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
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_ADMISSIONS,
  INITIAL_ALUMNI,
  INITIAL_DELETE_REQUESTS,
  INITIAL_DEPARTMENTS,
  INITIAL_DESIGNATIONS,
  INITIAL_PROMOTIONS,
  INITIAL_ROLES_PERMISSIONS,
  INITIAL_STAFF,
  INITIAL_STUDENTS,
  INITIAL_STUDENT_ATTENDANCE_HISTORY,
  INITIAL_STUDENT_DOCUMENTS,
  INITIAL_TEACHERS,
  INITIAL_TEACHER_ROUTINES,
  INITIAL_USERS,
  MOCK_STUDENT_360,
} from '@/data/peopleMock';
import type {
  AdmissionRecord,
  AlumniRecord,
  DeleteAccountRequestItem,
  DepartmentItem,
  DesignationItem,
  StaffRecord,
  StudentAttendanceHistoryItem,
  StudentDocumentItem,
  StudentPromotionItem,
  StudentRecord,
  TeacherRecord,
  TeacherRoutineSlot,
  UserAccount,
} from '@/types/modules';

type MainModule = 'students' | 'teachers' | 'staff' | 'users';
type StudentSubTab = 'roster' | 'admissions' | 'promotions' | 'alumni' | 'attendance' | 'documents';
type TeacherSubTab = 'directory' | 'routine';
type StaffSubTab = 'staff_list' | 'departments' | 'designations';
type UserSubTab = 'users_list' | 'roles' | 'delete_requests';

export default function PeopleScreen() {
  // Top-Level Module Selector
  const [activeModule, setActiveModule] = useState<MainModule>('students');

  // Sub-tab selectors
  const [studentTab, setStudentTab] = useState<StudentSubTab>('roster');
  const [teacherTab, setTeacherTab] = useState<TeacherSubTab>('directory');
  const [staffTab, setStaffTab] = useState<StaffSubTab>('staff_list');
  const [userTab, setUserTab] = useState<UserSubTab>('users_list');

  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Datasets state
  const [studentsList] = useState<StudentRecord[]>(INITIAL_STUDENTS);
  const [admissionsList, setAdmissionsList] = useState<AdmissionRecord[]>(INITIAL_ADMISSIONS);
  const [promotionsList, setPromotionsList] = useState<StudentPromotionItem[]>(INITIAL_PROMOTIONS);
  const [alumniList] = useState<AlumniRecord[]>(INITIAL_ALUMNI);
  const [attendanceHistory] = useState<StudentAttendanceHistoryItem[]>(INITIAL_STUDENT_ATTENDANCE_HISTORY);
  const [documentsList, setDocumentsList] = useState<StudentDocumentItem[]>(INITIAL_STUDENT_DOCUMENTS);

  const [teachersList, setTeachersList] = useState<TeacherRecord[]>(INITIAL_TEACHERS);
  const [routinesList] = useState<TeacherRoutineSlot[]>(INITIAL_TEACHER_ROUTINES);

  const [staffList] = useState<StaffRecord[]>(INITIAL_STAFF);
  const [departmentsList] = useState<DepartmentItem[]>(INITIAL_DEPARTMENTS);
  const [designationsList] = useState<DesignationItem[]>(INITIAL_DESIGNATIONS);

  const [usersList, setUsersList] = useState<UserAccount[]>(INITIAL_USERS);
  const [deleteRequests, setDeleteRequests] = useState<DeleteAccountRequestItem[]>(INITIAL_DELETE_REQUESTS);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<StudentRecord | null>(null);
  const [studentProfileTab, setStudentProfileTab] = useState<'overview' | 'fees' | 'exams' | 'attendance' | 'timeline'>('overview');

  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [showNewAdmissionModal, setShowNewAdmissionModal] = useState(false);
  // Filtered datasets based on search query
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return studentsList;
    return studentsList.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.grade.toLowerCase().includes(q)
    );
  }, [studentsList, searchQuery]);

  const filteredAdmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return admissionsList;
    return admissionsList.filter(
      (a) =>
        a.studentName.toLowerCase().includes(q) ||
        a.applicationNo.toLowerCase().includes(q) ||
        a.appliedGrade.toLowerCase().includes(q)
    );
  }, [admissionsList, searchQuery]);

  const filteredPromotions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return promotionsList;
    return promotionsList.filter((p) => p.studentName.toLowerCase().includes(q));
  }, [promotionsList, searchQuery]);

  const filteredAlumni = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return alumniList;
    return alumniList.filter(
      (al) =>
        al.name.toLowerCase().includes(q) ||
        al.currentProfession.toLowerCase().includes(q) ||
        al.higherEducation.toLowerCase().includes(q)
    );
  }, [alumniList, searchQuery]);

  const filteredDocuments = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return documentsList;
    return documentsList.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.studentName.toLowerCase().includes(q)
    );
  }, [documentsList, searchQuery]);

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachersList;
    return teachersList.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.employeeId.toLowerCase().includes(q) ||
        t.department.toLowerCase().includes(q)
    );
  }, [teachersList, searchQuery]);

  const filteredStaff = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return staffList;
    return staffList.filter(
      (st) =>
        st.name.toLowerCase().includes(q) ||
        st.role.toLowerCase().includes(q) ||
        st.department.toLowerCase().includes(q)
    );
  }, [staffList, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return usersList;
    return usersList.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [usersList, searchQuery]);

  const filteredDeleteRequests = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return deleteRequests;
    return deleteRequests.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.userType.toLowerCase().includes(q) ||
        r.reason.toLowerCase().includes(q)
    );
  }, [deleteRequests, searchQuery]);

  // Forms
  const [teacherFormName, setTeacherFormName] = useState('');
  const [teacherFormDept, setTeacherFormDept] = useState('Mathematics');
  const [teacherFormSubjects, setTeacherFormSubjects] = useState('Algebra, Calculus');
  const [teacherFormPhone, setTeacherFormPhone] = useState('');
  const [teacherFormEmail, setTeacherFormEmail] = useState('');

  const [docName, setDocName] = useState('');
  const [docCategory, setDocCategory] = useState<'Identity' | 'Academic' | 'Medical' | 'Transfer'>('Academic');

  const [admStudentName, setAdmStudentName] = useState('');
  const [admGrade, setAdmGrade] = useState('Grade IX');
  const [admGuardian, setAdmGuardian] = useState('');
  const [admPhone, setAdmPhone] = useState('');

  // Local CRUD actions
  const handleApproveAdmission = (id: string) => {
    setAdmissionsList((prev) =>
      prev.map((adm) => (adm.id === id ? { ...adm, status: 'Accepted' } : adm))
    );
    Alert.alert('Admission Approved', 'Student enrollment confirmed.');
  };

  const handleRejectAdmission = (id: string) => {
    setAdmissionsList((prev) =>
      prev.map((adm) => (adm.id === id ? { ...adm, status: 'Rejected' } : adm))
    );
    Alert.alert('Admission Rejected', 'Application status updated to Rejected.');
  };

  const handlePromoteStudent = (id: string) => {
    setPromotionsList((prev) =>
      prev.map((p) => (p.id === id ? { ...p, promotionStatus: 'Promoted' } : p))
    );
    Alert.alert('Student Promoted', 'Record updated to Promoted for AY 2026-27.');
  };

  const handleSaveTeacher = () => {
    if (!teacherFormName.trim()) {
      Alert.alert('Required', 'Please enter teacher name');
      return;
    }
    const newTeacher: TeacherRecord = {
      id: `tch-${Date.now()}`,
      employeeId: `TCH-2026-${Math.floor(100 + Math.random() * 900)}`,
      name: teacherFormName,
      department: teacherFormDept,
      subjects: teacherFormSubjects.split(',').map((s) => s.trim()),
      designation: 'Assistant Faculty',
      qualification: 'M.Sc., B.Ed.',
      phone: teacherFormPhone || '+1 (555) 000-0000',
      email: teacherFormEmail || `${teacherFormName.toLowerCase().replace(/\s+/g, '.')}@karkaii.edu`,
      rating: 4.8,
      passPercentage: 96,
      totalStudents: 120,
      status: 'Active',
    };
    setTeachersList([newTeacher, ...teachersList]);
    setShowAddTeacherModal(false);
    setTeacherFormName('');
    Alert.alert('Teacher Added', `${newTeacher.name} successfully registered.`);
  };

  const handleUploadDocument = () => {
    if (!docName.trim()) {
      Alert.alert('Required', 'Please enter document name');
      return;
    }
    const newDoc: StudentDocumentItem = {
      id: `doc-${Date.now()}`,
      name: docName.endsWith('.pdf') ? docName : `${docName}.pdf`,
      category: docCategory,
      verificationStatus: 'Verified',
      isFavourite: false,
      studentName: 'Janet Daniel',
      admissionNo: 'AD1256589',
      size: '1.2 MB',
      date: 'Today',
      uploadedBy: 'School Admin',
    };
    setDocumentsList([newDoc, ...documentsList]);
    setShowUploadDocModal(false);
    setDocName('');
    Alert.alert('Document Uploaded', `${newDoc.name} saved in student document vault.`);
  };

  const handleSaveAdmission = () => {
    if (!admStudentName.trim()) {
      Alert.alert('Required', 'Please enter applicant name');
      return;
    }
    const newAdm: AdmissionRecord = {
      id: `adm-${Date.now()}`,
      applicationNo: `APP-2026-${Math.floor(100 + Math.random() * 900)}`,
      studentName: admStudentName,
      appliedGrade: admGrade,
      guardianName: admGuardian || 'Parent / Guardian',
      phone: admPhone || '+1 (555) 000-0000',
      email: 'applicant@gmail.com',
      submissionDate: 'Today',
      status: 'Under Review',
      feesPaid: true,
    };
    setAdmissionsList([newAdm, ...admissionsList]);
    setShowNewAdmissionModal(false);
    setAdmStudentName('');
    Alert.alert('Application Submitted', `Application ${newAdm.applicationNo} added.`);
  };

  const handleApproveDeleteRequest = (id: string) => {
    setDeleteRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    Alert.alert('Request Approved', 'Account deletion scheduled per privacy guidelines.');
  };

  const handleToggleUserStatus = (id: string) => {
    setUsersList((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u
      )
    );
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* 1. TOP MODULE NAVIGATOR (4 MAIN MODULES) */}
      <View className="bg-white px-4 pt-3 pb-2 border-b border-slate-200 shadow-sm shadow-black/5">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              PEOPLE & ADMISSION (17 PAGES)
            </Text>
            <Text className="text-lg font-bold text-[#202C4B]">School Directory</Text>
          </View>
          <View className="rounded-full bg-indigo-50 px-2.5 py-1">
            <Text className="text-[11px] font-bold text-[#3D5EE1]">
              {activeModule.toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Module Switcher Tabs */}
        <View className="flex-row rounded-2xl bg-slate-100 p-1">
          {[
            { id: 'students', label: 'Students', count: 7 },
            { id: 'teachers', label: 'Teachers', count: 4 },
            { id: 'staff', label: 'Staff', count: 3 },
            { id: 'users', label: 'Users', count: 3 },
          ].map((mod) => {
            const isActive = activeModule === mod.id;
            return (
              <Pressable
                key={mod.id}
                onPress={() => {
                  setActiveModule(mod.id as MainModule);
                  setSearchQuery('');
                }}
                className={`flex-1 items-center justify-center py-2 rounded-xl ${
                  isActive ? 'bg-white shadow-sm shadow-black/5' : ''
                }`}
              >
                <Text
                  className={`text-xs font-bold ${
                    isActive ? 'text-[#3D5EE1]' : 'text-slate-500'
                  }`}
                >
                  {mod.label} ({mod.count})
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* 2. SUB-MODULE PILLS */}
      <View className="bg-white px-4 py-2 border-b border-slate-100">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-x-2">
          {activeModule === 'students' && (
            <>
              {[
                { id: 'roster', label: 'Students List' },
                { id: 'admissions', label: 'Admissions Pipeline' },
                { id: 'promotions', label: 'Student Promotion' },
                { id: 'alumni', label: 'Alumni Network' },
                { id: 'attendance', label: 'Attendance History' },
                { id: 'documents', label: 'Student Documents' },
              ].map((tab) => {
                const isActive = studentTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setStudentTab(tab.id as StudentSubTab)}
                    className={`rounded-full px-3.5 py-1.5 border mr-2 ${
                      isActive ? 'bg-[#3D5EE1] border-[#3D5EE1]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}

          {activeModule === 'teachers' && (
            <>
              {[
                { id: 'directory', label: 'Teachers Directory' },
                { id: 'routine', label: 'Teacher Routine' },
              ].map((tab) => {
                const isActive = teacherTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setTeacherTab(tab.id as TeacherSubTab)}
                    className={`rounded-full px-3.5 py-1.5 border mr-2 ${
                      isActive ? 'bg-[#10b981] border-[#10b981]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}

          {activeModule === 'staff' && (
            <>
              {[
                { id: 'staff_list', label: 'Staff Register' },
                { id: 'departments', label: 'Departments' },
                { id: 'designations', label: 'Designation Master' },
              ].map((tab) => {
                const isActive = staffTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setStaffTab(tab.id as StaffSubTab)}
                    className={`rounded-full px-3.5 py-1.5 border mr-2 ${
                      isActive ? 'bg-[#3D5EE1] border-[#3D5EE1]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}

          {activeModule === 'users' && (
            <>
              {[
                { id: 'users_list', label: 'User Accounts' },
                { id: 'roles', label: 'Roles & Permissions' },
                { id: 'delete_requests', label: 'Delete Account Requests' },
              ].map((tab) => {
                const isActive = userTab === tab.id;
                return (
                  <Pressable
                    key={tab.id}
                    onPress={() => setUserTab(tab.id as UserSubTab)}
                    className={`rounded-full px-3.5 py-1.5 border mr-2 ${
                      isActive ? 'bg-[#3D5EE1] border-[#3D5EE1]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-600'}`}>
                      {tab.label}
                    </Text>
                  </Pressable>
                );
              })}
            </>
          )}
        </ScrollView>
      </View>

      {/* 3. SEARCH BAR */}
      <View className="px-4 py-2.5 bg-white border-b border-slate-100 flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center rounded-xl bg-slate-100 px-3 py-1.5 mr-2">
          <Feather name="search" size={14} color="#94a3b8" />
          <TextInput
            placeholder="Search records, names, IDs..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-2 flex-1 text-xs text-[#202C4B] p-0"
          />
        </View>

        {activeModule === 'teachers' && (
          <Pressable
            onPress={() => setShowAddTeacherModal(true)}
            className="rounded-xl bg-[#10b981] px-3 py-2 flex-row items-center"
          >
            <Feather name="plus" size={14} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">Add Teacher</Text>
          </Pressable>
        )}

        {activeModule === 'students' && studentTab === 'documents' && (
          <Pressable
            onPress={() => setShowUploadDocModal(true)}
            className="rounded-xl bg-[#3D5EE1] px-3 py-2 flex-row items-center"
          >
            <Feather name="upload" size={14} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">Upload</Text>
          </Pressable>
        )}

        {activeModule === 'students' && studentTab === 'admissions' && (
          <Pressable
            onPress={() => setShowNewAdmissionModal(true)}
            className="rounded-xl bg-[#3D5EE1] px-3 py-2 flex-row items-center"
          >
            <Feather name="plus" size={14} color="#ffffff" />
            <Text className="ml-1 text-xs font-bold text-white">New Apply</Text>
          </Pressable>
        )}
      </View>

      {/* 4. MAIN CONTENT SCROLLER */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="p-4 pb-14"
        showsVerticalScrollIndicator={false}
      >
        {/* =========================================================================
            MODULE 1: STUDENTS (7 SUBMODULES)
            ========================================================================= */}
        {activeModule === 'students' && (
          <>
            {/* 1.1 STUDENTS ROSTER (Card Grid + Preview) */}
            {studentTab === 'roster' && (
              <View>
                {/* Summary Strip */}
                <View className="mb-3.5 flex-row gap-2">
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-slate-500 font-medium">Total</Text>
                    <Text className="text-base font-extrabold text-[#202C4B]">{studentsList.length}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-emerald-600 font-medium">Present</Text>
                    <Text className="text-base font-extrabold text-emerald-700">98.5%</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-amber-600 font-medium">Pending Fee</Text>
                    <Text className="text-base font-extrabold text-amber-700">1</Text>
                  </View>
                </View>

                {/* Cards List */}
                <View className="gap-y-3">
                  {filteredStudents.map((std) => (
                    <Pressable
                      key={std.id}
                      onPress={() => setSelectedStudent(std)}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1 mr-2">
                          <View className="h-10 w-10 items-center justify-center rounded-2xl bg-[#3D5EE1]/10">
                            <Feather name="user" size={18} color="#3D5EE1" />
                          </View>
                          <View className="ml-3 flex-1">
                            <Text className="text-sm font-bold text-[#202C4B]">{std.name}</Text>
                            <Text className="text-[11px] text-slate-500">
                              {std.admissionNo} • {std.grade} - Section {std.section} (Roll: {std.rollNo})
                            </Text>
                          </View>
                        </View>
                        <StatusBadge status={std.status} />
                      </View>

                      {/* Card meta fields */}
                      <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row items-center justify-between">
                        <Text className="text-[11px] text-slate-500">
                          Parent: {std.parentName}
                        </Text>
                        <View className="flex-row items-center">
                          <Feather name="check-circle" size={11} color="#10b981" />
                          <Text className="ml-1 text-[11px] font-bold text-emerald-700">
                            {std.attendancePercent}% Att.
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* 1.2 ADMISSIONS PIPELINE */}
            {studentTab === 'admissions' && (
              <View>
                <View className="mb-3.5 flex-row gap-2">
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-slate-500 font-medium">Applied</Text>
                    <Text className="text-base font-extrabold text-[#202C4B]">{admissionsList.length}</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-amber-600 font-medium">Under Review</Text>
                    <Text className="text-base font-extrabold text-amber-700">
                      {admissionsList.filter((a) => a.status === 'Under Review').length}
                    </Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-emerald-600 font-medium">Accepted</Text>
                    <Text className="text-base font-extrabold text-emerald-700">
                      {admissionsList.filter((a) => a.status === 'Accepted').length}
                    </Text>
                  </View>
                </View>

                <View className="gap-y-3">
                  {filteredAdmissions.map((adm) => (
                    <View
                      key={adm.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <View>
                          <Text className="text-xs font-bold text-slate-400">{adm.applicationNo}</Text>
                          <Text className="text-sm font-bold text-[#202C4B] mt-0.5">{adm.studentName}</Text>
                        </View>
                        <StatusBadge status={adm.status} />
                      </View>

                      <View className="mt-2 text-xs text-slate-600">
                        <Text className="text-xs text-slate-700">
                          Class: <Text className="font-bold">{adm.appliedGrade}</Text> • Guardian: {adm.guardianName}
                        </Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">Applied: {adm.submissionDate} • {adm.phone}</Text>
                      </View>

                      {/* Approval Row Actions */}
                      <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row gap-2">
                        {adm.status === 'Under Review' ? (
                          <>
                            <Pressable
                              onPress={() => handleApproveAdmission(adm.id)}
                              className="flex-1 items-center rounded-xl bg-emerald-600 py-2"
                            >
                              <Text className="text-xs font-bold text-white">Approve</Text>
                            </Pressable>
                            <Pressable
                              onPress={() => handleRejectAdmission(adm.id)}
                              className="flex-1 items-center rounded-xl border border-red-200 bg-red-50 py-2"
                            >
                              <Text className="text-xs font-bold text-red-700">Reject</Text>
                            </Pressable>
                          </>
                        ) : (
                          <View className="flex-row items-center justify-between flex-1">
                            <Text className="text-xs text-slate-500">Decision Recorded</Text>
                            <Feather name="check" size={16} color="#10b981" />
                          </View>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 1.3 STUDENT PROMOTIONS (Wizard & Table) */}
            {studentTab === 'promotions' && (
              <View>
                <View className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm mb-3.5">
                  <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    STEP 2: MAP CLASS & CONFIRM
                  </Text>
                  <Text className="text-sm font-bold text-[#202C4B] mt-0.5">
                    AY 2026-27 Promotion Roster
                  </Text>
                  <Text className="text-xs text-slate-500 mt-1">
                    Review passing grades & map eligible students to next grade.
                  </Text>
                </View>

                <View className="gap-y-3">
                  {filteredPromotions.map((p) => (
                    <View
                      key={p.id}
                      className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-sm font-bold text-[#202C4B]">{p.studentName}</Text>
                        <View className="rounded-full bg-emerald-50 px-2.5 py-0.5">
                          <Text className="text-[10px] font-bold text-emerald-700">{p.promotionStatus}</Text>
                        </View>
                      </View>
                      <View className="mt-2 flex-row items-center justify-between text-xs">
                        <Text className="text-xs text-slate-600">
                          {p.currentGrade} ➔ <Text className="font-bold text-[#3D5EE1]">{p.promotedGrade}</Text>
                        </Text>
                        <Text className="text-xs font-bold text-[#202C4B]">GPA: {p.gpa}</Text>
                      </View>

                      <Pressable
                        onPress={() => handlePromoteStudent(p.id)}
                        className="mt-3 pt-2.5 border-t border-slate-100 items-center rounded-xl bg-[#3D5EE1] py-2"
                      >
                        <Text className="text-xs font-bold text-white">Confirm Promotion</Text>
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 1.4 ALUMNI NETWORK */}
            {studentTab === 'alumni' && (
              <View className="gap-y-3">
                {filteredAlumni.map((alm) => (
                  <View
                    key={alm.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-[#202C4B]">{alm.name}</Text>
                      <View className="rounded-full bg-purple-50 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-purple-700">{alm.graduatingBatch}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-700 font-semibold mt-1">
                      {alm.currentProfession}
                    </Text>
                    <Text className="text-[11px] text-slate-500 mt-0.5">{alm.higherEducation}</Text>

                    <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row items-center justify-between">
                      <Text className="text-[11px] text-slate-400">{alm.contactEmail}</Text>
                      <Pressable
                        onPress={() => Alert.alert('Contact Alumni', `Email sent to ${alm.name}`)}
                        className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1"
                      >
                        <Text className="text-[10px] font-bold text-[#3D5EE1]">Connect</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 1.5 STUDENT ATTENDANCE HISTORY */}
            {studentTab === 'attendance' && (
              <View>
                <View className="mb-3.5 flex-row gap-2">
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-slate-500 font-medium">Monthly Rate</Text>
                    <Text className="text-base font-extrabold text-emerald-700">98.5%</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-slate-500 font-medium">Present</Text>
                    <Text className="text-base font-extrabold text-[#202C4B]">162 d</Text>
                  </View>
                  <View className="flex-1 rounded-2xl bg-white p-3 border border-slate-100 shadow-sm items-center">
                    <Text className="text-[10px] text-slate-500 font-medium">Late / Leave</Text>
                    <Text className="text-base font-extrabold text-amber-700">3 d</Text>
                  </View>
                </View>

                <View className="gap-y-2.5">
                  {attendanceHistory.map((log) => (
                    <View
                      key={log.id}
                      className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-black/5"
                    >
                      <View className="flex-row items-center justify-between">
                        <Text className="text-xs font-bold text-[#202C4B]">{log.date}</Text>
                        <View
                          className={`rounded-full px-2 py-0.5 ${
                            log.status === 'Present'
                              ? 'bg-emerald-50'
                              : log.status === 'Late'
                              ? 'bg-amber-50'
                              : 'bg-purple-50'
                          }`}
                        >
                          <Text
                            className={`text-[10px] font-bold ${
                              log.status === 'Present'
                                ? 'text-emerald-700'
                                : log.status === 'Late'
                                ? 'text-amber-700'
                                : 'text-purple-700'
                            }`}
                          >
                            {log.status}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-xs text-slate-600 mt-1 font-medium">{log.subject}</Text>
                      <View className="mt-1 flex-row items-center justify-between text-[10px]">
                        <Text className="text-[10px] text-slate-400">Time: {log.timeIn} - {log.timeOut}</Text>
                        <Text className="text-[10px] text-slate-500">Teacher: {log.teacher}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 1.6 STUDENT DOCUMENTS */}
            {studentTab === 'documents' && (
              <View className="gap-y-3">
                {filteredDocuments.map((doc) => (
                  <View
                    key={doc.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <Feather name="file-text" size={18} color="#3D5EE1" />
                        <Text className="ml-2 text-xs font-bold text-[#202C4B] flex-1" numberOfLines={1}>
                          {doc.name}
                        </Text>
                      </View>
                      <View className="rounded-full bg-emerald-50 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-emerald-700">{doc.verificationStatus}</Text>
                      </View>
                    </View>

                    <View className="mt-2 flex-row items-center justify-between text-[11px]">
                      <Text className="text-[11px] text-slate-500">
                        Category: {doc.category} • {doc.size}
                      </Text>
                      <Text className="text-[10px] text-slate-400">{doc.date}</Text>
                    </View>

                    <Pressable
                      onPress={() => Alert.alert('View Document', `Opening ${doc.name} preview...`)}
                      className="mt-3 pt-2.5 border-t border-slate-100 items-center rounded-xl bg-slate-50 py-2"
                    >
                      <Text className="text-xs font-semibold text-[#3D5EE1]">Preview Document</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* =========================================================================
            MODULE 2: TEACHERS (4 SUBMODULES)
            ========================================================================= */}
        {activeModule === 'teachers' && (
          <>
            {/* 2.1 TEACHERS DIRECTORY */}
            {teacherTab === 'directory' && (
              <View className="gap-y-3">
                {filteredTeachers.map((tch) => (
                  <Pressable
                    key={tch.id}
                    onPress={() => setSelectedTeacher(tch)}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1 mr-2">
                        <View className="h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50">
                          <Feather name="book-open" size={18} color="#059669" />
                        </View>
                        <View className="ml-3 flex-1">
                          <Text className="text-sm font-bold text-[#202C4B]">{tch.name}</Text>
                          <Text className="text-[11px] text-slate-500">
                            {tch.employeeId} • {tch.department}
                          </Text>
                        </View>
                      </View>
                      <View className="rounded-full bg-emerald-50 px-2 py-0.5 flex-row items-center">
                        <Feather name="star" size={10} color="#f59e0b" />
                        <Text className="ml-1 text-[10px] font-bold text-emerald-800">{tch.rating}</Text>
                      </View>
                    </View>

                    <View className="mt-2.5 flex-row flex-wrap gap-1.5">
                      {tch.subjects.map((sub, sIdx) => (
                        <View key={sIdx} className="rounded-md bg-slate-100 px-2 py-0.5">
                          <Text className="text-[10px] font-semibold text-slate-700">{sub}</Text>
                        </View>
                      ))}
                    </View>

                    <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row items-center justify-between">
                      <Text className="text-[11px] text-slate-500">Pass Rate: {tch.passPercentage}%</Text>
                      <Text className="text-[11px] font-bold text-[#3D5EE1]">View Profile →</Text>
                    </View>
                  </Pressable>
                ))}
              </View>
            )}

            {/* 2.2 TEACHER ROUTINE TIMETABLE GRID */}
            {teacherTab === 'routine' && (
              <View className="gap-y-2.5">
                {routinesList.map((rout) => (
                  <View
                    key={rout.id}
                    className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View className="rounded-full bg-indigo-50 px-2 py-0.5 mr-2">
                          <Text className="text-[10px] font-bold text-[#3D5EE1]">{rout.day}</Text>
                        </View>
                        <Text className="text-xs font-bold text-[#202C4B]">{rout.period}</Text>
                      </View>
                      <Text className="text-[10px] text-slate-400">{rout.time}</Text>
                    </View>
                    <Text className="text-sm font-bold text-[#202C4B] mt-1.5">{rout.subject}</Text>
                    <View className="mt-1 flex-row items-center justify-between text-[11px]">
                      <Text className="text-[11px] text-slate-500">{rout.grade} • {rout.room}</Text>
                      <Text className="text-[10px] text-emerald-700 font-semibold">{rout.duration}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* =========================================================================
            MODULE 3: STAFF (3 SUBMODULES)
            ========================================================================= */}
        {activeModule === 'staff' && (
          <>
            {/* 3.1 STAFF LIST */}
            {staffTab === 'staff_list' && (
              <View className="gap-y-3">
                {filteredStaff.map((stf) => (
                  <View
                    key={stf.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View>
                        <Text className="text-sm font-bold text-[#202C4B]">{stf.name}</Text>
                        <Text className="text-[11px] text-slate-500">{stf.role}</Text>
                      </View>
                      <StatusBadge status={stf.status} />
                    </View>
                    <Text className="text-xs text-slate-600 mt-2">
                      Dept: <Text className="font-semibold">{stf.department}</Text>
                    </Text>
                    <Text className="text-[11px] text-slate-400 mt-0.5">
                      Joined: {stf.joinDate} • {stf.phone}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* 3.2 DEPARTMENTS */}
            {staffTab === 'departments' && (
              <View className="gap-y-3">
                {departmentsList.map((dept) => (
                  <View
                    key={dept.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-[#202C4B]">{dept.name}</Text>
                      <View className="rounded-full bg-indigo-50 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-[#3D5EE1]">{dept.staffCount} Faculty</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-600 mt-1">Head of Dept: {dept.headOfDept}</Text>
                    <View className="mt-2 pt-2 border-t border-slate-100 flex-row justify-between">
                      <Text className="text-[11px] text-slate-400">Budget: {dept.budgetAllocated}</Text>
                      <Text className="text-[11px] font-bold text-emerald-700">Active</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 3.3 DESIGNATIONS */}
            {staffTab === 'designations' && (
              <View className="gap-y-2.5">
                {designationsList.map((des) => (
                  <View
                    key={des.id}
                    className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-black/5 flex-row items-center justify-between"
                  >
                    <View>
                      <Text className="text-xs font-bold text-[#202C4B]">{des.title}</Text>
                      <Text className="text-[10px] text-slate-500 mt-0.5">{des.department} • {des.level}</Text>
                    </View>
                    <View className="rounded-full bg-slate-100 px-2.5 py-0.5">
                      <Text className="text-[10px] font-bold text-slate-700">{des.totalHolders} Staff</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* =========================================================================
            MODULE 4: USERS (3 SUBMODULES)
            ========================================================================= */}
        {activeModule === 'users' && (
          <>
            {/* 4.1 USERS LIST */}
            {userTab === 'users_list' && (
              <View className="gap-y-3">
                {filteredUsers.map((usr) => (
                  <View
                    key={usr.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center">
                        <View
                          className={`h-2.5 w-2.5 rounded-full mr-2 ${
                            usr.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                        />
                        <Text className="text-sm font-bold text-[#202C4B]">{usr.name}</Text>
                      </View>
                      <View className="rounded-full bg-purple-50 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-purple-700">{usr.role}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">{usr.email}</Text>
                    <Text className="text-[10px] text-slate-400 mt-0.5">Last login: {usr.lastLogin}</Text>

                    <View className="mt-3 pt-2.5 border-t border-slate-100 flex-row justify-between items-center">
                      <Text className="text-[11px] font-semibold text-slate-600">
                        Status: {usr.status}
                      </Text>
                      <Pressable
                        onPress={() => handleToggleUserStatus(usr.id)}
                        className="rounded-lg bg-slate-50 border border-slate-200 px-2.5 py-1"
                      >
                        <Text className="text-[10px] font-bold text-[#3D5EE1]">
                          {usr.status === 'Active' ? 'Deactivate' : 'Activate'}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 4.2 ROLES & PERMISSIONS */}
            {userTab === 'roles' && (
              <View className="gap-y-3">
                {INITIAL_ROLES_PERMISSIONS.map((role) => (
                  <View
                    key={role.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-[#202C4B]">{role.name}</Text>
                      <View className="rounded-full bg-indigo-50 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-[#3D5EE1]">{role.type}</Text>
                      </View>
                    </View>
                    <Text className="text-xs text-slate-500 mt-1">
                      {role.usersCount} Users Assigned • {role.permissionsCount} Permissions Granted
                    </Text>

                    <View className="mt-2 flex-row flex-wrap gap-1.5">
                      {role.categories.map((cat, cIdx) => (
                        <View key={cIdx} className="rounded-md bg-slate-100 px-2 py-0.5">
                          <Text className="text-[10px] font-medium text-slate-600">{cat}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* 4.3 DELETE ACCOUNT REQUESTS */}
            {userTab === 'delete_requests' && (
              <View className="gap-y-3">
                {filteredDeleteRequests.map((req) => (
                  <View
                    key={req.id}
                    className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
                  >
                    <View className="flex-row items-center justify-between">
                      <Text className="text-sm font-bold text-[#202C4B]">{req.name}</Text>
                      <StatusBadge status={req.status} />
                    </View>
                    <Text className="text-xs text-slate-500 mt-0.5">
                      {req.userType} • {req.department} ({req.email})
                    </Text>
                    <Text className="text-xs text-slate-700 mt-1.5 leading-4">
                      Reason: &ldquo;{req.reason}&rdquo;
                    </Text>

                    {req.status === 'Pending' ? (
                      <Pressable
                        onPress={() => handleApproveDeleteRequest(req.id)}
                        className="mt-3 pt-2.5 border-t border-slate-100 items-center rounded-xl bg-red-600 py-2"
                      >
                        <Text className="text-xs font-bold text-white">Approve Deletion</Text>
                      </Pressable>
                    ) : (
                      <View className="mt-2 pt-2 border-t border-slate-100 flex-row justify-between items-center">
                        <Text className="text-[10px] text-slate-400">Processed by {req.reviewer}</Text>
                        <Feather name="check-circle" size={14} color="#10b981" />
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* =========================================================================
          MODALS & PROFILE PREVIEWS
          ========================================================================= */}

      {/* MODAL: STUDENT 360 PROFILE (15 TABS) */}
      <Modal visible={Boolean(selectedStudent)} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[90%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Student Profile (360° View)</Text>
              <Pressable onPress={() => setSelectedStudent(null)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            {selectedStudent && (
              <ScrollView className="mt-3" showsVerticalScrollIndicator={false}>
                {/* Hero Card */}
                <View className="rounded-2xl bg-indigo-50/60 p-4 mb-3">
                  <View className="flex-row items-center">
                    <View className="h-12 w-12 items-center justify-center rounded-2xl bg-[#3D5EE1]">
                      <Feather name="user" size={24} color="#ffffff" />
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-bold text-[#202C4B]">{selectedStudent.name}</Text>
                      <Text className="text-xs text-slate-500">
                        {selectedStudent.admissionNo} • {selectedStudent.grade} - Section {selectedStudent.section}
                      </Text>
                    </View>
                  </View>
                  <View className="mt-3 pt-2.5 border-t border-indigo-100/60 flex-row flex-wrap gap-1.5">
                    {MOCK_STUDENT_360.badges.map((b, bIdx) => (
                      <View key={bIdx} className="rounded-full bg-white px-2.5 py-0.5">
                        <Text className="text-[10px] font-bold text-[#3D5EE1]">{b}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Profile Tabs */}
                <View className="flex-row rounded-xl bg-slate-100 p-1 mb-3">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'fees', label: 'Fees' },
                    { id: 'exams', label: 'Exams' },
                    { id: 'attendance', label: 'Attendance' },
                    { id: 'timeline', label: 'Timeline' },
                  ].map((tb) => {
                    const isTabActive = studentProfileTab === tb.id;
                    return (
                      <Pressable
                        key={tb.id}
                        onPress={() => setStudentProfileTab(tb.id as any)}
                        className={`flex-1 items-center justify-center py-1.5 rounded-lg ${
                          isTabActive ? 'bg-white shadow-sm shadow-black/5' : ''
                        }`}
                      >
                        <Text className={`text-[11px] font-bold ${isTabActive ? 'text-[#3D5EE1]' : 'text-slate-500'}`}>
                          {tb.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Tab: Overview */}
                {studentProfileTab === 'overview' && (
                  <View className="gap-y-2">
                    <View className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                      <Text className="text-[10px] font-bold uppercase text-slate-400 mb-2">PERSONAL DETAILS</Text>
                      <Text className="text-xs text-slate-700">DOB: {MOCK_STUDENT_360.dob} • Blood: {MOCK_STUDENT_360.bloodGroup}</Text>
                      <Text className="text-xs text-slate-700 mt-1">Father: {MOCK_STUDENT_360.father}</Text>
                      <Text className="text-xs text-slate-700 mt-1">Mother: {MOCK_STUDENT_360.mother}</Text>
                      <Text className="text-xs text-slate-700 mt-1">Address: {MOCK_STUDENT_360.address}</Text>
                    </View>
                  </View>
                )}

                {/* Tab: Fees */}
                {studentProfileTab === 'fees' && (
                  <View className="gap-y-2">
                    {MOCK_STUDENT_360.feeInstallments.map((fee, fIdx) => (
                      <View key={fIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex-row justify-between items-center">
                        <View>
                          <Text className="text-xs font-bold text-[#202C4B]">{fee.group}</Text>
                          <Text className="text-[10px] text-slate-500">Due: {fee.dueDate} ({fee.code})</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-xs font-bold text-[#202C4B]">{fee.amount}</Text>
                          <Text className={`text-[10px] font-bold ${fee.status === 'Paid' ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {fee.status}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tab: Exams */}
                {studentProfileTab === 'exams' && (
                  <View className="gap-y-2">
                    {MOCK_STUDENT_360.examResults.map((ex, eIdx) => (
                      <View key={eIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex-row justify-between items-center">
                        <View>
                          <Text className="text-xs font-bold text-[#202C4B]">{ex.subject}</Text>
                          <Text className="text-[10px] text-slate-500">Max: {ex.maxMarks} • Min: {ex.minMarks}</Text>
                        </View>
                        <View className="items-end">
                          <Text className="text-xs font-bold text-[#3D5EE1]">{ex.marksObtained} / 100</Text>
                          <Text className="text-[10px] font-bold text-emerald-700">{ex.result}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tab: Attendance */}
                {studentProfileTab === 'attendance' && (
                  <View className="gap-y-2">
                    <View className="rounded-xl bg-emerald-50 p-3 mb-2">
                      <Text className="text-xs font-bold text-emerald-800">Overall Attendance: 98.5%</Text>
                      <Text className="text-[10px] text-emerald-600">Present 162 of 165 school days</Text>
                    </View>
                    {MOCK_STUDENT_360.leaveHistory.map((lv, lIdx) => (
                      <View key={lIdx} className="rounded-xl border border-slate-100 bg-slate-50 p-2.5">
                        <Text className="text-xs font-bold text-[#202C4B]">{lv.type}</Text>
                        <Text className="text-[10px] text-slate-500">{lv.from} to {lv.to} ({lv.days} Days) • {lv.status}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Tab: Timeline */}
                {studentProfileTab === 'timeline' && (
                  <View className="gap-y-2">
                    {MOCK_STUDENT_360.timelineLogs.map((tl, tIdx) => (
                      <View key={tIdx} className="rounded-xl bg-slate-50 p-2.5">
                        <Text className="text-xs font-bold text-[#202C4B]">{tl.event}</Text>
                        <Text className="text-[10px] text-slate-400 mt-0.5">{tl.date}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: TEACHER PROFILE (5 TABS) */}
      <Modal visible={Boolean(selectedTeacher)} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Teacher Profile</Text>
              <Pressable onPress={() => setSelectedTeacher(null)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            {selectedTeacher && (
              <ScrollView className="mt-3">
                <View className="rounded-2xl bg-emerald-50 p-4 mb-3">
                  <Text className="text-base font-bold text-emerald-900">{selectedTeacher.name}</Text>
                  <Text className="text-xs text-emerald-700">{selectedTeacher.designation} • {selectedTeacher.department}</Text>
                  <Text className="text-[11px] text-emerald-600 mt-1">ID: {selectedTeacher.employeeId} • {selectedTeacher.qualification}</Text>
                </View>

                <View className="rounded-xl border border-slate-100 bg-slate-50 p-3 mb-3">
                  <Text className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">CONTACT & ASSIGNMENTS</Text>
                  <Text className="text-xs text-slate-700">Email: {selectedTeacher.email}</Text>
                  <Text className="text-xs text-slate-700 mt-1">Phone: {selectedTeacher.phone}</Text>
                  <Text className="text-xs text-slate-700 mt-1">Assigned Classes: Grade X-A, Grade IX-B, Grade XI-A</Text>
                  <Text className="text-xs text-slate-700 mt-1">Weekly Teaching: 24 Hours</Text>
                </View>

                <Pressable
                  onPress={() => {
                    Alert.alert('Message Sent', `Direct message channel opened with ${selectedTeacher.name}`);
                    setSelectedTeacher(null);
                  }}
                  className="items-center rounded-xl bg-[#10b981] py-3 mt-2"
                >
                  <Text className="text-xs font-bold text-white">Send Message</Text>
                </Pressable>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* MODAL: ADD TEACHER (FORM PAGE) */}
      <Modal visible={showAddTeacherModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Add New Teacher</Text>
              <Pressable onPress={() => setShowAddTeacherModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Full Name *</Text>
              <TextInput
                placeholder="e.g. Robert Langdon"
                value={teacherFormName}
                onChangeText={setTeacherFormName}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Department</Text>
              <TextInput
                value={teacherFormDept}
                onChangeText={setTeacherFormDept}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Subjects (Comma separated)</Text>
              <TextInput
                value={teacherFormSubjects}
                onChangeText={setTeacherFormSubjects}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Contact Phone</Text>
              <TextInput
                placeholder="+1 (555) 123-4567"
                value={teacherFormPhone}
                onChangeText={setTeacherFormPhone}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Email Address</Text>
              <TextInput
                placeholder="faculty@karkaii.edu"
                value={teacherFormEmail}
                onChangeText={setTeacherFormEmail}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setShowAddTeacherModal(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveTeacher}
                  className="flex-1 items-center rounded-xl bg-[#10b981] py-3"
                >
                  <Text className="text-xs font-bold text-white">Save Teacher</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: UPLOAD STUDENT DOCUMENT */}
      <Modal visible={showUploadDocModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">Upload Student Document</Text>
              <Pressable onPress={() => setShowUploadDocModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Student</Text>
              <Text className="text-xs text-slate-600 mb-3">Janet Daniel (AD1256589 • Grade X-A)</Text>

              <Text className="text-xs font-semibold text-slate-700 mb-1">Document Name *</Text>
              <TextInput
                placeholder="e.g. Science_Fair_Certificate"
                value={docName}
                onChangeText={setDocName}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Category</Text>
              <View className="flex-row gap-2 mb-4">
                {(['Academic', 'Identity', 'Medical', 'Transfer'] as const).map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => setDocCategory(cat)}
                    className={`flex-1 items-center py-2 rounded-xl border ${
                      docCategory === cat ? 'bg-[#3D5EE1] border-[#3D5EE1]' : 'border-slate-200'
                    }`}
                  >
                    <Text className={`text-[10px] font-bold ${docCategory === cat ? 'text-white' : 'text-slate-600'}`}>
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setShowUploadDocModal(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleUploadDocument}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-xs font-bold text-white">Save File</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL: NEW ADMISSION FORM */}
      <Modal visible={showNewAdmissionModal} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
            <View className="flex-row items-center justify-between pb-3 border-b border-slate-100">
              <Text className="text-base font-bold text-[#202C4B]">New Student Admission</Text>
              <Pressable onPress={() => setShowNewAdmissionModal(false)}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <ScrollView className="mt-3">
              <Text className="text-xs font-semibold text-slate-700 mb-1">Applicant Name *</Text>
              <TextInput
                placeholder="Student Full Name"
                value={admStudentName}
                onChangeText={setAdmStudentName}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Applying Grade</Text>
              <TextInput
                value={admGrade}
                onChangeText={setAdmGrade}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Guardian Name</Text>
              <TextInput
                placeholder="Parent / Guardian"
                value={admGuardian}
                onChangeText={setAdmGuardian}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-3"
              />

              <Text className="text-xs font-semibold text-slate-700 mb-1">Contact Mobile</Text>
              <TextInput
                placeholder="+1 (555) 000-0000"
                value={admPhone}
                onChangeText={setAdmPhone}
                className="rounded-xl border border-slate-200 px-3 py-2 text-xs text-[#202C4B] mb-4"
              />

              <View className="flex-row gap-2 mt-2">
                <Pressable
                  onPress={() => setShowNewAdmissionModal(false)}
                  className="flex-1 items-center rounded-xl border border-slate-200 py-3"
                >
                  <Text className="text-xs font-bold text-slate-600">Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSaveAdmission}
                  className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3"
                >
                  <Text className="text-xs font-bold text-white">Submit Application</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
