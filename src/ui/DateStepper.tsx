import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Feather } from '@expo/vector-icons';
import { Sheet } from './Sheet';
import { Button } from './basics';
import { addDays, dayName, formatDate, parseISO, todayISO, toISO } from '@/core/utils/date';

/** Previous / next day + tap-to-pick, with an optional "All dates" switch. Value is 'YYYY-MM-DD' or 'all'. */
export function DateStepper({
  value,
  onChange,
  allowAll,
}: {
  value: string;
  onChange: (v: string) => void;
  allowAll?: boolean;
}) {
  const [iosOpen, setIosOpen] = useState(false);
  const isAll = value === 'all';
  const current = (!isAll && parseISO(value)) || new Date();
  const today = todayISO();

  const pick = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({ value: current, mode: 'date', onValueChange: (_e, d) => onChange(toISO(d)) });
    } else {
      setIosOpen(true);
    }
  };

  const step = (n: number) => onChange(addDays(isAll ? today : value, n));

  return (
    <View className="mb-3 flex-row items-center px-4">
      <Pressable onPress={() => step(-1)} disabled={isAll} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-50" style={{ opacity: isAll ? 0.4 : 1 }}>
        <Feather name="chevron-left" size={18} color="#1b2240" />
      </Pressable>
      <Pressable onPress={pick} className="mx-2 h-10 flex-1 flex-row items-center justify-center rounded-xl border border-slate-200 bg-white px-3 active:bg-slate-50">
        <Feather name="calendar" size={14} color="#3D5EE1" />
        <Text className="ml-2 text-xs font-bold text-[#1b2240]" numberOfLines={1}>
          {isAll ? 'All dates' : `${dayName(value).slice(0, 3)}, ${formatDate(value)}${value === today ? ' · Today' : ''}`}
        </Text>
      </Pressable>
      <Pressable onPress={() => step(1)} disabled={isAll} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white active:bg-slate-50" style={{ opacity: isAll ? 0.4 : 1 }}>
        <Feather name="chevron-right" size={18} color="#1b2240" />
      </Pressable>
      {allowAll ? (
        <Pressable onPress={() => onChange(isAll ? today : 'all')} className={`ml-2 h-10 items-center justify-center rounded-xl border px-3 ${isAll ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-200 bg-white'}`}>
          <Text className={`text-[11px] font-bold ${isAll ? 'text-white' : 'text-slate-600'}`}>All</Text>
        </Pressable>
      ) : null}

      {Platform.OS === 'ios' ? (
        <Sheet visible={iosOpen} title="Select date" onClose={() => setIosOpen(false)} footer={<Button label="Done" onPress={() => setIosOpen(false)} />}>
          <DateTimePicker value={current} mode="date" display="inline" onValueChange={(_e, d) => onChange(toISO(d))} />
        </Sheet>
      ) : null}
    </View>
  );
}
