import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

type ToastKind = 'success' | 'error' | 'info';
interface ToastState {
  message: string;
  kind: ToastKind;
  key: number;
}

const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const show = useCallback((message: string, kind: ToastKind = 'success') => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, kind, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const bg = toast?.kind === 'error' ? '#B91C1C' : toast?.kind === 'info' ? '#1b2240' : '#15803D';
  const icon = toast?.kind === 'error' ? 'alert-circle' : toast?.kind === 'info' ? 'info' : 'check-circle';

  return (
    <ToastContext.Provider value={show}>
      {children}
      {toast ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 18 }}>
          <View style={{ backgroundColor: bg }} className="flex-row items-center rounded-xl px-4 py-3 shadow-lg shadow-black/20">
            <Feather name={icon} size={16} color="#fff" />
            <Text className="ml-2.5 flex-1 text-xs font-semibold text-white">{toast.message}</Text>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
