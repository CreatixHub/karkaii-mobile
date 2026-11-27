import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { snapshot } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import { formatDate } from '@/core/utils/date';
import type { StudentRecord } from '@/data/seed/master';
import { useAuth } from '@/hooks/useAuth';
import { FormFields, validateFields } from '@/features/engine/FormSheet';
import type { FieldDef, FormValues } from '@/features/engine/types';
import {
  EMPTY_STUDENT_LOOKUPS,
  extractApiErrors,
  loadStudentFormLookups,
  studentsApi,
  type BackendStudent,
  type StudentFormLookups,
} from '@/services/api/studentsApi';
import { Button, Card, EmptyState } from '@/ui/basics';
import { SelectField, type Option } from '@/ui/Fields';
import { useToast } from '@/ui/Toast';
import {
  CHOICE_FIELDS,
  buildStudentSections,
  clearStudentDraft,
  hasTypedAnything,
  loadStudentDraft,
  nextBackendAdmissionNo,
  saveStudent,
  saveStudentDraft,
  studentToValues,
  validateStudent,
} from './studentFormLogic';

const lookup = (collection: string, id: string) => snapshot<{ id: string }>(collection).find((r) => r.id === id);

/** A row of buttons for a short fixed choice (the web form shows these as radio buttons). */
function ChoiceRow({ label, options, value, onChange, error }: { label: string; options: readonly string[]; value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <View className="mb-3">
      <Text className="mb-1.5 text-xs font-semibold text-slate-600 dark:text-[#B9B7C0]">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {options.map((o) => {
          const on = value === o;
          return (
            <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="radio" accessibilityState={{ selected: on }} className={`flex-row items-center rounded-full border px-3.5 py-1.5 ${on ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022]'}`}>
              <Feather name={on ? 'check-circle' : 'circle'} size={13} color={on ? '#fff' : '#94a3b8'} />
              <Text className={`ml-1.5 text-xs font-bold ${on ? 'text-white' : 'text-slate-600 dark:text-[#B9B7C0]'}`}>{o}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text className="mt-1 text-xs text-red-600 dark:text-red-300">{error}</Text> : null}
    </View>
  );
}

/** Brothers and sisters already at the school: pick each one from backend student records. */
function Siblings({
  ids,
  onChange,
  selfId,
  backendStudents,
  error,
}: {
  ids: string[];
  onChange: (ids: string[]) => void;
  selfId?: string;
  backendStudents: BackendStudent[];
  error?: string;
}) {
  const options = useMemo<Option[]>(
    () =>
      backendStudents
        .filter((s) => String(s.id) !== String(selfId ?? ''))
        .map((s) => ({
          label: s.fullName || `${s.firstName} ${s.lastName}`.trim(),
          value: String(s.id),
          hint: [s.admissionNo, s.className].filter(Boolean).join(' · '),
        })),
    [backendStudents, selfId],
  );
  const rows = ids.length ? ids : [''];
  const set = (i: number, id: string) => onChange(rows.map((x, j) => (j === i ? id : x)));
  return (
    <View>
      {rows.map((id, i) => {
        const s = backendStudents.find((x) => String(x.id) === String(id));
        return (
          <View key={`${i}-${id}`} className="mb-3 rounded-xl border border-slate-100 dark:border-[#262038] bg-slate-50/60 p-3">
            <View className="flex-row items-end">
              <View className="flex-1">
                <SelectField label="Name" value={id} options={options} onChange={(v) => set(i, v)} placeholder={options.length ? 'Select' : 'No students found'} />
              </View>
              <Pressable onPress={() => onChange(rows.filter((_x, j) => j !== i).filter(Boolean))} hitSlop={8} accessibilityLabel="Remove sibling" className="mb-3 ml-3 h-10 w-10 items-center justify-center rounded-xl bg-red-50 dark:bg-[#2e1a22]">
                <Feather name="trash-2" size={16} color="#DC2626" />
              </Pressable>
            </View>
            {s ? (
              <View className="flex-row gap-4">
                <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">Roll No <Text className="font-bold text-slate-700 dark:text-[#d6d4de]">{s.rollNo || '—'}</Text></Text>
                <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">Admission No <Text className="font-bold text-slate-700 dark:text-[#d6d4de]">{s.admissionNo}</Text></Text>
                <Text className="text-[11px] text-slate-500 dark:text-[#a29fb0]">Class <Text className="font-bold text-slate-700 dark:text-[#d6d4de]">{s.className || '—'}</Text></Text>
              </View>
            ) : null}
          </View>
        );
      })}
      {error ? <Text className="mb-2 text-xs text-red-600 dark:text-red-300">{error}</Text> : null}
      <Button small variant="secondary" icon="plus-circle" label="Add New" onPress={() => onChange([...ids, ''])} />
    </View>
  );
}

/** Add or edit a student: the web app's ten form sections as collapsible cards, with a chip bar to jump between them. */
export function StudentForm({ breadcrumb }: { breadcrumb: string }) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const all = useCollection<StudentRecord>('students');
  const { user, canManage, role } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const existing = typeof id === 'string' ? all.find((s) => s.id === id) : undefined;
  const allowed = canManage && role !== 'student' && role !== 'parent';

  const [lookups, setLookups] = useState<StudentFormLookups>(EMPTY_STUDENT_LOOKUPS);
  const [loadingLookups, setLoadingLookups] = useState(true);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [remoteStudent, setRemoteStudent] = useState<BackendStudent | null>(null);
  const [remoteMissing, setRemoteMissing] = useState(false);

  const [values, setValues] = useState<FormValues>(() => studentToValues(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ personal: true });
  const [draftAt, setDraftAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const admissionTouched = useRef(false);
  const draftRestored = useRef(false);
  const scroller = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const offsets = useRef<Record<string, number>>({});
  const bodyTop = useRef(0);

  const applyLookups = useCallback(
    (data: StudentFormLookups) => {
      setLookups(data);
      if (!id && !draftRestored.current && !admissionTouched.current) {
        setValues((cur) => ({ ...cur, admissionNo: nextBackendAdmissionNo(data.students) }));
      }
    },
    [id],
  );

  const retryLookups = useCallback(async () => {
    setLoadingLookups(true);
    setLookupError(null);
    try {
      const data = await loadStudentFormLookups();
      applyLookups(data);
    } catch (err) {
      const { message } = extractApiErrors(err);
      setLookupError(message);
    } finally {
      setLoadingLookups(false);
    }
  }, [applyLookups]);

  useEffect(() => {
    let alive = true;
    loadStudentFormLookups()
      .then((data) => {
        if (alive) applyLookups(data);
      })
      .catch((err) => {
        if (alive) setLookupError(extractApiErrors(err).message);
      })
      .finally(() => {
        if (alive) setLoadingLookups(false);
      });
    return () => {
      alive = false;
    };
  }, [applyLookups]);

  // Edit mode for a backend student ID: fetch full record from backend
  useEffect(() => {
    if (typeof id !== 'string' || !/^\d+$/.test(id)) return;
    let alive = true;
    studentsApi
      .fetchStudentById(id)
      .then((stu) => {
        if (!alive) return;
        setRemoteStudent(stu);
        setValues(studentToValues(existing, stu));
      })
      .catch(() => {
        if (alive && !existing) setRemoteMissing(true);
      });
    return () => {
      alive = false;
    };
  }, [id, existing]);

  // A new student: bring back a draft saved earlier.
  useEffect(() => {
    if (typeof id === 'string') return;
    let alive = true;
    loadStudentDraft().then((d) => {
      if (alive && d) {
        draftRestored.current = true;
        setValues(d.values);
        setDraftAt(d.savedAt);
        setOpen((cur) => ({ ...cur, personal: true }));
      }
    });
    return () => { alive = false; };
  }, [id]);

  const sections = useMemo(() => buildStudentSections(lookups, values), [lookups, values]);
  const allFields = useMemo(() => sections.flatMap((s) => s.fields), [sections]);

  const errorCount = useMemo(
    () =>
      Object.fromEntries(
        sections.map((s) => [s.key, s.fields.filter((f) => errors[f.key]).length + (s.key === 'siblings' && errors.siblingIds ? 1 : 0)]),
      ),
    [sections, errors],
  );

  const editTarget: StudentRecord | undefined = useMemo(() => {
    if (existing) return existing;
    if (remoteStudent) {
      return {
        id: String(remoteStudent.id),
        admissionNo: remoteStudent.admissionNo,
        name: remoteStudent.fullName || `${remoteStudent.firstName} ${remoteStudent.lastName}`.trim(),
        gender: (remoteStudent.gender === 'male' ? 'Male' : 'Female') as StudentRecord['gender'],
        dob: remoteStudent.dob,
        classId: '',
        sectionId: '',
        rollNo: Number(remoteStudent.rollNo) || 1,
        house: remoteStudent.houseName || '',
        parentName: remoteStudent.fatherName || '',
        parentPhone: remoteStudent.fatherPhone || '',
        email: '',
        bloodGroup: remoteStudent.bloodGroup || '',
        address: remoteStudent.addressLine1 || '',
        transport: false,
        hostel: false,
        scholar: false,
        status: 'Active',
        joinedOn: remoteStudent.admittedOn,
        motherName: remoteStudent.motherName || '',
        religion: '',
        nationality: 'Indian',
        phone: '',
        emergencyPhone: '',
        previousSchool: '',
        activities: [],
      };
    }
    return undefined;
  }, [existing, remoteStudent]);

  if (!allowed) return <EmptyState icon="lock" title="No access" hint="Your role can view students but not add or edit them." />;
  if (typeof id === 'string' && !existing && remoteMissing) return <EmptyState icon="user-x" title="Student not found" hint="This student may have been deleted." />;

  const set = (key: string, value: any) => {
    if (key === 'admissionNo') admissionTouched.current = true;
    setValues((cur) => {
      const next = { ...cur, [key]: value };
      const def = allFields.find((f) => f.key === key);
      const extra = def?.onChange?.(value, next, lookup);
      return extra ? { ...next, ...extra } : next;
    });
    setErrors((cur) => {
      if (!cur[key]) return cur;
      const { [key]: _drop, ...rest } = cur;
      return rest;
    });
  };

  const jump = (key: string) => {
    setOpen((cur) => ({ ...cur, [key]: true }));
    setTimeout(() => scroller.current?.scrollTo({ y: Math.max(0, (offsets.current[key] ?? 0) + bodyTop.current - 8), animated: true }), 60);
  };

  const openErrorSections = (found: Record<string, string>) => {
    setOpen((cur) => ({
      ...cur,
      ...Object.fromEntries(
        sections
          .filter((s) => s.fields.some((f) => found[f.key]) || (s.key === 'siblings' && found.siblingIds))
          .map((s) => [s.key, true]),
      ),
    }));
  };

  const submit = async () => {
    if (submitting) return;
    const found: Record<string, string> = { ...validateFields(allFields, values), ...validateStudent(values, editTarget, lookups) };
    setErrors(found);
    if (Object.keys(found).length) {
      openErrorSections(found);
      toast(`Please fix ${Object.keys(found).length} highlighted field${Object.keys(found).length > 1 ? 's' : ''}`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const { student, created, notes } = await saveStudent(values, editTarget, user?.name ?? 'Admin Office', lookups);
      if (created) await clearStudentDraft();
      toast(`${student.name} ${created ? 'added' : 'updated'}${notes.length ? ` · ${notes.join(' · ')}` : ''}`);
      router.replace(`/people/student-profile?id=${student.id}` as Href);
    } catch (err) {
      const { message, fieldErrors } = extractApiErrors(err);
      if (Object.keys(fieldErrors).length) {
        setErrors((cur) => ({ ...cur, ...fieldErrors }));
        openErrorSections(fieldErrors);
      }
      toast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const draft = async () => {
    if (!hasTypedAnything(values)) { toast('Nothing to save yet. Fill in a few details first.', 'info'); return; }
    await saveStudentDraft(values);
    setDraftAt(new Date().toISOString());
    toast('Draft saved. It will be here when you come back to Add Student.');
  };

  const discardDraft = async () => {
    await clearStudentDraft();
    draftRestored.current = false;
    admissionTouched.current = false;
    setDraftAt('');
    setValues({ ...studentToValues(undefined), admissionNo: nextBackendAdmissionNo(lookups.students) });
    setErrors({});
    toast('Draft discarded', 'info');
  };

  const cancel = () => (router.canGoBack() ? router.back() : router.replace('/people/students' as Href));

  /** Consecutive ordinary fields go to the shared form renderer; choice fields get a row of buttons. */
  const renderFields = (fields: FieldDef[]) => {
    const out: React.ReactNode[] = [];
    let run: FieldDef[] = [];
    const flush = () => {
      if (run.length) out.push(<FormFields key={`run-${run[0].key}`} fields={run} values={values} errors={errors} set={set} isEdit={!!editTarget} />);
      run = [];
    };
    for (const f of fields) {
      const choice = CHOICE_FIELDS[f.key];
      if (choice) {
        flush();
        if (f.section) out.push(<Text key={`h-${f.key}`} className="mb-2 mt-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1] dark:text-[#7d95f5]">{f.section}</Text>);
        out.push(<ChoiceRow key={f.key} label={choice.label} options={choice.options} value={String(values[f.key] ?? '')} onChange={(v) => set(f.key, v)} error={errors[f.key]} />);
      } else run.push(f);
    }
    flush();
    return out;
  };

  return (
    <View className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
      <ScrollView ref={scroller} className="flex-1" contentContainerStyle={{ paddingBottom: 24 }} keyboardShouldPersistTaps="handled">
        <View className="px-4 pt-3">
          <Text className="mb-1 text-[11px] text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>{breadcrumb}</Text>
          <Text className="mb-3 text-base font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{editTarget ? `Edit ${editTarget.name}` : 'Add Student'}</Text>

          {loadingLookups ? (
            <View className="mb-3 flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] p-3">
              <Feather name="refresh-cw" size={14} color="#3D5EE1" />
              <Text className="ml-2 text-xs text-slate-500 dark:text-[#a29fb0]">Loading school classes, houses & routes…</Text>
            </View>
          ) : null}

          {lookupError ? (
            <View className="mb-3 flex-row items-center rounded-xl border border-red-200 dark:border-[#3d3756] bg-red-50 dark:bg-[#2e1a22] p-3">
              <Feather name="alert-circle" size={16} color="#DC2626" />
              <Text className="ml-2 flex-1 text-xs text-red-700 dark:text-red-300">{lookupError}</Text>
              <Pressable onPress={retryLookups} hitSlop={8}><Text className="text-xs font-bold text-red-700 dark:text-red-300">Retry</Text></Pressable>
            </View>
          ) : null}

          {draftAt ? (
            <View className="mb-3 flex-row items-center rounded-xl border border-amber-200 dark:border-[#3d3756] bg-amber-50 dark:bg-[#2e2616] p-3">
              <Feather name="file-text" size={16} color="#B45309" />
              <Text className="ml-2 flex-1 text-xs text-amber-800 dark:text-amber-300">Draft from {formatDate(draftAt.slice(0, 10))} restored.</Text>
              <Pressable onPress={discardDraft} hitSlop={8}><Text className="text-xs font-bold text-amber-900 dark:text-amber-300">Discard</Text></Pressable>
            </View>
          ) : null}

          <Text className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wide text-slate-400 dark:text-[#8b879b]">Form Sections</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3" contentContainerStyle={{ gap: 8 }}>
            {sections.map((s) => (
              <Pressable key={s.key} onPress={() => jump(s.key)} className={`rounded-full border px-3 py-1.5 ${errorCount[s.key] ? 'border-red-300 dark:border-[#3d3756] bg-red-50 dark:bg-[#2e1a22]' : open[s.key] ? 'border-[#3D5EE1] bg-[#E9EDFC] dark:bg-[#1d2450]' : 'border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022]'}`}>
                <Text className={`text-xs font-bold ${errorCount[s.key] ? 'text-red-600 dark:text-red-300' : open[s.key] ? 'text-[#3D5EE1] dark:text-[#7d95f5]' : 'text-slate-600 dark:text-[#B9B7C0]'}`}>{s.nav}{errorCount[s.key] ? ` · ${errorCount[s.key]}` : ''}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <View onLayout={(e) => { bodyTop.current = e.nativeEvent.layout.y; }}>
            {sections.map((section) => {
              const expanded = !!open[section.key];
              return (
                <View key={section.key} onLayout={(e) => { offsets.current[section.key] = e.nativeEvent.layout.y; }}>
                  <Card style={{ marginBottom: 10 }}>
                    <Pressable onPress={() => setOpen((cur) => ({ ...cur, [section.key]: !cur[section.key] }))} className="flex-row items-center justify-between">
                      <Text className="flex-1 text-sm font-bold text-[#1b2240] dark:text-[#EFEFF2]">{section.title}</Text>
                      {errorCount[section.key] ? <Text className="mr-2 text-[11px] font-bold text-red-600 dark:text-red-300">{errorCount[section.key]} to fix</Text> : null}
                      <Feather name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748b" />
                    </Pressable>
                    {expanded ? (
                      <View className="mt-3">
                        {renderFields(section.fields)}
                        {section.key === 'siblings' && values.hasSibling === 'Yes' ? (
                          <Siblings
                            ids={Array.isArray(values.siblingIds) ? values.siblingIds : []}
                            selfId={editTarget?.id}
                            backendStudents={lookups.students}
                            onChange={(ids) => set('siblingIds', ids)}
                            error={errors.siblingIds}
                          />
                        ) : null}
                      </View>
                    ) : null}
                  </Card>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View className="flex-row gap-2 border-t border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-4 py-3">
        <Button label="Cancel" variant="secondary" onPress={cancel} disabled={submitting} style={{ flex: 1 }} />
        {editTarget ? null : <Button label="Save Draft" variant="secondary" icon="save" onPress={draft} disabled={submitting} style={{ flex: 1 }} />}
        <Button
          label={editTarget ? 'Save changes' : 'Add Student'}
          icon={editTarget ? 'check' : 'plus-circle'}
          onPress={submit}
          loading={submitting}
          disabled={submitting}
          style={{ flex: editTarget ? 2 : 1.4 }}
        />
      </View>
    </View>
  );
}
