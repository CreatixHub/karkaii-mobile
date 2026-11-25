/** Transport rules: what a route/vehicle/driver is right now, whether an assignment is allowed, schedule clashes and the simulated GPS trip. */
import { snapshot } from '@/core/store/store';
import { diffDays, todayISO } from '@/core/utils/date';
import type { StudentRecord } from '@/data/seed/master';
import type { DriverRecord, PickupPointRecord, RouteScheduleRecord, StudentTransportRecord, TransportRouteRecord, VehicleRecord } from '@/data/seed/transport';

export const toMin = (t: string): number => (/^\d{1,2}:\d{2}$/.test(t) ? Number(t.slice(0, t.indexOf(':'))) * 60 + Number(t.slice(-2)) : NaN);
export const fromMin = (m: number): string => `${String(Math.floor(((m % 1440) + 1440) % 1440 / 60)).padStart(2, '0')}:${String(Math.round(((m % 60) + 60) % 60)).padStart(2, '0')}`;

export const allRoutes = () => snapshot<TransportRouteRecord>('transportRoutes');
export const allVehicles = () => snapshot<VehicleRecord>('vehicles');
export const allDrivers = () => snapshot<DriverRecord>('drivers');
export const allStops = () => snapshot<PickupPointRecord>('pickupPoints');
export const allAssignments = () => snapshot<StudentTransportRecord>('studentTransport');
export const allSchedules = () => snapshot<RouteScheduleRecord>('routeSchedules');

export const vehicleOf = (id: string) => allVehicles().find((v) => v.id === id);
export const driverOf = (id: string) => allDrivers().find((d) => d.id === id);
export const routeOf = (id: string) => allRoutes().find((r) => r.id === id);
export const stopOf = (id: string) => allStops().find((p) => p.id === id);
export const stopsOfRoute = (routeId: string) => allStops().filter((p) => p.routeId === routeId).sort((a, b) => a.order - b.order);
export const routeLabel = (r?: Pick<TransportRouteRecord, 'code' | 'name'>) => (r ? `${r.code} · ${r.name}` : '—');

/** Students who hold a seat on the route (awaiting students have no route). */
export const ridersOf = (routeId: string) => allAssignments().filter((a) => a.routeId === routeId);
export const seatedOn = (routeId: string) => ridersOf(routeId).filter((a) => a.status !== 'Awaiting Assignment').length;
export const capacityOf = (route: Pick<TransportRouteRecord, 'vehicleId'>) => vehicleOf(route.vehicleId)?.seats ?? 0;
export const seatsFree = (route: TransportRouteRecord) => Math.max(0, capacityOf(route) - seatedOn(route.id));
export const occupancyPct = (route: TransportRouteRecord) => (capacityOf(route) ? Math.round((seatedOn(route.id) / capacityOf(route)) * 100) : 0);

/* ----------------------------------- Documents & duty ----------------------------------- */

export type DocState = 'Valid' | 'Expiring' | 'Expired';
export const docState = (expiry: string, warnDays = 60): DocState => {
  const left = diffDays(todayISO(), expiry);
  return left < 0 ? 'Expired' : left <= warnDays ? 'Expiring' : 'Valid';
};
export const insuranceState = (v: VehicleRecord) => docState(v.insuranceExpiry, 60);
export const fitnessState = (v: VehicleRecord) => docState(v.fitnessExpiry, 60);
export const licenseState = (d: DriverRecord) => docState(d.expires, 90);
export const serviceState = (v: VehicleRecord): 'Up to date' | 'Due soon' | 'Overdue' => {
  const left = diffDays(todayISO(), v.nextService);
  return left < 0 ? 'Overdue' : left <= 14 ? 'Due soon' : 'Up to date';
};

/** Routes that still take students. */
export const isLiveRoute = (r: TransportRouteRecord) => r.status === 'Active' || r.status === 'Scheduled' || r.status === 'Maintenance';
export const routeOfVehicle = (vehicleId: string) => allRoutes().find((r) => r.vehicleId === vehicleId && r.status !== 'Archived');
export const routeOfDriver = (driverId: string) => allRoutes().find((r) => r.driverId === driverId && r.status !== 'Archived');
export const driverDuty = (d: DriverRecord): 'On Duty' | 'Available' | 'On Leave' | 'Suspended' | 'Inactive' => (d.status === 'On Leave' ? 'On Leave' : d.status === 'Suspended' ? 'Suspended' : d.status === 'Inactive' ? 'Inactive' : routeOfDriver(d.id) ? 'On Duty' : 'Available');

/* -------------------------------------- Assignment -------------------------------------- */

export type AssignmentState = 'Active' | 'Driver Pending' | 'Vehicle Pending' | 'Vehicle Unavailable' | 'Suspended' | 'Closed';

export function assignmentState(r: TransportRouteRecord): AssignmentState {
  if (r.status === 'Archived') return 'Closed';
  if (r.status === 'Suspended') return 'Suspended';
  if (!r.vehicleId) return 'Vehicle Pending';
  const v = vehicleOf(r.vehicleId);
  if (!v || v.status === 'Maintenance' || v.status === 'Out of Service' || v.status === 'Archived') return 'Vehicle Unavailable';
  return r.driverId ? 'Active' : 'Driver Pending';
}

/** Minutes covered by a route's morning and afternoon runs. */
export function windowsOf(r: Pick<TransportRouteRecord, 'morningStart' | 'eveningStart' | 'durationMin'>): [number, number][] {
  return [[toMin(r.morningStart), toMin(r.morningStart) + r.durationMin], [toMin(r.eveningStart), toMin(r.eveningStart) + r.durationMin]];
}
const overlap = (a: [number, number], b: [number, number]) => a[0] < b[1] && b[0] < a[1];
const clash = (x: TransportRouteRecord, y: TransportRouteRecord) => windowsOf(x).some((a) => windowsOf(y).some((b) => overlap(a, b)));

/** Why this vehicle and driver cannot run this route (empty list = allowed). Pass '' to leave either one out of the check. */
export function checkAssignment(routeId: string, vehicleId: string, driverId: string, ignoreRouteIds: string[] = []): string[] {
  const route = routeOf(routeId);
  if (!route) return ['Route not found.'];
  const errors: string[] = [];
  const others = allRoutes().filter((r) => r.id !== route.id && !ignoreRouteIds.includes(r.id) && (r.status === 'Active' || r.status === 'Scheduled' || r.status === 'Maintenance'));
  if (vehicleId) {
    const v = vehicleOf(vehicleId);
    if (!v) errors.push('Vehicle not found.');
    else {
      if (v.status !== 'Active' && v.status !== 'Available') errors.push(`${v.number} is ${v.status.toLowerCase()} and cannot be assigned.`);
      if (insuranceState(v) === 'Expired') errors.push(`${v.number} has expired insurance.`);
      if (fitnessState(v) === 'Expired') errors.push(`${v.number} has an expired fitness certificate.`);
      const need = seatedOn(route.id);
      if (v.seats < need) errors.push(`${v.number} has ${v.seats} seats but ${need} students ride this route.`);
      const busy = others.find((r) => r.vehicleId === v.id && clash(route, r));
      if (busy) errors.push(`${v.number} already runs ${busy.code} at an overlapping time.`);
    }
  }
  if (driverId) {
    const d = driverOf(driverId);
    if (!d) errors.push('Driver not found.');
    else {
      if (d.status !== 'Active') errors.push(`${d.name} is ${d.status.toLowerCase()}.`);
      if (d.verification !== 'Verified') errors.push(`${d.name} is not verified yet.`);
      if (licenseState(d) === 'Expired') errors.push(`${d.name}’s licence has expired.`);
      const v = vehicleOf(vehicleId || route.vehicleId);
      if (v && v.seats > 24 && d.licenseType !== 'Heavy (HMV)') errors.push(`${d.name} holds a light licence; a ${v.seats}-seat bus needs a heavy (HMV) licence.`);
      const busy = others.find((r) => r.driverId === d.id && clash(route, r));
      if (busy) errors.push(`${d.name} already drives ${busy.code} at an overlapping time.`);
    }
  }
  return errors;
}

/** Pass this as `studentId` to check a route and stop for a student who is not on the roll yet (the Add Student form). */
export const NEW_STUDENT = '__new__';

/** Why a student cannot be given this seat / stop (empty list = allowed). */
export function checkStudentSeat(opts: { studentId: string; routeId: string; pickupPointId: string; assignmentId?: string }): string[] {
  const errors: string[] = [];
  const student = snapshot<StudentRecord>('students').find((s) => s.id === opts.studentId);
  if (!student && opts.studentId !== NEW_STUDENT) return ['Student not found.'];
  if (student && student.status !== 'Active' && student.status !== 'On Leave') errors.push(`${student.name} is ${student.status.toLowerCase()}.`);
  if (student && allAssignments().some((a) => a.studentId === opts.studentId && a.id !== opts.assignmentId)) errors.push(`${student.name} already has a transport assignment.`);
  if (!opts.routeId) return errors;
  const route = routeOf(opts.routeId);
  if (!route) return [...errors, 'Route not found.'];
  if (route.status === 'Archived' || route.status === 'Suspended') errors.push(`${route.code} is ${route.status.toLowerCase()} and takes no students.`);
  if (!route.vehicleId) errors.push(`${route.code} has no vehicle yet, so it has no seats.`);
  else {
    const holding = ridersOf(route.id).filter((a) => a.id !== opts.assignmentId && a.status !== 'Awaiting Assignment').length;
    if (holding >= capacityOf(route)) errors.push(`${route.code} is full (${capacityOf(route)} seats).`);
  }
  const stop = stopOf(opts.pickupPointId);
  if (!stop) errors.push('Choose a pickup point.');
  else if (stop.routeId !== route.id) errors.push(`${stop.name} is not a stop on ${route.code}.`);
  else if (stop.status !== 'Active') errors.push(`${stop.name} is ${stop.status.toLowerCase()}.`);
  return errors;
}

/* -------------------------------------- Scheduling -------------------------------------- */

const sharedDay = (a: RouteScheduleRecord, b: RouteScheduleRecord) => a.days.some((d) => b.days.includes(d));

/** Clashes of a schedule with the others: the same vehicle or driver on an overlapping run on a shared day. */
export function scheduleConflicts(s: Pick<RouteScheduleRecord, 'id' | 'routeId' | 'morningTime' | 'eveningTime' | 'days' | 'status'>): string[] {
  const route = routeOf(s.routeId);
  if (!route) return ['Route not found.'];
  const dur = route.durationMin;
  const mine: [number, number][] = [s.morningTime ? [toMin(s.morningTime), toMin(s.morningTime) + dur] : null, s.eveningTime ? [toMin(s.eveningTime), toMin(s.eveningTime) + dur] : null].filter((x): x is [number, number] => !!x);
  const out: string[] = [];
  for (const o of allSchedules()) {
    if (o.id === s.id || (o.status !== 'Active' && o.status !== 'Scheduled')) continue;
    const other = routeOf(o.routeId);
    if (!other || !sharedDay(o as RouteScheduleRecord, s as RouteScheduleRecord)) continue;
    const theirs: [number, number][] = [o.morningTime ? [toMin(o.morningTime), toMin(o.morningTime) + other.durationMin] : null, o.eveningTime ? [toMin(o.eveningTime), toMin(o.eveningTime) + other.durationMin] : null].filter((x): x is [number, number] => !!x);
    if (!mine.some((a) => theirs.some((b) => overlap(a, b)))) continue;
    if (route.vehicleId && other.vehicleId === route.vehicleId) out.push(`${vehicleOf(route.vehicleId)?.number} is also on ${other.code} at an overlapping time.`);
    if (route.driverId && other.driverId === route.driverId) out.push(`${driverOf(route.driverId)?.name} also drives ${other.code} at an overlapping time.`);
  }
  return out;
}

/* ------------------------------------- GPS simulation ------------------------------------- */

export type TripKind = 'Morning Pickup' | 'Afternoon Drop';
export type FleetState = 'On Trip' | 'Idle' | 'Offline' | 'Out of Service';

export interface TripState {
  state: FleetState;
  kind: TripKind | null;
  /** 0 to 1 along the run. */
  progress: number;
  stopsCovered: number;
  totalStops: number;
  nextStop: string;
  /** Minutes until the next stop, null when not on a trip. */
  etaMin: number | null;
  speedKmh: number;
  delayMin: number;
  /** Schedule used: 'Demo' loops a trip every 40 minutes so the screen is never empty. */
  mode: 'Demo' | 'Schedule';
}

const hash = (s: string) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);

/**
 * Where a route's vehicle is at `nowMin` (minutes since midnight). Positions are simulated — there is no GPS feed in this demo:
 * in Schedule mode the bus is on a trip only inside its real morning / afternoon window; in Demo mode every running bus loops through trips.
 */
export function tripOf(route: TransportRouteRecord, vehicle: VehicleRecord | undefined, stops: PickupPointRecord[], nowMin: number, demo: boolean): TripState {
  const live = stops.filter((s) => s.status === 'Active');
  const idle = (state: FleetState): TripState => ({ state, kind: null, progress: 0, stopsCovered: 0, totalStops: live.length, nextStop: live[0]?.name ?? '—', etaMin: null, speedKmh: 0, delayMin: 0, mode: demo ? 'Demo' : 'Schedule' });
  if (!vehicle || vehicle.status === 'Out of Service' || vehicle.status === 'Archived') return idle('Out of Service');
  if (!vehicle.gpsOnline) return idle('Offline');
  if (route.status !== 'Active' || vehicle.status !== 'Active' || !route.driverId || !live.length) return idle('Idle');
  let kind: TripKind | null = null;
  let progress = 0;
  if (demo) {
    const phase = (nowMin + (hash(route.id) % 17)) % 40;
    kind = Math.floor(nowMin / 40) % 2 === 0 ? 'Morning Pickup' : 'Afternoon Drop';
    progress = phase / 40;
  } else {
    const [m, e] = windowsOf(route);
    if (nowMin >= m[0] && nowMin < m[1]) { kind = 'Morning Pickup'; progress = (nowMin - m[0]) / route.durationMin; }
    else if (nowMin >= e[0] && nowMin < e[1]) { kind = 'Afternoon Drop'; progress = (nowMin - e[0]) / route.durationMin; }
  }
  if (!kind) return idle('Idle');
  const n = live.length;
  const order = kind === 'Morning Pickup' ? live : [...live].reverse();
  const covered = Math.min(n, Math.floor(progress * n));
  const next = order[Math.min(n - 1, covered)];
  const stopEta = Math.max(1, Math.round(((covered + 1) / n - progress) * route.durationMin));
  const delayMin = (hash(route.code) % 4) * 3 * (hash(vehicle.number) % 2);
  return { state: 'On Trip', kind, progress, stopsCovered: covered, totalStops: n, nextStop: next.name, etaMin: stopEta, speedKmh: Math.round(22 + 16 * Math.abs(Math.sin(progress * Math.PI * 7))), delayMin, mode: demo ? 'Demo' : 'Schedule' };
}

export interface FleetAlert {
  id: string;
  level: 'Critical' | 'Warning' | 'Info';
  title: string;
  detail: string;
  vehicleId: string;
}

/** Alerts worked out from the vehicle, driver and route records plus the current trip. */
export function fleetAlerts(trips: Map<string, TripState>): FleetAlert[] {
  const out: FleetAlert[] = [];
  for (const r of allRoutes().filter((x) => x.status !== 'Archived')) {
    const v = vehicleOf(r.vehicleId);
    const d = driverOf(r.driverId);
    if (!v) { out.push({ id: `nov-${r.id}`, level: 'Warning', title: `${r.code} has no vehicle`, detail: `${seatedOn(r.id)} students are booked on it.`, vehicleId: '' }); continue; }
    if (!v.gpsOnline && v.status !== 'Out of Service') out.push({ id: `gps-${v.id}`, level: 'Critical', title: `${v.number}: GPS offline`, detail: `${r.code} cannot be tracked until the device reports again.`, vehicleId: v.id });
    if (v.fuelLevel <= 25) out.push({ id: `fuel-${v.id}`, level: 'Warning', title: `${v.number}: low fuel`, detail: `${v.fuelLevel}% left. Refuel before the next run.`, vehicleId: v.id });
    if (insuranceState(v) !== 'Valid') out.push({ id: `ins-${v.id}`, level: insuranceState(v) === 'Expired' ? 'Critical' : 'Info', title: `${v.number}: insurance ${insuranceState(v).toLowerCase()}`, detail: `Expires ${v.insuranceExpiry}.`, vehicleId: v.id });
    if (!d && r.status === 'Active') out.push({ id: `drv-${r.id}`, level: 'Warning', title: `${r.code} has no driver`, detail: 'The route cannot run without a driver.', vehicleId: v.id });
    const t = trips.get(r.id);
    if (t && t.state === 'On Trip' && t.delayMin >= 6) out.push({ id: `late-${r.id}`, level: 'Warning', title: `${r.code} running ${t.delayMin} min late`, detail: `Next stop ${t.nextStop}.`, vehicleId: v.id });
  }
  const order = { Critical: 0, Warning: 1, Info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}
