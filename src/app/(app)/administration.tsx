import React, { useMemo, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import TabNavigation from '@/components/common/TabNavigation';
import SearchBar from '@/components/common/SearchBar';
import StatusBadge from '@/components/common/StatusBadge';
import {
  INITIAL_AUDIT_LOGS,
  INITIAL_BRANCHES,
  INITIAL_ROLES,
  INITIAL_SCHOOL_SETTING,
} from '@/data/administrationMock';
import type {
  AuditLogItem,
  BranchItem,
  RolePermissionItem,
  SchoolSetting,
} from '@/types/modules';

type AdminTab = 'roles' | 'branches' | 'profile' | 'sessions' | 'audit' | 'system';

interface AcademicSession {
  id: string;
  yearName: string;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Upcoming' | 'Archived';
}

const INITIAL_SESSIONS: AcademicSession[] = [
  {
    id: 'ay-1',
    yearName: 'AY 2026-27',
    startDate: '01 Aug 2026',
    endDate: '30 Jun 2027',
    status: 'Active',
  },
  {
    id: 'ay-2',
    yearName: 'AY 2027-28',
    startDate: '01 Aug 2027',
    endDate: '30 Jun 2028',
    status: 'Upcoming',
  },
  {
    id: 'ay-3',
    yearName: 'AY 2025-26',
    startDate: '01 Aug 2025',
    endDate: '30 Jun 2026',
    status: 'Archived',
  },
];

export default function AdministrationScreen() {
  const [activeTab, setActiveTab] = useState<AdminTab>('roles');
  const [searchQuery, setSearchQuery] = useState('');

  // Local state
  const [roles, setRoles] = useState<RolePermissionItem[]>(INITIAL_ROLES);
  const [branches] = useState<BranchItem[]>(INITIAL_BRANCHES);
  const [schoolSetting, setSchoolSetting] = useState<SchoolSetting>(INITIAL_SCHOOL_SETTING);
  const [sessions, setSessions] = useState<AcademicSession[]>(INITIAL_SESSIONS);
  const [auditLogs] = useState<AuditLogItem[]>(INITIAL_AUDIT_LOGS);

  // System settings state
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailAlertsEnabled, setEmailAlertsEnabled] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  // Form states for school settings
  const [schoolName, setSchoolName] = useState(schoolSetting.schoolName);
  const [schoolCode, setSchoolCode] = useState(schoolSetting.schoolCode);
  const [schoolEmail, setSchoolEmail] = useState(schoolSetting.email);
  const [schoolPhone, setSchoolPhone] = useState(schoolSetting.phone);
  const [schoolAddress, setSchoolAddress] = useState(schoolSetting.address);
  const [currency, setCurrency] = useState(schoolSetting.currency);
  const [timezone, setTimezone] = useState(schoolSetting.timezone);

  // Add Session Modal
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [newYearName, setNewYearName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  const tabs = useMemo(
    () => [
      { id: 'roles', label: 'Roles & Permissions', badge: roles.length },
      { id: 'branches', label: 'Campuses', badge: branches.length },
      { id: 'profile', label: 'School Profile' },
      { id: 'sessions', label: 'Academic Years', badge: sessions.length },
      { id: 'audit', label: 'Audit Logs', badge: auditLogs.length },
      { id: 'system', label: 'System Settings' },
    ],
    [roles.length, branches.length, sessions.length, auditLogs.length]
  );

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (r) =>
        r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  const filteredBranches = useMemo(() => {
    return branches.filter(
      (b) =>
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.campusCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.principal.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [branches, searchQuery]);

  const filteredLogs = useMemo(() => {
    return auditLogs.filter(
      (l) =>
        l.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.module.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [auditLogs, searchQuery]);

  // Toggle permission matrix
  const handleTogglePermission = (
    roleId: string,
    moduleKey: 'students' | 'academics' | 'finance' | 'staff',
    permKey: 'view' | 'create' | 'edit' | 'delete'
  ) => {
    setRoles(
      roles.map((r) => {
        if (r.id !== roleId) return r;
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [moduleKey]: {
              ...r.permissions[moduleKey],
              [permKey]: !r.permissions[moduleKey][permKey],
            },
          },
        };
      })
    );
  };

  const handleSaveProfile = () => {
    setSchoolSetting({
      schoolName,
      schoolCode,
      email: schoolEmail,
      phone: schoolPhone,
      address: schoolAddress,
      currency,
      timezone,
      currentAcademicYear: schoolSetting.currentAcademicYear,
    });
    Alert.alert('Settings Updated', 'School profile updated successfully.');
  };

  const handleSetActiveSession = (id: string) => {
    setSessions(
      sessions.map((s) => ({
        ...s,
        status: s.id === id ? 'Active' : s.status === 'Active' ? 'Archived' : s.status,
      }))
    );
    Alert.alert('Session Switched', 'Default academic year updated.');
  };

  const handleAddSession = () => {
    if (!newYearName.trim()) {
      Alert.alert('Required Field', 'Please enter year name (e.g. AY 2028-29).');
      return;
    }

    const newSess: AcademicSession = {
      id: `ay-${Date.now()}`,
      yearName: newYearName,
      startDate: newStartDate || '01 Aug',
      endDate: newEndDate || '30 Jun',
      status: 'Upcoming',
    };

    setSessions([...sessions, newSess]);
    Alert.alert('Session Created', `${newYearName} added to academic cycles.`);
    setNewYearName('');
    setNewStartDate('');
    setNewEndDate('');
    setShowAddSessionModal(false);
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Tab Navigation */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={(tabId) => {
          setActiveTab(tabId as AdminTab);
          setSearchQuery('');
        }}
      />

      {/* Action Header & Search */}
      <View className="bg-white px-4 pt-3 pb-3 border-b border-slate-200">
        <View className="flex-row items-center justify-between mb-2.5">
          <View>
            <Text className="text-base font-bold text-slate-900">
              Administration & Governance
            </Text>
            <Text className="text-xs text-slate-500">
              Security permissions, campus branches, academic years & logs
            </Text>
          </View>

          {activeTab === 'sessions' && (
            <Pressable
              onPress={() => setShowAddSessionModal(true)}
              className="flex-row items-center rounded-xl bg-[#3D5EE1] px-3 py-2 shadow-sm shadow-[#3D5EE1]/30"
            >
              <Feather name="plus" size={15} color="#ffffff" />
              <Text className="ml-1 text-xs font-bold text-white">Add Year</Text>
            </Pressable>
          )}
        </View>

        {(activeTab === 'roles' || activeTab === 'branches' || activeTab === 'audit') && (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={`Search ${activeTab}…`}
          />
        )}
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-14"
      >
        {/* ROLES & PERMISSIONS */}
        {activeTab === 'roles' && (
          <View className="gap-y-4">
            {filteredRoles.map((role) => (
              <View
                key={role.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <Text className="text-base font-bold text-slate-900">{role.role}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                      {role.description}
                    </Text>
                  </View>
                  <View className="rounded-lg bg-blue-50 px-2.5 py-1 border border-blue-200">
                    <Text className="text-xs font-bold text-[#3D5EE1]">{role.usersCount} Users</Text>
                  </View>
                </View>

                {/* Permission Matrix */}
                <View className="mt-4 rounded-xl bg-slate-50 p-3">
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Module Access Matrix
                  </Text>

                  {(['students', 'academics', 'finance', 'staff'] as const).map((module) => (
                    <View
                      key={module}
                      className="flex-row items-center justify-between border-b border-slate-200/60 py-2 last:border-b-0"
                    >
                      <Text className="text-xs font-semibold capitalize text-slate-800 flex-1">
                        {module}
                      </Text>

                      <View className="flex-row items-center gap-x-3">
                        {(['view', 'create', 'edit', 'delete'] as const).map((perm) => {
                          const isAllowed = role.permissions[module][perm];
                          return (
                            <Pressable
                              key={perm}
                              onPress={() => handleTogglePermission(role.id, module, perm)}
                              className="items-center"
                            >
                              <Text className="text-[9px] uppercase font-bold text-slate-400 mb-0.5">
                                {perm}
                              </Text>
                              <View
                                className={`h-4 w-4 items-center justify-center rounded border ${
                                  isAllowed
                                    ? 'bg-[#3D5EE1] border-[#3D5EE1]'
                                    : 'bg-white border-slate-300'
                                }`}
                              >
                                {isAllowed ? <Feather name="check" size={10} color="#ffffff" /> : null}
                              </View>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* MULTI-SCHOOL CAMPUSES */}
        {activeTab === 'branches' && (
          <View className="gap-y-3">
            {filteredBranches.map((branch) => (
              <View
                key={branch.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-blue-50 px-2 py-0.5 border border-blue-200">
                        <Text className="text-[10px] font-bold text-[#3D5EE1]">{branch.campusCode}</Text>
                      </View>
                      {branch.isMain && (
                        <View className="rounded-md bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                          <Text className="text-[10px] font-bold text-emerald-700">HQ Campus</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-base font-bold text-slate-900">{branch.name}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">{branch.address}</Text>
                  </View>
                </View>

                <View className="mt-3 flex-row items-center justify-between rounded-xl bg-slate-50 p-2.5">
                  <Text className="text-xs text-slate-600">
                    Principal: <Text className="font-bold text-slate-800">{branch.principal}</Text>
                  </Text>
                  <Text className="text-xs font-bold text-[#3D5EE1]">{branch.totalStudents} Students</Text>
                </View>

                <View className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-2.5">
                  <Text className="text-[11px] text-slate-400">{branch.phone}</Text>
                  <Pressable
                    onPress={() =>
                      Alert.alert(
                        'Campus Switched',
                        `Active management workspace shifted to ${branch.name}.`
                      )
                    }
                    className="rounded-lg bg-slate-100 px-3 py-1.5"
                  >
                    <Text className="text-xs font-bold text-[#3D5EE1]">Manage Campus</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SCHOOL PROFILE */}
        {activeTab === 'profile' && (
          <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5">
            <Text className="text-base font-bold text-slate-900 mb-1">
              General Organization Profile
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Institutional identity and branding parameters
            </Text>

            <View className="gap-y-3.5">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Institution Name</Text>
                <TextInput
                  value={schoolName}
                  onChangeText={setSchoolName}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">School Code / Affiliation</Text>
                <TextInput
                  value={schoolCode}
                  onChangeText={setSchoolCode}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View className="flex-row gap-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Official Email</Text>
                  <TextInput
                    value={schoolEmail}
                    onChangeText={setSchoolEmail}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Phone Number</Text>
                  <TextInput
                    value={schoolPhone}
                    onChangeText={setSchoolPhone}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Campus Physical Address</Text>
                <TextInput
                  value={schoolAddress}
                  onChangeText={setSchoolAddress}
                  multiline
                  numberOfLines={2}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View className="flex-row gap-x-3">
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Operating Currency</Text>
                  <TextInput
                    value={currency}
                    onChangeText={setCurrency}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Standard Timezone</Text>
                  <TextInput
                    value={timezone}
                    onChangeText={setTimezone}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
              </View>
            </View>

            <Pressable
              onPress={handleSaveProfile}
              className="mt-6 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
            >
              <Text className="text-sm font-bold text-white">Save Changes</Text>
            </Pressable>
          </View>
        )}

        {/* ACADEMIC SESSIONS */}
        {activeTab === 'sessions' && (
          <View className="gap-y-3">
            {sessions.map((sess) => (
              <View
                key={sess.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-base font-bold text-slate-900">{sess.yearName}</Text>
                    <Text className="text-xs text-slate-500">
                      {sess.startDate} → {sess.endDate}
                    </Text>
                  </View>
                  <StatusBadge status={sess.status} />
                </View>

                {sess.status !== 'Active' && (
                  <View className="mt-3 flex-row justify-end border-t border-slate-100 pt-2.5">
                    <Pressable
                      onPress={() => handleSetActiveSession(sess.id)}
                      className="rounded-lg bg-slate-100 px-3 py-1.5"
                    >
                      <Text className="text-xs font-semibold text-[#3D5EE1]">Set Active Term</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* AUDIT LOGS */}
        {activeTab === 'audit' && (
          <View className="gap-y-3">
            {filteredLogs.map((log) => (
              <View
                key={log.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-2">
                    <View className="flex-row items-center gap-1.5 mb-1">
                      <View className="rounded-md bg-slate-100 px-2 py-0.5">
                        <Text className="text-[10px] font-bold text-slate-700">{log.module}</Text>
                      </View>
                      <StatusBadge status={log.status} />
                    </View>
                    <Text className="text-sm font-bold text-slate-900">{log.action}</Text>
                    <Text className="text-xs text-slate-500 mt-0.5">By {log.user}</Text>
                  </View>
                  <Text className="text-[11px] text-slate-400">{log.timestamp}</Text>
                </View>

                <View className="mt-2.5 flex-row items-center justify-between border-t border-slate-100 pt-2">
                  <Text className="text-[10px] font-mono text-slate-400">IP: {log.ipAddress}</Text>
                  <Text className="text-[10px] text-emerald-600 font-semibold">Verified Audit Trail</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* SYSTEM & APP SETTINGS */}
        {activeTab === 'system' && (
          <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5">
            <Text className="text-base font-bold text-slate-900 mb-1">
              Mobile Application Settings
            </Text>
            <Text className="text-xs text-slate-500 mb-4">
              Push notification preferences, maintenance mode & security policies
            </Text>

            <View className="gap-y-4">
              <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-sm font-bold text-slate-900">Push Notifications</Text>
                  <Text className="text-xs text-slate-500">Send attendance and fee alerts to phones</Text>
                </View>
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: '#cbd5e1', true: '#3D5EE1' }}
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-sm font-bold text-slate-900">Email Alerts & Circulars</Text>
                  <Text className="text-xs text-slate-500">Disseminate official circulars to parents</Text>
                </View>
                <Switch
                  value={emailAlertsEnabled}
                  onValueChange={setEmailAlertsEnabled}
                  trackColor={{ false: '#cbd5e1', true: '#3D5EE1' }}
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-sm font-bold text-slate-900">Two-Factor Authentication</Text>
                  <Text className="text-xs text-slate-500">Enforce OTP login for staff accounts</Text>
                </View>
                <Switch
                  value={twoFactorAuth}
                  onValueChange={setTwoFactorAuth}
                  trackColor={{ false: '#cbd5e1', true: '#3D5EE1' }}
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-slate-100">
                <View className="flex-1 pr-4">
                  <Text className="text-sm font-bold text-slate-900">System Maintenance Mode</Text>
                  <Text className="text-xs text-slate-500">Temporarily restrict portal access for upgrades</Text>
                </View>
                <Switch
                  value={maintenanceMode}
                  onValueChange={setMaintenanceMode}
                  trackColor={{ false: '#cbd5e1', true: '#DC2626' }}
                />
              </View>

              <Pressable
                onPress={() =>
                  Alert.alert('Backup Created', 'Local database snapshot stored in encrypted archive.')
                }
                className="mt-2 flex-row items-center justify-center rounded-xl bg-slate-100 py-3"
              >
                <Feather name="database" size={15} color="#3D5EE1" />
                <Text className="ml-2 text-xs font-bold text-[#3D5EE1]">Create System Backup</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Add Academic Year Modal */}
      <Modal
        visible={showAddSessionModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSessionModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="rounded-t-3xl bg-white p-5 pb-8">
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <Text className="text-base font-bold text-slate-900">New Academic Year</Text>
              <Pressable onPress={() => setShowAddSessionModal(false)} hitSlop={10}>
                <Feather name="x" size={20} color="#64748b" />
              </Pressable>
            </View>

            <View className="mt-4 gap-y-3">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Session Code *</Text>
                <TextInput
                  value={newYearName}
                  onChangeText={setNewYearName}
                  placeholder="e.g. AY 2028-29"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Start Date</Text>
                <TextInput
                  value={newStartDate}
                  onChangeText={setNewStartDate}
                  placeholder="e.g. 01 Aug 2028"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">End Date</Text>
                <TextInput
                  value={newEndDate}
                  onChangeText={setNewEndDate}
                  placeholder="e.g. 30 Jun 2029"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>
            </View>

            <View className="mt-6 flex-row gap-x-3">
              <Pressable
                onPress={() => setShowAddSessionModal(false)}
                className="flex-1 items-center rounded-xl bg-slate-100 py-3"
              >
                <Text className="text-sm font-semibold text-slate-700">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddSession}
                className="flex-1 items-center rounded-xl bg-[#3D5EE1] py-3 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Session</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
