/**
 * Hook that loads and synchronizes the live Student Profile from backend APIs.
 * Supports authenticated students (`/api/students/me`), parents, and staff/admin selection (`?id=` or picker).
 */
import { useCallback, useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import type { RoleKey } from '@/core/auth/access';
import {
  fetchStudentProfileBundle,
  fetchStudentSelectorOptions,
  type SelectorOption,
  type StudentProfileBundle,
} from '@/services/api/studentProfileApi';

export interface UseStudentProfileResult {
  profile: StudentProfileBundle | null;
  options: SelectorOption[];
  selectedId: string;
  setSelectedId: (id: string) => void;
  locked: boolean;
  isLoading: boolean;
  error: string;
  emptyReason: string;
  reload: () => void;
}

interface SelectorState {
  key: string;
  options: SelectorOption[];
  defaultId: string;
  emptyReason: string;
  error: string;
}

interface DetailState {
  key: string;
  profile: StudentProfileBundle | null;
  error: string;
}

export function useStudentProfile(
  role: RoleKey | null,
  isAuthenticated: boolean,
  userId?: string,
): UseStudentProfileResult {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const preferredId = typeof id === 'string' ? id : undefined;

  const [pickedId, setPickedId] = useState<string>(preferredId ?? '');
  const [reloadKey, setReloadKey] = useState(0);
  const [selectorState, setSelectorState] = useState<SelectorState | null>(null);
  const [detailState, setDetailState] = useState<DetailState | null>(null);

  const reload = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const listKey = isAuthenticated && role ? `${role}:${userId ?? ''}:${preferredId ?? ''}:${reloadKey}` : '';

  // 1. Load selectable student(s) for the current authenticated account
  useEffect(() => {
    if (!listKey || !role) return;

    let alive = true;
    fetchStudentSelectorOptions(role, preferredId)
      .then((res) => {
        if (!alive) return;
        setSelectorState({
          key: listKey,
          options: res.options,
          defaultId: res.defaultId,
          emptyReason: res.emptyReason ?? '',
          error: '',
        });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setSelectorState({
          key: listKey,
          options: [],
          defaultId: '',
          emptyReason: '',
          error: err instanceof Error ? err.message : 'Unable to load student list.',
        });
      });

    return () => {
      alive = false;
    };
  }, [listKey, role, preferredId]);

  const activeSelector = listKey && selectorState?.key === listKey ? selectorState : null;
  const options = activeSelector?.options ?? [];
  const selectedId =
    preferredId && options.some((o) => o.value === preferredId)
      ? preferredId
      : pickedId && options.some((o) => o.value === pickedId)
        ? pickedId
        : activeSelector?.defaultId ?? '';

  const detailKey = isAuthenticated && role && selectedId ? `${role}:${selectedId}:${reloadKey}` : '';

  // 2. Load the full backend profile bundle whenever selectedId changes
  useEffect(() => {
    if (!detailKey || !role || !selectedId) return;

    let alive = true;
    fetchStudentProfileBundle(selectedId, role)
      .then((bundle) => {
        if (!alive) return;
        setDetailState({ key: detailKey, profile: bundle, error: '' });
      })
      .catch((err: unknown) => {
        if (!alive) return;
        setDetailState({
          key: detailKey,
          profile: null,
          error: err instanceof Error ? err.message : 'Unable to load student profile.',
        });
      });

    return () => {
      alive = false;
    };
  }, [detailKey, role, selectedId]);

  const activeDetail = detailKey && detailState?.key === detailKey ? detailState : null;
  const listLoading = !!listKey && selectorState?.key !== listKey;
  const detailLoading = !!detailKey && detailState?.key !== detailKey;

  const emptyReason = !isAuthenticated || !role
    ? 'Please sign in to view the student profile.'
    : activeSelector?.emptyReason ?? '';

  return {
    profile: activeDetail?.profile ?? null,
    options,
    selectedId,
    setSelectedId: setPickedId,
    locked: role === 'student' || options.length <= 1,
    isLoading: listLoading || detailLoading,
    error: activeSelector?.error || activeDetail?.error || '',
    emptyReason,
    reload,
  };
}
