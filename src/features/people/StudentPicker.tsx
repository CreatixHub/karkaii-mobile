import React, { useMemo, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useCollection } from '@/core/store/useCollection';
import type { StudentRecord } from '@/data/seed/master';
import { useAuth } from '@/hooks/useAuth';
import { classSection } from '@/features/common/refs';
import { SelectField, type Option } from '@/ui/Fields';

/**
 * Which student a per-student page shows: a student sees themselves, a parent picks among their children,
 * staff pick anyone (or arrive with `?id=` from a link on another page).
 */
export function useSelectedStudent() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const all = useCollection<StudentRecord>('students');
  const allowed = useMemo(() => (user?.role === 'student' ? all.filter((s) => s.id === user.studentId) : user?.role === 'parent' ? all.filter((s) => user.childIds?.includes(s.id)) : all), [all, user]);
  const [picked, setPicked] = useState<string | undefined>(typeof id === 'string' ? id : undefined);
  const student = allowed.find((s) => s.id === picked) ?? allowed[0];
  const options = useMemo<Option[]>(() => allowed.map((s) => ({ label: s.name, value: s.id, hint: `${s.admissionNo} · ${classSection(s)}` })), [allowed]);
  return { student, setId: setPicked, options, locked: allowed.length <= 1 };
}

export function StudentPicker({ student, value, options, onChange, locked }: { student?: StudentRecord; value?: string; options: Option[]; onChange: (id: string) => void; locked: boolean }) {
  return <SelectField label="Student" value={value ?? student?.id ?? ''} options={options} onChange={onChange} disabled={locked} />;
}
