import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { Sheet } from '@/ui/Sheet';
import { Button } from '@/ui/basics';
import { DateField, MultiSelectField, SelectField, SwitchField, TextField, TimeField, type Option } from '@/ui/Fields';
import { snapshot } from '@/core/store/store';
import { useCollection } from '@/core/store/useCollection';
import type { FieldDef, FieldErrors, FormValues } from './types';

const clean = (e: FieldErrors): Record<string, string> =>
  Object.fromEntries(Object.entries(e).filter(([, v]) => !!v)) as Record<string, string>;

export const lookup = (collection: string, id: string): any => snapshot<any>(collection).find((r) => r.id === id);

function normaliseOptions(options: FieldDef['options']): Option[] {
  return (options ?? []).map((o) => (typeof o === 'string' ? { label: o, value: o } : o));
}

/** Seed form values: record values as strings (numbers) / arrays / booleans, falling back to field defaults. */
export function toFormValues(fields: FieldDef[], source?: Record<string, any>): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const raw = source?.[f.key];
    if (f.type === 'multiselect') out[f.key] = Array.isArray(raw) ? raw : Array.isArray(f.default) ? f.default : [];
    else if (f.type === 'switch') out[f.key] = typeof raw === 'boolean' ? raw : typeof f.default === 'boolean' ? f.default : false;
    else if (raw !== undefined && raw !== null) out[f.key] = String(raw);
    else out[f.key] = f.default !== undefined ? String(f.default) : '';
  }
  return out;
}

/** Convert form strings to typed values (numbers for number/money fields). */
export function fromFormValues(fields: FieldDef[], values: FormValues): Record<string, any> {
  const out: Record<string, any> = {};
  for (const f of fields) {
    const v = values[f.key];
    if (f.type === 'number' || f.type === 'money') out[f.key] = v === '' || v === undefined ? 0 : Number(v);
    else out[f.key] = v;
  }
  return out;
}

export function validateFields(fields: FieldDef[], values: FormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const f of fields) {
    if (f.hidden?.(values)) continue;
    const v = values[f.key];
    const empty = f.type === 'multiselect' ? !(v && v.length) : f.type === 'switch' ? false : String(v ?? '').trim() === '';
    if (f.required && empty) {
      errors[f.key] = `${f.label} is required`;
      continue;
    }
    if (empty) continue;
    if (f.type === 'number' || f.type === 'money') {
      const n = Number(v);
      if (Number.isNaN(n)) errors[f.key] = 'Enter a valid number';
      else if (f.min !== undefined && n < f.min) errors[f.key] = `Must be at least ${f.min}`;
      else if (f.max !== undefined && n > f.max) errors[f.key] = `Must be at most ${f.max}`;
    } else if (f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v).trim())) {
      errors[f.key] = 'Enter a valid email address';
    } else if (f.type === 'phone' && !/^\+?[\d\s()-]{7,16}$/.test(String(v).trim())) {
      errors[f.key] = 'Enter a valid phone number';
    }
  }
  return errors;
}

function DynamicSelect({ field, values, set, error }: { field: FieldDef; values: FormValues; set: (k: string, v: any) => void; error?: string }) {
  const from = field.optionsFrom!;
  const rows = useCollection<any>(from.collection);
  const options = useMemo<Option[]>(
    () => rows.filter((r) => (from.filter ? from.filter(r, values) : true)).map((r) => ({ label: from.label(r), value: r.id, hint: from.hint?.(r) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, values],
  );
  return field.type === 'multiselect' ? (
    <MultiSelectField label={field.label} values={values[field.key] ?? []} options={options} onChange={(v) => set(field.key, v)} required={field.required} error={error} hint={field.hint} />
  ) : (
    <SelectField label={field.label} value={values[field.key] ?? ''} options={options} onChange={(v) => set(field.key, v)} required={field.required} error={error} hint={field.hint} placeholder={field.placeholder} />
  );
}

export function FormFields({
  fields,
  values,
  errors,
  set,
  isEdit,
}: {
  fields: FieldDef[];
  values: FormValues;
  errors: Record<string, string>;
  set: (key: string, value: any) => void;
  isEdit: boolean;
}) {
  return (
    <>
      {fields.map((f) => {
        if (f.hidden?.(values)) return null;
        const disabled = f.readOnly?.(values, isEdit) ?? false;
        const error = errors[f.key];
        let control: React.ReactNode;
        if (f.optionsFrom && (f.type === 'select' || f.type === 'multiselect')) {
          control = <DynamicSelect field={f} values={values} set={set} error={error} />;
        } else if (f.type === 'select') {
          control = <SelectField label={f.label} value={values[f.key] ?? ''} options={normaliseOptions(f.options)} onChange={(v) => set(f.key, v)} required={f.required} error={error} hint={f.hint} placeholder={f.placeholder} disabled={disabled} />;
        } else if (f.type === 'multiselect') {
          control = <MultiSelectField label={f.label} values={values[f.key] ?? []} options={normaliseOptions(f.options)} onChange={(v) => set(f.key, v)} required={f.required} error={error} hint={f.hint} />;
        } else if (f.type === 'date') {
          control = <DateField label={f.label} value={values[f.key] ?? ''} onChange={(v) => set(f.key, v)} required={f.required} error={error} hint={f.hint} disabled={disabled} />;
        } else if (f.type === 'time') {
          control = <TimeField label={f.label} value={values[f.key] ?? ''} onChange={(v) => set(f.key, v)} required={f.required} error={error} hint={f.hint} disabled={disabled} />;
        } else if (f.type === 'switch') {
          control = <SwitchField label={f.label} value={!!values[f.key]} onChange={(v) => set(f.key, v)} hint={f.hint} />;
        } else {
          control = (
            <TextField
              label={f.label}
              value={values[f.key] ?? ''}
              onChange={(v) => set(f.key, v)}
              placeholder={f.placeholder}
              required={f.required}
              error={error}
              hint={f.hint}
              disabled={disabled}
              multiline={f.type === 'textarea'}
              keyboard={f.type === 'number' || f.type === 'money' ? 'decimal-pad' : f.type === 'email' ? 'email-address' : f.type === 'phone' ? 'phone-pad' : undefined}
              prefix={f.type === 'money' ? '$' : undefined}
            />
          );
        }
        return (
          <View key={f.key}>
            {f.section ? <Text className="mb-2 mt-1 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1]">{f.section}</Text> : null}
            {control}
          </View>
        );
      })}
    </>
  );
}

/** A form in a bottom sheet: used for Add / Edit and for actions that need input. */
function FormSheetBody({
  title,
  fields,
  initial,
  submitLabel = 'Save',
  isEdit = false,
  validate,
  onSubmit,
  onClose,
}: {
  title: string;
  fields: FieldDef[];
  initial: FormValues;
  submitLabel?: string;
  isEdit?: boolean;
  validate?: (values: FormValues) => FieldErrors;
  onSubmit: (values: FormValues) => void;
  onClose: () => void;
}) {
  const [values, setValues] = useState<FormValues>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (key: string, value: any) => {
    setValues((prev) => {
      let next: FormValues = { ...prev, [key]: value };
      const def = fields.find((f) => f.key === key);
      const extra = def?.onChange?.(value, next, lookup);
      if (extra) next = { ...next, ...extra };
      return next;
    });
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const { [key]: _drop, ...rest } = prev;
      return rest;
    });
  };

  const submit = () => {
    const found = clean({ ...validateFields(fields, values), ...(validate?.(values) ?? {}) });
    setErrors(found);
    if (Object.keys(found).length) return;
    onSubmit(values);
  };

  return (
    <Sheet
      visible
      title={title}
      onClose={onClose}
      tall
      footer={
        <View className="flex-row gap-3">
          <Button label="Cancel" variant="secondary" onPress={onClose} style={{ flex: 1 }} />
          <Button label={submitLabel} onPress={submit} style={{ flex: 1 }} />
        </View>
      }
    >
      <FormFields fields={fields} values={values} errors={errors} set={set} isEdit={isEdit} />
      {Object.keys(errors).length ? <Text className="mb-2 text-center text-xs font-semibold text-red-600">Please fix the highlighted fields.</Text> : null}
    </Sheet>
  );
}

/** Mounts the form only while open, so every opening starts from fresh `initial` values. */
export function FormSheet(props: React.ComponentProps<typeof FormSheetBody> & { visible: boolean }) {
  const { visible, ...rest } = props;
  if (!visible) return null;
  return <FormSheetBody {...rest} />;
}
