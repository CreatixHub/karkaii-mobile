import React from 'react';
import { Drawer } from 'expo-router/drawer';
import DrawerContent from '@/components/DrawerContent';
import { MENU_ITEMS } from '@/data/menu';

export default function AppDrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1b2240',
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        drawerStyle: { width: 280 },
      }}
    >
      {MENU_ITEMS.map((item) => (
        <Drawer.Screen
          key={item.key}
          name={item.key === 'dashboard' ? 'index' : item.key}
          options={{ title: item.label, drawerLabel: item.label }}
        />
      ))}
    </Drawer>
  );
}
