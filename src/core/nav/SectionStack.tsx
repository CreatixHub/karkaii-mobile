import React from 'react';
import { Stack } from 'expo-router';
import { DrawerToggleButton } from 'expo-router/drawer';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemeToggle } from '@/theme/ThemeToggle';
import { PageHeaderLeft } from './PageHeaderLeft';
import { MENU, type SectionDef } from './menu';

/** The stack every section folder uses: hub screen (with the drawer button) + pages pushed on top. */
export function SectionStack({ section }: { section: SectionDef['key'] }) {
  const def = MENU.find((s) => s.key === section)!;
  const { palette } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: palette.surface },
        headerTintColor: palette.text,
        headerRight: () => <ThemeToggle />,
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: palette.background },
      }}
    >
      <Stack.Screen
        name="index"
        options={{ title: def.label, headerLeft: () => <DrawerToggleButton tintColor={palette.text} /> }}
      />
      <Stack.Screen name="[page]" options={{ title: def.label, headerLeft: ({ canGoBack }) => <PageHeaderLeft canGoBack={canGoBack} /> }} />
    </Stack>
  );
}
