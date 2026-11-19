import React, { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Pill } from '@/ui/basics';
import { TONES } from '@/ui/tone';
import { toISO, todayISO, formatDate } from '@/core/utils/date';
import type { HolidayCategory, HolidayRecord } from '@/data/seed/hrm';
import { categoryTone } from './configs';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const LEGEND: HolidayCategory[] = ['Public', 'School', 'Festival', 'Examination', 'Optional'];

/** Month grid: a dot per holiday category on each day; tap a day to see what falls on it. */
export function HolidayCalendar({ rows }: { rows: HolidayRecord[] }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [picked, setPicked] = useState<string | null>(todayISO());

  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const out: (string | null)[] = Array(first.getDay()).fill(null);
    for (let d = 1; d <= days; d++) out.push(toISO(new Date(cursor.getFullYear(), cursor.getMonth(), d)));
    while (out.length % 7) out.push(null);
    return out;
  }, [cursor]);

  const on = (iso: string) => rows.filter((h) => h.start <= iso && h.end >= iso);
  const today = todayISO();
  const shown = picked ? on(picked) : [];
  const move = (n: number) => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + n, 1));

  return (
    <View className="mx-4 mb-3 rounded-2xl border border-slate-100 bg-white p-3.5">
      <View className="mb-2 flex-row items-center justify-between">
        <Pressable onPress={() => move(-1)} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100">
          <Feather name="chevron-left" size={18} color="#1b2240" />
        </Pressable>
        <Text className="text-sm font-extrabold text-[#1b2240]">
          {MONTHS[cursor.getMonth()]} {cursor.getFullYear()}
        </Text>
        <Pressable onPress={() => move(1)} hitSlop={8} className="h-8 w-8 items-center justify-center rounded-lg active:bg-slate-100">
          <Feather name="chevron-right" size={18} color="#1b2240" />
        </Pressable>
      </View>

      <View className="flex-row">
        {WEEKDAYS.map((w, i) => (
          <Text key={i} className="flex-1 text-center text-[10px] font-bold text-slate-400">
            {w}
          </Text>
        ))}
      </View>

      <View className="mt-1 flex-row flex-wrap">
        {cells.map((iso, i) => {
          if (!iso) return <View key={i} style={{ width: '14.2857%', height: 40 }} />;
          const hol = on(iso);
          const isToday = iso === today;
          const isPicked = iso === picked;
          return (
            <Pressable key={iso} onPress={() => setPicked(iso)} style={{ width: '14.2857%', height: 40 }} className="items-center justify-center">
              <View className={`h-8 w-8 items-center justify-center rounded-full ${isPicked ? 'bg-[#3D5EE1]' : isToday ? 'bg-[#E9EDFC]' : ''}`}>
                <Text className={`text-xs font-semibold ${isPicked ? 'text-white' : isToday ? 'text-[#3D5EE1]' : 'text-slate-700'}`}>{Number(iso.slice(8))}</Text>
              </View>
              <View className="absolute bottom-0 flex-row gap-0.5">
                {[...new Set(hol.map((h) => h.category))].slice(0, 3).map((c) => (
                  <View key={c} style={{ backgroundColor: TONES[categoryTone[c]].fg }} className="h-1 w-1 rounded-full" />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="mt-2 flex-row flex-wrap gap-x-3 gap-y-1">
        {LEGEND.map((c) => (
          <View key={c} className="flex-row items-center">
            <View style={{ backgroundColor: TONES[categoryTone[c]].fg }} className="mr-1 h-2 w-2 rounded-full" />
            <Text className="text-[10px] text-slate-500">{c}</Text>
          </View>
        ))}
      </View>

      {picked ? (
        <View className="mt-3 border-t border-slate-100 pt-3">
          <Text className="mb-1.5 text-[11px] font-bold text-slate-500">{formatDate(picked)}</Text>
          {shown.length ? (
            shown.map((h) => (
              <View key={h.id} className="mb-1.5 flex-row items-center justify-between">
                <Text className="flex-1 pr-2 text-xs font-semibold text-slate-800" numberOfLines={1}>
                  {h.name}
                </Text>
                <Pill label={h.category} tone={categoryTone[h.category]} />
              </View>
            ))
          ) : (
            <Text className="text-xs text-slate-400">No holiday on this day.</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
