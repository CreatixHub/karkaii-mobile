import { repo, snapshot } from '@/core/store/store';
import { addDays, formatDate, todayISO } from '@/core/utils/date';
import { money } from '@/core/utils/format';
import { ASSET_CATEGORIES, ASSET_DEPARTMENTS, ASSET_LOCATIONS, CONDITIONS, MAINTENANCE_TYPES, STOCK_CATEGORIES, UNITS, WAREHOUSES, serviceCost, type AllocationRecord, type AssetRecord, type AssigneeType, type Condition, type ServiceRecord, type StockItemRecord, type StockMovementRecord } from '@/data/seed/assets';
import type { StaffRecord, TeacherRecord } from '@/data/seed/master';
import { opts, parseCsvRows } from '@/features/academic/helpers';
import { countBy, nextNo, sum } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Option } from '@/ui/Fields';
import type { Tone } from '@/ui/tone';
import {
  ageYears, allServices, allStock, assetName, assetOf, allocationState, allocationsOf, checkAllocate, currentValue, custodianOf, isOpenService, issuedSince, lastMovementDate, lastServiceOf, movementsOf, nextServiceOf, openServiceOf, outNow, recordMovement, serviceState, servicesOf, spendOn, stockOnHand, stockState, stockValue, syncAssetStatus, unitsFree, unitsOut, warrantyState,
} from './assetLogic';

const BY = 'Estates Office';
const assetTone: Record<string, Tone> = { 'In Use': 'success', Available: 'primary', 'Under Maintenance': 'warning', Retired: 'neutral' };
const condTone: Record<string, Tone> = { Excellent: 'success', Good: 'primary', Fair: 'warning', Poor: 'danger' };
const warrantyTone: Record<string, Tone> = { 'No warranty': 'neutral', 'In warranty': 'success', Expiring: 'warning', Expired: 'danger' };
const worse = (a: Condition, b: Condition) => CONDITIONS.indexOf(a) > CONDITIONS.indexOf(b);

/** Everyone an asset can be handed to, as 'type|ref|name' options. */
const assigneeChoices = (): Option[] => [
  ...snapshot<TeacherRecord>('teachers').map((t) => ({ label: t.name, value: `Teacher|${t.id}|${t.name}`, hint: `Teacher · ${t.department}` })),
  ...snapshot<StaffRecord>('staff').map((s) => ({ label: s.name, value: `Staff|${s.id}|${s.name}`, hint: `Staff · ${s.department}` })),
  ...ASSET_DEPARTMENTS.map((d) => ({ label: d, value: `Department|${d}|${d}`, hint: 'Department' })),
  ...['301', '302', '303', '304', '305', '306', '201', '202'].map((r) => ({ label: `Room ${r}`, value: `Classroom|${r}|Room ${r}`, hint: 'Classroom' })),
];
const parseAssignee = (v: string): { assigneeType: AssigneeType; assigneeRef: string; assigneeName: string } => {
  const [assigneeType, assigneeRef, assigneeName] = v.split('|');
  return { assigneeType: assigneeType as AssigneeType, assigneeRef, assigneeName };
};

/* ======================================== Asset register ======================================== */

const ASSET_STATUSES = ['In Use', 'Available', 'Under Maintenance', 'Retired'];

export const assetsCfg: ResourceConfig<AssetRecord> = {
  entity: 'Asset',
  collection: 'assets',
  auditEntity: 'asset',
  searchPlaceholder: 'Search asset, tag, serial, holder…',
  searchText: (r) => `${r.name} ${r.tag} ${r.serial} ${r.model} ${r.category} ${r.location} ${r.spot} ${custodianOf(r.id)}`,
  code: (r) => r.tag,
  title: (r) => r.name,
  subtitle: (r) => `${r.model} · ${r.units} unit${r.units === 1 ? '' : 's'}`,
  status: (r) => ({ label: r.status, tone: assetTone[r.status] }),
  badges: (r) => [{ label: r.category, tone: 'primary' }, { label: r.condition, tone: condTone[r.condition] }, ...(warrantyState(r) === 'Expiring' || warrantyState(r) === 'Expired' ? [{ label: `Warranty ${warrantyState(r).toLowerCase()}`, tone: warrantyTone[warrantyState(r)] }] : []), ...(nextServiceOf(r.id) && serviceState(nextServiceOf(r.id)!) === 'Overdue' ? [{ label: 'Service overdue', tone: 'danger' as Tone }] : [])],
  facts: [
    { label: 'Location', value: (r) => `${r.location} · ${r.spot}` },
    { label: 'Held by', value: (r) => custodianOf(r.id) },
    { label: 'Units out', value: (r) => `${unitsOut(r.id)} of ${r.units}` },
    { label: 'Current value', value: (r) => money(currentValue(r)) },
    { label: 'Next service', value: (r) => { const s = nextServiceOf(r.id); return s ? formatDate(s.scheduled) : '—'; } },
  ],
  detail: [
    { title: 'Asset', items: [{ label: 'Tag', value: (r) => r.tag }, { label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Department', value: (r) => r.department }, { label: 'Model', value: (r) => r.model }, { label: 'Serial', value: (r) => r.serial }, { label: 'Units', value: (r) => r.units }, { label: 'Condition', value: (r) => r.condition }, { label: 'Status', value: (r) => r.status }, { label: 'Notes', value: (r) => r.notes || '—' }] },
    { title: 'Location & custody', items: [{ label: 'Location', value: (r) => `${r.location} · ${r.spot}` }, { label: 'Held by', value: (r) => outNow(r.id).map((a) => `${a.assigneeName} (${a.units})`).join(', ') || 'In store' }, { label: 'Units free', value: (r) => unitsFree(r) }, { label: 'Allocation history', value: (r) => `${allocationsOf(r.id).length} record(s)` }] },
    { title: 'Purchase & value', items: [{ label: 'Purchased', value: (r) => `${formatDate(r.purchaseDate)} (${ageYears(r)} yrs ago)` }, { label: 'Purchase value', value: (r) => money(r.purchaseValue) }, { label: 'Useful life', value: (r) => `${r.usefulLifeYears} years` }, { label: 'Current value', value: (r) => money(currentValue(r)) }, { label: 'Vendor', value: (r) => `${r.vendor} · ${r.vendorContact}` }, { label: 'Purchase order', value: (r) => r.poNumber }] },
    { title: 'Warranty & service', items: [{ label: 'Warranty', value: (r) => (r.warrantyUntil ? `${formatDate(r.warrantyUntil)} (${warrantyState(r)})` : 'None') }, { label: 'Last service', value: (r) => { const s = lastServiceOf(r.id); return s ? `${formatDate(s.completedOn)} · ${s.type}` : '—'; } }, { label: 'Next service', value: (r) => { const s = nextServiceOf(r.id); return s ? `${formatDate(s.scheduled)} · ${s.type}` : '—'; } }, { label: 'Open repair', value: (r) => openServiceOf(r.id)?.summary ?? 'None' }, { label: 'Lifetime service spend', value: (r) => money(spendOn(r.id)) }] },
  ],
  stats: [
    { label: 'Assets', value: (rows) => rows.length, icon: 'package' },
    { label: 'Units', value: (rows) => sum(rows, (r) => r.units), tone: 'info', icon: 'layers' },
    { label: 'In use', value: (rows) => countBy(rows, (r) => r.status === 'In Use'), tone: 'success', icon: 'check-circle' },
    { label: 'Under maintenance', value: (rows) => countBy(rows, (r) => r.status === 'Under Maintenance'), tone: 'warning', icon: 'tool' },
    { label: 'Purchase value', value: (rows) => money(sum(rows, (r) => r.purchaseValue)), tone: 'primary', icon: 'dollar-sign' },
    { label: 'Current value', value: (rows) => money(sum(rows.filter((r) => r.status !== 'Retired'), currentValue)), tone: 'purple', icon: 'trending-down' },
  ],
  views: [{ key: 'all', label: 'All Assets', match: () => true }, ...ASSET_STATUSES.map((s) => ({ key: s, label: s, match: (r: AssetRecord) => r.status === s }))],
  filters: [
    { key: 'category', label: 'Category', options: opts(ASSET_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'department', label: 'Department', options: opts(ASSET_DEPARTMENTS), match: (r, v) => r.department === v },
    { key: 'location', label: 'Location', options: opts(ASSET_LOCATIONS), match: (r, v) => r.location === v },
    { key: 'status', label: 'Status', options: opts(ASSET_STATUSES), match: (r, v) => r.status === v },
    { key: 'condition', label: 'Condition', options: opts(CONDITIONS), match: (r, v) => r.condition === v },
    { key: 'warranty', label: 'Warranty', options: opts(['In warranty', 'Expiring', 'Expired', 'No warranty']), match: (r, v) => warrantyState(r) === v },
    { key: 'age', label: 'Age', single: true, options: opts(['Under 2 years', '2 – 5 years', 'Over 5 years']), match: (r, v) => (v === 'Under 2 years' ? ageYears(r) < 2 : v === '2 – 5 years' ? ageYears(r) >= 2 && ageYears(r) <= 5 : ageYears(r) > 5) },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'value', label: 'Purchase value (high)', compare: (a, b) => b.purchaseValue - a.purchaseValue },
    { key: 'purchase', label: 'Newest purchase', compare: (a, b) => b.purchaseDate.localeCompare(a.purchaseDate) },
    { key: 'condition', label: 'Condition (worst first)', compare: (a, b) => CONDITIONS.indexOf(b.condition) - CONDITIONS.indexOf(a.condition) },
  ],
  form: [
    { key: 'name', label: 'Asset Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: ASSET_CATEGORIES },
    { key: 'department', label: 'Department', type: 'select', required: true, options: ASSET_DEPARTMENTS },
    { key: 'model', label: 'Model', type: 'text', required: true },
    { key: 'serial', label: 'Serial / Registration No', type: 'text' },
    { key: 'units', label: 'Units', type: 'number', required: true, min: 1, max: 5000, default: 1 },
    { key: 'location', label: 'Location', type: 'select', required: true, options: ASSET_LOCATIONS },
    { key: 'spot', label: 'Spot / Room', type: 'text' },
    { key: 'purchaseDate', label: 'Purchase Date', type: 'date', required: true },
    { key: 'purchaseValue', label: 'Purchase Value (all units)', type: 'money', required: true, min: 0 },
    { key: 'usefulLifeYears', label: 'Useful Life (years)', type: 'number', required: true, min: 1, max: 50, default: 5 },
    { key: 'condition', label: 'Condition', type: 'select', required: true, options: CONDITIONS, default: 'Good' },
    { key: 'warrantyUntil', label: 'Warranty Until', type: 'date' },
    { key: 'vendor', label: 'Vendor', type: 'text' },
    { key: 'vendorContact', label: 'Vendor Contact', type: 'text' },
    { key: 'poNumber', label: 'Purchase Order No', type: 'text' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ purchaseDate: todayISO() }),
  validate: (v, { existing, rows }) => ({
    ...(v.serial && rows.some((r) => r.id !== existing?.id && r.serial.toLowerCase() === String(v.serial).trim().toLowerCase()) ? { serial: 'Another asset has this serial number' } : {}),
    ...(String(v.purchaseDate) > todayISO() ? { purchaseDate: 'The purchase date cannot be in the future' } : {}),
    ...(v.warrantyUntil && String(v.warrantyUntil) <= String(v.purchaseDate) ? { warrantyUntil: 'The warranty must end after the purchase date' } : {}),
    ...(existing && Number(v.units) < unitsOut(existing.id) ? { units: `${unitsOut(existing.id)} units are allocated; units cannot drop below that` } : {}),
  }),
  prepare: (_v, { existing, rows }) => ({ tag: existing?.tag ?? nextNo('AST-', rows.map((r) => r.tag), 4), status: existing?.status ?? ('Available' as const) }),
  canDeleteRecord: (r) => (allocationsOf(r.id).length || servicesOf(r.id).length ? `${r.name} has allocation or service history. Retire it instead.` : null),
  actions: [
    { key: 'allocate', label: 'Allocate', icon: 'share-2', visible: (r) => r.status === 'Available' || (r.status === 'In Use' && unitsFree(r) > 0), run: (r, _v, ctx) => ctx.go(`/campus/asset-allocation?q=${r.tag}`) },
    {
      key: 'service',
      label: 'Schedule service',
      icon: 'tool',
      visible: (r) => r.status !== 'Retired',
      form: { title: 'Schedule service', submitLabel: 'Schedule', fields: [{ key: 'type', label: 'Type', type: 'select', required: true, options: MAINTENANCE_TYPES, default: 'Preventive Maintenance' }, { key: 'scheduled', label: 'Date', type: 'date', required: true }, { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' }, { key: 'summary', label: 'What needs doing', type: 'textarea', required: true }], initial: () => ({ scheduled: addDays(todayISO(), 7) }), validate: (v) => (String(v.scheduled) < todayISO() ? { scheduled: 'Choose today or a later date' } : {}) },
      run: (r, v, ctx) => { repo<ServiceRecord>('assetServices').create({ assetId: r.id, type: v.type, summary: v.summary, priority: v.priority, scheduled: v.scheduled, startedOn: '', completedOn: '', vendor: r.vendor, technician: '', technicianContact: '', labour: 0, consumables: 0, callOut: 0, parts: [], status: 'Scheduled', onHold: false, holdReason: '', notes: '' }); ctx.toast(`${v.type} scheduled for ${formatDate(v.scheduled)}`); },
    },
    { key: 'condition', label: 'Update condition', icon: 'activity', form: { title: 'Update condition', fields: [{ key: 'condition', label: 'Condition', type: 'select', required: true, options: CONDITIONS }], initial: (r) => ({ condition: r.condition }) }, run: (r, v, ctx) => { ctx.update({ condition: v.condition }); ctx.toast(`${r.name} is now ${v.condition}`); } },
    { key: 'retire', label: 'Retire', icon: 'archive', tone: 'danger', visible: (r) => r.status !== 'Retired', confirm: 'Retire this asset? It leaves active use and cannot be allocated.', run: (r, _v, ctx) => { if (unitsOut(r.id) > 0) { ctx.toast(`${unitsOut(r.id)} unit(s) are still allocated. Return them first.`, 'error'); return; } if (openServiceOf(r.id)) { ctx.toast('Finish or cancel the open repair first.', 'error'); return; } ctx.update({ status: 'Retired', notes: `Retired on ${todayISO()}.` }); ctx.toast(`${r.name} retired`, 'info'); } },
    { key: 'reinstate', label: 'Reinstate', icon: 'rotate-ccw', visible: (r) => r.status === 'Retired', run: (r, _v, ctx) => { ctx.update({ status: 'Available' }); ctx.toast(`${r.name} is available again`); } },
    { key: 'print', label: 'Share asset tag', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.tag, `${r.tag} · ${r.name}\n${r.model} · S/N ${r.serial}\n${r.location}, ${r.spot}\nCondition ${r.condition} · ${r.status}`) },
  ],
  bulk: [
    { key: 'location', label: 'Move', icon: 'map-pin', form: { title: 'Move selected assets', fields: [{ key: 'location', label: 'Location', type: 'select', required: true, options: ASSET_LOCATIONS }, { key: 'spot', label: 'Spot / Room', type: 'text' }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ location: v.location, ...(v.spot ? { spot: v.spot } : {}) })); ctx.toast(`${rows.length} assets moved to ${v.location}`); } },
    { key: 'condition', label: 'Set condition', icon: 'activity', form: { title: 'Set condition', fields: [{ key: 'condition', label: 'Condition', type: 'select', required: true, options: CONDITIONS }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ condition: v.condition })); ctx.toast(`${rows.length} assets set to ${v.condition}`); } },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Import assets',
      icon: 'upload',
      form: { title: 'Import assets', submitLabel: 'Import', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'Whiteboard,Furniture,Academic,SteelRest WB-2,10,Main Block,Room 201,1500', hint: 'name, category, department, model, units, location, spot, purchase value. Rows with a bad category, department, location or number are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        const tags = ctx.rows.map((r) => r.tag);
        for (const [name, category, department, model, units, location, spot, value] of parseCsvRows(String(v.csv))) {
          if (!name || !ASSET_CATEGORIES.includes(category as never) || !ASSET_DEPARTMENTS.includes(department as never) || !ASSET_LOCATIONS.includes(location) || !(Number(units) >= 1) || !(Number(value) >= 0) || value === '') { skipped += 1; continue; }
          const tag = nextNo('AST-', tags, 4);
          tags.push(tag);
          ctx.create({ tag, name, category: category as AssetRecord['category'], department: department as AssetRecord['department'], model: model || '—', serial: '', units: Number(units), location, spot: spot || '', purchaseDate: todayISO(), purchaseValue: Number(value), usefulLifeYears: 5, condition: 'Good', status: 'Available', warrantyUntil: '', vendor: '', vendorContact: '', poNumber: '', notes: 'Imported' });
          added += 1;
        }
        ctx.toast(`${added} asset${added === 1 ? '' : 's'} imported${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ========================================= Allocation ========================================= */

const allocTone: Record<string, Tone> = { Active: 'success', Returned: 'neutral', 'Pending Return': 'warning', 'Overdue Return': 'danger', 'Damage Reported': 'danger' };
const ALLOC_STATES = ['Active', 'Pending Return', 'Overdue Return', 'Damage Reported', 'Returned'];
const aAsset = (a: AllocationRecord) => assetOf(a.assetId);

export const allocationsCfg: ResourceConfig<AllocationRecord> = {
  entity: 'Allocation',
  collection: 'assetAllocations',
  auditEntity: 'allocation',
  searchPlaceholder: 'Search asset, holder, tag…',
  searchText: (r) => `${assetName(r.assetId)} ${aAsset(r)?.tag ?? ''} ${r.assigneeName} ${r.assigneeType} ${aAsset(r)?.serial ?? ''}`,
  code: (r) => aAsset(r)?.tag,
  title: (r) => assetName(r.assetId),
  subtitle: (r) => `${r.assigneeType}: ${r.assigneeName} · ${r.units} unit${r.units === 1 ? '' : 's'}`,
  status: (r) => ({ label: allocationState(r), tone: allocTone[allocationState(r)] }),
  badges: (r) => [{ label: r.assigneeType, tone: 'primary' }, { label: `Out: ${r.conditionOut}`, tone: condTone[r.conditionOut] }, ...(r.damage ? [{ label: `Damage: ${r.damage.severity}`, tone: 'danger' as Tone }] : [])],
  facts: [
    { label: 'Allocated', value: (r) => formatDate(r.allocatedOn) },
    { label: 'Expected return', value: (r) => (r.expectedReturn ? formatDate(r.expectedReturn) : 'Open-ended') },
    { label: 'Returned', value: (r) => (r.actualReturn ? formatDate(r.actualReturn) : undefined) },
    { label: 'Approved by', value: (r) => r.approvedBy },
    { label: 'Location', value: (r) => (aAsset(r) ? `${aAsset(r)!.location} · ${aAsset(r)!.spot}` : undefined) },
  ],
  detail: [
    { title: 'Allocation', items: [{ label: 'Asset', value: (r) => `${assetName(r.assetId)} (${aAsset(r)?.tag})` }, { label: 'Held by', value: (r) => `${r.assigneeName} · ${r.assigneeType}` }, { label: 'Units', value: (r) => r.units }, { label: 'Status', value: (r) => allocationState(r) }, { label: 'Allocated on', value: (r) => formatDate(r.allocatedOn) }, { label: 'Expected return', value: (r) => (r.expectedReturn ? formatDate(r.expectedReturn) : 'Open-ended') }, { label: 'Returned on', value: (r) => (r.actualReturn ? formatDate(r.actualReturn) : '—') }, { label: 'Condition out / in', value: (r) => `${r.conditionOut} / ${r.conditionIn || '—'}` }] },
    { title: 'Approval', items: [{ label: 'Requested by', value: (r) => r.requestedBy }, { label: 'Approved by', value: (r) => r.approvedBy }, { label: 'Notes', value: (r) => r.notes || '—' }] },
    { title: 'Damage', items: [{ label: 'Report', value: (r) => (r.damage ? `${r.damage.type} (${r.damage.severity}) reported ${formatDate(r.damage.reportedOn)}` : 'None') }, { label: 'Repair estimate', value: (r) => (r.damage ? money(r.damage.estimate) : undefined) }, { label: 'Liability', value: (r) => r.damage?.liability }] },
  ],
  stats: [
    { label: 'Allocations', value: (rows) => rows.length, icon: 'share-2' },
    { label: 'Out now', value: (rows) => countBy(rows, (r) => !r.actualReturn && r.status !== 'Returned'), tone: 'info', icon: 'arrow-up-right' },
    { label: 'Overdue', value: (rows) => countBy(rows, (r) => allocationState(r) === 'Overdue Return'), tone: 'danger', icon: 'clock' },
    { label: 'Return requested', value: (rows) => countBy(rows, (r) => r.status === 'Pending Return'), tone: 'warning', icon: 'corner-down-left' },
    { label: 'Damage reported', value: (rows) => countBy(rows, (r) => r.status === 'Damage Reported'), tone: 'danger', icon: 'alert-triangle' },
  ],
  views: [{ key: 'all', label: 'All Allocations', match: () => true }, ...ALLOC_STATES.map((s) => ({ key: s, label: s, match: (r: AllocationRecord) => allocationState(r) === s }))],
  filters: [
    { key: 'type', label: 'Assignee type', options: opts(['Teacher', 'Staff', 'Student', 'Department', 'Classroom']), match: (r, v) => r.assigneeType === v },
    { key: 'status', label: 'Status', options: opts(ALLOC_STATES), match: (r, v) => allocationState(r) === v },
    { key: 'category', label: 'Category', options: opts(ASSET_CATEGORIES), match: (r, v) => aAsset(r)?.category === v },
    { key: 'department', label: 'Department', options: opts(ASSET_DEPARTMENTS), match: (r, v) => aAsset(r)?.department === v },
    { key: 'condition', label: 'Condition out', options: opts(CONDITIONS), match: (r, v) => r.conditionOut === v },
  ],
  sorts: [
    { key: 'recent', label: 'Recently allocated', compare: (a, b) => b.allocatedOn.localeCompare(a.allocatedOn) },
    { key: 'asset', label: 'Asset (A–Z)', compare: (a, b) => assetName(a.assetId).localeCompare(assetName(b.assetId)) },
    { key: 'due', label: 'Return date (soonest)', compare: (a, b) => (a.expectedReturn || '9999').localeCompare(b.expectedReturn || '9999') },
  ],
  form: [
    { key: 'assetId', label: 'Asset', type: 'select', required: true, readOnly: (_v, isEdit) => isEdit, optionsFrom: { collection: 'assets', label: (a: AssetRecord) => `${a.name} (${a.tag})`, hint: (a: AssetRecord) => `${unitsFree(a)} of ${a.units} free · ${a.status}`, filter: (a: AssetRecord) => a.status === 'Available' || a.status === 'In Use' } },
    { key: 'assignee', label: 'Allocate To', type: 'select', required: true, options: assigneeChoices, readOnly: (_v, isEdit) => isEdit },
    { key: 'units', label: 'Units', type: 'number', required: true, min: 1, default: 1 },
    { key: 'allocatedOn', label: 'Allocated On', type: 'date', required: true },
    { key: 'expectedReturn', label: 'Expected Return', type: 'date', hint: 'Leave empty for permanent allocation.' },
    { key: 'requestedBy', label: 'Requested By', type: 'text' },
    { key: 'approvedBy', label: 'Approved By', type: 'text', default: 'Dr. Meera Krishnan' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ allocatedOn: todayISO() }),
  validate: (v, { existing }) => {
    const errors = checkAllocate(String(v.assetId), Number(v.units), existing?.id);
    return {
      ...(errors.length ? { units: errors[0] } : {}),
      ...(String(v.allocatedOn) > todayISO() ? { allocatedOn: 'The allocation date cannot be in the future' } : {}),
      ...(v.expectedReturn && String(v.expectedReturn) < String(v.allocatedOn) ? { expectedReturn: 'The return date is before the allocation date' } : {}),
    };
  },
  prepare: (v, { existing }) => ({ ...(existing ? {} : parseAssignee(String(v.assignee))), conditionOut: existing?.conditionOut ?? assetOf(String(v.assetId))?.condition ?? 'Good', conditionIn: existing?.conditionIn ?? '', actualReturn: existing?.actualReturn ?? '', status: existing?.status ?? ('Active' as const), damage: existing?.damage ?? null, assignee: undefined as never }),
  editable: (r) => !r.actualReturn && r.status !== 'Returned',
  afterSave: (_kind, record) => syncAssetStatus(record.assetId),
  canDeleteRecord: (r) => (!r.actualReturn && r.status !== 'Returned' ? 'This asset is still out. Record the return first.' : null),
  actions: [
    {
      key: 'return',
      label: 'Record return',
      icon: 'corner-down-left',
      tone: 'success',
      visible: (r) => !r.actualReturn && r.status !== 'Returned',
      form: { title: 'Record return', submitLabel: 'Return', fields: [{ key: 'on', label: 'Returned On', type: 'date', required: true }, { key: 'condition', label: 'Condition on Return', type: 'select', required: true, options: CONDITIONS, default: 'Good' }, { key: 'notes', label: 'Notes', type: 'textarea' }], initial: (r) => ({ on: todayISO(), condition: r.conditionOut }), validate: (v, r) => ({ ...(String(v.on) < r.allocatedOn ? { on: 'The return date is before the allocation date' } : {}), ...(String(v.on) > todayISO() ? { on: 'The return date cannot be in the future' } : {}) }) },
      run: (r, v, ctx) => {
        ctx.update({ actualReturn: v.on, conditionIn: v.condition, status: 'Returned', notes: v.notes ? `${r.notes ? `${r.notes} ` : ''}${v.notes}` : r.notes });
        const a = aAsset(r);
        if (a && worse(v.condition, a.condition)) repo<AssetRecord>('assets').update(a.id, { condition: v.condition });
        ctx.toast(`${assetName(r.assetId)} returned${a && worse(v.condition, a.condition) ? `; condition lowered to ${v.condition}` : ''}`);
      },
    },
    { key: 'request', label: 'Request return', icon: 'bell', visible: (r) => r.status === 'Active', run: (r, _v, ctx) => { ctx.update({ status: 'Pending Return' }); ctx.toast(`Return requested from ${r.assigneeName} (mock: nothing is sent)`, 'info'); } },
    { key: 'extend', label: 'Extend return date', icon: 'calendar', visible: (r) => !r.actualReturn && r.status !== 'Returned', form: { title: 'Extend return date', fields: [{ key: 'date', label: 'New Return Date', type: 'date', required: true }], initial: (r) => ({ date: addDays(r.expectedReturn && r.expectedReturn > todayISO() ? r.expectedReturn : todayISO(), 30) }), validate: (v) => (String(v.date) < todayISO() ? { date: 'Choose today or a later date' } : {}) }, run: (r, v, ctx) => { ctx.update({ expectedReturn: v.date, status: r.status === 'Pending Return' ? 'Active' : r.status }); ctx.toast(`Return date moved to ${formatDate(v.date)}`); } },
    { key: 'damage', label: 'Report damage', icon: 'alert-triangle', tone: 'danger', visible: (r) => !r.actualReturn && !r.damage, form: { title: 'Report damage', submitLabel: 'Report', fields: [{ key: 'type', label: 'What happened', type: 'text', required: true }, { key: 'severity', label: 'Severity', type: 'select', required: true, options: ['Minor', 'Moderate', 'Severe'], default: 'Minor' }, { key: 'estimate', label: 'Repair Estimate', type: 'money', required: true, min: 0 }, { key: 'liability', label: 'Liability', type: 'select', required: true, options: ['School', 'Assignee', 'Insurance'], default: 'School' }] }, run: (r, v, ctx) => { ctx.update({ status: 'Damage Reported', damage: { type: v.type, severity: v.severity, reportedOn: todayISO(), estimate: Number(v.estimate), liability: v.liability } }); const a = aAsset(r); if (a && v.severity === 'Severe') repo<AssetRecord>('assets').update(a.id, { condition: 'Poor' }); ctx.toast('Damage reported'); } },
    { key: 'slip', label: 'Share allocation slip', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(`${assetName(r.assetId)} allocation`, `ALLOCATION SLIP\n${assetName(r.assetId)} (${aAsset(r)?.tag}) × ${r.units}\nTo: ${r.assigneeName} (${r.assigneeType})\nOn: ${formatDate(r.allocatedOn)} · Return by: ${r.expectedReturn ? formatDate(r.expectedReturn) : 'open-ended'}\nCondition out: ${r.conditionOut}\nApproved by ${r.approvedBy}`) },
  ],
};

/* ======================================== Maintenance ======================================== */

const svcTone: Record<string, Tone> = { Scheduled: 'primary', 'In Progress': 'info', Completed: 'success', Overdue: 'danger', 'Out of Service': 'danger' };
const SERVICE_STATES = ['Scheduled', 'In Progress', 'Completed', 'Overdue', 'Out of Service'];
const prioTone: Record<string, Tone> = { Low: 'neutral', Medium: 'info', High: 'warning', Critical: 'danger' };
const sAsset = (s: ServiceRecord) => assetOf(s.assetId);

export const servicesCfg: ResourceConfig<ServiceRecord> = {
  entity: 'Service',
  collection: 'assetServices',
  auditEntity: 'service',
  searchPlaceholder: 'Search asset, vendor, technician…',
  searchText: (r) => `${assetName(r.assetId)} ${sAsset(r)?.tag ?? ''} ${r.type} ${r.summary} ${r.vendor} ${r.technician}`,
  code: (r) => r.type,
  title: (r) => assetName(r.assetId),
  subtitle: (r) => r.summary,
  status: (r) => ({ label: serviceState(r), tone: svcTone[serviceState(r)] }),
  badges: (r) => [{ label: r.priority, tone: prioTone[r.priority] }, ...(r.onHold ? [{ label: 'On hold', tone: 'warning' as Tone }] : []), ...(serviceCost(r) ? [{ label: money(serviceCost(r)), tone: 'neutral' as Tone }] : [])],
  facts: [
    { label: 'Scheduled', value: (r) => formatDate(r.scheduled) },
    { label: 'Started', value: (r) => (r.startedOn ? formatDate(r.startedOn) : undefined) },
    { label: 'Completed', value: (r) => (r.completedOn ? formatDate(r.completedOn) : undefined) },
    { label: 'Technician', value: (r) => r.technician || 'Not assigned' },
    { label: 'Vendor', value: (r) => r.vendor },
  ],
  detail: [
    { title: 'Service', items: [{ label: 'Asset', value: (r) => `${assetName(r.assetId)} (${sAsset(r)?.tag}) · ${sAsset(r)?.location}` }, { label: 'Type', value: (r) => r.type }, { label: 'Summary', value: (r) => r.summary }, { label: 'Priority', value: (r) => r.priority }, { label: 'Status', value: (r) => `${serviceState(r)}${r.onHold ? ` (on hold: ${r.holdReason})` : ''}` }, { label: 'Scheduled', value: (r) => formatDate(r.scheduled) }, { label: 'Started', value: (r) => (r.startedOn ? formatDate(r.startedOn) : '—') }, { label: 'Completed', value: (r) => (r.completedOn ? formatDate(r.completedOn) : '—') }] },
    { title: 'People', items: [{ label: 'Vendor', value: (r) => r.vendor }, { label: 'Technician', value: (r) => (r.technician ? `${r.technician} · ${r.technicianContact}` : 'Not assigned') }] },
    { title: 'Cost', items: [{ label: 'Labour', value: (r) => money(r.labour) }, { label: 'Consumables', value: (r) => money(r.consumables) }, { label: 'Call-out', value: (r) => money(r.callOut) }, { label: 'Parts', value: (r) => r.parts.map((p) => `${p.name} × ${p.qty} @ ${money(p.price)}`).join('\n') || 'None' }, { label: 'Total', value: (r) => money(serviceCost(r)) }, { label: 'Warranty', value: (r) => { const a = sAsset(r); return a ? warrantyState(a) : undefined; } }, { label: 'Notes', value: (r) => r.notes || '—' }] },
  ],
  stats: [
    { label: 'Services', value: (rows) => rows.length, icon: 'tool' },
    { label: 'Open work', value: (rows) => countBy(rows, isOpenService), tone: 'info', icon: 'activity' },
    { label: 'Overdue', value: (rows) => countBy(rows, (r) => serviceState(r) === 'Overdue'), tone: 'danger', icon: 'clock' },
    { label: 'Upcoming', value: (rows) => countBy(rows, (r) => r.status === 'Scheduled' && r.scheduled >= todayISO()), tone: 'primary', icon: 'calendar' },
    { label: 'Spend (completed)', value: (rows) => money(sum(rows.filter((r) => r.status === 'Completed'), serviceCost)), tone: 'purple', icon: 'dollar-sign' },
  ],
  views: [{ key: 'all', label: 'All Services', match: () => true }, ...SERVICE_STATES.map((s) => ({ key: s, label: s, match: (r: ServiceRecord) => serviceState(r) === s }))],
  filters: [
    { key: 'status', label: 'Status', options: opts(SERVICE_STATES), match: (r, v) => serviceState(r) === v },
    { key: 'type', label: 'Type', options: opts(MAINTENANCE_TYPES), match: (r, v) => r.type === v },
    { key: 'category', label: 'Asset category', options: opts(ASSET_CATEGORIES), match: (r, v) => sAsset(r)?.category === v },
    { key: 'priority', label: 'Priority', options: opts(['Low', 'Medium', 'High', 'Critical']), match: (r, v) => r.priority === v },
    { key: 'vendor', label: 'Vendor', options: () => [...new Set(allServices().map((s) => s.vendor))].map((x) => ({ label: x, value: x })), match: (r, v) => r.vendor === v },
    { key: 'cost', label: 'Cost', single: true, options: opts(['Under $100', '$100 – $250', '$250 – $500', 'Above $500']), match: (r, v) => { const c = serviceCost(r); return v === 'Under $100' ? c < 100 : v === '$100 – $250' ? c >= 100 && c <= 250 : v === '$250 – $500' ? c > 250 && c <= 500 : c > 500; } },
    { key: 'warranty', label: 'Asset warranty', options: opts(['In warranty', 'Expiring', 'Expired', 'No warranty']), match: (r, v) => (sAsset(r) ? warrantyState(sAsset(r)!) === v : false) },
  ],
  sorts: [
    { key: 'date', label: 'Scheduled date (soonest)', compare: (a, b) => a.scheduled.localeCompare(b.scheduled) },
    { key: 'recent', label: 'Latest first', compare: (a, b) => b.scheduled.localeCompare(a.scheduled) },
    { key: 'priority', label: 'Priority', compare: (a, b) => ['Critical', 'High', 'Medium', 'Low'].indexOf(a.priority) - ['Critical', 'High', 'Medium', 'Low'].indexOf(b.priority) },
    { key: 'cost', label: 'Cost (high)', compare: (a, b) => serviceCost(b) - serviceCost(a) },
  ],
  form: [
    { key: 'assetId', label: 'Asset', type: 'select', required: true, readOnly: (_v, isEdit) => isEdit, optionsFrom: { collection: 'assets', label: (a: AssetRecord) => `${a.name} (${a.tag})`, hint: (a: AssetRecord) => `${a.location} · ${a.status}`, filter: (a: AssetRecord) => a.status !== 'Retired' } },
    { key: 'type', label: 'Type', type: 'select', required: true, options: MAINTENANCE_TYPES },
    { key: 'summary', label: 'What needs doing', type: 'textarea', required: true },
    { key: 'priority', label: 'Priority', type: 'select', required: true, options: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
    { key: 'scheduled', label: 'Scheduled Date', type: 'date', required: true },
    { key: 'vendor', label: 'Vendor', type: 'text' },
    { key: 'technician', label: 'Technician', type: 'text' },
    { key: 'technicianContact', label: 'Technician Contact', type: 'phone' },
    { key: 'labour', label: 'Labour Cost', type: 'money', min: 0, default: 0 },
    { key: 'consumables', label: 'Consumables', type: 'money', min: 0, default: 0 },
    { key: 'callOut', label: 'Call-out Charge', type: 'money', min: 0, default: 0 },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ scheduled: addDays(todayISO(), 7) }),
  validate: (v, { existing }) => ({
    ...(!existing && String(v.scheduled) < todayISO() ? { scheduled: 'Choose today or a later date' } : {}),
    ...(!existing && openServiceOf(String(v.assetId)) && (v.type === 'Repair' || v.type === 'Emergency Repair') ? { type: 'This asset already has open repair work' } : {}),
  }),
  prepare: (v, { existing }) => ({ status: existing?.status ?? ('Scheduled' as const), startedOn: existing?.startedOn ?? '', completedOn: existing?.completedOn ?? '', parts: existing?.parts ?? [], onHold: existing?.onHold ?? false, holdReason: existing?.holdReason ?? '', vendor: v.vendor || assetOf(String(v.assetId))?.vendor || '' }),
  editable: (r) => r.status !== 'Completed',
  afterSave: (_kind, record) => syncAssetStatus(record.assetId),
  canDeleteRecord: (r) => (r.status === 'Scheduled' ? null : 'Only work that has not started can be deleted; completed work is history.'),
  actions: [
    { key: 'start', label: 'Start work', icon: 'play', visible: (r) => r.status === 'Scheduled', run: (r, _v, ctx) => { const open = openServiceOf(r.assetId); if (open) { ctx.toast(`${assetName(r.assetId)} already has work in progress.`, 'error'); return; } ctx.update({ status: 'In Progress', startedOn: todayISO() }); ctx.toast('Work started; the asset is under maintenance'); } },
    { key: 'hold', label: 'Put on hold', icon: 'pause', visible: (r) => r.status === 'In Progress' && !r.onHold, form: { title: 'Put on hold', submitLabel: 'Hold', fields: [{ key: 'reason', label: 'Reason', type: 'text', required: true }] }, run: (r, v, ctx) => { ctx.update({ onHold: true, holdReason: v.reason }); ctx.toast('Work is on hold', 'info'); } },
    { key: 'resume', label: 'Resume', icon: 'play', visible: (r) => r.onHold && isOpenService(r), run: (r, _v, ctx) => { ctx.update({ onHold: false, holdReason: '', status: 'In Progress' }); ctx.toast('Work resumed'); } },
    { key: 'oos', label: 'Mark out of service', icon: 'slash', tone: 'danger', visible: (r) => r.status === 'In Progress', run: (r, _v, ctx) => { ctx.update({ status: 'Out of Service' }); ctx.toast('Asset is out of service until repaired', 'info'); } },
    { key: 'part', label: 'Add spare part', icon: 'plus-square', visible: (r) => r.status !== 'Completed', form: { title: 'Add spare part', submitLabel: 'Add', fields: [{ key: 'name', label: 'Part', type: 'text', required: true }, { key: 'qty', label: 'Quantity', type: 'number', required: true, min: 1, default: 1 }, { key: 'price', label: 'Unit Price', type: 'money', required: true, min: 0 }] }, run: (r, v, ctx) => { ctx.update({ parts: [...r.parts, { name: v.name, qty: Number(v.qty), price: Number(v.price) }] }); ctx.toast(`${v.name} added`); } },
    {
      key: 'complete',
      label: 'Complete',
      icon: 'check-circle',
      tone: 'success',
      visible: (r) => r.status === 'In Progress' || r.status === 'Out of Service',
      form: { title: 'Complete service', submitLabel: 'Complete', fields: [{ key: 'on', label: 'Completed On', type: 'date', required: true }, { key: 'labour', label: 'Labour Cost', type: 'money', min: 0 }, { key: 'consumables', label: 'Consumables', type: 'money', min: 0 }, { key: 'condition', label: 'Asset Condition Now', type: 'select', required: true, options: CONDITIONS, default: 'Good' }, { key: 'next', label: 'Next Service Due (optional)', type: 'date' }, { key: 'notes', label: 'Outcome', type: 'textarea' }], initial: (r) => ({ on: todayISO(), labour: String(r.labour), consumables: String(r.consumables) }), validate: (v, r) => ({ ...(String(v.on) < r.startedOn ? { on: 'This is before the work started' } : {}), ...(String(v.on) > todayISO() ? { on: 'The completion date cannot be in the future' } : {}), ...(v.next && String(v.next) <= String(v.on) ? { next: 'The next service must be after this one' } : {}) }) },
      run: (r, v, ctx) => {
        ctx.update({ status: 'Completed', completedOn: v.on, labour: Number(v.labour || 0), consumables: Number(v.consumables || 0), onHold: false, holdReason: '', notes: v.notes || r.notes });
        repo<AssetRecord>('assets').update(r.assetId, { condition: v.condition });
        if (v.next) repo<ServiceRecord>('assetServices').create({ ...r, id: undefined, status: 'Scheduled', scheduled: v.next, startedOn: '', completedOn: '', labour: 0, consumables: 0, callOut: 0, parts: [], onHold: false, holdReason: '', notes: '', summary: `Follow-up: ${r.summary}` });
        syncAssetStatus(r.assetId);
        ctx.toast(`Service completed${v.next ? '; follow-up scheduled' : ''}`);
      },
    },
    { key: 'reschedule', label: 'Reschedule', icon: 'calendar', visible: (r) => r.status === 'Scheduled', form: { title: 'Reschedule', fields: [{ key: 'date', label: 'New Date', type: 'date', required: true }], initial: (r) => ({ date: r.scheduled < todayISO() ? todayISO() : r.scheduled }), validate: (v) => (String(v.date) < todayISO() ? { date: 'Choose today or a later date' } : {}) }, run: (r, v, ctx) => { ctx.update({ scheduled: v.date }); ctx.toast(`Moved to ${formatDate(v.date)}`); } },
    { key: 'asset', label: 'Open asset', icon: 'package', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/assets?q=${sAsset(r)?.tag ?? ''}`) },
  ],
};

/* =========================================== Stock =========================================== */

const stockTone: Record<string, Tone> = { 'In Stock': 'success', 'Low Stock': 'warning', 'Reorder Raised': 'info', 'Out of Stock': 'danger' };
const STOCK_STATES = ['In Stock', 'Low Stock', 'Reorder Raised', 'Out of Stock'];
const ADJUST_REASONS = ['Damaged in storage', 'Expired', 'Breakage', 'Lost or unaccounted', 'Physical count correction', 'Returned to supplier'];

export const stockCfg: ResourceConfig<StockItemRecord> = {
  entity: 'Stock Item',
  collection: 'stockItems',
  auditEntity: 'stock',
  searchPlaceholder: 'Search item, code, supplier…',
  searchText: (r) => `${r.name} ${r.code} ${r.supplier} ${r.category} ${r.warehouse} ${r.location}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.category} · ${r.warehouse}`,
  status: (r) => ({ label: stockState(r), tone: stockTone[stockState(r)] }),
  badges: (r) => [{ label: `${stockOnHand(r)} ${r.unit}${stockOnHand(r) === 1 ? '' : 's'}`, tone: 'primary' }, ...(r.openOrder ? [{ label: r.openOrder, tone: 'info' as Tone }] : [])],
  facts: [
    { label: 'On hand', value: (r) => `${stockOnHand(r)} (reorder at ${r.reorderLevel})` },
    { label: 'Stock value', value: (r) => money(stockValue(r)) },
    { label: 'Supplier', value: (r) => r.supplier },
    { label: 'Rack', value: (r) => r.location },
    { label: 'Last movement', value: (r) => (lastMovementDate(r.id) ? formatDate(lastMovementDate(r.id)) : '—') },
  ],
  detail: [
    { title: 'Item', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Unit / pack', value: (r) => `${r.unit} · ${r.packSize}` }, { label: 'Warehouse / rack', value: (r) => `${r.warehouse} · ${r.location}` }, { label: 'Unit price', value: (r) => money(r.unitPrice) }, { label: 'Notes', value: (r) => r.notes || '—' }] },
    { title: 'Stock', items: [{ label: 'Opening balance', value: (r) => r.openingBalance }, { label: 'Received', value: (r) => movementsOf(r.id).filter((m) => m.direction === 'in' && m.kind !== 'adjustment' && m.kind !== 'transfer-in').reduce((n, m) => n + m.qty, 0) }, { label: 'Issued', value: (r) => movementsOf(r.id).filter((m) => m.kind === 'issue').reduce((n, m) => n + m.qty, 0) }, { label: 'Transferred in / out', value: (r) => `${movementsOf(r.id).filter((m) => m.kind === 'transfer-in').reduce((n, m) => n + m.qty, 0)} / ${movementsOf(r.id).filter((m) => m.kind === 'transfer-out').reduce((n, m) => n + m.qty, 0)}` }, { label: 'Adjustments', value: (r) => movementsOf(r.id).filter((m) => m.kind === 'adjustment').reduce((n, m) => n + (m.direction === 'in' ? m.qty : -m.qty), 0) }, { label: 'On hand', value: (r) => stockOnHand(r) }, { label: 'Value', value: (r) => money(stockValue(r)) }] },
    { title: 'Supply', items: [{ label: 'Supplier', value: (r) => `${r.supplier} · lead time ${r.leadTimeDays} days` }, { label: 'Reorder level / quantity', value: (r) => `${r.reorderLevel} / ${r.reorderQty}` }, { label: 'Open order', value: (r) => r.openOrder || 'None' }, { label: 'Issued last 30 days', value: (r) => issuedSince(r.id, 30) }] },
    { title: 'Recent movements', items: [{ label: 'Latest', value: (r) => [...movementsOf(r.id)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6).map((m) => `${formatDate(m.date)} · ${m.kind} ${m.direction === 'in' ? '+' : '−'}${m.qty}${m.party ? ` · ${m.party}` : ''}`).join('\n') || 'None' }] },
  ],
  stats: [
    { label: 'Items', value: (rows) => rows.length, icon: 'archive' },
    { label: 'In stock', value: (rows) => countBy(rows, (r) => stockState(r) === 'In Stock'), tone: 'success', icon: 'check-circle' },
    { label: 'Low', value: (rows) => countBy(rows, (r) => stockState(r) === 'Low Stock'), tone: 'warning', icon: 'alert-triangle' },
    { label: 'Out of stock', value: (rows) => countBy(rows, (r) => stockState(r) === 'Out of Stock'), tone: 'danger', icon: 'x-circle' },
    { label: 'Stock value', value: (rows) => money(sum(rows, stockValue)), tone: 'purple', icon: 'dollar-sign' },
  ],
  views: [{ key: 'all', label: 'All Items', match: () => true }, ...STOCK_STATES.map((s) => ({ key: s, label: s, match: (r: StockItemRecord) => stockState(r) === s }))],
  filters: [
    { key: 'category', label: 'Category', options: opts(STOCK_CATEGORIES), match: (r, v) => r.category === v },
    { key: 'warehouse', label: 'Warehouse', options: opts(WAREHOUSES), match: (r, v) => r.warehouse === v },
    { key: 'supplier', label: 'Supplier', options: () => [...new Set(allStock().map((s) => s.supplier))].map((x) => ({ label: x, value: x })), match: (r, v) => r.supplier === v },
    { key: 'status', label: 'Status', options: opts(STOCK_STATES), match: (r, v) => stockState(r) === v },
    { key: 'value', label: 'Stock value', single: true, options: opts(['Under $500', '$500 – $1,000', '$1,000 – $2,500', 'Above $2,500']), match: (r, v) => { const x = stockValue(r); return v === 'Under $500' ? x < 500 : v === '$500 – $1,000' ? x >= 500 && x <= 1000 : v === '$1,000 – $2,500' ? x > 1000 && x <= 2500 : x > 2500; } },
    { key: 'movement', label: 'Movement', single: true, options: opts(['Fast moving', 'No movement in 60 days']), match: (r, v) => (v === 'Fast moving' ? issuedSince(r.id, 30) >= r.reorderLevel : issuedSince(r.id, 60) === 0) },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'low', label: 'Lowest stock vs level', compare: (a, b) => stockOnHand(a) - a.reorderLevel - (stockOnHand(b) - b.reorderLevel) },
    { key: 'value', label: 'Stock value (high)', compare: (a, b) => stockValue(b) - stockValue(a) },
  ],
  form: [
    { key: 'name', label: 'Item Name', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: STOCK_CATEGORIES },
    { key: 'unit', label: 'Unit', type: 'select', required: true, options: UNITS, default: 'Piece' },
    { key: 'packSize', label: 'Pack Size', type: 'text' },
    { key: 'warehouse', label: 'Warehouse', type: 'select', required: true, options: WAREHOUSES },
    { key: 'location', label: 'Rack', type: 'text' },
    { key: 'supplier', label: 'Supplier', type: 'text', required: true },
    { key: 'leadTimeDays', label: 'Lead Time (days)', type: 'number', min: 0, max: 120, default: 5 },
    { key: 'openingBalance', label: 'Opening Balance', type: 'number', required: true, min: 0, default: 0, readOnly: (_v, isEdit) => isEdit, hint: 'Fixed after creation; use Receive, Issue or Adjust.' },
    { key: 'reorderLevel', label: 'Reorder Level', type: 'number', required: true, min: 0, default: 10 },
    { key: 'reorderQty', label: 'Reorder Quantity', type: 'number', required: true, min: 1, default: 20 },
    { key: 'unitPrice', label: 'Unit Price', type: 'money', required: true, min: 0 },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  validate: (v, { existing, rows }) => (rows.some((r) => r.id !== existing?.id && r.warehouse === v.warehouse && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'This warehouse already stocks an item with that name' } : {}),
  prepare: (_v, { existing, rows }) => ({ code: existing?.code ?? nextNo('STK-', rows.map((r) => r.code), 3), createdOn: existing?.createdOn ?? todayISO(), openOrder: existing?.openOrder ?? '' }),
  canDeleteRecord: (r) => (movementsOf(r.id).length ? `${r.name} has ${movementsOf(r.id).length} movement(s) on record. Keep it for the audit trail.` : null),
  actions: [
    {
      key: 'receive',
      label: 'Receive stock',
      icon: 'arrow-down-circle',
      tone: 'success',
      form: { title: 'Receive stock', submitLabel: 'Receive', fields: [{ key: 'qty', label: 'Quantity Received', type: 'number', required: true, min: 1 }, { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'reference', label: 'Delivery / GRN No', type: 'text' }, { key: 'note', label: 'Note', type: 'text' }], initial: (r) => ({ qty: String(r.reorderQty), date: todayISO() }), validate: (v) => (String(v.date) > todayISO() ? { date: 'The date cannot be in the future' } : {}) },
      run: (r, v, ctx) => { recordMovement({ itemId: r.id, kind: 'receipt', qty: Number(v.qty), direction: 'in', date: v.date, reference: v.reference || nextNo('GRN-', movementsOf(r.id).map((m) => m.reference), 4), party: r.supplier, by: BY, note: v.note || '' }); if (r.openOrder) ctx.update({ openOrder: '' }); ctx.toast(`${v.qty} ${r.unit}(s) received${r.openOrder ? '; open order closed' : ''}`); },
    },
    {
      key: 'issue',
      label: 'Issue stock',
      icon: 'arrow-up-circle',
      visible: (r) => stockOnHand(r) > 0,
      form: { title: 'Issue stock', submitLabel: 'Issue', fields: [{ key: 'qty', label: 'Quantity', type: 'number', required: true, min: 1 }, { key: 'to', label: 'Issued To', type: 'text', required: true, placeholder: 'Science dept' }, { key: 'date', label: 'Date', type: 'date', required: true }, { key: 'note', label: 'Note', type: 'text' }], initial: () => ({ date: todayISO() }), validate: (v, r) => ({ ...(Number(v.qty) > stockOnHand(r) ? { qty: `Only ${stockOnHand(r)} on hand` } : {}), ...(String(v.date) > todayISO() ? { date: 'The date cannot be in the future' } : {}) }) },
      run: (r, v, ctx) => { recordMovement({ itemId: r.id, kind: 'issue', qty: Number(v.qty), direction: 'out', date: v.date, reference: nextNo('ISS-', movementsOf(r.id).map((m) => m.reference), 4), party: v.to, by: BY, note: v.note || '' }); const left = stockOnHand(r) - Number(v.qty); ctx.toast(`${v.qty} issued to ${v.to}${left <= r.reorderLevel ? `. ${left <= 0 ? 'Out of stock' : 'Low stock'} — consider a reorder.` : ''}`); },
    },
    {
      key: 'adjust',
      label: 'Adjust stock',
      icon: 'edit-3',
      form: { title: 'Adjust stock', submitLabel: 'Adjust', fields: [{ key: 'direction', label: 'Direction', type: 'select', required: true, options: [{ label: 'Remove stock', value: 'out' }, { label: 'Add stock', value: 'in' }], default: 'out' }, { key: 'qty', label: 'Quantity', type: 'number', required: true, min: 1 }, { key: 'reason', label: 'Reason', type: 'select', required: true, options: ADJUST_REASONS }], validate: (v, r) => (v.direction === 'out' && Number(v.qty) > stockOnHand(r) ? { qty: `Only ${stockOnHand(r)} on hand` } : {}) },
      run: (r, v, ctx) => { recordMovement({ itemId: r.id, kind: 'adjustment', qty: Number(v.qty), direction: v.direction, date: todayISO(), reference: nextNo('ADJ-', movementsOf(r.id).map((m) => m.reference), 4), party: '', by: BY, note: v.reason }); ctx.toast(`Stock ${v.direction === 'in' ? 'increased' : 'reduced'} by ${v.qty} (${v.reason})`); },
    },
    {
      key: 'transfer',
      label: 'Transfer to another store',
      icon: 'repeat',
      visible: (r) => stockOnHand(r) > 0,
      form: { title: 'Transfer stock', submitLabel: 'Transfer', fields: [{ key: 'warehouse', label: 'To Warehouse', type: 'select', required: true, options: WAREHOUSES }, { key: 'qty', label: 'Quantity', type: 'number', required: true, min: 1 }], validate: (v, r) => ({ ...(v.warehouse === r.warehouse ? { warehouse: 'Choose a different warehouse' } : {}), ...(Number(v.qty) > stockOnHand(r) ? { qty: `Only ${stockOnHand(r)} on hand` } : {}) }) },
      run: (r, v, ctx) => {
        let dest = allStock().find((x) => x.name === r.name && x.warehouse === v.warehouse);
        if (!dest) dest = repo<StockItemRecord>('stockItems').create({ ...r, id: undefined, code: nextNo('STK-', allStock().map((x) => x.code), 3), warehouse: v.warehouse, openingBalance: 0, openOrder: '', createdOn: todayISO(), location: '', notes: `Created by transfer from ${r.warehouse}.` });
        const ref = nextNo('TRF-', allSMoves(), 4);
        recordMovement({ itemId: r.id, kind: 'transfer-out', qty: Number(v.qty), direction: 'out', date: todayISO(), reference: ref, party: v.warehouse, by: BY, note: '' });
        recordMovement({ itemId: dest.id, kind: 'transfer-in', qty: Number(v.qty), direction: 'in', date: todayISO(), reference: ref, party: r.warehouse, by: BY, note: '' });
        ctx.toast(`${v.qty} ${r.unit}(s) moved to ${v.warehouse}`);
      },
    },
    { key: 'order', label: 'Raise purchase order', icon: 'shopping-cart', visible: (r) => !r.openOrder && stockState(r) !== 'In Stock', run: (r, _v, ctx) => { const po = nextNo('PO-2026-', allStock().map((x) => x.openOrder).filter(Boolean), 3); ctx.update({ openOrder: po }); ctx.toast(`${po} raised for ${r.reorderQty} ${r.unit}(s) from ${r.supplier} (mock: nothing is sent)`, 'info'); } },
    { key: 'receiveOrder', label: 'Receive the open order', icon: 'package', visible: (r) => !!r.openOrder, run: (r, _v, ctx) => { recordMovement({ itemId: r.id, kind: 'receipt', qty: r.reorderQty, direction: 'in', date: todayISO(), reference: r.openOrder, party: r.supplier, by: BY, note: 'Purchase order received.' }); ctx.update({ openOrder: '' }); ctx.toast(`${r.openOrder} received: ${r.reorderQty} ${r.unit}(s)`); } },
    { key: 'cancelOrder', label: 'Cancel the open order', icon: 'x', visible: (r) => !!r.openOrder, confirm: 'Cancel this purchase order?', run: (r, _v, ctx) => { ctx.update({ openOrder: '' }); ctx.toast(`${r.openOrder} cancelled`, 'info'); } },
    { key: 'level', label: 'Change reorder level', icon: 'sliders', form: { title: 'Change reorder level', fields: [{ key: 'level', label: 'Reorder Level', type: 'number', required: true, min: 0 }, { key: 'qty', label: 'Reorder Quantity', type: 'number', required: true, min: 1 }], initial: (r) => ({ level: String(r.reorderLevel), qty: String(r.reorderQty) }) }, run: (r, v, ctx) => { ctx.update({ reorderLevel: Number(v.level), reorderQty: Number(v.qty) }); ctx.toast('Reorder settings saved'); } },
  ],
};

const allSMoves = () => snapshot<StockMovementRecord>('stockMovements').map((m) => m.reference);

