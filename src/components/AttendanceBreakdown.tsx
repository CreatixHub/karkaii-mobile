import { View, Text } from 'react-native';
import { ATTENDANCE_BREAKDOWN } from '@/data/dashboard';

export default function AttendanceBreakdown() {
  return (
    <View>
      <View className="h-3 w-full flex-row overflow-hidden rounded-full bg-slate-100">
        {ATTENDANCE_BREAKDOWN.map((segment) => (
          <View
            key={segment.label}
            style={{ width: `${segment.value}%`, backgroundColor: segment.color }}
          />
        ))}
      </View>
      <View className="mt-3 flex-row flex-wrap gap-x-4 gap-y-2">
        {ATTENDANCE_BREAKDOWN.map((segment) => (
          <View key={segment.label} className="flex-row items-center">
            <View
              className="mr-1.5 h-2 w-2 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <Text className="text-xs text-slate-600">
              {segment.label} · {segment.value}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
