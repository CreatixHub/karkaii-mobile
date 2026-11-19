import React, { useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Switch, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Sheet } from './Sheet';
import { Button } from './basics';
import { colors } from '@/theme/colors';
import { formatDate, formatTime, parseISO, timeToDate, toHHmm, toISO } from '@/core/utils/date';

export interface Option {
  label: string;
  value: string;
  hint?: string;
}

export function FieldShell({
  label,
  required,
  error,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="mb-3.5">
      <Text className="mb-1.5 text-xs font-semibold text-[#202C4B]">
        {label}
        {required ? <Text className="text-red-500"> *</Text> : null}
      </Text>
      {children}
      {error ? <Text className="mt-1 text-[11px] font-medium text-red-600">{error}</Text> : null}
      {!error && hint ? <Text className="mt-1 text-[11px] text-slate-400">{hint}</Text> : null}
    </View>
  );
}

const boxClass = (error?: string, disabled?: boolean) =>
  `flex-row items-center rounded-xl border bg-white px-3.5 ${error ? 'border-red-400' : 'border-slate-200'} ${disabled ? 'opacity-50' : ''}`;

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  error,
  hint,
  keyboard,
  multiline,
  secure,
  disabled,
  prefix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  keyboard?: KeyboardTypeOptions;
  multiline?: boolean;
  secure?: boolean;
  disabled?: boolean;
  prefix?: string;
}) {
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <View className={boxClass(error, disabled)}>
        {prefix ? <Text className="mr-1.5 text-sm font-semibold text-slate-400">{prefix}</Text> : null}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder={placeholder ?? label}
          placeholderTextColor="#94a3b8"
          keyboardType={keyboard}
          multiline={multiline}
          secureTextEntry={secure}
          editable={!disabled}
          autoCapitalize={keyboard === 'email-address' ? 'none' : 'sentences'}
          style={multiline ? { minHeight: 76, textAlignVertical: 'top' } : undefined}
          className="flex-1 py-2.5 text-sm text-[#202C4B]"
        />
      </View>
    </FieldShell>
  );
}

export function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder,
  required,
  error,
  hint,
  disabled,
  allowClear,
}: {
  label: string;
  value: string;
  options: Option[];
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  allowClear?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <Pressable onPress={() => !disabled && setOpen(true)} className={`${boxClass(error, disabled)} justify-between py-2.5`}>
        <Text className={`flex-1 text-sm ${selected ? 'text-[#202C4B]' : 'text-slate-400'}`} numberOfLines={1}>
          {selected ? selected.label : placeholder ?? `Select ${label.toLowerCase()}`}
        </Text>
        <Feather name="chevron-down" size={16} color="#94a3b8" />
      </Pressable>
      <OptionSheet
        visible={open}
        title={label}
        options={options}
        selected={value ? [value] : []}
        onClose={() => setOpen(false)}
        onPick={(v) => {
          onChange(v);
          setOpen(false);
        }}
        onClear={allowClear && value ? () => { onChange(''); setOpen(false); } : undefined}
      />
    </FieldShell>
  );
}

export function MultiSelectField({
  label,
  values,
  options,
  onChange,
  required,
  error,
  hint,
}: {
  label: string;
  values: string[];
  options: Option[];
  onChange: (v: string[]) => void;
  required?: boolean;
  error?: string;
  hint?: string;
}) {
  const [open, setOpen] = useState(false);
  const labels = options.filter((o) => values.includes(o.value)).map((o) => o.label);
  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <Pressable onPress={() => setOpen(true)} className={`${boxClass(error)} justify-between py-2.5`}>
        <Text className={`flex-1 text-sm ${labels.length ? 'text-[#202C4B]' : 'text-slate-400'}`} numberOfLines={1}>
          {labels.length ? labels.join(', ') : `Select ${label.toLowerCase()}`}
        </Text>
        <Feather name="chevron-down" size={16} color="#94a3b8" />
      </Pressable>
      <OptionSheet
        visible={open}
        title={label}
        options={options}
        selected={values}
        multi
        onClose={() => setOpen(false)}
        onPick={(v) => onChange(values.includes(v) ? values.filter((x) => x !== v) : [...values, v])}
      />
    </FieldShell>
  );
}

/** Searchable single / multi pick list in a sheet. Also used by filter sheets. */
export function OptionSheet({
  visible,
  title,
  options,
  selected,
  multi,
  onPick,
  onClose,
  onClear,
}: {
  visible: boolean;
  title: string;
  options: Option[];
  selected: string[];
  multi?: boolean;
  onPick: (v: string) => void;
  onClose: () => void;
  onClear?: () => void;
}) {
  const [q, setQ] = useState('');
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s ? options.filter((o) => o.label.toLowerCase().includes(s) || o.hint?.toLowerCase().includes(s)) : options;
  }, [options, q]);
  return (
    <Sheet
      visible={visible}
      title={title}
      onClose={onClose}
      scroll={false}
      footer={
        multi ? (
          <Button label="Done" onPress={onClose} />
        ) : onClear ? (
          <Button label="Clear selection" variant="secondary" onPress={onClear} />
        ) : undefined
      }
    >
      {options.length > 7 ? (
        <View className="mb-2 flex-row items-center rounded-xl border border-slate-200 px-3">
          <Feather name="search" size={14} color="#94a3b8" />
          <TextInput value={q} onChangeText={setQ} placeholder="Search…" placeholderTextColor="#94a3b8" className="ml-2 flex-1 py-2 text-sm" />
        </View>
      ) : null}
      <ScrollView style={{ maxHeight: 420 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {shown.length === 0 ? <Text className="py-6 text-center text-xs text-slate-400">No matches</Text> : null}
        {shown.map((o) => {
          const on = selected.includes(o.value);
          return (
            <Pressable key={o.value} onPress={() => onPick(o.value)} className="flex-row items-center border-b border-slate-100 py-3 active:bg-slate-50">
              <View className="flex-1">
                <Text className={`text-sm ${on ? 'font-bold text-[#3D5EE1]' : 'text-slate-800'}`}>{o.label}</Text>
                {o.hint ? <Text className="mt-0.5 text-[11px] text-slate-400">{o.hint}</Text> : null}
              </View>
              {on ? <Feather name={multi ? 'check-square' : 'check'} size={16} color={colors.primary} /> : multi ? <Feather name="square" size={16} color="#cbd5e1" /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Sheet>
  );
}

export function DateField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  disabled,
  minimumDate,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  minimumDate?: Date;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const current = parseISO(value) ?? new Date();

  const open = () => {
    if (disabled) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: current,
        mode: 'date',
        minimumDate,
        onValueChange: (_e, d) => onChange(toISO(d)),
      });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <Pressable onPress={open} className={`${boxClass(error, disabled)} justify-between py-2.5`}>
        <Text className={`flex-1 text-sm ${value ? 'text-[#202C4B]' : 'text-slate-400'}`}>{value ? formatDate(value) : 'Select date'}</Text>
        <Feather name="calendar" size={16} color="#94a3b8" />
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Sheet visible={iosOpen} title={label} onClose={() => setIosOpen(false)} footer={<Button label="Done" onPress={() => setIosOpen(false)} />}>
          <DateTimePicker
            value={current}
            mode="date"
            display="inline"
            minimumDate={minimumDate}
            onValueChange={(_e, d) => onChange(toISO(d))}
          />
        </Sheet>
      ) : null}
    </FieldShell>
  );
}

export function TimeField({
  label,
  value,
  onChange,
  required,
  error,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const current = timeToDate(value);

  const open = () => {
    if (disabled) return;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: current, mode: 'time', is24Hour: false, onValueChange: (_e, d) => onChange(toHHmm(d)) });
    } else {
      setIosOpen(true);
    }
  };

  return (
    <FieldShell label={label} required={required} error={error} hint={hint}>
      <Pressable onPress={open} className={`${boxClass(error, disabled)} justify-between py-2.5`}>
        <Text className={`flex-1 text-sm ${value ? 'text-[#202C4B]' : 'text-slate-400'}`}>{value ? formatTime(value) : 'Select time'}</Text>
        <Feather name="clock" size={16} color="#94a3b8" />
      </Pressable>
      {Platform.OS === 'ios' ? (
        <Sheet visible={iosOpen} title={label} onClose={() => setIosOpen(false)} footer={<Button label="Done" onPress={() => setIosOpen(false)} />}>
          <DateTimePicker value={current} mode="time" display="spinner" onValueChange={(_e, d) => onChange(toHHmm(d))} />
        </Sheet>
      ) : null}
    </FieldShell>
  );
}

export function SwitchField({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
  return (
    <View className="mb-3.5 flex-row items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
      <View className="flex-1 pr-3">
        <Text className="text-xs font-semibold text-[#202C4B]">{label}</Text>
        {hint ? <Text className="mt-0.5 text-[11px] text-slate-400">{hint}</Text> : null}
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: colors.primary, false: '#cbd5e1' }} />
    </View>
  );
}
