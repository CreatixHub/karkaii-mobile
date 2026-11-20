import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCollection } from '@/core/store/useCollection';
import type { TeacherRecord } from '@/data/seed/master';
import { useAuth } from '@/hooks/useAuth';
import { FormFields, validateFields } from '@/features/engine/FormSheet';
import type { FormValues } from '@/features/engine/types';
import { Button, Card, EmptyState } from '@/ui/basics';
import { useToast } from '@/ui/Toast';
import { ALL_FIELDS, TEACHER_SECTIONS, saveTeacher, teacherToValues, validateTeacher } from './teacherLogic';

/** Add or edit a teacher: the source's nine form cards as collapsible sections. */
export function TeacherForm({ breadcrumb }: { breadcrumb: string }) {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const teachers = useCollection<TeacherRecord>('teachers');
  const { user, canManage, role } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const existing = typeof id === 'string' ? teachers.find((t) => t.id === id) : undefined;
  const allowed = canManage && role !== 'student' && role !== 'parent';

  const [values, setValues] = useState<FormValues>(() => teacherToValues(existing));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [open, setOpen] = useState<Record<string, boolean>>({ personal: true });

  // The login switch only applies to a new teacher (existing ones get theirs from the roster action).
  const sections = useMemo(() => (existing ? TEACHER_SECTIONS.filter((s) => s.key !== 'login') : TEACHER_SECTIONS), [existing]);
  const errorCount = useMemo(() => Object.fromEntries(sections.map((s) => [s.key, s.fields.filter((f) => errors[f.key]).length])), [errors, sections]);

  if (!allowed) return <EmptyState icon="lock" title="No access" hint="Your role can view teachers but not add or edit them." />;
  if (typeof id === 'string' && !existing) return <EmptyState icon="user-x" title="Teacher not found" hint="This teacher may have been deleted." />;

  const set = (key: string, value: any) => {
    setValues((cur) => ({ ...cur, [key]: value }));
    setErrors((cur) => {
      if (!cur[key]) return cur;
      const { [key]: _drop, ...rest } = cur;
      return rest;
    });
  };

  const submit = () => {
    const found: Record<string, string> = { ...validateFields(ALL_FIELDS, values), ...validateTeacher(values, existing) };
    setErrors(found);
    if (Object.keys(found).length) {
      setOpen((cur) => ({ ...cur, ...Object.fromEntries(sections.filter((s) => s.fields.some((f) => found[f.key])).map((s) => [s.key, true])) }));
      toast(`Please fix ${Object.keys(found).length} highlighted field${Object.keys(found).length > 1 ? 's' : ''}`, 'error');
      return;
    }
    const { teacher, created } = saveTeacher(values, existing, user?.name ?? 'Admin Office');
    toast(created ? `${teacher.name} added` : `${teacher.name} updated`);
    router.replace(`/people/teacher-profile?id=${teacher.id}` as Href);
  };

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <View className="px-4 pt-3">
        <Text className="mb-1 text-[11px] text-slate-400" numberOfLines={1}>{breadcrumb}</Text>
        <Text className="mb-3 text-base font-extrabold text-[#1b2240]">{existing ? `Edit ${existing.name}` : 'Add teacher'}</Text>
        {sections.map((section) => {
          const expanded = !!open[section.key];
          return (
            <Card key={section.key} style={{ marginBottom: 10 }}>
              <Pressable onPress={() => setOpen((cur) => ({ ...cur, [section.key]: !cur[section.key] }))} className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm font-bold text-[#1b2240]">{section.title}</Text>
                {errorCount[section.key] ? <Text className="mr-2 text-[11px] font-bold text-red-600">{errorCount[section.key]} to fix</Text> : null}
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
          <Button label={existing ? 'Save changes' : 'Add teacher'} onPress={submit} style={{ flex: 1 }} />
        </View>
      </View>
    </ScrollView>
  );
}
