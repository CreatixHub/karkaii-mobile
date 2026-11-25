import React from 'react';
import { Text, View } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { EmptyState } from '@/ui/basics';
import { PAGES } from '@/features/registry';
import { findPage, type SectionDef } from './menu';

/**
 * Resolves /<section>/<page> to a registered page component, after checking the role may open it
 * (same rules as the web menu: sidebarAccess.ts).
 */
export function PageHost({ section }: { section: SectionDef['key'] }) {
  const { page } = useLocalSearchParams<{ page: string }>();
  const { canOpenPage } = useAuth();
  const loc = page ? findPage(section, page) : undefined;

  if (!loc) {
    return <EmptyState icon="help-circle" title="Page not found" hint="This page does not exist in the app." />;
  }
  if (!canOpenPage(section, loc.page.key)) {
    return (
      <>
        <Stack.Screen options={{ title: loc.page.label }} />
        <EmptyState icon="lock" title="No access" hint="Your role does not have access to this page." />
      </>
    );
  }

  const Page = PAGES[loc.page.key];
  const breadcrumb = `${loc.section.label} › ${loc.module.label}${loc.module.label === loc.page.label ? '' : ` › ${loc.page.label}`}`;

  return (
    <>
      <Stack.Screen options={{ title: loc.page.label }} />
      {Page ? (
        <Page breadcrumb={breadcrumb} />
      ) : (
        <View className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
          <EmptyState icon="tool" title={`${loc.page.label} is being rebuilt`} hint="This page is queued for a later implementation batch." />
          <Text className="px-6 text-center text-[11px] text-slate-400 dark:text-[#8b879b]">{breadcrumb}</Text>
        </View>
      )}
    </>
  );
}
