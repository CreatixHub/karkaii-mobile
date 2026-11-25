import React from 'react';
import { Text, View } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toLowerCase();

  let bg = 'bg-slate-100 dark:bg-[#1B1632]';
  let text = 'text-slate-600 dark:text-[#B9B7C0]';

  if (s.includes('active') || s.includes('paid') || s.includes('present') || s.includes('approved') || s.includes('accepted')) {
    bg = 'bg-emerald-50 dark:bg-[#14291f] border border-emerald-200 dark:border-[#3d3756]';
    text = 'text-emerald-700 dark:text-emerald-300';
  } else if (s.includes('pending') || s.includes('review') || s.includes('wait') || s.includes('partial') || s.includes('late')) {
    bg = 'bg-amber-50 dark:bg-[#2e2616] border border-amber-200 dark:border-[#3d3756]';
    text = 'text-amber-700 dark:text-amber-300';
  } else if (s.includes('inactive') || s.includes('overdue') || s.includes('absent') || s.includes('rejected') || s.includes('damaged') || s.includes('suspended')) {
    bg = 'bg-red-50 dark:bg-[#2e1a22] border border-red-200 dark:border-[#3d3756]';
    text = 'text-red-700 dark:text-red-300';
  } else if (s.includes('leave') || s.includes('upcoming') || s.includes('route') || s.includes('issued')) {
    bg = 'bg-blue-50 dark:bg-[#162540] border border-blue-200 dark:border-[#3d3756]';
    text = 'text-blue-700 dark:text-blue-300';
  }

  return (
    <View className={`rounded-full px-2.5 py-0.5 ${bg} self-start`}>
      <Text className={`text-[#202C4B] dark:text-[#EFEFF2] text-[10px] font-bold ${text}`}>{status}</Text>
    </View>
  );
}
