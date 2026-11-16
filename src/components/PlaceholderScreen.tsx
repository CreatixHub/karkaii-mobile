import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function PlaceholderScreen({
  title,
  icon,
}: {
  title: string;
  icon: string;
}) {
  return (
    <View className="flex-1 items-center justify-center bg-[#f4f6fb] px-8">
      <View className="h-16 w-16 items-center justify-center rounded-2xl bg-[#3D5EE11A]">
        <Feather name={icon as any} size={28} color="#3D5EE1" />
      </View>
      <Text className="mt-4 text-base font-semibold text-slate-900">{title}</Text>
      <Text className="mt-2 text-center text-sm text-slate-500">
        This section&rsquo;s screens haven&rsquo;t been built yet — the menu is wired up, the pages come next.
      </Text>
    </View>
  );
}
