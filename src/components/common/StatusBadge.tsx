import React from 'react';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase();

  let bg = 'bg-slate-100';
  let text = 'text-slate-600';

  if (s.includes('active') || s.includes('paid') || s.includes('present') || s.includes('approved') || s.includes('accepted')) {
    bg = 'bg-emerald-50 border border-emerald-200';
    text = 'text-emerald-700';
  } else if (s.includes('pending') || s.includes('review') || s.includes('wait') || s.includes('partial') || s.includes('late')) {
    bg = 'bg-amber-50 border border-amber-200';
    text = 'text-amber-700';
  } else if (s.includes('inactive') || s.includes('overdue') || s.includes('absent') || s.includes('rejected') || s.includes('damaged') || s.includes('suspended')) {
    bg = 'bg-red-50 border border-red-200';
    text = 'text-red-700';
  } else if (s.includes('leave') || s.includes('upcoming') || s.includes('route') || s.includes('issued')) {
    bg = 'bg-blue-50 border border-blue-200';
    text = 'text-blue-700';
  }

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg} self-start`}>
      <Text className={`text-[10px] font-bold ${text}`}>{status}</Text>
    </View>
  );
}
