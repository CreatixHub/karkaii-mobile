import '../global.css';

import React, { useEffect } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';

function RootNavigationGate() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;

    const firstSegment = (segments as string[])[0];
    const inAuthGroup = firstSegment === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Unauthenticated users are redirected to login
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Authenticated users trying to access login go to dashboard
      router.replace('/(app)');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f6fb] px-6">
        <Image
          source={require('../../assets/karkaii-logo.png')}
          style={{ width: 200, height: 50 }}
          resizeMode="contain"
        />
        <ActivityIndicator size="small" color="#3D5EE1" className="mt-6" />
        <Text className="mt-3 text-xs font-medium text-slate-500">
          Loading school workspace…
        </Text>
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(app)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <RootNavigationGate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
