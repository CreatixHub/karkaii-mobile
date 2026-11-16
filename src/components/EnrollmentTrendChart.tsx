import { View, Text } from 'react-native';
import { ENROLLMENT_TREND } from '@/data/dashboard';

// Plain View-based bars with pixel heights (not percentages — the column
// wrapper has no fixed height for a percentage to resolve against) — avoids
// pulling in a native charting dependency just for this. Swap for a real
// chart lib if the data gets richer.
const BAR_AREA_HEIGHT = 96;

export default function EnrollmentTrendChart() {
  const max = Math.max(...ENROLLMENT_TREND.map((d) => d.value));
  return (
    <View className="flex-row items-end justify-between">
      {ENROLLMENT_TREND.map((point) => (
        <View key={point.label} className="items-center flex-1">
          <View
            className="w-5 rounded-t-md bg-[#3D5EE1]"
            style={{ height: Math.max(4, (point.value / max) * BAR_AREA_HEIGHT) }}
          />
          <Text className="mt-2 text-[10px] text-slate-500">{point.label}</Text>
        </View>
      ))}
    </View>
  );
}
