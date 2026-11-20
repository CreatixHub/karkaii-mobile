import { todayISO } from '@/core/utils/date';

/** Deterministic pseudo-random helpers so seed data is identical on every install (and testable). */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min,
    pick: <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)],
    chance: (p: number) => next() < p,
  };
}

export const pad = (n: number, w = 3) => String(n).padStart(w, '0');

/**
 * Relative seed dates (attendance, leave, homework, expenses…) are anchored to the day the data is first created,
 * so a fresh install always looks current. Calendar-year data (the holiday calendar, fee due dates) is fixed.
 */
export const SEED_TODAY = todayISO();
