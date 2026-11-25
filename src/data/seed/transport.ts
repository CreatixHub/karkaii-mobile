/** Campus Operations seed data, part 1: transport (vehicles, drivers, routes, pickup points, schedules, student assignments). */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildStudents } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

export const SCHOOL_NAME = 'Karkaii International School';

/* ------------------------------------ Vehicles ------------------------------------ */

export type VehicleStatus = 'Active' | 'Available' | 'Maintenance' | 'Out of Service' | 'Archived';
export type VehicleType = 'School Bus' | 'Mini Bus' | 'Van';
export type FuelType = 'Diesel' | 'CNG' | 'Electric';

export interface VehicleRecord extends Entity {
  number: string;
  model: string;
  type: VehicleType;
  seats: number;
  fuel: FuelType;
  mfgYear: number;
  insuranceExpiry: string;
  insurer: string;
  registrationExpiry: string;
  fitnessExpiry: string;
  lastService: string;
  nextService: string;
  gpsDevice: string;
  /** False when the tracker has stopped reporting. */
  gpsOnline: boolean;
  fuelLevel: number;
  odometerKm: number;
  status: VehicleStatus;
  notes: string;
}

// number, model, type, seats, fuel, year, status, insurance in days, fuel %, odometer, gps online
const VEHICLE_ROWS: [string, string, VehicleType, number, FuelType, number, VehicleStatus, number, number, number, boolean][] = [
  ['TN-09-BC-4471', 'Tata Starbus Ultra', 'School Bus', 54, 'Diesel', 2021, 'Active', 210, 72, 98400, true],
  ['TN-09-BC-1145', 'Ashok Leyland Lynx', 'School Bus', 54, 'Diesel', 2020, 'Active', 150, 64, 121350, true],
  ['TN-09-BC-2218', 'Eicher Skyline Pro', 'School Bus', 40, 'Diesel', 2022, 'Active', 26, 48, 64210, true],
  ['TN-09-BC-8890', 'Tata Winger', 'Mini Bus', 24, 'CNG', 2022, 'Active', 260, 81, 47780, true],
  ['TN-09-BC-6602', 'Force Traveller', 'Mini Bus', 24, 'Diesel', 2019, 'Active', 95, 22, 133900, true],
  ['TN-09-BC-3390', 'Tata Starbus', 'School Bus', 54, 'Diesel', 2018, 'Maintenance', -12, 35, 168240, false],
  ['TN-09-BC-7724', 'Mahindra Supro', 'Van', 12, 'CNG', 2023, 'Available', 300, 90, 18950, true],
  ['TN-09-BC-5531', 'Eicher Skyline Pro', 'School Bus', 40, 'Diesel', 2021, 'Active', 175, 58, 87120, true],
  ['TN-09-BC-9912', 'BYD K6', 'Mini Bus', 24, 'Electric', 2024, 'Active', 330, 68, 9840, true],
  ['TN-09-BC-1007', 'Tata Ace', 'Van', 12, 'Diesel', 2015, 'Out of Service', 40, 12, 214500, false],
];

export const buildVehicles = (): VehicleRecord[] =>
  VEHICLE_ROWS.map(([number, model, type, seats, fuel, mfgYear, status, ins, fuelLevel, odometerKm, gpsOnline], i) => ({
    id: `veh-${pad(i + 1, 2)}`,
    number,
    model,
    type,
    seats,
    fuel,
    mfgYear,
    insuranceExpiry: addDays(SEED_TODAY, ins),
    insurer: ['New India Assurance', 'ICICI Lombard', 'United India'][i % 3],
    registrationExpiry: addDays(SEED_TODAY, 400 + i * 37),
    fitnessExpiry: addDays(SEED_TODAY, 120 + i * 23),
    lastService: addDays(SEED_TODAY, -(20 + i * 7)),
    nextService: addDays(SEED_TODAY, status === 'Maintenance' ? -3 : 60 - i * 5),
    gpsDevice: `GPS-${pad(i + 1, 2)}`,
    gpsOnline,
    fuelLevel,
    odometerKm,
    status,
    notes: status === 'Maintenance' ? 'Gearbox overhaul in progress.' : status === 'Out of Service' ? 'Retired from the road; kept for parts.' : '',
  }));
export const vehicles = defineCollection<VehicleRecord>('vehicles', buildVehicles);

/* ------------------------------------ Drivers ------------------------------------ */

export type DriverStatus = 'Active' | 'On Leave' | 'Suspended' | 'Inactive';
export type Verification = 'Verified' | 'Pending' | 'Suspended';
export type LicenseType = 'Heavy (HMV)' | 'Light (LMV)';

export interface DriverRecord extends Entity {
  code: string;
  name: string;
  phone: string;
  email: string;
  licenseNo: string;
  licenseType: LicenseType;
  issued: string;
  expires: string;
  verification: Verification;
  experience: number;
  joined: string;
  emergency: string;
  status: DriverStatus;
}

// name, license type, license expires in days, experience, status, verification
const DRIVER_ROWS: [string, LicenseType, number, number, DriverStatus, Verification][] = [
  ['James Miller', 'Heavy (HMV)', 700, 14, 'Active', 'Verified'],
  ['Daniel Cruz', 'Heavy (HMV)', 520, 11, 'Active', 'Verified'],
  ['Peter Hall', 'Heavy (HMV)', 45, 9, 'Active', 'Verified'],
  ['Anthony Reed', 'Light (LMV)', 900, 7, 'Active', 'Verified'],
  ['Victor Adams', 'Heavy (HMV)', 410, 16, 'Active', 'Verified'],
  ['Marcus Bell', 'Heavy (HMV)', 650, 8, 'Active', 'Verified'],
  ['Owen Fisher', 'Heavy (HMV)', 380, 6, 'Active', 'Verified'],
  ['Selvam Raj', 'Light (LMV)', 800, 5, 'On Leave', 'Verified'],
  ['Rahul Menon', 'Heavy (HMV)', 300, 3, 'Active', 'Pending'],
  ['Imran Pasha', 'Heavy (HMV)', -30, 20, 'Suspended', 'Suspended'],
  ['Karthik Raja', 'Heavy (HMV)', 600, 10, 'Active', 'Verified'],
];

export const buildDrivers = (): DriverRecord[] =>
  DRIVER_ROWS.map(([name, licenseType, expIn, experience, status, verification], i) => ({
    id: `drv-${pad(i + 1, 2)}`,
    code: `DRV-${pad(i + 1, 3)}`,
    name,
    phone: `+91 98400 3${pad(i + 1, 4)}`,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@transport.karkaii.demo`,
    licenseNo: `TN09 20${12 + (i % 8)}${pad(41000 + i * 137, 7)}`,
    licenseType,
    issued: addDays(SEED_TODAY, expIn - 365 * 5),
    expires: addDays(SEED_TODAY, expIn),
    verification,
    experience,
    joined: addDays(SEED_TODAY, -(experience > 5 ? 900 : 400) - i * 31),
    emergency: `+91 97400 4${pad(i + 1, 4)}`,
    status,
  }));
export const drivers = defineCollection<DriverRecord>('drivers', buildDrivers);

/* ------------------------------------- Routes ------------------------------------- */

export type RouteStatus = 'Active' | 'Scheduled' | 'Maintenance' | 'Suspended' | 'Archived';

export interface TransportRouteRecord extends Entity {
  code: string;
  name: string;
  corridor: string;
  distanceKm: number;
  /** '' = no vehicle / no driver yet. */
  vehicleId: string;
  driverId: string;
  shift: 'Morning' | 'Afternoon' | 'Both';
  /** 'HH:mm' the morning run leaves its first stop. */
  morningStart: string;
  /** 'HH:mm' the afternoon run leaves the school. */
  eveningStart: string;
  durationMin: number;
  /** Monthly fee per student. */
  fee: number;
  academicYear: string;
  updated: string;
  status: RouteStatus;
}

// code, name, corridor, km, vehicle idx (1-based, 0 none), driver idx (0 none), morning start, duration, fee, status
const ROUTE_ROWS: [string, string, string, number, number, number, string, number, number, RouteStatus][] = [
  ['RT-01', 'North Corridor', 'North Corridor', 18, 1, 1, '06:45', 65, 60, 'Active'],
  ['RT-02', 'South Corridor', 'South Corridor', 14, 2, 2, '06:55', 55, 55, 'Active'],
  ['RT-03', 'Central Loop', 'Central Loop', 9, 3, 3, '07:15', 40, 45, 'Active'],
  ['RT-04', 'East Corridor', 'East Corridor', 12, 4, 4, '07:00', 50, 50, 'Active'],
  ['RT-05', 'Hill Route', 'Hill Route', 21, 6, 5, '06:40', 70, 65, 'Maintenance'],
  ['RT-06', 'Riverside', 'Riverside', 11, 5, 6, '07:10', 45, 48, 'Active'],
  ['RT-07', 'West Corridor', 'West Corridor', 16, 8, 7, '06:50', 60, 58, 'Scheduled'],
  ['RT-08', 'Legacy Village Run', 'Outer Ring', 27, 0, 0, '06:30', 80, 70, 'Archived'],
  ['RT-09', 'Outer Ring', 'Outer Ring', 24, 9, 0, '06:35', 75, 68, 'Suspended'],
];

export const buildRoutes = (): TransportRouteRecord[] =>
  ROUTE_ROWS.map(([code, name, corridor, distanceKm, vi, di, morningStart, durationMin, fee, status], i) => ({
    id: `rt-${pad(i + 1, 2)}`,
    code,
    name,
    corridor,
    distanceKm,
    vehicleId: vi ? `veh-${pad(vi, 2)}` : '',
    driverId: di ? `drv-${pad(di, 2)}` : '',
    shift: 'Both' as const,
    morningStart,
    eveningStart: '15:45',
    durationMin,
    fee,
    academicYear: '2026-27',
    updated: addDays(SEED_TODAY, -(i * 3 + 1)),
    status,
  }));
export const transportRoutes = defineCollection<TransportRouteRecord>('transportRoutes', buildRoutes);

/* ---------------------------------- Pickup points ---------------------------------- */

export type PickupStatus = 'Active' | 'Temporarily Closed' | 'Maintenance' | 'Inactive' | 'Archived';

export interface PickupPointRecord extends Entity {
  code: string;
  name: string;
  routeId: string;
  /** Position along the route, 1 = first stop. */
  order: number;
  area: string;
  zone: string;
  address: string;
  landmark: string;
  /** 'HH:mm' the bus is at this stop on the morning run. */
  boarding: string;
  /** 'HH:mm' the bus is at this stop on the afternoon run. */
  drop: string;
  distanceKm: number;
  updated: string;
  status: PickupStatus;
}

const STOPS: Record<string, string[]> = {
  'rt-01': ['Green Park Gate', 'Riverside Stop', 'Lake View Junction', 'Temple Street Corner', 'North Market Stop', 'Rose Garden Lane'],
  'rt-02': ['Market Road Stop', 'Old Mill Stop', 'South Gate Plaza', 'Palm Grove Stop', 'Canal Bridge'],
  'rt-03': ['Central Square', 'Library Junction', 'Town Hall Stop', 'Clock Tower'],
  'rt-04': ['East End Stop', 'Fern Hill Gate', 'Garden City Stop', 'Harbour View', 'Sunrise Enclave'],
  'rt-05': ['Hillside Cross', 'Pine Ridge Stop', 'Summit Villas', 'Orchard Corner', 'Valley View', 'Cedar Court'],
  'rt-06': ['River Walk Stop', 'Willow Bend', 'Boat Club Gate', 'Marina Stop'],
  'rt-07': ['West Gate Stop', 'Mango Grove', 'Heritage Quarter', 'Potters Lane', 'Kings Road'],
  'rt-09': ['Outer Ring Toll', 'Farmhouse Stop', 'Quarry Road', 'Highway Dhaba'],
};
const AREAS = ['Riverside', 'Downtown', 'Green Park', 'Sunrise', 'Heritage', 'Lakeview', 'Old Village', 'City Center'];
const toMin = (t: string) => Number(t.slice(0, 2)) * 60 + Number(t.slice(3, 5));
const fromMin = (m: number) => `${pad(Math.floor(m / 60) % 24, 2)}:${pad(Math.round(m) % 60, 2)}`;

export const buildPickupPoints = (): PickupPointRecord[] => {
  const out: PickupPointRecord[] = [];
  let n = 0;
  for (const r of buildRoutes()) {
    const names = STOPS[r.id];
    if (!names) continue;
    const step = r.durationMin / names.length;
    names.forEach((name, k) => {
      n += 1;
      out.push({
        id: `pp-${pad(n)}`,
        code: `PP-${pad(n, 3)}`,
        name,
        routeId: r.id,
        order: k + 1,
        area: AREAS[(n + k) % AREAS.length],
        zone: `Zone ${'ABCDEFG'[(n + k) % 7]}`,
        address: `${10 + n * 3}, ${name} Road, Chennai`,
        landmark: `Near ${['the temple', 'the bakery', 'the petrol bunk', 'the bus shelter', 'the post office'][n % 5]}`,
        boarding: fromMin(toMin(r.morningStart) + step * k),
        drop: fromMin(toMin(r.eveningStart) + step * (names.length - 1 - k) + 10),
        distanceKm: Math.round((r.distanceKm * (names.length - k)) / names.length),
        updated: addDays(SEED_TODAY, -(n % 20)),
        status: r.id === 'rt-05' && k === 5 ? 'Temporarily Closed' : r.id === 'rt-09' && k === 3 ? 'Inactive' : 'Active',
      });
    });
  }
  return out;
};
export const pickupPoints = defineCollection<PickupPointRecord>('pickupPoints', buildPickupPoints);

/* ------------------------------------ Schedules ------------------------------------ */

export type ScheduleStatus = 'Active' | 'Scheduled' | 'Draft' | 'Closing' | 'Suspended';
export type RouteType = 'Morning & Evening' | 'Morning Only' | 'Evening Only' | 'Activity / Special';
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export interface RouteScheduleRecord extends Entity {
  routeId: string;
  routeType: RouteType;
  /** 'HH:mm', '' when the schedule has no morning run. */
  morningTime: string;
  /** 'HH:mm', '' when the schedule has no afternoon run. */
  eveningTime: string;
  days: string[];
  effectiveFrom: string;
  status: ScheduleStatus;
  notes: string;
  updated: string;
}

export const buildSchedules = (): RouteScheduleRecord[] => {
  const routes = buildRoutes();
  const out: RouteScheduleRecord[] = routes.map((r, i) => ({
    id: `sch-${pad(i + 1, 2)}`,
    routeId: r.id,
    routeType: 'Morning & Evening' as const,
    morningTime: r.morningStart,
    eveningTime: r.eveningStart,
    days: [...WEEKDAYS],
    effectiveFrom: addDays(SEED_TODAY, r.status === 'Scheduled' ? 3 : -120),
    status: (r.status === 'Active' || r.status === 'Maintenance' ? 'Active' : r.status === 'Scheduled' ? 'Scheduled' : r.status === 'Suspended' ? 'Suspended' : 'Closing') as ScheduleStatus,
    notes: r.status === 'Maintenance' ? 'Runs with a substitute vehicle until the bus is repaired.' : '',
    updated: r.updated,
  }));
  out.push({ id: 'sch-10', routeId: 'rt-03', routeType: 'Activity / Special', morningTime: '09:30', eveningTime: '', days: ['Sat'], effectiveFrom: addDays(SEED_TODAY, 14), status: 'Draft', notes: 'Science museum trip, Grade VII–VIII.', updated: SEED_TODAY });
  return out;
};
export const routeSchedules = defineCollection<RouteScheduleRecord>('routeSchedules', buildSchedules);

/* ------------------------------- Student assignments ------------------------------- */

export type TransportAssignStatus = 'Assigned' | 'Awaiting Assignment' | 'Stop Change Requested' | 'Suspended';

export interface StudentTransportRecord extends Entity {
  studentId: string;
  /** '' while awaiting assignment. */
  routeId: string;
  pickupPointId: string;
  dropPoint: 'School Main Gate' | 'School Side Gate';
  seatNo: number;
  /** Monthly fee after the concession. */
  fee: number;
  concessionPct: number;
  effectiveFrom: string;
  status: TransportAssignStatus;
  /** Stop the family asked to move to (Stop Change Requested only). */
  requestedPickupPointId: string;
  notes: string;
}

export const buildStudentTransport = (): StudentTransportRecord[] => {
  const rng = makeRng(71000);
  const routes = buildRoutes();
  const vehicles = buildVehicles();
  const stops = buildPickupPoints();
  const seatsOf = (routeId: string) => vehicles.find((v) => v.id === routes.find((r) => r.id === routeId)!.vehicleId)?.seats ?? 0;
  const live = ['rt-01', 'rt-02', 'rt-03', 'rt-04', 'rt-05', 'rt-06', 'rt-07'];
  const used = new Map<string, number>();
  const out: StudentTransportRecord[] = [];
  const riders = buildStudents().filter((s) => s.transport);
  riders.forEach((s, i) => {
    const awaiting = i % 23 === 7;
    const suspended = i % 29 === 11;
    let routeId = awaiting ? '' : suspended ? 'rt-09' : live[(i * 3 + rng.int(0, 2)) % live.length];
    // Keep inside the vehicle's seats: spill to the next route with room.
    if (routeId && !awaiting) {
      for (let k = 0; k < live.length + 1 && (used.get(routeId) ?? 0) >= seatsOf(routeId); k++) routeId = live[(live.indexOf(routeId) + 1) % live.length];
    }
    const mine = stops.filter((p) => p.routeId === routeId && p.status === 'Active');
    const point = routeId ? mine[rng.int(0, mine.length - 1)] : undefined;
    const seatNo = routeId ? (used.get(routeId) ?? 0) + 1 : 0;
    if (routeId) used.set(routeId, seatNo);
    const route = routes.find((r) => r.id === routeId);
    const concessionPct = s.scholar ? 25 : 0;
    const change = !awaiting && !suspended && i % 31 === 5;
    const alt = change ? mine.find((p) => p.id !== point?.id) : undefined;
    out.push({
      id: `trn-${s.id}`,
      studentId: s.id,
      routeId,
      pickupPointId: point?.id ?? '',
      dropPoint: i % 4 === 0 ? 'School Side Gate' : 'School Main Gate',
      seatNo,
      fee: route ? Math.round(route.fee * (1 - concessionPct / 100)) : 0,
      concessionPct,
      effectiveFrom: addDays(SEED_TODAY, -rng.int(60, 300)),
      status: awaiting ? 'Awaiting Assignment' : suspended ? 'Suspended' : change ? 'Stop Change Requested' : 'Assigned',
      requestedPickupPointId: alt?.id ?? '',
      notes: awaiting ? 'Family has not chosen a stop yet.' : suspended ? 'Route suspended; the family is being contacted.' : change ? 'Asked to move to a closer stop.' : '',
    });
  });
  return out;
};
export const studentTransport = defineCollection<StudentTransportRecord>('studentTransport', buildStudentTransport);
