import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { StatCard as StatCardData } from '@/data/dashboard';

export default function StatCard({ data }: { data: StatCardData }) {
  const isUp = data.trend === 'up';
  return (
    <View className="w-[47%] rounded-2xl bg-white p-4 shadow-sm shadow-black/5 border border-slate-100">
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${data.tint}1A` }}
      >
        <Feather name={data.icon as any} size={18} color={data.tint} />
      </View>
      <Text className="mt-3 text-xl font-bold text-slate-900">{data.value}</Text>
      <Text className="mt-0.5 text-xs text-slate-500">{data.label}</Text>
      <View className="mt-2 flex-row items-center">
        <Feather
          name={isUp ? 'arrow-up-right' : 'arrow-down-right'}
          size={12}
          color={isUp ? '#1ABE17' : '#dc2626'}
        />
        <Text
          className="ml-1 text-[11px] font-semibold"
          style={{ color: isUp ? '#1ABE17' : '#dc2626' }}
        >
          {data.delta}
        </Text>
      </View>
    </View>
  );
}
