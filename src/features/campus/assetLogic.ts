/** Asset and stock rules: what is out, what it is worth, what state it is in, and how a change in one record updates the others. */
import { repo, snapshot } from '@/core/store/store';
import { diffDays, todayISO } from '@/core/utils/date';
import type { AllocationRecord, AssetRecord, ServiceRecord, StockItemRecord, StockMovementRecord } from '@/data/seed/assets';
import { onHand, serviceCost } from '@/data/seed/assets';

export const allAssets = () => snapshot<AssetRecord>('assets');
export const allAllocations = () => snapshot<AllocationRecord>('assetAllocations');
export const allServices = () => snapshot<ServiceRecord>('assetServices');
export const allStock = () => snapshot<StockItemRecord>('stockItems');
export const allMovements = () => snapshot<StockMovementRecord>('stockMovements');

export const assetOf = (id: string) => allAssets().find((a) => a.id === id);
export const assetName = (id: string) => assetOf(id)?.name ?? '—';

/* -------------------------------------- Allocations -------------------------------------- */

export const isOut = (a: AllocationRecord) => !a.actualReturn && a.status !== 'Returned';
export const allocationsOf = (assetId: string) => allAllocations().filter((a) => a.assetId === assetId);
export const outNow = (assetId: string) => allocationsOf(assetId).filter(isOut);
export const unitsOut = (assetId: string) => outNow(assetId).reduce((n, a) => n + a.units, 0);
export const unitsFree = (asset: AssetRecord) => Math.max(0, asset.units - unitsOut(asset.id));

export type AllocationState = 'Active' | 'Returned' | 'Pending Return' | 'Overdue Return' | 'Damage Reported';
export const allocationState = (a: AllocationRecord): AllocationState => (a.status === 'Active' && a.expectedReturn && a.expectedReturn < todayISO() ? 'Overdue Return' : a.status);

/** Who holds the asset right now, as a short line. */
export const custodianOf = (assetId: string): string => {
  const out = outNow(assetId);
  if (!out.length) return 'In store';
  return out.length === 1 ? out[0].assigneeName : `${out[0].assigneeName} +${out.length - 1}`;
};

/** Why these units cannot be handed out (empty list = allowed). */
export function checkAllocate(assetId: string, units: number, excludeAllocationId?: string): string[] {
  const asset = assetOf(assetId);
  if (!asset) return ['Asset not found.'];
  const errors: string[] = [];
  if (asset.status === 'Retired') errors.push(`${asset.name} is retired.`);
  if (asset.status === 'Under Maintenance') errors.push(`${asset.name} is under maintenance.`);
  const others = outNow(assetId).filter((a) => a.id !== excludeAllocationId).reduce((n, a) => n + a.units, 0);
  const free = Math.max(0, asset.units - others);
  if (units > free) errors.push(`Only ${free} of ${asset.units} unit${asset.units === 1 ? ' is' : 's are'} free.`);
  if (!(units >= 1)) errors.push('Allocate at least one unit.');
  return errors;
}

/* --------------------------------------- Valuation --------------------------------------- */

/** Straight-line depreciation over the useful life, never below 10% of the purchase value. */
export function currentValue(a: AssetRecord): number {
  const years = Math.max(0, diffDays(a.purchaseDate, todayISO()) / 365.25);
  const kept = Math.max(0.1, 1 - years / Math.max(1, a.usefulLifeYears));
  return Math.round(a.purchaseValue * kept);
}
export type WarrantyState = 'No warranty' | 'In warranty' | 'Expiring' | 'Expired';
export const warrantyState = (a: AssetRecord): WarrantyState => {
  if (!a.warrantyUntil) return 'No warranty';
  const left = diffDays(todayISO(), a.warrantyUntil);
  return left < 0 ? 'Expired' : left <= 90 ? 'Expiring' : 'In warranty';
};
export const ageYears = (a: AssetRecord) => Math.floor(diffDays(a.purchaseDate, todayISO()) / 365.25);

/* --------------------------------------- Maintenance --------------------------------------- */

export type ServiceState = 'Scheduled' | 'In Progress' | 'Completed' | 'Overdue' | 'Out of Service';
export const serviceState = (s: ServiceRecord): ServiceState => (s.status === 'Scheduled' && s.scheduled < todayISO() ? 'Overdue' : s.status);
export const isOpenService = (s: ServiceRecord) => s.status === 'In Progress' || s.status === 'Out of Service';
export const servicesOf = (assetId: string) => allServices().filter((s) => s.assetId === assetId);
export const openServiceOf = (assetId: string) => servicesOf(assetId).find(isOpenService);
export const nextServiceOf = (assetId: string) => servicesOf(assetId).filter((s) => s.status === 'Scheduled').sort((a, b) => a.scheduled.localeCompare(b.scheduled))[0];
export const lastServiceOf = (assetId: string) => servicesOf(assetId).filter((s) => s.status === 'Completed').sort((a, b) => b.completedOn.localeCompare(a.completedOn))[0];
export const spendOn = (assetId: string) => servicesOf(assetId).filter((s) => s.status === 'Completed').reduce((n, s) => n + serviceCost(s), 0);

/**
 * An asset's status follows what is happening to it: retired stays retired; open repair work means Under Maintenance;
 * units out mean In Use; otherwise it is Available. Call after any allocation or service change.
 */
export function syncAssetStatus(assetId: string): void {
  const asset = assetOf(assetId);
  if (!asset || asset.status === 'Retired') return;
  const next: AssetRecord['status'] = openServiceOf(assetId) ? 'Under Maintenance' : unitsOut(assetId) > 0 ? 'In Use' : 'Available';
  if (next !== asset.status) repo<AssetRecord>('assets').update(assetId, { status: next });
}

/* ------------------------------------------- Stock ------------------------------------------- */

export const movementsOf = (itemId: string) => allMovements().filter((m) => m.itemId === itemId);
export const stockOnHand = (item: StockItemRecord) => onHand(item, movementsOf(item.id));
export type StockState = 'In Stock' | 'Low Stock' | 'Reorder Raised' | 'Out of Stock';
export const stockState = (item: StockItemRecord): StockState => {
  const qty = stockOnHand(item);
  return qty <= 0 ? 'Out of Stock' : item.openOrder ? 'Reorder Raised' : qty <= item.reorderLevel ? 'Low Stock' : 'In Stock';
};
export const stockValue = (item: StockItemRecord) => Math.round(stockOnHand(item) * item.unitPrice * 100) / 100;
export const lastMovementDate = (itemId: string) => movementsOf(itemId).map((m) => m.date).sort().pop() ?? '';
export const issuedSince = (itemId: string, days: number) => movementsOf(itemId).filter((m) => m.direction === 'out' && diffDays(m.date, todayISO()) <= days).reduce((n, m) => n + m.qty, 0);

export function recordMovement(m: Omit<StockMovementRecord, 'id'>): StockMovementRecord {
  return repo<StockMovementRecord>('stockMovements').create(m);
}
