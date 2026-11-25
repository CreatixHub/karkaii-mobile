/**
 * Light / dark mode, one source of truth. NativeWind owns the colour scheme (the `dark:` classes follow it);
 * this provider restores the saved choice at start-up, saves every change, and hands screens the few colours that
 * cannot be written as classes (header bar, icons). Palette values follow the web app's dark theme ramp
 * (karkaii-frontend `$dark-700/800/900`, `$dark-100/300`) with the same brand blue.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'nativewind';
import { StatusBar } from 'expo-status-bar';
import { colors } from './colors';

export type ThemeMode = 'light' | 'dark';
const KEY = 'karkaii:theme';

export interface Palette {
  background: string;
  surface: string;
  border: string;
  text: string;
  muted: string;
}

export const PALETTES: Record<ThemeMode, Palette> = {
  light: { background: colors.background, surface: colors.surface, border: colors.border, text: colors.ink, muted: colors.muted },
  dark: { background: '#0F0C1C', surface: '#131022', border: '#322D46', text: '#EFEFF2', muted: '#B9B7C0' },
};

interface ThemeValue {
  mode: ThemeMode;
  isDark: boolean;
  palette: Palette;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const mode: ThemeMode = colorScheme === 'dark' ? 'dark' : 'light';

  // Restore the saved choice ONCE at start-up. (This must not re-run when the scheme changes, or it would
  // keep re-applying the old saved value and the theme would flip back and forth.) Light is the default.
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    AsyncStorage.getItem(KEY)
      .then((saved) => { setColorScheme(saved === 'dark' ? 'dark' : 'light'); })
      .catch(() => { /* no saved choice */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setColorScheme(m);
    AsyncStorage.setItem(KEY, m).catch(() => { /* the choice just won't survive a restart */ });
  }, [setColorScheme]);

  const value = useMemo<ThemeValue>(() => ({ mode, isDark: mode === 'dark', palette: PALETTES[mode], toggle: () => setMode(mode === 'dark' ? 'light' : 'dark'), setMode }), [mode, setMode]);

  return (
    <ThemeContext.Provider value={value}>
      <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
