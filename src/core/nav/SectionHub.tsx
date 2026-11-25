import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { visibleMenu } from '@/core/auth/access';
import { EmptyState } from '@/ui/basics';
import { pageHref, type SectionDef } from './menu';
import { PAGES } from '@/features/registry';

/** Landing screen of a section: its modules and pages, filtered to what the signed-in role may open. */
export function SectionHub({ section }: { section: SectionDef['key'] }) {
  const { role } = useAuth();
  const def = visibleMenu(role).find((s) => s.key === section);

  if (!def) return <EmptyState icon="lock" title="No access" hint="Your role cannot open this section." />;

  return (
    <ScrollView className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]" contentContainerClassName="p-4 pb-12" showsVerticalScrollIndicator={false}>
      {def.modules.map((m) => (
        <View key={m.label} className="mb-4">
          <View className="mb-2 flex-row items-center">
            <View style={{ backgroundColor: `${def.color}1A` }} className="mr-2 h-7 w-7 items-center justify-center rounded-lg">
              <Feather name={m.icon} size={14} color={def.color} />
            </View>
            <Text className="text-sm font-extrabold text-[#1b2240] dark:text-[#EFEFF2]">{m.label}</Text>
            <Text className="ml-2 text-[11px] text-slate-400 dark:text-[#8b879b]">{m.pages.length} {m.pages.length === 1 ? 'page' : 'pages'}</Text>
          </View>
          <View className="overflow-hidden rounded-2xl border border-slate-100 dark:border-[#262038] bg-white dark:bg-[#131022]">
            {m.pages.map((p, i) => (
              <Pressable
                key={p.key}
                onPress={() => router.push(pageHref(def.key, p.key) as Href)}
                className={`flex-row items-center px-4 py-3.5 active:bg-slate-50 ${i > 0 ? 'border-t border-slate-100 dark:border-[#262038]' : ''}`}
              >
                <Feather name={p.icon} size={16} color={def.color} />
                <Text className="ml-3 flex-1 text-sm font-semibold text-slate-800 dark:text-[#EFEFF2]">{p.label}</Text>
                {!PAGES[p.key] ? <Text className="mr-2 text-[10px] font-bold text-amber-600 dark:text-amber-300">SOON</Text> : null}
                <Feather name="chevron-right" size={16} color="#cbd5e1" />
              </Pressable>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
