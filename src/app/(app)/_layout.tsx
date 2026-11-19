import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Drawer } from 'expo-router/drawer';
import { router } from 'expo-router';
import DrawerContent from '@/components/DrawerContent';
import { MENU_ITEMS } from '@/data/menu';
import { useAuth } from '@/hooks/useAuth';

function HeaderProfileButton() {
  const { user } = useAuth();
  const displayName = user?.name || 'Staff';
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <Pressable
      onPress={() => router.push('/(app)/profile' as any)}
      className="mr-3.5 flex-row items-center py-1 px-2.5 rounded-full bg-slate-100 border border-slate-200 active:bg-slate-200"
    >
      <View className="h-6 w-6 rounded-full bg-indigo-600 items-center justify-center mr-1.5">
        <Text className="text-[11px] font-bold text-white">{initial}</Text>
      </View>
      <Text className="text-xs font-semibold text-slate-800" numberOfLines={1}>
        {displayName.split(' ')[0]}
      </Text>
    </Pressable>
  );
}

export default function AppDrawerLayout() {
  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#1b2240',
        headerTitleStyle: { fontSize: 16, fontWeight: '600' },
        drawerStyle: { width: 280 },
        headerRight: () => <HeaderProfileButton />,
      }}
    >
      {MENU_ITEMS.map((item) => (
        <Drawer.Screen
          key={item.key}
          name={item.key === 'dashboard' ? 'index' : item.key}
          options={{ title: item.label, drawerLabel: item.label }}
        />
      ))}
      <Drawer.Screen
        name="profile"
        options={{
          title: 'My Profile',
          drawerItemStyle: { display: 'none' },
        }}
      />
    </Drawer>
  );
}
