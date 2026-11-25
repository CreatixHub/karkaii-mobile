import React from 'react';
import { useTheme } from '@/theme/ThemeProvider';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TONES, type Tone } from './tone';

type IconName = React.ComponentProps<typeof Feather>['name'];

export interface StatTile {
  label: string;
  value: string | number;
  tone?: Tone;
  icon?: IconName;
}

export function SummaryStrip({ items }: { items: StatTile[] }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }} className="mb-3">
      {items.map((s) => {
        const t = TONES[s.tone ?? 'primary'];
        return (
          <View key={s.label} className="min-w-[108px] rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022] px-3 py-2.5 shadow-sm shadow-black/5">
            <View className="flex-row items-center">
              {s.icon ? (
                <View style={{ backgroundColor: t.bg }} className="mr-2 h-6 w-6 items-center justify-center rounded-lg">
                  <Feather name={s.icon} size={12} color={t.fg} />
                </View>
              ) : null}
              <Text className="flex-1 text-[10px] font-semibold uppercase text-slate-400 dark:text-[#8b879b]" numberOfLines={1}>
                {s.label}
              </Text>
            </View>
            <Text style={{ color: t.fg }} className="mt-1.5 text-lg font-extrabold" numberOfLines={1}>
              {s.value}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

export function SegmentedTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string; count?: number }[];
  active: string;
  onChange: (key: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-3">
      {tabs.map((t) => {
        const on = t.key === active;
        return (
          <Pressable
            key={t.key}
            onPress={() => onChange(t.key)}
            className={`flex-row items-center rounded-full border px-3.5 py-1.5 ${on ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022]'}`}
          >
            <Text className={`text-xs font-bold ${on ? 'text-white' : 'text-slate-600 dark:text-[#B9B7C0]'}`}>{t.label}</Text>
            {t.count !== undefined ? (
              <View className={`ml-1.5 rounded-full px-1.5 ${on ? 'bg-white/25' : 'bg-slate-100 dark:bg-[#1B1632]'}`}>
                <Text className={`text-[10px] font-bold ${on ? 'text-white' : 'text-slate-500 dark:text-[#a29fb0]'}`}>{t.count}</Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <View className="flex-1 flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3">
      <Feather name="search" size={15} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? 'Search…'}
        placeholderTextColor="#94a3b8"
        returnKeyType="search"
        className="ml-2 flex-1 py-2.5 text-sm text-[#202C4B] dark:text-[#EFEFF2]"
      />
      {value ? (
        <Pressable onPress={() => onChange('')} hitSlop={10}>
          <Feather name="x-circle" size={15} color="#94a3b8" />
        </Pressable>
      ) : null}
    </View>
  );
}

export function ToolbarButton({ icon, label, badge, onPress }: { icon: IconName; label?: string; badge?: number; onPress: () => void }) {
  const ink = useTheme().palette.text;
  return (
    <Pressable onPress={onPress} className="h-11 flex-row items-center justify-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3 active:bg-slate-50">
      <Feather name={icon} size={15} color={ink} />
      {label ? <Text className="ml-1.5 text-xs font-semibold text-[#1b2240] dark:text-[#EFEFF2]">{label}</Text> : null}
      {badge ? (
        <View className="ml-1.5 h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3D5EE1] px-1">
          <Text className="text-[#202C4B] dark:text-[#EFEFF2] text-[9px] font-bold text-white">{badge}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

export function FilterChips({ chips, onRemove, onClear }: { chips: { key: string; label: string }[]; onRemove: (key: string) => void; onClear: () => void }) {
  if (!chips.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }} className="mb-3">
      {chips.map((c) => (
        <Pressable key={c.key} onPress={() => onRemove(c.key)} className="flex-row items-center rounded-full bg-[#E9EDFC] dark:bg-[#1d2450] px-2.5 py-1">
          <Text className="text-[11px] font-semibold text-[#3D5EE1] dark:text-[#7d95f5]">{c.label}</Text>
          <Feather name="x" size={11} color="#3D5EE1" style={{ marginLeft: 4 }} />
        </Pressable>
      ))}
      <Pressable onPress={onClear} className="justify-center px-1">
        <Text className="text-[11px] font-bold text-slate-500 dark:text-[#a29fb0]">Clear all</Text>
      </Pressable>
    </ScrollView>
  );
}
