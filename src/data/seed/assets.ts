/** Campus Operations seed data, part 2: assets, allocations, maintenance and stock. */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildStaff, buildTeachers } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';
import { buildVehicles } from './transport';

export type AssetCategory = 'IT Equipment' | 'Lab Equipment' | 'Furniture' | 'Vehicle' | 'Office Equipment' | 'Kitchen Equipment' | 'Sports Equipment';
export type AssetDepartment = 'Academic' | 'Science' | 'Administration' | 'Library' | 'Hostel' | 'Transport' | 'Cafeteria';
export type AssetStatus = 'In Use' | 'Under Maintenance' | 'Available' | 'Retired';
export type Condition = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export const ASSET_CATEGORIES: AssetCategory[] = ['IT Equipment', 'Lab Equipment', 'Furniture', 'Vehicle', 'Office Equipment', 'Kitchen Equipment', 'Sports Equipment'];
export const ASSET_DEPARTMENTS: AssetDepartment[] = ['Academic', 'Science', 'Administration', 'Library', 'Hostel', 'Transport', 'Cafeteria'];
export const CONDITIONS: Condition[] = ['Excellent', 'Good', 'Fair', 'Poor'];
export const ASSET_LOCATIONS = ['Main Block', 'Science Block', 'Library', 'Hostel Block A', 'Hostel Block B', 'Transport Yard', 'Cafeteria', 'Sports Complex'];

export interface AssetRecord extends Entity {
  tag: string;
  name: string;
  category: AssetCategory;
  department: AssetDepartment;
  model: string;
  serial: string;
  units: number;
  location: string;
  spot: string;
  purchaseDate: string;
  /** Total purchase value of all units. */
  purchaseValue: number;
  usefulLifeYears: number;
  condition: Condition;
  status: AssetStatus;
  warrantyUntil: string;
  vendor: string;
  vendorContact: string;
  poNumber: string;
  notes: string;
}

// name, category, department, model, units, location, spot, value, life, condition, status, years ago, warranty years
const ASSET_ROWS: [string, AssetCategory, AssetDepartment, string, number, string, string, number, number, Condition, AssetStatus, number, number][] = [
  ['Dell Latitude Laptop', 'IT Equipment', 'Academic', 'Latitude 3440', 20, 'Main Block', 'Computer Lab 1', 16000, 5, 'Good', 'In Use', 2, 3],
  ['Interactive Smart Board', 'IT Equipment', 'Academic', 'ViewPro 75"', 6, 'Main Block', 'Classrooms 301–306', 9600, 8, 'Excellent', 'In Use', 1, 5],
  ['Projector', 'IT Equipment', 'Academic', 'Epson EB-X49', 4, 'Main Block', 'Seminar Hall', 2800, 6, 'Good', 'Available', 3, 3],
  ['Desktop Computer', 'IT Equipment', 'Administration', 'HP ProDesk 400', 8, 'Main Block', 'Admin Office', 5600, 5, 'Fair', 'In Use', 4, 3],
  ['Compound Microscope', 'Lab Equipment', 'Science', 'OptiLab M200', 12, 'Science Block', 'Biology Lab', 7200, 12, 'Good', 'In Use', 3, 2],
  ['Digital Balance', 'Lab Equipment', 'Science', 'Mettler XS204', 3, 'Science Block', 'Chemistry Lab', 2400, 10, 'Excellent', 'Under Maintenance', 2, 2],
  ['Spectrophotometer', 'Lab Equipment', 'Science', 'Shimadzu UV-1800', 1, 'Science Block', 'Physics Lab', 6800, 10, 'Good', 'Available', 4, 3],
  ['Student Desk & Bench', 'Furniture', 'Academic', 'SteelRest SB-2', 240, 'Main Block', 'All classrooms', 14400, 12, 'Good', 'In Use', 5, 1],
  ['Library Shelving Unit', 'Furniture', 'Library', 'Oakline LS-6', 30, 'Library', 'Reading Hall', 6000, 15, 'Good', 'In Use', 6, 1],
  ['Hostel Bunk Bed', 'Furniture', 'Hostel', 'SteelRest HB-1', 60, 'Hostel Block A', 'Rooms 101–130', 9000, 10, 'Fair', 'In Use', 5, 1],
  ['School Bus', 'Vehicle', 'Transport', 'Tata Starbus Ultra', 1, 'Transport Yard', 'Bay 1', 38000, 12, 'Good', 'In Use', 5, 3],
  ['School Bus', 'Vehicle', 'Transport', 'Ashok Leyland Lynx', 1, 'Transport Yard', 'Bay 2', 36000, 12, 'Good', 'In Use', 6, 3],
  ['Mini Bus', 'Vehicle', 'Transport', 'Tata Winger', 1, 'Transport Yard', 'Bay 4', 21000, 10, 'Good', 'In Use', 4, 3],
  ['Photocopier', 'Office Equipment', 'Administration', 'CanonPro iR-2625', 2, 'Main Block', 'Admin Office', 3600, 7, 'Fair', 'In Use', 4, 2],
  ['Laser Printer', 'Office Equipment', 'Administration', 'HP LaserJet 4003', 5, 'Main Block', 'Staff Room', 1750, 5, 'Good', 'Available', 2, 2],
  ['Commercial Refrigerator', 'Kitchen Equipment', 'Cafeteria', 'ColdMax CR-800', 2, 'Cafeteria', 'Kitchen', 4200, 10, 'Good', 'Under Maintenance', 3, 2],
  ['Industrial Gas Range', 'Kitchen Equipment', 'Cafeteria', 'KitchenPro GR-6', 2, 'Cafeteria', 'Kitchen', 3200, 10, 'Good', 'In Use', 5, 1],
  ['Football Goal Post Set', 'Sports Equipment', 'Academic', 'SportsOne FG-11', 2, 'Sports Complex', 'Main Ground', 1800, 8, 'Fair', 'In Use', 4, 0],
  ['Basketball Backboard', 'Sports Equipment', 'Academic', 'SportsOne BB-3', 2, 'Sports Complex', 'Court 1', 2400, 10, 'Good', 'Available', 3, 0],
  ['Old CRT Monitor', 'IT Equipment', 'Administration', 'Samsung SyncMaster', 10, 'Main Block', 'Store room', 1500, 6, 'Poor', 'Retired', 11, 0],
  ['Water Cooler', 'Office Equipment', 'Hostel', 'BlueStar WC-20', 6, 'Hostel Block B', 'Corridors', 1800, 8, 'Good', 'In Use', 3, 1],
  ['Treadmill', 'Sports Equipment', 'Hostel', 'FitLine T-500', 2, 'Hostel Block A', 'Gym', 2600, 8, 'Good', 'Available', 2, 2],
];

const VENDORS: [string, string][] = [['Dell Technologies', 'sales@dell.example'], ['ViewPro Systems Ltd', 'orders@viewpro.example'], ['OptiLab Instruments', 'support@optilab.example'], ['SteelRest Furnishings', 'b2b@steelrest.example'], ['CanonPro Office Solutions', 'care@canonpro.example'], ['Volvo Commercial Services', 'fleet@volvo.example'], ['ColdMax Refrigeration', 'service@coldmax.example']];

export const buildAssets = (): AssetRecord[] => {
  const rng = makeRng(81000);
  const vehicles = buildVehicles();
  let vi = 0;
  return ASSET_ROWS.map(([name, category, department, model, units, location, spot, purchaseValue, usefulLifeYears, condition, status, yearsAgo, warranty], i) => {
    const [vendor, vendorContact] = VENDORS[i % VENDORS.length];
    const purchaseDate = addDays(SEED_TODAY, -Math.round(yearsAgo * 365 - rng.int(0, 120)));
    const serial = category === 'Vehicle' ? vehicles[vi++].number : `SN${rng.int(100000, 999999)}${String.fromCharCode(65 + (i % 26))}`;
    return {
      id: `ast-${pad(i + 1)}`,
      tag: `AST-${pad(i + 1, 4)}`,
      name,
      category,
      department,
      model,
      serial,
      units,
      location,
      spot,
      purchaseDate,
      purchaseValue,
      usefulLifeYears,
      condition,
      status,
      warrantyUntil: warranty ? addDays(purchaseDate, warranty * 365) : '',
      vendor,
      vendorContact,
      poNumber: `PO-${2020 + (i % 6)}-${pad(100 + i * 7)}`,
      notes: status === 'Retired' ? 'Written off after the lab refit.' : '',
    };
  });
};
export const assets = defineCollection<AssetRecord>('assets', buildAssets);

/* ------------------------------------ Allocations ------------------------------------ */

export type AssigneeType = 'Staff' | 'Teacher' | 'Student' | 'Department' | 'Classroom';
export type AllocationStatus = 'Active' | 'Returned' | 'Pending Return' | 'Damage Reported';

export interface DamageReport {
  type: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  reportedOn: string;
  estimate: number;
  liability: 'School' | 'Assignee' | 'Insurance';
}

export interface AllocationRecord extends Entity {
  assetId: string;
  assigneeType: AssigneeType;
  assigneeName: string;
  /** Teacher id / staff id / classroom number / department name. */
  assigneeRef: string;
  units: number;
  allocatedOn: string;
  expectedReturn: string;
  /** '' while the asset is still out. */
  actualReturn: string;
  conditionOut: Condition;
  conditionIn: '' | Condition;
  status: AllocationStatus;
  damage: DamageReport | null;
  requestedBy: string;
  approvedBy: string;
  notes: string;
}

export const buildAllocations = (): AllocationRecord[] => {
  const rng = makeRng(82000);
  const assetsAll = buildAssets();
  const teachers = buildTeachers();
  const staff = buildStaff();
  const out: AllocationRecord[] = [];
  const add = (a: AllocationRecord) => out.push(a);
  assetsAll.forEach((a, i) => {
    if (a.status === 'In Use') {
      const kind = a.category === 'Vehicle' ? 'Department' : a.category === 'Furniture' || a.name.includes('Board') ? 'Classroom' : i % 3 === 0 ? 'Teacher' : i % 3 === 1 ? 'Staff' : 'Department';
      const t = teachers[i % teachers.length];
      const s = staff[i % staff.length];
      const [assigneeName, assigneeRef] = kind === 'Teacher' ? [t.name, t.id] : kind === 'Staff' ? [s.name, s.id] : kind === 'Classroom' ? [`Room ${301 + (i % 6)}`, String(301 + (i % 6))] : [a.department, a.department];
      add({
        id: `alc-${pad(out.length + 1)}`,
        assetId: a.id,
        assigneeType: kind,
        assigneeName,
        assigneeRef,
        units: kind === 'Teacher' || kind === 'Staff' ? Math.min(a.units, kind === 'Teacher' ? 1 : 2) : a.units,
        allocatedOn: addDays(SEED_TODAY, -rng.int(40, 400)),
        expectedReturn: kind === 'Teacher' || kind === 'Staff' ? addDays(SEED_TODAY, i === 3 ? -20 : rng.int(60, 300)) : '',
        actualReturn: '',
        conditionOut: a.condition === 'Poor' ? 'Fair' : a.condition,
        conditionIn: '',
        status: 'Active',
        damage: null,
        requestedBy: kind === 'Teacher' ? t.name : 'Administration',
        approvedBy: 'Dr. Meera Krishnan',
        notes: '',
      });
    }
  });
  // Past loans of assets that are back on the shelf.
  const back = assetsAll.filter((a) => a.status === 'Available').slice(0, 3);
  back.forEach((a, k) => {
    const t = teachers[(k + 4) % teachers.length];
    const from = addDays(SEED_TODAY, -(150 + k * 20));
    add({ id: `alc-${pad(out.length + 1)}`, assetId: a.id, assigneeType: 'Teacher', assigneeName: t.name, assigneeRef: t.id, units: 1, allocatedOn: from, expectedReturn: addDays(from, 60), actualReturn: addDays(from, 55), conditionOut: 'Good', conditionIn: 'Good', status: 'Returned', damage: null, requestedBy: t.name, approvedBy: 'Dr. Meera Krishnan', notes: 'Returned on time.' });
  });
  // One loan with damage and one with a return requested.
  const dmgAsset = assetsAll.find((a) => a.name === 'Football Goal Post Set')!;
  const dmg = out.find((x) => x.assetId === dmgAsset.id)!;
  dmg.status = 'Damage Reported';
  dmg.damage = { type: 'Bent crossbar', severity: 'Moderate', reportedOn: addDays(SEED_TODAY, -6), estimate: 180, liability: 'School' };
  const pend = out.find((x) => x.assigneeType === 'Teacher' && x.status === 'Active');
  if (pend) pend.status = 'Pending Return';
  return out;
};
export const assetAllocations = defineCollection<AllocationRecord>('assetAllocations', buildAllocations);

/* ------------------------------------- Maintenance ------------------------------------- */

export type ServiceStatus = 'Scheduled' | 'In Progress' | 'Completed' | 'Out of Service';
export type MaintenanceType = 'Preventive Maintenance' | 'Inspection' | 'Calibration' | 'Repair' | 'Emergency Repair' | 'AMC Service';
export const MAINTENANCE_TYPES: MaintenanceType[] = ['Preventive Maintenance', 'Inspection', 'Calibration', 'Repair', 'Emergency Repair', 'AMC Service'];

export interface SparePart {
  name: string;
  qty: number;
  price: number;
}

export interface ServiceRecord extends Entity {
  assetId: string;
  type: MaintenanceType;
  summary: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  scheduled: string;
  startedOn: string;
  completedOn: string;
  vendor: string;
  technician: string;
  technicianContact: string;
  labour: number;
  consumables: number;
  callOut: number;
  parts: SparePart[];
  status: ServiceStatus;
  onHold: boolean;
  holdReason: string;
  notes: string;
}

export const serviceCost = (s: Pick<ServiceRecord, 'labour' | 'consumables' | 'callOut' | 'parts'>) => s.labour + s.consumables + s.callOut + s.parts.reduce((n, p) => n + p.qty * p.price, 0);

export const buildServices = (): ServiceRecord[] => {
  const rng = makeRng(83000);
  const list = buildAssets();
  const out: ServiceRecord[] = [];
  const make = (assetIdx: number, over: Partial<ServiceRecord> & Pick<ServiceRecord, 'type' | 'summary' | 'status' | 'scheduled'>) => {
    const a = list[assetIdx];
    out.push({
      id: `svc-${pad(out.length + 1)}`,
      assetId: a.id,
      priority: 'Medium',
      startedOn: '',
      completedOn: '',
      vendor: a.vendor,
      technician: ['Ravi Kumar', 'Anita Joseph', 'Faisal Ahmed', 'Meena Iyer'][out.length % 4],
      technicianContact: `+91 98400 6${pad(out.length + 11, 4)}`,
      labour: 0,
      consumables: 0,
      callOut: 0,
      parts: [],
      onHold: false,
      holdReason: '',
      notes: '',
      ...over,
    });
  };
  // Completed history across assets.
  [0, 1, 4, 10, 11, 13, 15, 7].forEach((idx, k) => {
    const done = addDays(SEED_TODAY, -(30 + k * 25));
    make(idx, { type: k % 3 === 0 ? 'Preventive Maintenance' : k % 3 === 1 ? 'Inspection' : 'AMC Service', summary: 'Routine check, cleaning and parts test.', status: 'Completed', scheduled: done, startedOn: done, completedOn: done, labour: 60 + rng.int(0, 60), consumables: rng.int(10, 40), callOut: 25, parts: k % 2 ? [{ name: 'Filter kit', qty: 1, price: 35 }] : [], notes: 'No issues found.' });
  });
  // Open work.
  make(5, { type: 'Calibration', summary: 'Balance drifting by 0.4 mg; recalibration with certified weights.', status: 'In Progress', scheduled: addDays(SEED_TODAY, -4), startedOn: addDays(SEED_TODAY, -2), priority: 'High', labour: 90, consumables: 20, callOut: 30 });
  make(15, { type: 'Emergency Repair', summary: 'Compressor failure; the unit is not cooling.', status: 'Out of Service', scheduled: addDays(SEED_TODAY, -9), startedOn: addDays(SEED_TODAY, -9), priority: 'Critical', onHold: true, holdReason: 'Waiting for the compressor spare part.', labour: 0, consumables: 0, callOut: 60, parts: [{ name: 'Compressor', qty: 1, price: 280 }] });
  // Scheduled work (one of them already overdue).
  make(3, { type: 'Preventive Maintenance', summary: 'Quarterly clean and thermal paste check.', status: 'Scheduled', scheduled: addDays(SEED_TODAY, -5), priority: 'Medium' });
  make(1, { type: 'AMC Service', summary: 'Annual maintenance contract visit.', status: 'Scheduled', scheduled: addDays(SEED_TODAY, 12), priority: 'Low' });
  make(10, { type: 'Inspection', summary: 'Pre-term fitness inspection.', status: 'Scheduled', scheduled: addDays(SEED_TODAY, 6), priority: 'High' });
  make(13, { type: 'Preventive Maintenance', summary: 'Toner and drum replacement.', status: 'Scheduled', scheduled: addDays(SEED_TODAY, 25), priority: 'Low' });
  return out;
};
export const assetServices = defineCollection<ServiceRecord>('assetServices', buildServices);

/* ------------------------------------------ Stock ------------------------------------------ */

export type StockCategory = 'Stationery' | 'Academic Supplies' | 'Lab Consumables' | 'IT Consumables' | 'Housekeeping' | 'Cafeteria' | 'Medical';
export type MovementKind = 'receipt' | 'issue' | 'transfer-in' | 'transfer-out' | 'adjustment';
export const STOCK_CATEGORIES: StockCategory[] = ['Stationery', 'Academic Supplies', 'Lab Consumables', 'IT Consumables', 'Housekeeping', 'Cafeteria', 'Medical'];
export const WAREHOUSES = ['Main Store', 'Science Store', 'IT Store', 'Hostel Store', 'Kitchen Store', 'Medical Store'];
export const UNITS = ['Piece', 'Ream', 'Box', 'Set', 'Can', 'Pack'];

export interface StockItemRecord extends Entity {
  code: string;
  name: string;
  category: StockCategory;
  unit: string;
  packSize: string;
  warehouse: string;
  location: string;
  supplier: string;
  leadTimeDays: number;
  openingBalance: number;
  reorderLevel: number;
  reorderQty: number;
  unitPrice: number;
  /** Purchase order raised for a re-supply that has not arrived yet, '' if none. */
  openOrder: string;
  createdOn: string;
  notes: string;
}

export interface StockMovementRecord extends Entity {
  itemId: string;
  kind: MovementKind;
  /** Always positive; the kind says whether it adds or removes stock (adjustments carry `direction`). */
  qty: number;
  direction: 'in' | 'out';
  date: string;
  reference: string;
  party: string;
  by: string;
  note: string;
}

// name, category, unit, pack, warehouse, supplier, opening, reorder level, reorder qty, price
const STOCK_ROWS: [string, StockCategory, string, string, string, string, number, number, number, number][] = [
  ['A4 Copier Paper', 'Stationery', 'Ream', '500 sheets', 'Main Store', 'Global Paper Mills', 300, 100, 200, 4.5],
  ['Whiteboard Marker', 'Stationery', 'Box', '12 pens', 'Main Store', 'ClassEdge Supplies', 80, 30, 60, 6],
  ['Notebook (Ruled)', 'Academic Supplies', 'Piece', '200 pages', 'Main Store', 'ClassEdge Supplies', 900, 300, 600, 0.8],
  ['Chalk', 'Academic Supplies', 'Box', '100 sticks', 'Main Store', 'ClassEdge Supplies', 60, 20, 40, 2.2],
  ['Test Tubes', 'Lab Consumables', 'Pack', '50 pcs', 'Science Store', 'OptiLab Instruments', 40, 15, 30, 9],
  ['Litmus Paper', 'Lab Consumables', 'Pack', '100 strips', 'Science Store', 'OptiLab Instruments', 35, 10, 25, 3.5],
  ['Printer Toner', 'IT Consumables', 'Piece', 'Black', 'IT Store', 'CanonPro Office Solutions', 14, 6, 10, 62],
  ['HDMI Cable', 'IT Consumables', 'Piece', '2 m', 'IT Store', 'CanonPro Office Solutions', 25, 8, 15, 7],
  ['Floor Cleaner', 'Housekeeping', 'Can', '5 litres', 'Hostel Store', 'LinenCare Textiles', 50, 20, 40, 11],
  ['Bed Linen Set', 'Housekeeping', 'Set', '2 sheets + cover', 'Hostel Store', 'LinenCare Textiles', 120, 40, 80, 14],
  ['Cooking Oil', 'Cafeteria', 'Can', '15 litres', 'Kitchen Store', 'FreshLine Foods', 24, 10, 20, 32],
  ['Rice (Sona Masoori)', 'Cafeteria', 'Pack', '25 kg', 'Kitchen Store', 'FreshLine Foods', 70, 25, 50, 21],
  ['First-aid Kit', 'Medical', 'Box', 'Standard', 'Medical Store', 'MediServe Supplies', 18, 6, 12, 22],
  ['Disposable Gloves', 'Medical', 'Box', '100 pcs', 'Medical Store', 'MediServe Supplies', 45, 15, 30, 5.5],
  ['Hand Sanitiser', 'Medical', 'Can', '5 litres', 'Medical Store', 'MediServe Supplies', 30, 12, 24, 15],
  ['Exam Answer Booklets', 'Stationery', 'Pack', '50 booklets', 'Main Store', 'Global Paper Mills', 100, 40, 80, 9],
  ['Mop Head', 'Housekeeping', 'Piece', 'Cotton', 'Hostel Store', 'LinenCare Textiles', 40, 10, 20, 3.2],
  ['Projector Lamp', 'IT Consumables', 'Piece', 'Epson EB', 'IT Store', 'CanonPro Office Solutions', 6, 3, 5, 96],
];

export const buildStockItems = (): StockItemRecord[] =>
  STOCK_ROWS.map(([name, category, unit, packSize, warehouse, supplier, openingBalance, reorderLevel, reorderQty, unitPrice], i) => ({
    id: `stk-${pad(i + 1, 2)}`,
    code: `STK-${pad(i + 1, 3)}`,
    name,
    category,
    unit,
    packSize,
    warehouse,
    location: `Rack ${'ABCDEF'[i % 6]}${(i % 4) + 1}`,
    supplier,
    leadTimeDays: 3 + (i % 5) * 2,
    openingBalance,
    reorderLevel,
    reorderQty,
    unitPrice,
    openOrder: i === 6 || i === 10 ? `PO-2026-${pad(300 + i)}` : '',
    createdOn: addDays(SEED_TODAY, -400 + i * 5),
    notes: '',
  }));
export const stockItems = defineCollection<StockItemRecord>('stockItems', buildStockItems);

/** On-hand quantity: the opening balance plus every movement. */
export const onHand = (item: Pick<StockItemRecord, 'openingBalance'>, moves: Pick<StockMovementRecord, 'qty' | 'direction'>[]) => item.openingBalance + moves.reduce((n, m) => n + (m.direction === 'in' ? m.qty : -m.qty), 0);

export const buildStockMovements = (): StockMovementRecord[] => {
  const rng = makeRng(84000);
  const items = buildStockItems();
  const out: StockMovementRecord[] = [];
  items.forEach((it, i) => {
    // Items 6 (toner), 10 (oil) and 16 (answer booklets) are drawn down to low / zero stock for the demo.
    const heavy = i === 6 ? it.openingBalance - 2 : i === 10 ? it.openingBalance + 4 : i === 15 ? it.openingBalance - 70 : 0;
    const issues = Math.min(it.openingBalance, heavy || Math.round(it.openingBalance * rng.int(15, 45) / 100));
    const parts = heavy ? [Math.ceil(issues / 2), issues - Math.ceil(issues / 2)] : [Math.ceil(issues / 2), Math.floor(issues / 2)];
    parts.forEach((q, k) => {
      if (q > 0) out.push({ id: `mv-${pad(out.length + 1)}`, itemId: it.id, kind: 'issue', qty: q, direction: 'out', date: addDays(SEED_TODAY, -(15 + k * 30 + i)), reference: `ISS-${pad(out.length + 1, 4)}`, party: ['Science dept', 'Class teachers', 'Admin Office', 'Hostel'][i % 4], by: 'Store Manager', note: '' });
    });
    if (i % 2 === 0 && !heavy) out.push({ id: `mv-${pad(out.length + 1)}`, itemId: it.id, kind: 'receipt', qty: it.reorderQty, direction: 'in', date: addDays(SEED_TODAY, -(40 + i)), reference: `GRN-${pad(out.length + 1, 4)}`, party: it.supplier, by: 'Store Assistant', note: 'Regular re-supply.' });
  });
  return out;
};
export const stockMovements = defineCollection<StockMovementRecord>('stockMovements', buildStockMovements);
