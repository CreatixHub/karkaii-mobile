/** Same output as the frontend's `money()` helper: $ prefix, en-US grouping. */
export const money = (value: number | undefined | null): string => `$${Math.round(Number(value) || 0).toLocaleString('en-US')}`;

export const money2 = (value: number | undefined | null): string =>
  `$${(Number(value) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const num = (value: number | undefined | null): string => (Number(value) || 0).toLocaleString('en-US');

export const pct = (value: number | undefined | null, digits = 0): string => `${(Number(value) || 0).toFixed(digits)}%`;

export function initials(name: string): string {
  const parts = name.replace(/[^\p{L}\s]/gu, '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

/** Next sequential code like FEE-0007 from existing records. */
export function nextCode(prefix: string, existing: string[], pad = 3): string {
  let max = 0;
  for (const code of existing) {
    const m = new RegExp(`^${prefix}-?(\\d+)$`).exec(code ?? '');
    if (m) max = Math.max(max, Number(m[1]));
  }
  return `${prefix}-${String(max + 1).padStart(pad, '0')}`;
}

export function csvEscape(v: unknown): string {
  const s = v === undefined || v === null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(headers: string[], rows: (string | number | undefined | null)[][]): string {
  return [headers, ...rows].map((r) => r.map(csvEscape).join(',')).join('\n');
}
