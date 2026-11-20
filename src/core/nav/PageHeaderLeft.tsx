import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { DrawerToggleButton } from 'expo-router/drawer';
import { Feather } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

/**
 * Left side of the top bar on every module page: a back arrow when there is somewhere to go back to,
 * and always the menu button, so the drawer is reachable from any page (also when the page was opened straight from the drawer).
 */
export function PageHeaderLeft({ canGoBack }: { canGoBack?: boolean }) {
  const router = useRouter();
  return (
    <View className="flex-row items-center">
      {canGoBack ? (
        <Pressable onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back" className="h-10 w-9 items-center justify-center">
          <Feather name="arrow-left" size={22} color={colors.ink} />
        </Pressable>
      ) : null}
      <DrawerToggleButton tintColor={colors.ink} />
    </View>
  );
}
