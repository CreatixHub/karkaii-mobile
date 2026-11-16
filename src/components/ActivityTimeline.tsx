import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ACTIVITY_TIMELINE } from '@/data/dashboard';

export default function ActivityTimeline() {
  return (
    <View>
      {ACTIVITY_TIMELINE.map((item, index) => (
        <View key={item.id} className="flex-row">
          <View className="items-center">
            <View className="h-7 w-7 items-center justify-center rounded-full bg-[#3D5EE11A]">
              <Feather name={item.icon as any} size={13} color="#3D5EE1" />
            </View>
            {index < ACTIVITY_TIMELINE.length - 1 ? (
              <View className="w-px flex-1 bg-slate-200" />
            ) : null}
          </View>
          <View className="ml-3 flex-1 pb-4">
            <Text className="text-sm text-slate-800">{item.title}</Text>
            <Text className="mt-0.5 text-xs text-slate-400">{item.time}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}
