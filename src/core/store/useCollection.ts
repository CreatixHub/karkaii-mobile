import { useCallback, useSyncExternalStore } from 'react';
import { snapshot, subscribe, type Entity } from './store';

/** Reactive read of one collection. Re-renders whenever any record in it changes. */
export function useCollection<T extends Entity>(name: string): T[] {
  const sub = useCallback((onChange: () => void) => subscribe(name, onChange), [name]);
  const get = useCallback(() => snapshot<T>(name), [name]);
  return useSyncExternalStore(sub, get, get);
}
