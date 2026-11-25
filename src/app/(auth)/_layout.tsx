import { useTheme } from '@/theme/ThemeProvider';
import { Stack } from 'expo-router';

export default function AuthLayout() {
  const { palette } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: palette.background } }} />;
}
