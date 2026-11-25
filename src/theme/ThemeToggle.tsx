import React from 'react';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

/** Sun / moon button for the header: switches between light and dark mode. */
export function ThemeToggle() {
  const { isDark, toggle, palette } = useTheme();
  return (
    <Pressable onPress={toggle} hitSlop={8} accessibilityRole="button" accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="mr-3 h-9 w-9 items-center justify-center rounded-full">
      <Feather name={isDark ? 'sun' : 'moon'} size={20} color={palette.text} />
    </Pressable>
  );
}
