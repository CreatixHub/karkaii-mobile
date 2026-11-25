import React from 'react';
import { Stack } from 'expo-router';
import { PageHeaderLeft } from '@/core/nav/PageHeaderLeft';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemeToggle } from '@/theme/ThemeToggle';

export default function DashboardLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[page]" options={{ title: 'Dashboard', headerLeft: ({ canGoBack }) => <PageHeaderLeft canGoBack={canGoBack} /> }} />
    </Stack>
  );
}
