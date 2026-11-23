import React from 'react';
import { View } from 'react-native';
import { DrawerToggleButton } from 'expo-router/drawer';
import { colors } from '@/theme/colors';

/**
 * Left side of the top bar on every page: just the menu button, so the drawer is reachable from any page.
 * There is no back arrow; pages are reached from the menu.
 */
export function PageHeaderLeft(_props: { canGoBack?: boolean }) {
  return (
    <View className="flex-row items-center">
      <DrawerToggleButton tintColor={colors.ink} />
    </View>
  );
}
