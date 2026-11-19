import React from 'react';
import { Stack } from 'expo-router';
import { DrawerToggleButton } from 'expo-router/drawer';
import { colors } from '@/theme/colors';

export default function DashboardLayout() {
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
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="[page]" options={{ title: 'Dashboard', headerLeft: () => <DrawerToggleButton tintColor={colors.ink} /> }} />
    </Stack>
  );
}
