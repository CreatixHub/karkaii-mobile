import React from 'react';
import { Stack } from 'expo-router';
import { DrawerToggleButton } from 'expo-router/drawer';
import { colors } from '@/theme/colors';
import { PageHeaderLeft } from './PageHeaderLeft';
import { MENU, type SectionDef } from './menu';

/** The stack every section folder uses: hub screen (with the drawer button) + pages pushed on top. */
export function SectionStack({ section }: { section: SectionDef['key'] }) {
  const def = MENU.find((s) => s.key === section)!;
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: colors.ink,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: def.label, headerLeft: () => <DrawerToggleButton tintColor={colors.ink} /> }}
      />
      <Stack.Screen name="[page]" options={{ title: def.label, headerLeft: ({ canGoBack }) => <PageHeaderLeft canGoBack={canGoBack} /> }} />
    </Stack>
  );
}
