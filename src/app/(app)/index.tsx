import { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import StatCard from '@/components/StatCard';
import SectionCard from '@/components/SectionCard';
import EnrollmentTrendChart from '@/components/EnrollmentTrendChart';
import AttendanceBreakdown from '@/components/AttendanceBreakdown';
import ActivityTimeline from '@/components/ActivityTimeline';
import { STAT_CARDS } from '@/data/dashboard';
import { API_URL } from '@/config/env';
import { useAuth } from '@/hooks/useAuth';

type ConnectionState = 'idle' | 'checking' | 'ok' | 'error';

export default function Dashboard() {
  const { user } = useAuth();
  const [connection, setConnection] = useState<ConnectionState>('idle');

  const checkBackend = useCallback(async () => {
    setConnection('checking');
    try {
      const res = await fetch(`${API_URL}/api/health`);
      setConnection(res.ok ? 'ok' : 'error');
    } catch {
      setConnection('error');
    }
  }, []);

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb]" contentContainerClassName="p-4 pb-10">
      <View className="mb-4 rounded-2xl bg-[#3D5EE1] p-5">
        <Text className="text-lg font-bold text-white">
          Welcome back{user?.name ? `, ${user.name}` : ''} 👋
        </Text>
        <Text className="mt-1 text-sm text-white/80">
          Here&rsquo;s what&rsquo;s happening across your school today.
        </Text>
        <Pressable
          onPress={checkBackend}
          className="mt-4 flex-row items-center self-start rounded-full bg-white/15 px-3 py-1.5"
        >
          <View
            className={`mr-2 h-2 w-2 rounded-full ${
              connection === 'ok'
                ? 'bg-emerald-400'
                : connection === 'error'
                  ? 'bg-red-400'
                  : 'bg-white/60'
            }`}
          />
          <Text className="text-xs text-white">
            {connection === 'idle' && 'Check backend connection'}
            {connection === 'checking' && 'Checking…'}
            {connection === 'ok' && 'Backend connected'}
            {connection === 'error' && 'Backend unreachable — tap to retry'}
          </Text>
        </Pressable>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {STAT_CARDS.map((card) => (
          <StatCard key={card.key} data={card} />
        ))}
      </View>

      <View className="mt-3">
        <SectionCard title="Enrollment Trend" subtitle="New admissions over the last 6 months">
          <EnrollmentTrendChart />
        </SectionCard>
      </View>

      <View className="mt-3">
        <SectionCard title="Attendance Breakdown" subtitle="School-wide, today">
          <AttendanceBreakdown />
        </SectionCard>
      </View>

      <View className="mt-3">
        <SectionCard title="Recent Activity">
          <ActivityTimeline />
        </SectionCard>
      </View>

      <View className="mt-4 flex-row items-center justify-center">
        <Feather name="info" size={12} color="#94a3b8" />
        <Text className="ml-1.5 text-[11px] text-slate-400">
          Sample data — live numbers arrive once the dashboard API is wired up.
        </Text>
      </View>
    </ScrollView>
  );
}
