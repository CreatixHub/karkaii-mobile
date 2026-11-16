import { View, Text } from 'react-native';
import type { ReactNode } from 'react';

export default function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View className="rounded-2xl bg-white p-4 border border-slate-100 shadow-sm shadow-black/5">
      <Text className="text-sm font-semibold text-slate-900">{title}</Text>
      {subtitle ? <Text className="mt-0.5 text-xs text-slate-500">{subtitle}</Text> : null}
      <View className="mt-3">{children}</View>
    </View>
  );
}
