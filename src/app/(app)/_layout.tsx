import React from 'react';
import { Drawer } from 'expo-router/drawer';
import DrawerContent from '@/components/DrawerContent';
import { useTheme } from '@/theme/ThemeProvider';
import { ThemeToggle } from '@/theme/ThemeToggle';

/**
 * Drawer = full module access (role-filtered inside DrawerContent). Folder routes (dashboard, academic, hrm, finance) are
 * the rebuilt sections and draw their own stack headers; the plain screens (people, campus,
 * reports, communication, administration) are the legacy screens that have not been rebuilt yet.
 */
export default function AppDrawerLayout() {
  const { palette } = useTheme();
  const header = {
    headerStyle: { backgroundColor: palette.surface },
    headerTintColor: palette.text,
    headerRight: () => <ThemeToggle />,
    headerTitleStyle: { fontSize: 16, fontWeight: '600' as const },
  };
  return (
    <Drawer drawerContent={(props) => <DrawerContent {...props} />} screenOptions={{ ...header, drawerStyle: { width: 300, backgroundColor: palette.surface } }}>
      <Drawer.Screen name="index" options={{ headerShown: false, title: 'Home' }} />
      <Drawer.Screen name="dashboard" options={{ headerShown: false, title: 'Dashboard' }} />
      <Drawer.Screen name="academic" options={{ headerShown: false, title: 'Academic' }} />
      <Drawer.Screen name="hrm" options={{ headerShown: false, title: 'HRM' }} />
      <Drawer.Screen name="finance" options={{ headerShown: false, title: 'Finance & Accounts' }} />
      <Drawer.Screen name="people" options={{ headerShown: false, title: 'People & Admission' }} />
      <Drawer.Screen name="campus" options={{ headerShown: false, title: 'Campus Operations' }} />
      <Drawer.Screen name="reports" options={{ headerShown: false, title: 'Reports' }} />
      <Drawer.Screen name="communication" options={{ headerShown: false, title: 'Communication' }} />
      <Drawer.Screen name="administration" options={{ headerShown: false, title: 'Administration' }} />
      <Drawer.Screen name="profile" options={{ title: 'My Profile' }} />
    </Drawer>
  );
}
