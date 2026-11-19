import React from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';

export default function RootIndex() {
  const { isAuthenticated, isLoading } = useAuth();

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

  if (isAuthenticated) {
    return <Redirect href="/(app)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
