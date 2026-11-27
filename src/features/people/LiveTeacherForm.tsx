import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  useLocalSearchParams,
  useRouter,
  type Href,
} from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/ui/basics';
import {
  staffApi,
  type CreateTeacherInput,
  type CreatedTeacher,
} from '@/services/api/staffApi';
import {
  teacherMasterApi,
  type TeacherSubject,
} from '@/services/api/teacherMasterApi';

const fields = [
  ['employeeNo', 'Employee ID (optional)'],
  ['firstName', 'First name *'],
  ['lastName', 'Last name'],
  ['dob', 'Date of birth (YYYY-MM-DD)'],
  ['gender', 'Gender'],
  ['bloodGroup', 'Blood group'],
  ['phone', 'Mobile number'],
  ['email', 'Email address'],
  ['addressLine1', 'Address'],
  ['postalCode', 'Postal code'],
  ['qualification', 'Qualification'],
  ['experienceYears', 'Experience in years'],
  ['joinedOn', 'Joining date (YYYY-MM-DD) *'],
  ['maxPeriodsPerWeek', 'Maximum periods per week (1-35)'],
] as const;

const employmentOptions = [
  { value: 'full_time', label: 'Full time' },
  { value: 'part_time', label: 'Part time' },
  { value: 'contract', label: 'Contract' },
  { value: 'visiting', label: 'Visiting' },
] as const;

export function LiveTeacherForm({
  breadcrumb,
}: {
  breadcrumb: string;
}) {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user, role, canManage } = useAuth();

  const allowed = !!user && canManage && role === 'admin';

  const [values, setValues] = useState<Record<string, string>>({});
  const [employment, setEmployment] =
    useState<CreateTeacherInput['employmentType'] | ''>('');

  const [createLogin, setCreateLogin] = useState(true);
  const [subjects, setSubjects] = useState<TeacherSubject[]>([]);
  const [primary, setPrimary] = useState('');
  const [additional, setAdditional] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [reload, setReload] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [uncertain, setUncertain] = useState(false);
  const [created, setCreated] = useState<CreatedTeacher | null>(null);

  const busy = useRef(false);
  const currentUser = useRef(user);
  currentUser.current = user;

  useEffect(() => {
    let alive = true;

    setSubjects([]);
    setPrimary('');
    setAdditional([]);
    setLoadError('');

    if (!allowed || id) {
      setLoading(false);
      return;
    }

    setLoading(true);

    teacherMasterApi.fetchSubjects()
      .then(rows => {
        if (alive) setSubjects(rows);
      })
      .catch(() => {
        if (alive) {
          setLoadError('Unable to load school subjects.');
        }
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [allowed, user, id, reload]);

  const goToTeachers = () => {
    router.replace('/people/teachers' as Href);
  };

  const submit = async () => {
    if (
      busy.current ||
      saving ||
      created ||
      uncertain ||
      !allowed ||
      id ||
      loading ||
      loadError
    ) return;

    setError('');

    const read = (key: string) =>
      (values[key] ?? '').trim();

    if (!read('firstName')) {
      setError('First name is required.');
      return;
    }

    if (!employment) {
      setError('Select an employment type.');
      return;
    }

    if (!read('joinedOn')) {
      setError('Joining date is required.');
      return;
    }

    if (createLogin && !read('dob')) {
      setError('Date of birth is required for login creation.');
      return;
    }

    if (
      read('email') &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(read('email'))
    ) {
      setError('Enter a valid email address.');
      return;
    }

    const experience = read('experienceYears')
      ? Number(read('experienceYears'))
      : undefined;

    if (
      experience !== undefined &&
      (!Number.isFinite(experience) ||
        experience < 0 ||
        experience > 80)
    ) {
      setError('Experience must be between 0 and 80 years.');
      return;
    }

    const periods = read('maxPeriodsPerWeek')
      ? Number(read('maxPeriodsPerWeek'))
      : undefined;

    if (
      periods !== undefined &&
      (!Number.isInteger(periods) ||
        periods < 1 ||
        periods > 35)
    ) {
      setError('Maximum periods must be between 1 and 35.');
      return;
    }

    const validIds = new Set(subjects.map(s => s.id));

    if (
      (primary && !validIds.has(primary)) ||
      additional.some(s => !validIds.has(s))
    ) {
      setError('Refresh and select valid school subjects.');
      return;
    }

    const payload: CreateTeacherInput = {
      employeeNo: read('employeeNo') || undefined,
      firstName: read('firstName'),
      lastName: read('lastName') || undefined,
      dob: read('dob') || undefined,
      gender: read('gender') || undefined,
      bloodGroup: read('bloodGroup') || undefined,
      phone: read('phone') || undefined,
      email: read('email') || undefined,
      addressLine1: read('addressLine1') || undefined,
      postalCode: read('postalCode') || undefined,
      qualification: read('qualification') || undefined,
      joinedOn: read('joinedOn'),
      experienceYears: experience,
      employmentType: employment,
      primarySubjectId: primary || undefined,
      additionalSubjectIds: additional.filter(s => s !== primary),
      maxPeriodsPerWeek: periods,
      createLogin,
    };

    const submittingUser = user;

    busy.current = true;
    setSaving(true);

    try {
      const teacher = await staffApi.createTeacher(payload);

      if (currentUser.current !== submittingUser) {
        setUncertain(true);
        setError(
          'School session changed. Verify the teacher list.'
        );
        return;
      }

      setCreated(teacher);

    } catch (e) {
      const status = (e as { status?: number })?.status;

      const message = e instanceof Error
        ? e.message
        : 'Unable to create teacher.';

      if (
        status === 0 ||
        (typeof status === 'number' && status >= 500) ||
        message.includes('response could not be verified')
      ) {
        setUncertain(true);
        setError(
          'Creation result is uncertain. Check the teacher list before trying again.'
        );
      } else {
        setError(message);
      }

    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  if (!allowed) {
    return (
      <EmptyState
        icon="lock"
        title="No access"
        hint="Only administrators can create teachers."
      />
    );
  }

  if (id) {
    return (
      <EmptyState
        icon="lock"
        title="Teacher editing unavailable"
        hint="Use Teacher Management for employment status changes."
      />
    );
  }

  if (created) {
    return (
      <ScrollView className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
        <View className="m-4 rounded-2xl bg-white p-5 dark:bg-[#211D30]">
          <Text className="text-xl font-bold text-green-600">
            Teacher added successfully
          </Text>

          <Text className="mt-3 text-slate-800 dark:text-white">
            {created.fullName || created.firstName}
          </Text>

          <Text className="mt-2 text-slate-600 dark:text-slate-300">
            Employee ID: {created.employeeNo}
          </Text>

          {created.login ? (
            <View className="mt-4 rounded-xl bg-blue-50 p-4">
              <Text className="font-bold text-blue-900">
                Login account created
              </Text>

              <Text className="mt-2 text-blue-900">
                Username: {created.login.username}
              </Text>

              <Text className="mt-2 text-blue-900">
                Initial password: {created.login.password}
              </Text>

              <Text className="mt-2 text-blue-900">
                Password must be changed after first sign-in.
              </Text>
            </View>
          ) : (
            <Text className="mt-3 text-slate-600 dark:text-slate-300">
              No new login account was returned.
            </Text>
          )}

          <Pressable
            onPress={goToTeachers}
            className="mt-5 rounded-xl bg-blue-600 p-4"
          >
            <Text className="text-center font-bold text-white">
              View Teachers
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="p-4">
        <Text className="text-xs text-slate-400">
          {breadcrumb}
        </Text>

        <Text className="mb-4 mt-2 text-xl font-bold text-slate-900 dark:text-white">
          Add Teacher
        </Text>

        <View className="rounded-2xl bg-white p-4 dark:bg-[#211D30]">
          {fields.map(([key, label]) => (
            <View key={key} className="mb-4">
              <Text className="mb-2 font-semibold text-slate-700 dark:text-slate-200">
                {label}
              </Text>

              <TextInput
                editable={!saving && !uncertain}
                value={values[key] ?? ''}
                onChangeText={value => {
                  setValues(previous => ({
                    ...previous,
                    [key]: value,
                  }));
                  setError('');
                }}
                autoCapitalize={
                  key === 'email' ? 'none' : 'sentences'
                }
                keyboardType={
                  key === 'email'
                    ? 'email-address'
                    : key === 'phone'
                      ? 'phone-pad'
                      : key === 'experienceYears' ||
                        key === 'maxPeriodsPerWeek'
                        ? 'decimal-pad'
                        : 'default'
                }
                className="rounded-xl border border-slate-200 p-3 text-slate-900 dark:border-slate-600 dark:text-white"
              />
            </View>
          ))}

          <Text className="mb-3 font-bold text-slate-800 dark:text-white">
            Employment type *
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {employmentOptions.map(option => (
              <Pressable
                key={option.value}
                disabled={saving || uncertain}
                onPress={() => setEmployment(option.value)}
                className={`rounded-xl border p-3 ${
                  employment === option.value
                    ? 'border-blue-600 bg-blue-100'
                    : 'border-slate-300'
                }`}
              >
                <Text className={
                  employment === option.value
                    ? 'text-blue-800'
                    : 'text-slate-700 dark:text-slate-200'
                }>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4 dark:bg-[#211D30]">
          <Text className="mb-3 font-bold text-slate-800 dark:text-white">
            Teaching subjects
          </Text>

          {loading ? <ActivityIndicator /> : null}

          {loadError ? (
            <View>
              <Text className="text-red-600">{loadError}</Text>

              <Pressable
                onPress={() => setReload(v => v + 1)}
                className="mt-3 rounded-xl bg-blue-600 p-3"
              >
                <Text className="text-center text-white">
                  Retry
                </Text>
              </Pressable>
            </View>
          ) : null}

          {!loading && !loadError && !subjects.length ? (
            <Text className="text-slate-500">
              No active subjects available.
            </Text>
          ) : null}

          {subjects.length > 0 ? (
            <>
              <Text className="mb-2 font-semibold text-slate-700 dark:text-white">
                Primary subject (optional)
              </Text>

              <Pressable
                disabled={saving || uncertain}
                onPress={() => setPrimary('')}
                className="mb-2 rounded-lg border border-slate-300 p-3"
              >
                <Text className="text-slate-700 dark:text-white">
                  {!primary ? '[Selected] ' : ''}None
                </Text>
              </Pressable>

              {subjects.map(subject => (
                <Pressable
                  key={subject.id}
                  disabled={saving || uncertain}
                  onPress={() => {
                    setPrimary(subject.id);
                    setAdditional(previous =>
                      previous.filter(s => s !== subject.id)
                    );
                  }}
                  className={`mb-2 rounded-lg border p-3 ${
                    primary === subject.id
                      ? 'border-blue-600 bg-blue-100'
                      : 'border-slate-300'
                  }`}
                >
                  <Text className={
                    primary === subject.id
                      ? 'text-blue-800'
                      : 'text-slate-700 dark:text-white'
                  }>
                    {subject.name} ({subject.code})
                  </Text>
                </Pressable>
              ))}

              <Text className="mb-2 mt-4 font-semibold text-slate-700 dark:text-white">
                Additional subjects
              </Text>

              {subjects.filter(s => s.id !== primary).map(subject => (
                <Pressable
                  key={subject.id}
                  disabled={saving || uncertain}
                  onPress={() => setAdditional(previous =>
                    previous.includes(subject.id)
                      ? previous.filter(s => s !== subject.id)
                      : [...previous, subject.id]
                  )}
                  className="mb-2 rounded-lg border border-slate-300 p-3"
                >
                  <Text className="text-slate-700 dark:text-white">
                    {additional.includes(subject.id) ? '[x] ' : '[ ] '}
                    {subject.name}
                  </Text>
                </Pressable>
              ))}
            </>
          ) : null}
        </View>

        <View className="mt-4 rounded-2xl bg-white p-4 dark:bg-[#211D30]">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 font-bold text-slate-800 dark:text-white">
              Create teacher login
            </Text>

            <Switch
              disabled={saving || uncertain}
              value={createLogin}
              onValueChange={setCreateLogin}
            />
          </View>

          <Text className="mt-2 text-xs text-slate-500">
            The initial password is the date of birth in DD-MM-YYYY format.
          </Text>
        </View>

        <Text className="mt-4 text-xs text-slate-500">
          Department, designation, payroll, documents and class
          assignments are not included in this creation form yet.
        </Text>

        {error ? (
          <Text className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">
            {error}
          </Text>
        ) : null}

        <Pressable
          disabled={saving || loading || !!loadError || uncertain}
          onPress={submit}
          className={`mt-4 rounded-xl p-4 ${
            saving || loading || loadError || uncertain
              ? 'bg-slate-400'
              : 'bg-blue-600'
          }`}
        >
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="text-center font-bold text-white">
              Add Teacher
            </Text>
          )}
        </Pressable>

        <Pressable
          disabled={saving}
          onPress={goToTeachers}
          className="mt-3 rounded-xl border border-slate-300 p-4"
        >
          <Text className="text-center font-semibold text-slate-700 dark:text-white">
            {uncertain ? 'Check Teacher List' : 'Cancel'}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}