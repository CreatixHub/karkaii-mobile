import React, { useMemo, useState } from 'react';
import {
  Alert,
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
import {
  INITIAL_ROLES,
  INITIAL_SCHOOL_SETTING,
} from '@/data/administrationMock';
import type {
  RolePermissionItem,
  SchoolSetting,
} from '@/types/modules';

type AdminTab = 'roles' | 'profile' | 'sessions';

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

  // Local state for permissions
  const [roles, setRoles] = useState<RolePermissionItem[]>(INITIAL_ROLES);
  const [schoolSetting, setSchoolSetting] = useState<SchoolSetting>(INITIAL_SCHOOL_SETTING);
  const [sessions, setSessions] = useState<AcademicSession[]>(INITIAL_SESSIONS);

  // Form states for school settings
  const [schoolName, setSchoolName] = useState(schoolSetting.schoolName);
  const [schoolCode, setSchoolCode] = useState(schoolSetting.schoolCode);
  const [schoolEmail, setSchoolEmail] = useState(schoolSetting.email);
  const [schoolPhone, setSchoolPhone] = useState(schoolSetting.phone);
  const [schoolAddress, setSchoolAddress] = useState(schoolSetting.address);
  const [currency, setCurrency] = useState(schoolSetting.currency);
  const [timezone, setTimezone] = useState(schoolSetting.timezone);

  const tabs = useMemo(
    () => [
      { id: 'roles', label: 'Roles & Permissions', badge: roles.length },
      { id: 'profile', label: 'School Profile' },
      { id: 'sessions', label: 'Academic Years', badge: sessions.length },
    ],
    [roles.length, sessions.length]
  );

  const filteredRoles = useMemo(() => {
    return roles.filter(
      (r) =>
        r.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [roles, searchQuery]);

  // Toggle permission matrix
  const handleTogglePermission = (
    roleId: string,
    moduleKey: 'students' | 'academics' | 'finance' | 'staff',
    permKey: 'view' | 'create' | 'edit' | 'delete'
  ) => {
    setRoles(
      roles.map((r) => {
        if (r.id !== roleId) return r;
        const currentVal = r.permissions[moduleKey][permKey];
        return {
          ...r,
          permissions: {
            ...r.permissions,
            [moduleKey]: {
              ...r.permissions[moduleKey],
              [permKey]: !currentVal,
            },
          },
        };
      })
    );
  };

  // Save Settings
  const handleSaveSettings = () => {
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
    Alert.alert('Settings Updated', 'School configuration has been saved successfully.');
  };

  // Switch Active Academic Year
  const handleSelectActiveSession = (id: string) => {
    setSessions(
      sessions.map((s) => ({
        ...s,
        status: s.id === id ? 'Active' : s.status === 'Active' ? 'Archived' : s.status,
      }))
    );
    const chosen = sessions.find((s) => s.id === id);
    if (chosen) {
      setSchoolSetting({
        ...schoolSetting,
        currentAcademicYear: chosen.yearName,
      });
      Alert.alert('Academic Year Switched', `Default session is now ${chosen.yearName}.`);
    }
  };

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      {/* Submodule Tab Bar */}
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
            <Text className="text-base font-bold text-slate-900 capitalize">
              Administration & Settings
            </Text>
            <Text className="text-xs text-slate-500">
              RBAC access control, institutional branding & academic periods
            </Text>
          </View>
        </View>

        {activeTab === 'roles' && (
          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search roles…"
          />
        )}
      </View>

      {/* Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerClassName="p-4 pb-12"
      >
        {/* ROLES & PERMISSIONS TAB */}
        {activeTab === 'roles' && (
          <View className="gap-y-4">
            {filteredRoles.map((r) => (
              <View
                key={r.id}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm shadow-black/5"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-slate-900">{r.role}</Text>
                    <Text className="text-xs text-slate-500">{r.description}</Text>
                  </View>
                  <View className="rounded-xl bg-[#3D5EE1]/10 px-2.5 py-1">
                    <Text className="text-xs font-bold text-[#3D5EE1]">
                      {r.usersCount} Users
                    </Text>
                  </View>
                </View>

                {/* Permissions Matrix */}
                <View className="mt-3 rounded-xl bg-slate-50 p-3">
                  <Text className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    Module Access Matrix
                  </Text>

                  {(['students', 'academics', 'finance', 'staff'] as const).map((mod) => (
                    <View
                      key={mod}
                      className="border-t border-slate-200/60 pt-2 pb-2"
                    >
                      <Text className="text-xs font-bold text-slate-700 capitalize mb-1.5">
                        {mod === 'students' ? 'Students & Admissions' : mod}
                      </Text>
                      <View className="flex-row items-center justify-between">
                        {(['view', 'create', 'edit', 'delete'] as const).map((action) => {
                          const isAllowed = r.permissions[mod][action];
                          return (
                            <Pressable
                              key={action}
                              onPress={() => handleTogglePermission(r.id, mod, action)}
                              className={`flex-row items-center rounded-lg px-2 py-1 border ${
                                isAllowed
                                  ? 'bg-emerald-50 border-emerald-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <Feather
                                name={isAllowed ? 'check' : 'x'}
                                size={11}
                                color={isAllowed ? '#059669' : '#94a3b8'}
                              />
                              <Text
                                className={`ml-1 text-[10px] font-semibold capitalize ${
                                  isAllowed ? 'text-emerald-700' : 'text-slate-400'
                                }`}
                              >
                                {action}
                              </Text>
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

        {/* SCHOOL PROFILE TAB */}
        {activeTab === 'profile' && (
          <View className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-black/5">
            <Text className="text-base font-bold text-slate-900 mb-4">
              Institution Details
            </Text>

            <View className="gap-y-3.5">
              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">School Name</Text>
                <TextInput
                  value={schoolName}
                  onChangeText={setSchoolName}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Institution Code</Text>
                <TextInput
                  value={schoolCode}
                  onChangeText={setSchoolCode}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Official Email</Text>
                <TextInput
                  value={schoolEmail}
                  onChangeText={setSchoolEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Contact Phone</Text>
                <TextInput
                  value={schoolPhone}
                  onChangeText={setSchoolPhone}
                  keyboardType="phone-pad"
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                />
              </View>

              <View>
                <Text className="text-xs font-semibold text-slate-700 mb-1">Campus Address</Text>
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
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Currency</Text>
                  <TextInput
                    value={currency}
                    onChangeText={setCurrency}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-semibold text-slate-700 mb-1">Timezone</Text>
                  <TextInput
                    value={timezone}
                    onChangeText={setTimezone}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm text-slate-900"
                  />
                </View>
              </View>

              <Pressable
                onPress={handleSaveSettings}
                className="mt-3 items-center rounded-xl bg-[#3D5EE1] py-3.5 shadow-md shadow-[#3D5EE1]/30"
              >
                <Text className="text-sm font-bold text-white">Save Changes</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* ACADEMIC YEARS TAB */}
        {activeTab === 'sessions' && (
          <View className="gap-y-3">
            {sessions.map((sess) => {
              const isActive = sess.status === 'Active';
              return (
                <View
                  key={sess.id}
                  className={`rounded-2xl border bg-white p-4 shadow-sm shadow-black/5 ${
                    isActive ? 'border-[#3D5EE1] bg-blue-50/20' : 'border-slate-200'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-base font-bold text-slate-900">
                          {sess.yearName}
                        </Text>
                        {isActive && (
                          <View className="ml-2 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-200">
                            <Text className="text-[10px] font-bold text-emerald-700">
                              Current Default
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-slate-500 mt-0.5">
                        {sess.startDate} → {sess.endDate}
                      </Text>
                    </View>

                    <Switch
                      value={isActive}
                      onValueChange={() => handleSelectActiveSession(sess.id)}
                      trackColor={{ false: '#cbd5e1', true: '#3D5EE1' }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
