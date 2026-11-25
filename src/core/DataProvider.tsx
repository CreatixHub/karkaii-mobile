import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Text, View } from 'react-native';
import { hydrateStore } from '@/core/store/store';
import '@/data/seed'; // registers every collection

/** Loads persisted data before any screen renders, so screens can read collections synchronously. */
export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateStore().finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center bg-[#f4f6fb] dark:bg-[#0F0C1C]">
        <Image source={require('../../assets/karkaii-logo.png')} style={{ width: 170, height: 44 }} resizeMode="contain" />
        <ActivityIndicator style={{ marginTop: 18 }} color="#3D5EE1" />
        <Text className="mt-2 text-xs text-slate-400 dark:text-[#8b879b]">Loading school data…</Text>
      </View>
    );
  }
  return <>{children}</>;
}
