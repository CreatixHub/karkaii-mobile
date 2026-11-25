/** Dates are stored as 'YYYY-MM-DD' strings and times as 'HH:mm' so they persist and sort as plain text. */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const pad = (n: number) => String(n).padStart(2, '0');

export function toISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function parseISO(s?: string | null): Date | null {
  if (!s || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, days: number): string {
  const d = parseISO(iso) ?? new Date();
  d.setDate(d.getDate() + days);
  return toISO(d);
}

/** '2026-11-19' -> '19 Nov 2026' */
export function formatDate(s?: string | null): string {
  const d = parseISO(s);
  return d ? `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}` : s ? String(s) : '—';
}

/** Whole days from `a` to `b` (positive when b is later). */
export function diffDays(a: string, b: string): number {
  const da = parseISO(a);
  const db = parseISO(b);
  if (!da || !db) return 0;
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}

/** Inclusive number of days between two dates. */
export function inclusiveDays(from: string, to: string): number {
  return Math.max(1, diffDays(from, to) + 1);
}

export function timeToDate(t?: string | null): Date {
  const d = new Date();
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '');
  d.setHours(m ? Number(m[1]) : 9, m ? Number(m[2]) : 0, 0, 0);
  return d;
}

export function toHHmm(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** '14:05' -> '2:05 PM' */
export function formatTime(t?: string | null): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(t ?? '');
  if (!m) return t ? String(t) : '—';
  const h = Number(m[1]);
  return `${h % 12 === 0 ? 12 : h % 12}:${m[2]} ${h >= 12 ? 'PM' : 'AM'}`;
}

/** 'Today 14:05' / 'Yesterday 09:10' / '3 days ago' for an ISO date-time; '' means never. */
export function relativeDay(iso?: string | null): string {
  if (!iso) return 'Never signed in';
  const day = iso.slice(0, 10);
  const time = iso.length > 10 ? iso.slice(11, 16) : '';
  const diff = diffDays(day, todayISO());
  if (diff <= 0) return time ? `Today ${time}` : 'Today';
  if (diff === 1) return time ? `Yesterday ${time}` : 'Yesterday';
  return `${diff} days ago`;
}

export function dayName(iso: string): string {
  const d = parseISO(iso);
  return d ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()] : '';
}
