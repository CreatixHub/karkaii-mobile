import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { REPORTS } from '@/data/reports';

export default function Reports() {
  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerClassName="p-4 pb-10">
      <Text className="mb-1 text-sm text-slate-500">
        Pick a report to view — these open with sample data until the reporting API is wired up.
      </Text>
      <View className="mt-3 gap-y-3">
        {REPORTS.map((report) => (
          <Pressable
            key={report.key}
            className="flex-row items-center rounded-2xl border border-slate-100 bg-white p-4 shadow-sm shadow-black/5"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${report.tint}1A` }}
            >
              <Feather name={report.icon as any} size={18} color={report.tint} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-semibold text-slate-900">{report.title}</Text>
              <Text className="mt-0.5 text-xs text-slate-500">{report.description}</Text>
            </View>
            <Feather name="chevron-right" size={18} color="#94a3b8" />
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
