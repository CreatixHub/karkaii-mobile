/** Audit trail: who changed what, written by the engine for pages that set `auditEntity`. */
import { repo, type Entity } from '@/core/store/store';

export interface AuditRecord extends Entity {
  entity: string;
  entityId: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Action';
  summary: string;
  by: string;
  at: string;
}

const IGNORED = new Set(['id', 'updatedOn', 'lastUpdated']);

/** Keys whose value differs between two versions of a record (shallow, order-insensitive for arrays of primitives). */
export function changedKeys(previous: Record<string, unknown> | undefined, next: Record<string, unknown>): string[] {
  if (!previous) return [];
  const out: string[] = [];
  for (const key of Object.keys(next)) {
    if (IGNORED.has(key)) continue;
    if (JSON.stringify(previous[key]) !== JSON.stringify(next[key])) out.push(key);
  }
  return out;
}

const humanise = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase());

export function logAudit(entry: { entity: string; entityId: string; action: AuditRecord['action']; summary: string; by: string }) {
  repo<AuditRecord>('auditLog').create({ ...entry, at: new Date().toISOString() });
}

export function describeChange(action: AuditRecord['action'], label: string, keys: string[]): string {
  if (action === 'Created') return `${label} created`;
  if (action === 'Deleted') return `${label} deleted`;
  return keys.length ? `${label}: changed ${keys.slice(0, 6).map(humanise).join(', ')}${keys.length > 6 ? ` +${keys.length - 6} more` : ''}` : `${label} updated`;
}
