import { View, Text, Image, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import type { DrawerContentComponentProps } from 'expo-router/drawer';
import { MENU_ITEMS } from '@/data/menu';

// Static for now — swap for the signed-in user/org once auth is wired up
// (mirrors karkaii-frontend's sidebar, which reads this from useAuth()).
const CURRENT_USER = { name: 'Admin User', role: 'Owner', org: 'Karkaii Demo School' };

export default function DrawerContent(props: DrawerContentComponentProps) {
  const { state, navigation } = props;
  const activeRouteName = state.routeNames[state.index];

  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="px-5 pb-4 pt-2">
        <Image
          source={require('../../assets/icon.png')}
          className="h-10 w-10 rounded-xl"
          resizeMode="contain"
        />
        <Text className="mt-3 text-base font-bold text-slate-900">{CURRENT_USER.org}</Text>
        <View className="mt-2 flex-row items-center">
          <View className="h-7 w-7 items-center justify-center rounded-full bg-[#3D5EE1]">
            <Text className="text-xs font-semibold text-white">
              {CURRENT_USER.name.charAt(0)}
            </Text>
          </View>
          <View className="ml-2">
            <Text className="text-xs font-semibold text-slate-800">{CURRENT_USER.name}</Text>
            <Text className="text-[11px] text-slate-400">{CURRENT_USER.role}</Text>
          </View>
        </View>
      </View>

      <View className="h-px bg-slate-100" />

      <View className="flex-1 px-3 pt-3">
        {MENU_ITEMS.map((item) => {
          const isActive = activeRouteName === item.key || (item.key === 'dashboard' && activeRouteName === 'index');
          return (
            <Pressable
              key={item.key}
              onPress={() => navigation.navigate(item.key === 'dashboard' ? 'index' : item.key)}
              className={`mb-1 flex-row items-center rounded-xl px-3 py-2.5 ${
                isActive ? 'bg-[#3D5EE11A]' : ''
              }`}
            >
              <Feather
                name={item.icon as any}
                size={18}
                color={isActive ? '#3D5EE1' : '#6A7287'}
              />
              <Text
                className={`ml-3 text-sm ${
                  isActive ? 'font-semibold text-[#3D5EE1]' : 'text-slate-600'
                }`}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View className="border-t border-slate-100 px-5 py-4">
        <Text className="text-[11px] text-slate-400">Karkaii · mobile starter</Text>
      </View>
    </SafeAreaView>
  );
}
