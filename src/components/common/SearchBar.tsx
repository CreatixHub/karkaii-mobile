import React from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search records…',
  onClear,
}: SearchBarProps) {
  return (
    <View className="flex-row items-center rounded-xl border border-slate-200 dark:border-[#322D46] bg-white dark:bg-[#131022] px-3.5 py-2 shadow-sm shadow-black/5">
      <Feather name="search" size={16} color="#94a3b8" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        className="ml-2 flex-1 text-xs text-[#202C4B] dark:text-[#EFEFF2] p-0"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={10}
        >
          <Feather name="x-circle" size={15} color="#94a3b8" />
        </Pressable>
      ) : null}
    </View>
  );
}
