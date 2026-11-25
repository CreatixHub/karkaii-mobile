import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Pill, ProgressBar } from '@/ui/basics';
import { TONES } from '@/ui/tone';
import type { Entity } from '@/core/store/store';
import type { ResourceConfig } from './types';

export function RecordCard<T extends Entity>({
  cfg,
  row,
  selected,
  selecting,
  onPress,
  onLongPress,
}: {
  cfg: ResourceConfig<T>;
  row: T;
  selected: boolean;
  selecting: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const status = cfg.status?.(row);
  const badges = cfg.badges?.(row) ?? [];
  const progress = cfg.progress?.(row);
  const code = cfg.code?.(row);
  const subtitle = cfg.subtitle?.(row);
  const facts = cfg.facts
    .map((f) => ({ label: f.label, value: f.value(row) }))
    .filter((f) => f.value !== undefined && f.value !== null && f.value !== '');

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      delayLongPress={280}
      className={`mx-4 mb-3 rounded-2xl border bg-white dark:bg-[#131022] p-3.5 shadow-sm shadow-black/5 active:opacity-90 ${selected ? 'border-[#3D5EE1]' : 'border-slate-100 dark:border-[#262038]'}`}
    >
      <View className="flex-row items-start">
        {selecting ? (
          <View className={`mr-3 mt-0.5 h-5 w-5 items-center justify-center rounded-md border ${selected ? 'border-[#3D5EE1] bg-[#3D5EE1]' : 'border-slate-300 dark:border-[#3d3756] bg-white dark:bg-[#131022]'}`}>
            {selected ? <Feather name="check" size={13} color="#fff" /> : null}
          </View>
        ) : null}
        <View className="flex-1 pr-2">
          {code ? <Text className="mb-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400 dark:text-[#8b879b]">{code}</Text> : null}
          <Text className="text-[15px] font-bold text-[#1b2240] dark:text-[#EFEFF2]" numberOfLines={2}>
            {cfg.title(row)}
          </Text>
          {subtitle ? (
            <Text className="mt-0.5 text-xs text-slate-500 dark:text-[#a29fb0]" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {status ? <Pill label={status.label} tone={status.tone} /> : null}
      </View>

      {badges.length ? (
        <View className="mt-2 flex-row flex-wrap gap-1.5">
          {badges.map((b, i) => (
            <Pill key={`${b.label}-${i}`} label={b.label} tone={b.tone} />
          ))}
        </View>
      ) : null}

      {facts.length ? (
        <View className="mt-3 flex-row flex-wrap">
          {facts.map((f) => (
            <View key={f.label} style={{ width: '50%' }} className="mb-2 pr-2">
              <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">{f.label}</Text>
              <Text className="text-xs font-semibold text-slate-800 dark:text-[#EFEFF2]" numberOfLines={1}>
                {String(f.value)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {progress ? (
        <View className="mt-1">
          <View className="mb-1 flex-row justify-between">
            <Text className="text-[10px] text-slate-400 dark:text-[#8b879b]">{progress.label}</Text>
            <Text style={{ color: TONES[progress.tone ?? 'primary'].fg }} className="text-[10px] font-bold">
              {progress.max > 0 ? Math.round((progress.value / progress.max) * 100) : 0}%
            </Text>
          </View>
          <ProgressBar value={progress.value} max={progress.max} tone={progress.tone} />
        </View>
      ) : null}
    </Pressable>
  );
}
