export type Tone = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'purple' | 'pink' | 'teal';

export const TONES: Record<Tone, { bg: string; fg: string; border: string }> = {
  success: { bg: '#E8F7EC', fg: '#15803D', border: '#BBE5C6' },
  warning: { bg: '#FEF3E2', fg: '#B45309', border: '#F8D9AE' },
  danger: { bg: '#FDE8E8', fg: '#B91C1C', border: '#F5BEBE' },
  info: { bg: '#E6F1FD', fg: '#0F65CD', border: '#B9D6F6' },
  neutral: { bg: '#EEF1F6', fg: '#475569', border: '#D9DFEA' },
  primary: { bg: '#E9EDFC', fg: '#3D5EE1', border: '#C6D0F7' },
  purple: { bg: '#EFEAFC', fg: '#6D4BD6', border: '#D6CAF6' },
  pink: { bg: '#FCE8F0', fg: '#BE2D6A', border: '#F5C2D8' },
  teal: { bg: '#E3F6F2', fg: '#0B7F6F', border: '#B5E4DB' },
};

const GOOD = ['active', 'paid', 'approved', 'present', 'completed', 'verified', 'in use', 'available', 'published', 'enrolled', 'cleared', 'delivered', 'assigned', 'on duty', 'in stock', 'on route', 'open', 'excellent', 'good', 'returned', 'received', 'confirmed', 'valid', 'running', 'online', 'scheduled', 'ok'];
const WARN = ['pending', 'partial', 'late', 'draft', 'under review', 'on leave', 'half day', 'in progress', 'waitlisted', 'low stock', 'expiring', 'due soon', 'fair', 'forwarded', 'probation', 'review', 'maintenance', 'reserved', 'awaiting', 'inactive'];
const BAD = ['rejected', 'overdue', 'unpaid', 'absent', 'cancelled', 'blocked', 'suspended', 'expired', 'out of stock', 'failed', 'waived', 'damaged', 'offline', 'deleted', 'closed', 'poor', 'detained', 'high'];

/** Best-guess tone for a status string, used wherever a config doesn't spell tones out. */
export function toneFor(status: string | undefined | null): Tone {
  const s = (status ?? '').toLowerCase().trim();
  if (!s) return 'neutral';
  if (BAD.some((k) => s === k || s.includes(k))) return s === 'waived' ? 'neutral' : 'danger';
  if (WARN.some((k) => s === k || s.includes(k))) return 'warning';
  if (GOOD.some((k) => s === k || s.includes(k))) return 'success';
  return 'neutral';
}
