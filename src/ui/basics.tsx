import React from 'react';
import { ActivityIndicator, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { TONES, type Tone } from './tone';
import { colors } from '@/theme/colors';

type IconName = React.ComponentProps<typeof Feather>['name'];

export function Pill({ label, tone = 'neutral', icon }: { label: string; tone?: Tone; icon?: IconName }) {
  const t = TONES[tone];
  return (
    <View
      style={{ backgroundColor: t.bg, borderColor: t.border }}
      className="flex-row items-center self-start rounded-full border px-2 py-0.5"
    >
      {icon ? <Feather name={icon} size={10} color={t.fg} style={{ marginRight: 3 }} /> : null}
      <Text style={{ color: t.fg }} className="text-[10px] font-bold" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled,
  loading,
  small,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: IconName;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const palette = {
    primary: { bg: colors.primary, fg: '#fff', border: colors.primary },
    secondary: { bg: '#fff', fg: colors.ink, border: '#D9DFEA' },
    danger: { bg: '#fff', fg: '#B91C1C', border: '#F5BEBE' },
    ghost: { bg: 'transparent', fg: colors.primary, border: 'transparent' },
  }[variant];
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        { backgroundColor: palette.bg, borderColor: palette.border, opacity: disabled ? 0.45 : 1 },
        style,
      ]}
      className={`flex-row items-center justify-center rounded-xl border active:opacity-80 ${small ? 'px-3 py-2' : 'px-4 py-3'}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={palette.fg} />
      ) : (
        <>
          {icon ? <Feather name={icon} size={small ? 13 : 15} color={palette.fg} style={{ marginRight: 6 }} /> : null}
          <Text style={{ color: palette.fg }} className={`font-bold ${small ? 'text-xs' : 'text-sm'}`}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.muted,
  size = 18,
  label,
}: {
  icon: IconName;
  onPress?: () => void;
  color?: string;
  size?: number;
  label?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityLabel={label}
      className="h-9 w-9 items-center justify-center rounded-full active:bg-slate-100"
    >
      <Feather name={icon} size={size} color={color} />
    </Pressable>
  );
}

export function EmptyState({ icon = 'inbox', title, hint }: { icon?: IconName; title: string; hint?: string }) {
  return (
    <View className="items-center px-6 py-14">
      <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-slate-100">
        <Feather name={icon} size={24} color="#94a3b8" />
      </View>
      <Text className="text-center text-sm font-bold text-slate-700">{title}</Text>
      {hint ? <Text className="mt-1 text-center text-xs text-slate-400">{hint}</Text> : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style} className="rounded-2xl border border-slate-100 bg-white p-3.5 shadow-sm shadow-black/5">
      {children}
    </View>
  );
}

export function ProgressBar({ value, max = 100, tone = 'primary' }: { value: number; max?: number; tone?: Tone }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <View className="h-1.5 overflow-hidden rounded-full bg-slate-100">
      <View style={{ width: `${pct}%`, backgroundColor: TONES[tone].fg }} className="h-full rounded-full" />
    </View>
  );
}

export function KeyValue({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <View className="flex-row border-b border-slate-100 py-2">
      <Text className="w-[38%] pr-2 text-xs text-slate-400">{label}</Text>
      <Text className="flex-1 text-xs font-semibold text-slate-800">{value === undefined || value === null || value === '' ? '—' : String(value)}</Text>
    </View>
  );
}
