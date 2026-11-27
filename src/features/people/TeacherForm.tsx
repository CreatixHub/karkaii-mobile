import { staffApi, type CreateTeacherInput } from '@/services/api/staffApi';
import { API_URL } from '@/config/env';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { teacherMasterApi, type TeacherSubject } from '@/services/api/teacherMasterApi';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCollection } from '@/core/store/useCollection';
import type { TeacherRecord } from '@/data/seed/master';
import { useAuth } from '@/hooks/useAuth';
import { FormFields, validateFields } from '@/features/engine/FormSheet';
import type { FormValues } from '@/features/engine/types';
import { Button, Card, EmptyState } from '@/ui/basics';
import { useToast } from '@/ui/Toast';
import { TEACHER_SECTIONS, teacherToValues } from './teacherLogic';

/** Add or edit a teacher: the source's nine form cards as collapsible sections. */
export function TeacherForm({ breadcrumb }: { breadcrumb: string }) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const teachers = useCollection<TeacherRecord>('teachers');
  const { user, canManage, role } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const existing = typeof id === 'string' ? teachers.find((t) => t.id === id) : undefined;
  const allowed = canManage && role !== 'student' && role !== 'parent';

  const [values, setValues] = useState<FormValues>(() => {
    const initial = teacherToValues(existing);

    if (!existing) {
      for (const key of [
        'employeeId', 'department', 'designation', 'campus',
        'basicSalary', 'contractType', 'workShift', 'workLocation',
        'dateOfLeaving', 'medicalLeaves', 'casualLeaves',
        'sickLeaves', 'maternityLeaves', 'motherName',
        'previousSchool', 'previousSchoolAddress',
        'previousSchoolPhone', 'notes', 'route',
        'vehicleNumber', 'pickupPoint', 'hostel', 'roomNo',
        'resume', 'joiningLetter'
      ]) {
        initial[key] = '';
      }
      initial.languages = [];
    }

    return initial;
  });

  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const submissionLocked = useRef(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ personal: true });

  // The login switch only applies to a new teacher (existing ones get theirs from the roster action).
  const [liveSubjects, setLiveSubjects] = useState<TeacherSubject[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState('');

  useEffect(() => {
    let active = true;

    setLiveSubjects([]);
    setSubjectsError('');

    if (!allowed || !user || id) {
      setSubjectsLoading(false);
      return;
    }

    setSubjectsLoading(true);
    setValues(cur => ({ ...cur, subjects: [] }));

    teacherMasterApi.fetchSubjects()
      .then(rows => {
        if (active) setLiveSubjects(rows);
      })
      .catch(() => {
        if (active) {
          setSubjectsError('Unable to load school subjects. Reopen the form to retry.');
        }
      })
      .finally(() => {
        if (active) setSubjectsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [allowed, user, id]);

  const sections = useMemo(() => {
    if (existing) {
      return TEACHER_SECTIONS.filter(s => s.key !== 'login');
    }

    return TEACHER_SECTIONS.map(section => ({
      ...section,
      fields: section.fields.map(field => {
        const unavailable = [
          'department', 'designation', 'campus',
          'basicSalary', 'workShift', 'workLocation',
          'dateOfLeaving', 'medicalLeaves', 'casualLeaves',
          'sickLeaves', 'maternityLeaves', 'motherName',
          'languages', 'previousSchool', 'previousSchoolAddress',
          'previousSchoolPhone', 'notes', 'route',
          'vehicleNumber', 'pickupPoint', 'hostel', 'roomNo',
          'resume', 'joiningLetter'
        ];

        if (unavailable.includes(field.key)) {
          return {
            ...field,
            required: false,
            options: [],
            readOnly: () => true,
            hint: 'Backend integration pending. Not saved.',
          };
        }

        if (field.key === 'employeeId') {
          return {
            ...field,
            required: false,
            hint: 'Leave blank to generate automatically',
          };
        }

        if (field.key === 'contractType') {
          return {
            ...field,
            label: 'Employment Type',
            required: true,
            options: [
              { label: 'Full Time', value: 'full_time' },
              { label: 'Part Time', value: 'part_time' },
              { label: 'Contract', value: 'contract' },
              { label: 'Visiting', value: 'visiting' },
            ],
          };
        }

        if (field.key === 'status') {
          return {
            ...field,
            options: ['Active'],
            readOnly: () => true,
          };
        }

        if (field.key === 'createLogin') {
          return {
            ...field,
            label: 'Create a login account',
            hint: 'Creates a real teacher account. Password must be changed on first sign-in.',
          };
        }

        if (field.key === 'panId') {
          return { ...field, label: 'PAN Number' };
        }

        if (field.key !== 'subjects') return field;

        return {
          ...field,
          options: liveSubjects.map(subject => ({
            label: `${subject.name} (${subject.code})`,
            value: subject.id,
          })),
          hint: subjectsLoading
            ? 'Loading school subjects...'
            : subjectsError ||
              (liveSubjects.length
                ? field.hint
                : 'No active school subjects available.'),
        };
      }),
    }));
  }, [existing, liveSubjects, subjectsLoading, subjectsError]);
  const errorCount = useMemo(() => Object.fromEntries(sections.map((s) => [s.key, s.fields.filter((f) => errors[f.key]).length])), [errors, sections]);

  if (!allowed) return <EmptyState icon="lock" title="No access" hint="Your role can view teachers but not add or edit them." />;
  if (typeof id === 'string' && !existing) return <EmptyState icon="user-x" title="Teacher not found" hint="This teacher may have been deleted." />;

  const set = (key: string, value: any) => {
    if (savingRef.current || submissionLocked.current) return;
    setValues((cur) => ({ ...cur, [key]: value }));
    setErrors((cur) => {
      if (!cur[key]) return cur;
      const { [key]: _drop, ...rest } = cur;
      return rest;
    });
  };

  const submit = async () => {
    if (savingRef.current || submissionLocked.current) return;

    if (!user || !canManage || role !== 'admin' || id) {
      toast('Live teacher creation requires an administrator. Editing is not integrated yet.', 'error');
      return;
    }

    if (subjectsLoading || subjectsError) {
      toast('School subjects must be loaded before saving.', 'error');
      return;
    }

    const str = (key: string) => String(values[key] ?? '').trim();
    const fields = sections.flatMap(section => section.fields);
    const found = validateFields(fields, values);

    const subjectIds: string[] = Array.isArray(values.subjects)
      ? [...new Set<string>(values.subjects.map(String))]
      : [];

    if (!subjectIds.length || subjectIds.some(
      subjectId => !liveSubjects.some(subject => subject.id === subjectId)
    )) {
      found.subjects = 'Select valid school subjects';
    }

    const employmentType = str('contractType') as CreateTeacherInput['employmentType'];

    if (!['full_time', 'part_time', 'contract', 'visiting'].includes(employmentType)) {
      found.contractType = 'Select an employment type';
    }

    if (str('status') !== 'Active') {
      found.status = 'Create as Active, then manage employment status';
    }

    const validDate = (value: string) => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(`${value}T00:00:00Z`);
      return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
    };

    const today = new Date().toISOString().slice(0, 10);

    if (!validDate(str('dob')) || str('dob') >= today) {
      found.dob = 'Enter a valid date of birth';
    }

    if (!validDate(str('joinedOn')) || str('joinedOn') > today) {
      found.joinedOn = 'Enter a valid joining date';
    }

    const experience = Number(str('experienceYears') || 0);

    if (!Number.isFinite(experience) || experience < 0 || experience > 50) {
      found.experienceYears = 'Enter experience from 0 to 50';
    }

    const socialLinks: Record<string, string> = {};

    for (const key of ['facebook', 'instagram', 'linkedin', 'youtube', 'twitter']) {
      const value = str(key);
      if (!value) continue;

      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
        socialLinks[key] = value;
      } catch {
        found[key] = 'Enter a complete website URL';
      }
    }

    const secureFields = [
      'panId', 'epfNo', 'accountName', 'accountNumber',
      'bankName', 'ifscCode', 'branchName'
    ];

    if (!API_URL.startsWith('https://')) {
      for (const key of secureFields) {
        if (str(key)) found[key] = 'HTTPS is required for this information';
      }
    }

    if (str('ifscCode') && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(str('ifscCode').toUpperCase())) {
      found.ifscCode = 'Enter a valid IFSC code';
    }

    if (str('accountNumber') && !/^\d{6,20}$/.test(str('accountNumber'))) {
      found.accountNumber = 'Enter 6 to 20 digits';
    }

    setErrors(found);

    if (Object.keys(found).length) {
      setOpen(cur => ({
        ...cur,
        ...Object.fromEntries(
          sections.filter(s => s.fields.some(f => found[f.key]))
            .map(s => [s.key, true])
        ),
      }));
      toast('Please fix the highlighted fields', 'error');
      return;
    }

    const payload: CreateTeacherInput = {
      employeeNo: str('employeeId') || undefined,
      firstName: str('firstName'),
      lastName: str('lastName'),
      gender: str('gender'),
      phone: str('phone'),
      email: str('email').toLowerCase(),
      dob: str('dob'),
      bloodGroup: str('bloodGroup'),
      maritalStatus: str('maritalStatus'),
      fatherName: str('fatherName'),
      qualification: str('qualification'),
      experienceYears: experience,
      addressLine1: str('address'),
      permanentAddressLine1: str('permanentAddress'),
      joinedOn: str('joinedOn'),
      employmentType,
      additionalSubjectIds: subjectIds,
      pan: str('panId'),
      epfNo: str('epfNo'),
      bankAccountName: str('accountName'),
      bankAccountNumber: str('accountNumber'),
      bankName: str('bankName'),
      bankIfsc: str('ifscCode').toUpperCase(),
      bankBranch: str('branchName'),
      socialLinks: Object.keys(socialLinks).length ? socialLinks : undefined,
      createLogin: values.createLogin === true,
    };

    savingRef.current = true;
    setSaving(true);

    try {
      const teacher = await staffApi.createTeacher(payload);

      submissionLocked.current = true;

      const name = teacher.fullName ||
        `${teacher.firstName} ${teacher.lastName ?? ''}`.trim();

      toast(`${name} added successfully`);

      if (teacher.login) {
        Alert.alert(
          'Teacher account created',
          `Username: ${teacher.login.username}\nInitial password: ${teacher.login.password}\nChange the password on first sign-in.`,
          [{
            text: 'OK',
            onPress: () => router.replace(
              `/people/teacher-profile?id=${teacher.id}` as Href
            ),
          }],
          { cancelable: false }
        );
      } else {
        router.replace(`/people/teacher-profile?id=${teacher.id}` as Href);
      }
    } catch (error) {
      submissionLocked.current = true;

      Alert.alert(
        'Teacher creation not confirmed',
        'The server did not return a verified creation result. Check the teacher list before attempting another submission.'
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };
  return (
    <ScrollView className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-1 text-[11px] text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>{breadcrumb}</Text>
        <Text className="mb-3 text-base font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{existing ? `Edit ${existing.name}` : 'Add teacher'}</Text>
        {sections.map((section) => {
          const expanded = !!open[section.key];
          return (
            <Card key={section.key} style={{ marginBottom: 10 }}>
              <Pressable onPress={() => setOpen((cur) => ({ ...cur, [section.key]: !cur[section.key] }))} className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{section.title}</Text>
                {errorCount[section.key] ? <Text className="mr-2 text-[11px] font-bold text-red-600 dark:text-red-300">{errorCount[section.key]} to fix</Text> : null}
                <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
              </Pressable>
              {expanded ? (
                <View className="mt-3">
                  <FormFields fields={section.fields} values={values} errors={errors} set={set} isEdit={!!existing} />
                </View>
              ) : null}
            </Card>
          );
        })}
        <View className="mt-2 flex-row gap-3">
          <Button label="Cancel" variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/people/teachers' as Href))} style={{ flex: 1 }} />
          <Button label={saving ? 'Saving...' : existing ? 'Save changes' : 'Add teacher'} onPress={submit} style={{ flex: 1 }} />
        </View>
      </View>
    </ScrollView>
  );
}
