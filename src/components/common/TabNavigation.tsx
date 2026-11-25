import React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

interface TabItem {
  id: string;
  label: string;
  badge?: number | string;
}

interface TabNavigationProps {
  tabs: TabItem[];
  activeTab: string;
  onSelectTab: (tabId: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onSelectTab }: TabNavigationProps) {
  return (
    <View className="border-b border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022]">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-4 py-2 gap-x-2"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              className={`flex-row items-center rounded-xl px-3.5 py-2 ${
                isActive ? 'bg-[#3D5EE1]' : 'bg-slate-100 dark:bg-[#1B1632]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  isActive ? 'text-white' : 'text-slate-600 dark:text-[#B9B7C0]'
                }`}
              >
                {tab.label}
              </Text>
              {tab.badge ? (
                <View
                  className={`ml-1.5 rounded-full px-1.5 py-0.5 ${
                    isActive ? 'bg-white/20' : 'bg-slate-200 dark:bg-[#322D46]'
                  }`}
                >
                  <Text
                    className={`text-[10px] font-bold ${
                      isActive ? 'text-white' : 'text-slate-600 dark:text-[#B9B7C0]'
                    }`}
                  >
                    {tab.badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
