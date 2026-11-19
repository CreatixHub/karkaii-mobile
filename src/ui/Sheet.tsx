import React from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

/** Bottom sheet used for forms, filters, sort menus, record details and pickers. */
export function Sheet({
  visible,
  title,
  onClose,
  children,
  footer,
  tall,
  scroll = true,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  tall?: boolean;
  scroll?: boolean;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end">
        <Pressable className="absolute inset-0 bg-black/45" onPress={onClose} accessibilityLabel="Close" />
        <View
          style={{ maxHeight: tall ? '92%' : '82%', paddingBottom: Math.max(insets.bottom, 12) }}
          className="rounded-t-3xl bg-white"
        >
          <View className="items-center pt-2">
            <View className="h-1 w-10 rounded-full bg-slate-200" />
          </View>
          <View className="flex-row items-center justify-between px-5 pb-2 pt-3">
            <Text className="flex-1 pr-3 text-base font-bold text-[#1b2240]" numberOfLines={1}>
              {title}
            </Text>
            <Pressable onPress={onClose} hitSlop={10} className="h-8 w-8 items-center justify-center rounded-full bg-slate-100">
              <Feather name="x" size={16} color="#475569" />
            </Pressable>
          </View>
          {scroll ? (
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 12 }}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={{ paddingHorizontal: 20, flexShrink: 1 }}>{children}</View>
          )}
          {footer ? <View className="border-t border-slate-100 px-5 pt-3">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
