import '../global.css';

import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import DrawerContent from '@/components/DrawerContent';
import { MENU_ITEMS } from '@/data/menu';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
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
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
