/**
 * Local data store (mock phase).
 *
 * Every dataset ("collection") is an array of records with a string `id`. Collections are seeded from
 * `src/data/seed/*`, kept in memory, and persisted to AsyncStorage so edits survive an app restart.
 *
 * Screens never touch this file directly: they use `useCollection` (reactive reads) and `repo` (writes).
 * When the real API is wired in later, only `repo` needs a second implementation; screens stay as they are.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Entity {
  id: string;
}

type Listener = () => void;

/** Bump when seed data changes shape so stale persisted data is discarded instead of crashing screens. */
export const SEED_VERSION = '2026-11-21.1';

const PREFIX = 'karkaii:data:';
const VERSION_KEY = 'karkaii:data-version';

const seeds = new Map<string, () => Entity[]>();
const data = new Map<string, Entity[]>();
const listeners = new Map<string, Set<Listener>>();
const saveTimers = new Map<string, ReturnType<typeof setTimeout>>();
let hydrated = false;

/** Register a collection and the function that produces its first-run records. */
export function defineCollection<T extends Entity>(name: string, seed: () => T[]): string {
  seeds.set(name, seed);
  return name;
}

export function isHydrated(): boolean {
  return hydrated;
}

/** Load persisted collections (falling back to seeds). Call once before rendering any module screen. */
export async function hydrateStore(): Promise<void> {
  if (hydrated) return;
  const names = [...seeds.keys()];
  let versionOk = false;
  try {
    versionOk = (await AsyncStorage.getItem(VERSION_KEY)) === SEED_VERSION;
  } catch {
    versionOk = false;
  }

  let stored: readonly (readonly [string, string | null])[] = [];
  if (versionOk) {
    try {
      stored = await AsyncStorage.multiGet(names.map((n) => PREFIX + n));
    } catch {
      stored = [];
    }
  } else {
    try {
      await AsyncStorage.multiRemove(names.map((n) => PREFIX + n));
      await AsyncStorage.setItem(VERSION_KEY, SEED_VERSION);
    } catch {
      /* storage unavailable: run from seeds only */
    }
  }

  const byKey = new Map(stored.map(([k, v]) => [k, v] as const));
  for (const name of names) {
    const raw = byKey.get(PREFIX + name);
    let rows: Entity[] | null = null;
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) rows = parsed as Entity[];
      } catch {
        rows = null;
      }
    }
    data.set(name, rows ?? seeds.get(name)!());
  }
  hydrated = true;
}

function notify(name: string) {
  listeners.get(name)?.forEach((l) => l());
}

function persist(name: string) {
  const pending = saveTimers.get(name);
  if (pending) clearTimeout(pending);
  saveTimers.set(
    name,
    setTimeout(() => {
      saveTimers.delete(name);
      AsyncStorage.setItem(PREFIX + name, JSON.stringify(data.get(name) ?? [])).catch(() => {});
    }, 150),
  );
}

export function subscribe(name: string, listener: Listener): () => void {
  let set = listeners.get(name);
  if (!set) {
    set = new Set();
    listeners.set(name, set);
  }
  set.add(listener);
  return () => {
    set!.delete(listener);
  };
}

export function snapshot<T extends Entity>(name: string): T[] {
  const rows = data.get(name);
  if (rows) return rows as T[];
  // Not hydrated yet (should not happen behind DataProvider). Cache the seed so the reference stays stable,
  // otherwise useSyncExternalStore would see a new array on every read and loop.
  const fallback = (seeds.get(name)?.() ?? []) as T[];
  data.set(name, fallback);
  return fallback;
}

function write(name: string, rows: Entity[]) {
  data.set(name, rows);
  notify(name);
  persist(name);
}

let idCounter = 0;
export function newId(prefix = 'rec'): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}${idCounter.toString(36)}${Math.floor(Math.random() * 1296).toString(36)}`;
}

/** Writes for one collection. */
export function repo<T extends Entity>(name: string) {
  return {
    list: (): T[] => snapshot<T>(name),
    get: (id: string): T | undefined => snapshot<T>(name).find((r) => r.id === id),
    create(input: Omit<T, 'id'> & { id?: string }): T {
      const record = { ...input, id: input.id ?? newId(name.slice(0, 3)) } as T;
      write(name, [record, ...snapshot<T>(name)]);
      return record;
    },
    update(id: string, patch: Partial<T>): T | undefined {
      let updated: T | undefined;
      write(
        name,
        snapshot<T>(name).map((r) => {
          if (r.id !== id) return r;
          updated = { ...r, ...patch, id } as T;
          return updated;
        }),
      );
      return updated;
    },
    remove(id: string) {
      write(
        name,
        snapshot<T>(name).filter((r) => r.id !== id),
      );
    },
    removeMany(ids: string[]) {
      const drop = new Set(ids);
      write(
        name,
        snapshot<T>(name).filter((r) => !drop.has(r.id)),
      );
    },
    /** Apply `fn` to every record whose id is in `ids` (used by bulk actions). */
    updateMany(ids: string[], fn: (r: T) => Partial<T>) {
      const pick = new Set(ids);
      write(
        name,
        snapshot<T>(name).map((r) => (pick.has(r.id) ? ({ ...r, ...fn(r), id: r.id } as T) : r)),
      );
    },
    reset() {
      write(name, seeds.get(name)!());
    },
  };
}

/** Restore every collection to its seed data (Profile > Reset demo data). */
export function resetAllData() {
  for (const name of seeds.keys()) write(name, seeds.get(name)!());
}
