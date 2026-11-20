import { repo, snapshot } from '@/core/store/store';
import { addDays, formatDate, formatTime, todayISO } from '@/core/utils/date';
import { money } from '@/core/utils/format';
import type { StudentRecord } from '@/data/seed/master';
import { WEEKDAYS, type DriverRecord, type PickupPointRecord, type RouteScheduleRecord, type StudentTransportRecord, type TransportRouteRecord, type VehicleRecord } from '@/data/seed/transport';
import { opts, parseCsvRows } from '@/features/academic/helpers';
import { classSection, countBy, getStudent, nextNo, studentOptions, sum } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import { feeSummary } from '@/features/people/studentData';
import type { Tone } from '@/ui/tone';
import {
  allAssignments, allRoutes, allSchedules, allStops, allVehicles, assignmentState, capacityOf, checkAssignment, checkStudentSeat, driverDuty, driverOf, fitnessState, insuranceState, isLiveRoute, licenseState, occupancyPct, ridersOf, routeLabel, routeOf, routeOfDriver, routeOfVehicle, scheduleConflicts, seatedOn, seatsFree, serviceState, stopOf, stopsOfRoute, toMin, vehicleOf,
} from './transportLogic';

const BY = 'Transport Office';
const time = (t: string) => (t ? formatTime(t) : '—');
const stateTone: Record<string, Tone> = { Valid: 'success', Expiring: 'warning', Expired: 'danger' };

/* ======================================== Routes ======================================== */

const routeTone: Record<string, Tone> = { Active: 'success', Scheduled: 'primary', Maintenance: 'warning', Suspended: 'danger', Archived: 'neutral' };
const ROUTE_STATUSES = ['Active', 'Scheduled', 'Maintenance', 'Suspended', 'Archived'];
/** Splits assignment errors into the one about the vehicle and the one about the driver (vehicle messages name a plate). */
const splitAssignErrors = (errors: string[]): { vehicle?: string; driver?: string } => {
  const vehicle = errors.find((e) => allVehicles().some((x) => e.includes(x.number)));
  const driver = errors.find((e) => e !== vehicle);
  return { vehicle, driver };
};
const vehicleChoices = () => allVehicles().filter((v) => v.status === 'Active' || v.status === 'Available').map((v) => ({ label: v.number, value: v.id, hint: `${v.model} · ${v.seats} seats` }));
const driverChoices = () => snapshot<DriverRecord>('drivers').filter((d) => d.status === 'Active' && d.verification === 'Verified').map((d) => ({ label: d.name, value: d.id, hint: `${d.licenseType} · ${d.experience} yrs` }));

export const routesCfg: ResourceConfig<TransportRouteRecord> = {
  entity: 'Route',
  collection: 'transportRoutes',
  auditEntity: 'route',
  searchPlaceholder: 'Search route, code, vehicle, driver…',
  searchText: (r) => `${r.code} ${r.name} ${r.corridor} ${vehicleOf(r.vehicleId)?.number ?? ''} ${driverOf(r.driverId)?.name ?? ''}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.distanceKm} km · ${stopsOfRoute(r.id).length} stops · ${r.corridor}`,
  status: (r) => ({ label: r.status, tone: routeTone[r.status] }),
  badges: (r) => [{ label: vehicleOf(r.vehicleId)?.number ?? 'No vehicle', tone: r.vehicleId ? 'primary' : 'neutral' }, { label: driverOf(r.driverId)?.name ?? 'No driver', tone: r.driverId ? 'info' : 'neutral' }, { label: `${seatedOn(r.id)}/${capacityOf(r)} seats`, tone: occupancyPct(r) >= 100 ? 'danger' : 'success' }],
  facts: [
    { label: 'First stop', value: (r) => stopsOfRoute(r.id)[0]?.name ?? '—' },
    { label: 'Morning run', value: (r) => `${time(r.morningStart)} · ${r.durationMin} min` },
    { label: 'Afternoon run', value: (r) => `${time(r.eveningStart)} · ${r.durationMin} min` },
    { label: 'Students', value: (r) => seatedOn(r.id) },
    { label: 'Monthly fee', value: (r) => money(r.fee) },
  ],
  detail: [
    { title: 'Route', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Name', value: (r) => r.name }, { label: 'Corridor', value: (r) => r.corridor }, { label: 'Distance', value: (r) => `${r.distanceKm} km` }, { label: 'Status', value: (r) => r.status }, { label: 'Academic year', value: (r) => r.academicYear }, { label: 'Monthly fee', value: (r) => money(r.fee) }, { label: 'Updated', value: (r) => formatDate(r.updated) }] },
    { title: 'Run times', items: [{ label: 'Morning pick-up', value: (r) => `${time(r.morningStart)} (${r.durationMin} min)` }, { label: 'Afternoon drop', value: (r) => `${time(r.eveningStart)} (${r.durationMin} min)` }, { label: 'Stops', value: (r) => stopsOfRoute(r.id).map((s) => `${s.order}. ${s.name} ${time(s.boarding)}`).join('\n') || 'No stops yet' }] },
    { title: 'Vehicle, driver & students', items: [{ label: 'Vehicle', value: (r) => { const v = vehicleOf(r.vehicleId); return v ? `${v.number} · ${v.model} (${v.seats} seats)` : 'None'; } }, { label: 'Driver', value: (r) => { const d = driverOf(r.driverId); return d ? `${d.name} · ${d.phone}` : 'None'; } }, { label: 'Students', value: (r) => `${seatedOn(r.id)} of ${capacityOf(r)} seats (${occupancyPct(r)}%)` }, { label: 'Seats free', value: (r) => seatsFree(r) }] },
  ],
  stats: [
    { label: 'Routes', value: (rows) => rows.length, icon: 'navigation' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Students riding', value: (rows) => sum(rows, (r) => seatedOn(r.id)), tone: 'info', icon: 'users' },
    { label: 'Seats free', value: (rows) => sum(rows.filter(isLiveRoute), seatsFree), tone: 'purple', icon: 'grid' },
    { label: 'Need attention', value: (rows) => countBy(rows, (r) => ['Driver Pending', 'Vehicle Pending', 'Vehicle Unavailable'].includes(assignmentState(r))), tone: 'warning', icon: 'alert-triangle' },
  ],
  views: [{ key: 'all', label: 'All Routes', match: () => true }, ...ROUTE_STATUSES.map((s) => ({ key: s, label: s, match: (r: TransportRouteRecord) => r.status === s }))],
  filters: [
    { key: 'status', label: 'Status', options: opts(ROUTE_STATUSES), match: (r, v) => r.status === v },
    { key: 'vehicle', label: 'Vehicle', options: () => allVehicles().map((v) => ({ label: v.number, value: v.id })), match: (r, v) => r.vehicleId === v },
    { key: 'driver', label: 'Driver', options: () => snapshot<DriverRecord>('drivers').map((d) => ({ label: d.name, value: d.id })), match: (r, v) => r.driverId === v },
    { key: 'corridor', label: 'Corridor', options: () => [...new Set(allRoutes().map((r) => r.corridor))].map((c) => ({ label: c, value: c })), match: (r, v) => r.corridor === v },
    { key: 'assigned', label: 'Assignment', single: true, options: opts(['No vehicle', 'No driver', 'Fully assigned']), match: (r, v) => (v === 'No vehicle' ? !r.vehicleId : v === 'No driver' ? !r.driverId : !!r.vehicleId && !!r.driverId) },
  ],
  sorts: [
    { key: 'code', label: 'Code', compare: (a, b) => a.code.localeCompare(b.code) },
    { key: 'students', label: 'Most students', compare: (a, b) => seatedOn(b.id) - seatedOn(a.id) },
    { key: 'distance', label: 'Distance (longest)', compare: (a, b) => b.distanceKm - a.distanceKm },
    { key: 'updated', label: 'Recently updated', compare: (a, b) => b.updated.localeCompare(a.updated) },
  ],
  form: [
    { key: 'code', label: 'Route Code', type: 'text', required: true },
    { key: 'name', label: 'Route Name', type: 'text', required: true },
    { key: 'corridor', label: 'Corridor', type: 'text', required: true },
    { key: 'distanceKm', label: 'Distance (km)', type: 'number', required: true, min: 1, max: 200 },
    { key: 'morningStart', label: 'Morning Run Starts', type: 'time', required: true },
    { key: 'eveningStart', label: 'Afternoon Run Starts', type: 'time', required: true },
    { key: 'durationMin', label: 'Run Duration (minutes)', type: 'number', required: true, min: 10, max: 180 },
    { key: 'fee', label: 'Monthly Fee per Student', type: 'money', required: true, min: 0 },
    { key: 'vehicleId', label: 'Vehicle', type: 'select', options: vehicleChoices, hint: 'Optional. You can also use Assign Vehicle.' },
    { key: 'driverId', label: 'Driver', type: 'select', options: driverChoices },
    { key: 'academicYear', label: 'Academic Year', type: 'select', required: true, options: ['2026-27', '2027-28'], default: '2026-27' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ROUTE_STATUSES, default: 'Scheduled' },
  ],
  defaults: (rows) => ({ code: nextNo('RT-', rows.map((r) => r.code), 2), morningStart: '07:00', eveningStart: '15:45', durationMin: '50' }),
  validate: (v, { existing, rows }) => {
    const draft = { ...(existing ?? { id: '__new__' }), ...v, morningStart: String(v.morningStart), eveningStart: String(v.eveningStart), durationMin: Number(v.durationMin) } as TransportRouteRecord;
    const assignErrors = existing && (v.vehicleId !== existing.vehicleId || v.driverId !== existing.driverId) ? checkAssignment(existing.id, v.vehicleId === existing.vehicleId ? '' : String(v.vehicleId), v.driverId === existing.driverId ? '' : String(v.driverId)) : [];
    return {
      ...(rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This route code is already used' } : {}),
      ...(rows.some((r) => r.id !== existing?.id && r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'A route with this name already exists' } : {}),
      ...(toMin(String(v.morningStart)) >= 12 * 60 ? { morningStart: 'The morning run must start before noon' } : {}),
      ...(toMin(String(v.eveningStart)) < 12 * 60 ? { eveningStart: 'The afternoon run must start after noon' } : {}),
      ...(existing && ['Archived'].includes(String(v.status)) && seatedOn(existing.id) > 0 ? { status: `${seatedOn(existing.id)} students still ride this route. Move them first.` } : {}),
      ...(!existing && v.driverId && !v.vehicleId ? { vehicleId: 'Choose a vehicle for the driver' } : {}),
      ...(splitAssignErrors(assignErrors).vehicle ? { vehicleId: splitAssignErrors(assignErrors).vehicle } : {}),
      ...(splitAssignErrors(assignErrors).driver ? { driverId: splitAssignErrors(assignErrors).driver } : {}),
      ...(draft.durationMin <= 0 ? { durationMin: 'Enter a duration' } : {}),
    };
  },
  prepare: (v, { existing }) => ({ vehicleId: v.vehicleId || '', driverId: v.driverId || '', shift: existing?.shift ?? 'Both', updated: todayISO() }),
  /** Suspending a route suspends its riders; resuming restores them. */
  afterSave: (kind, record, previous) => {
    if (kind !== 'update' || !previous || previous.status === record.status) return;
    if (record.status === 'Suspended') repo<StudentTransportRecord>('studentTransport').updateMany(ridersOf(record.id).filter((a) => a.status === 'Assigned').map((a) => a.id), () => ({ status: 'Suspended' as const, notes: 'Route suspended; the family is being contacted.' }));
    if (previous.status === 'Suspended' && record.status !== 'Suspended') repo<StudentTransportRecord>('studentTransport').updateMany(ridersOf(record.id).filter((a) => a.status === 'Suspended').map((a) => a.id), () => ({ status: 'Assigned' as const, notes: '' }));
  },
  canDeleteRecord: (r) => {
    const parts = [seatedOn(r.id) ? `${seatedOn(r.id)} students` : '', stopsOfRoute(r.id).length ? `${stopsOfRoute(r.id).length} pickup points` : '', allSchedules().some((s) => s.routeId === r.id) ? 'a schedule' : ''].filter(Boolean);
    return parts.length ? `${r.name} still has ${parts.join(', ')}. Archive it instead.` : null;
  },
  actions: [
    { key: 'stops', label: 'Manage pickup points', icon: 'map-pin', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/pickup-points?q=${r.code}`) },
    { key: 'assign', label: 'Assign vehicle & driver', icon: 'link', run: (r, _v, ctx) => ctx.go(`/campus/assign-vehicle?q=${r.code}`) },
    { key: 'students', label: 'Students on this route', icon: 'users', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/assign-students?q=${r.code}`) },
    { key: 'schedule', label: 'Schedule', icon: 'clock', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/route-scheduling?q=${r.code}`) },
    { key: 'suspend', label: 'Suspend route', icon: 'pause-circle', tone: 'danger', visible: (r) => r.status === 'Active' || r.status === 'Maintenance' || r.status === 'Scheduled', confirm: 'Suspend this route? Its riders are marked Suspended until it resumes.', run: (r, _v, ctx) => { ctx.update({ status: 'Suspended', updated: todayISO() }); ctx.toast(`${r.code} suspended`, 'info'); } },
    { key: 'resume', label: 'Resume route', icon: 'play-circle', visible: (r) => r.status === 'Suspended' || r.status === 'Archived', run: (r, _v, ctx) => { ctx.update({ status: r.vehicleId ? 'Active' : 'Scheduled', updated: todayISO() }); ctx.toast(`${r.code} is running again`); } },
    { key: 'archive', label: 'Archive route', icon: 'archive', visible: (r) => r.status !== 'Archived', confirm: 'Archive this route? Students must be moved first.', run: (r, _v, ctx) => { if (seatedOn(r.id)) { ctx.toast(`${seatedOn(r.id)} students still ride ${r.code}. Move them first.`, 'error'); return; } ctx.update({ status: 'Archived', updated: todayISO() }); ctx.toast(`${r.code} archived`, 'info'); } },
    { key: 'duplicate', label: 'Duplicate', icon: 'copy', run: (r, _v, ctx) => { repo<TransportRouteRecord>('transportRoutes').create({ ...r, id: undefined, code: nextNo('RT-', allRoutes().map((x) => x.code), 2), name: `${r.name} (Copy)`, vehicleId: '', driverId: '', status: 'Scheduled', updated: todayISO() }); ctx.toast('Copy created without vehicle, driver or stops'); } },
    { key: 'print', label: 'Share route sheet', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(`${r.code} — ${r.name}`, `ROUTE ${r.code} · ${r.name}\n${r.distanceKm} km · ${r.status}\nVehicle: ${vehicleOf(r.vehicleId)?.number ?? 'none'} · Driver: ${driverOf(r.driverId)?.name ?? 'none'}\nMorning ${time(r.morningStart)} · Afternoon ${time(r.eveningStart)}\nStudents: ${seatedOn(r.id)} of ${capacityOf(r)}\n\nStops:\n${stopsOfRoute(r.id).map((s) => `${s.order}. ${s.name} — ${time(s.boarding)}`).join('\n')}`) },
  ],
  bulk: [
    { key: 'status', label: 'Set status', icon: 'flag', form: { title: 'Set status for selected routes', fields: [{ key: 'status', label: 'Status', type: 'select', required: true, options: ['Active', 'Scheduled', 'Maintenance', 'Suspended'] }] }, run: (rows, v, ctx) => { ctx.updateMany(() => ({ status: v.status })); ctx.toast(`${rows.length} routes set to ${v.status}`); } },
  ],
};

/* ===================================== Pickup points ===================================== */

const pointTone: Record<string, Tone> = { Active: 'success', 'Temporarily Closed': 'danger', Maintenance: 'warning', Inactive: 'neutral', Archived: 'neutral' };
const POINT_STATUSES = ['Active', 'Temporarily Closed', 'Maintenance', 'Inactive', 'Archived'];
const ridersAt = (id: string) => allAssignments().filter((a) => a.pickupPointId === id && a.status !== 'Awaiting Assignment');

export const pickupPointsCfg: ResourceConfig<PickupPointRecord> = {
  entity: 'Pickup Point',
  collection: 'pickupPoints',
  auditEntity: 'pickupPoint',
  searchPlaceholder: 'Search stop, route, area…',
  searchText: (r) => `${r.name} ${r.code} ${r.area} ${r.zone} ${r.landmark} ${routeOf(r.routeId)?.code ?? ''} ${routeOf(r.routeId)?.name ?? ''}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${routeLabel(routeOf(r.routeId))} · stop ${r.order}`,
  status: (r) => ({ label: r.status, tone: pointTone[r.status] }),
  badges: (r) => [{ label: r.zone, tone: 'purple' }, { label: r.area, tone: 'neutral' }, { label: `${ridersAt(r.id).length} students`, tone: 'info' }],
  facts: [
    { label: 'Morning pick-up', value: (r) => time(r.boarding) },
    { label: 'Afternoon drop', value: (r) => time(r.drop) },
    { label: 'Distance from school', value: (r) => `${r.distanceKm} km` },
    { label: 'Vehicle', value: (r) => vehicleOf(routeOf(r.routeId)?.vehicleId ?? '')?.number ?? 'None' },
    { label: 'Driver', value: (r) => driverOf(routeOf(r.routeId)?.driverId ?? '')?.name ?? 'None' },
    { label: 'Landmark', value: (r) => r.landmark },
  ],
  detail: [
    { title: 'Stop', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Name', value: (r) => r.name }, { label: 'Route', value: (r) => routeLabel(routeOf(r.routeId)) }, { label: 'Order on route', value: (r) => r.order }, { label: 'Area / zone', value: (r) => `${r.area} · ${r.zone}` }, { label: 'Address', value: (r) => r.address }, { label: 'Landmark', value: (r) => r.landmark }, { label: 'Status', value: (r) => r.status }] },
    { title: 'Times & students', items: [{ label: 'Morning pick-up', value: (r) => time(r.boarding) }, { label: 'Afternoon drop', value: (r) => time(r.drop) }, { label: 'Distance', value: (r) => `${r.distanceKm} km` }, { label: 'Students boarding', value: (r) => ridersAt(r.id).map((a) => getStudent(a.studentId)?.name).filter(Boolean).join(', ') || 'None' }] },
  ],
  stats: [
    { label: 'Pickup points', value: (rows) => rows.length, icon: 'map-pin' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Closed / maintenance', value: (rows) => countBy(rows, (r) => r.status === 'Temporarily Closed' || r.status === 'Maintenance'), tone: 'warning', icon: 'alert-triangle' },
    { label: 'Students boarding', value: (rows) => sum(rows, (r) => ridersAt(r.id).length), tone: 'info', icon: 'users' },
    { label: 'Routes covered', value: (rows) => new Set(rows.map((r) => r.routeId)).size, tone: 'purple', icon: 'navigation' },
  ],
  views: [{ key: 'all', label: 'All Stops', match: () => true }, ...POINT_STATUSES.map((s) => ({ key: s, label: s, match: (r: PickupPointRecord) => r.status === s }))],
  filters: [
    { key: 'route', label: 'Route', options: () => allRoutes().map((r) => ({ label: routeLabel(r), value: r.id })), match: (r, v) => r.routeId === v },
    { key: 'zone', label: 'Zone', options: opts(['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G']), match: (r, v) => r.zone === v },
    { key: 'area', label: 'Area', options: () => [...new Set(allStops().map((s) => s.area))].map((a) => ({ label: a, value: a })), match: (r, v) => r.area === v },
    { key: 'status', label: 'Status', options: opts(POINT_STATUSES), match: (r, v) => r.status === v },
    { key: 'window', label: 'Morning boarding', single: true, options: opts(['Before 07:00', '07:00 – 08:00', 'After 08:00']), match: (r, v) => { const m = toMin(r.boarding); return v === 'Before 07:00' ? m < 420 : v === '07:00 – 08:00' ? m >= 420 && m < 480 : m >= 480; } },
  ],
  sorts: [
    { key: 'route', label: 'Route, then order', compare: (a, b) => a.routeId.localeCompare(b.routeId) || a.order - b.order },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'students', label: 'Most students', compare: (a, b) => ridersAt(b.id).length - ridersAt(a.id).length },
    { key: 'time', label: 'Morning time', compare: (a, b) => a.boarding.localeCompare(b.boarding) },
  ],
  form: [
    { key: 'name', label: 'Stop Name', type: 'text', required: true },
    { key: 'routeId', label: 'Route', type: 'select', required: true, optionsFrom: { collection: 'transportRoutes', label: (r: TransportRouteRecord) => routeLabel(r), filter: (r: TransportRouteRecord) => r.status !== 'Archived' } },
    { key: 'order', label: 'Order on Route', type: 'number', required: true, min: 1, max: 40 },
    { key: 'boarding', label: 'Morning Pick-up Time', type: 'time', required: true },
    { key: 'drop', label: 'Afternoon Drop Time', type: 'time', required: true },
    { key: 'area', label: 'Area', type: 'text', required: true },
    { key: 'zone', label: 'Zone', type: 'select', options: ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F', 'Zone G'], default: 'Zone A' },
    { key: 'address', label: 'Address', type: 'textarea' },
    { key: 'landmark', label: 'Landmark', type: 'text' },
    { key: 'distanceKm', label: 'Distance from School (km)', type: 'number', min: 0, max: 200, default: 5 },
    { key: 'status', label: 'Status', type: 'select', required: true, options: POINT_STATUSES, default: 'Active' },
  ],
  validate: (v, { existing, rows }) => {
    const mates = rows.filter((r) => r.routeId === v.routeId && r.id !== existing?.id);
    const before = mates.filter((r) => r.order < Number(v.order));
    const after = mates.filter((r) => r.order > Number(v.order));
    return {
      ...(mates.some((r) => r.name.toLowerCase() === String(v.name).trim().toLowerCase()) ? { name: 'This route already has a stop with that name' } : {}),
      ...(mates.some((r) => r.order === Number(v.order)) ? { order: 'Another stop already has this position' } : {}),
      ...(before.some((r) => r.boarding >= String(v.boarding)) || after.some((r) => r.boarding <= String(v.boarding)) ? { boarding: 'Morning times must follow the stop order' } : {}),
      ...(before.some((r) => r.drop <= String(v.drop)) || after.some((r) => r.drop >= String(v.drop)) ? { drop: 'Afternoon times run in the opposite order of the stops' } : {}),
      ...(toMin(String(v.boarding)) >= 12 * 60 ? { boarding: 'The morning pick-up is before noon' } : {}),
      ...(toMin(String(v.drop)) < 12 * 60 ? { drop: 'The afternoon drop is after noon' } : {}),
    };
  },
  prepare: () => ({ updated: todayISO() }),
  /** A stop that closes sends its riders back for a new stop. */
  afterSave: (kind, record, previous) => {
    if (kind !== 'update' || !previous || previous.status === record.status || record.status === 'Active') return;
    repo<StudentTransportRecord>('studentTransport').updateMany(ridersAt(record.id).filter((a) => a.status === 'Assigned').map((a) => a.id), () => ({ status: 'Stop Change Requested' as const, notes: `${record.name} is ${record.status.toLowerCase()}; choose another stop.` }));
  },
  canDeleteRecord: (r) => (ridersAt(r.id).length ? `${ridersAt(r.id).length} students board here. Move them to another stop first.` : null),
  actions: [
    { key: 'close', label: 'Close temporarily', icon: 'slash', visible: (r) => r.status === 'Active', confirm: 'Close this stop? Students boarding here are asked to choose another stop.', run: (r, _v, ctx) => { ctx.update({ status: 'Temporarily Closed' }); ctx.toast(`${r.name} closed`, 'info'); } },
    { key: 'reopen', label: 'Reopen', icon: 'unlock', visible: (r) => r.status !== 'Active' && r.status !== 'Archived', run: (r, _v, ctx) => { ctx.update({ status: 'Active' }); ctx.toast(`${r.name} reopened`); } },
    { key: 'riders', label: 'Students at this stop', icon: 'users', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/assign-students?q=${encodeURIComponent(r.name)}`) },
    { key: 'print', label: 'Share stop details', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.name, `${r.name} (${r.code})\n${routeLabel(routeOf(r.routeId))} · stop ${r.order}\nMorning ${time(r.boarding)} · Afternoon ${time(r.drop)}\n${r.address}\n${r.landmark}`) },
  ],
};

/* ======================================== Vehicles ======================================== */

const vehicleTone: Record<string, Tone> = { Active: 'success', Available: 'primary', Maintenance: 'warning', 'Out of Service': 'neutral', Archived: 'neutral' };
const VEHICLE_STATUSES = ['Active', 'Available', 'Maintenance', 'Out of Service', 'Archived'];
const PLATE = /^[A-Z]{2}-\d{2}-[A-Z]{1,3}-\d{4}$/;
const seatBand = (n: number) => (n <= 15 ? 'Up to 15' : n <= 30 ? '16 – 30' : n <= 45 ? '31 – 45' : '46+');

export const vehiclesCfg: ResourceConfig<VehicleRecord> = {
  entity: 'Vehicle',
  collection: 'vehicles',
  auditEntity: 'vehicle',
  searchPlaceholder: 'Search number, model, route, driver…',
  searchText: (r) => `${r.number} ${r.model} ${r.type} ${r.fuel} ${routeOfVehicle(r.id)?.code ?? ''} ${driverOf(routeOfVehicle(r.id)?.driverId ?? '')?.name ?? ''}`,
  code: (r) => r.type,
  title: (r) => r.number,
  subtitle: (r) => `${r.model} · ${r.seats} seats · ${r.fuel}`,
  status: (r) => ({ label: r.status, tone: vehicleTone[r.status] }),
  badges: (r) => [
    ...(routeOfVehicle(r.id) ? [{ label: routeOfVehicle(r.id)!.code, tone: 'primary' as Tone }] : []),
    ...(insuranceState(r) !== 'Valid' ? [{ label: `Insurance ${insuranceState(r).toLowerCase()}`, tone: stateTone[insuranceState(r)] }] : []),
    ...(serviceState(r) !== 'Up to date' ? [{ label: `Service ${serviceState(r).toLowerCase()}`, tone: serviceState(r) === 'Overdue' ? ('danger' as Tone) : ('warning' as Tone) }] : []),
    ...(!r.gpsOnline ? [{ label: 'GPS offline', tone: 'danger' as Tone }] : []),
  ],
  facts: [
    { label: 'Route', value: (r) => (routeOfVehicle(r.id) ? routeLabel(routeOfVehicle(r.id)) : 'Not assigned') },
    { label: 'Driver', value: (r) => driverOf(routeOfVehicle(r.id)?.driverId ?? '')?.name ?? '—' },
    { label: 'Insurance expires', value: (r) => formatDate(r.insuranceExpiry) },
    { label: 'Fitness expires', value: (r) => formatDate(r.fitnessExpiry) },
    { label: 'Next service', value: (r) => formatDate(r.nextService) },
    { label: 'Fuel', value: (r) => `${r.fuelLevel}%` },
  ],
  detail: [
    { title: 'Vehicle', items: [{ label: 'Number', value: (r) => r.number }, { label: 'Model', value: (r) => `${r.model} (${r.mfgYear})` }, { label: 'Type', value: (r) => r.type }, { label: 'Seats', value: (r) => r.seats }, { label: 'Fuel', value: (r) => `${r.fuel} · ${r.fuelLevel}% in tank` }, { label: 'Odometer', value: (r) => `${r.odometerKm.toLocaleString('en-US')} km` }, { label: 'GPS device', value: (r) => `${r.gpsDevice} · ${r.gpsOnline ? 'online' : 'offline'}` }, { label: 'Status', value: (r) => r.status }] },
    { title: 'Documents', items: [{ label: 'Insurance', value: (r) => `${r.insurer} · ${formatDate(r.insuranceExpiry)} (${insuranceState(r)})` }, { label: 'Registration', value: (r) => formatDate(r.registrationExpiry) }, { label: 'Fitness certificate', value: (r) => `${formatDate(r.fitnessExpiry)} (${fitnessState(r)})` }] },
    { title: 'Service & route', items: [{ label: 'Last service', value: (r) => formatDate(r.lastService) }, { label: 'Next service', value: (r) => `${formatDate(r.nextService)} (${serviceState(r)})` }, { label: 'Route', value: (r) => (routeOfVehicle(r.id) ? routeLabel(routeOfVehicle(r.id)) : 'Not assigned') }, { label: 'Driver', value: (r) => driverOf(routeOfVehicle(r.id)?.driverId ?? '')?.name ?? '—' }, { label: 'Notes', value: (r) => r.notes || '—' }] },
  ],
  stats: [
    { label: 'Vehicles', value: (rows) => rows.length, icon: 'truck' },
    { label: 'On a route', value: (rows) => countBy(rows, (r) => !!routeOfVehicle(r.id)), tone: 'info', icon: 'navigation' },
    { label: 'Available', value: (rows) => countBy(rows, (r) => (r.status === 'Active' || r.status === 'Available') && !routeOfVehicle(r.id)), tone: 'success', icon: 'check-circle' },
    { label: 'In maintenance', value: (rows) => countBy(rows, (r) => r.status === 'Maintenance'), tone: 'warning', icon: 'tool' },
    { label: 'Documents due', value: (rows) => countBy(rows, (r) => insuranceState(r) !== 'Valid' || fitnessState(r) !== 'Valid'), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Total seats', value: (rows) => sum(rows.filter((r) => r.status === 'Active' || r.status === 'Available'), (r) => r.seats), tone: 'purple', icon: 'grid' },
  ],
  views: [
    { key: 'all', label: 'All Vehicles', match: () => true },
    { key: 'Active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'Available', label: 'Available', match: (r) => r.status === 'Available' || (r.status === 'Active' && !routeOfVehicle(r.id)) },
    { key: 'route', label: 'On Route', match: (r) => !!routeOfVehicle(r.id) },
    { key: 'Maintenance', label: 'Maintenance', match: (r) => r.status === 'Maintenance' },
    { key: 'insurance', label: 'Insurance Due', match: (r) => insuranceState(r) !== 'Valid' },
    { key: 'Out', label: 'Out of Service', match: (r) => r.status === 'Out of Service' },
    { key: 'Archived', label: 'Archived', match: (r) => r.status === 'Archived' },
  ],
  filters: [
    { key: 'type', label: 'Type', options: opts(['School Bus', 'Mini Bus', 'Van']), match: (r, v) => r.type === v },
    { key: 'fuel', label: 'Fuel', options: opts(['Diesel', 'CNG', 'Electric']), match: (r, v) => r.fuel === v },
    { key: 'seats', label: 'Seating', options: opts(['Up to 15', '16 – 30', '31 – 45', '46+']), match: (r, v) => seatBand(r.seats) === v },
    { key: 'insurance', label: 'Insurance', options: opts(['Valid', 'Expiring', 'Expired']), match: (r, v) => insuranceState(r) === v },
    { key: 'service', label: 'Maintenance', options: opts(['Up to date', 'Due soon', 'Overdue']), match: (r, v) => serviceState(r) === v },
    { key: 'status', label: 'Status', options: opts(VEHICLE_STATUSES), match: (r, v) => r.status === v },
    { key: 'route', label: 'Route', options: () => allRoutes().map((r) => ({ label: routeLabel(r), value: r.id })), match: (r, v) => routeOfVehicle(r.id)?.id === v },
  ],
  sorts: [
    { key: 'number', label: 'Number', compare: (a, b) => a.number.localeCompare(b.number) },
    { key: 'seats', label: 'Seats (most)', compare: (a, b) => b.seats - a.seats },
    { key: 'insurance', label: 'Insurance expiry (soonest)', compare: (a, b) => a.insuranceExpiry.localeCompare(b.insuranceExpiry) },
    { key: 'service', label: 'Next service (soonest)', compare: (a, b) => a.nextService.localeCompare(b.nextService) },
  ],
  form: [
    { key: 'number', label: 'Registration Number', type: 'text', required: true, placeholder: 'TN-09-BC-1234' },
    { key: 'model', label: 'Make & Model', type: 'text', required: true },
    { key: 'type', label: 'Type', type: 'select', required: true, options: ['School Bus', 'Mini Bus', 'Van'], default: 'School Bus' },
    { key: 'seats', label: 'Seats', type: 'number', required: true, min: 2, max: 70 },
    { key: 'fuel', label: 'Fuel', type: 'select', required: true, options: ['Diesel', 'CNG', 'Electric'], default: 'Diesel' },
    { key: 'mfgYear', label: 'Year of Manufacture', type: 'number', required: true, min: 1995, max: new Date().getFullYear() + 1 },
    { key: 'insurer', label: 'Insurer', type: 'text' },
    { key: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date', required: true },
    { key: 'registrationExpiry', label: 'Registration Expiry', type: 'date', required: true },
    { key: 'fitnessExpiry', label: 'Fitness Expiry', type: 'date', required: true },
    { key: 'lastService', label: 'Last Service', type: 'date', required: true },
    { key: 'nextService', label: 'Next Service', type: 'date', required: true },
    { key: 'gpsDevice', label: 'GPS Device ID', type: 'text' },
    { key: 'fuelLevel', label: 'Fuel Level (%)', type: 'number', min: 0, max: 100, default: 100 },
    { key: 'odometerKm', label: 'Odometer (km)', type: 'number', min: 0, default: 0 },
    { key: 'status', label: 'Status', type: 'select', required: true, options: VEHICLE_STATUSES, default: 'Available' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ lastService: todayISO(), nextService: addDays(todayISO(), 90), insuranceExpiry: addDays(todayISO(), 365), registrationExpiry: addDays(todayISO(), 730), fitnessExpiry: addDays(todayISO(), 365) }),
  validate: (v, { existing, rows }) => {
    const route = existing ? routeOfVehicle(existing.id) : undefined;
    return {
      ...(!PLATE.test(String(v.number).trim().toUpperCase()) ? { number: 'Use the format TN-09-BC-1234' } : {}),
      ...(rows.some((r) => r.id !== existing?.id && r.number.toUpperCase() === String(v.number).trim().toUpperCase()) ? { number: 'This vehicle is already registered' } : {}),
      ...(v.type === 'Van' && Number(v.seats) > 15 ? { seats: 'A van seats at most 15' } : {}),
      ...(v.type === 'Mini Bus' && (Number(v.seats) < 16 || Number(v.seats) > 30) ? { seats: 'A mini bus seats 16 to 30' } : {}),
      ...(v.type === 'School Bus' && Number(v.seats) < 31 ? { seats: 'A school bus seats 31 or more' } : {}),
      ...(String(v.nextService) <= String(v.lastService) ? { nextService: 'The next service must be after the last one' } : {}),
      ...(route && Number(v.seats) < seatedOn(route.id) ? { seats: `${seatedOn(route.id)} students ride ${route.code}; seats cannot drop below that` } : {}),
      ...(route && (v.status === 'Out of Service' || v.status === 'Archived') ? { status: `Remove it from ${route.code} (Assign Vehicle) before taking it off the road` } : {}),
    };
  },
  prepare: (v) => ({ number: String(v.number).trim().toUpperCase(), gpsOnline: true, gpsDevice: v.gpsDevice || '' }),
  canDeleteRecord: (r) => (routeOfVehicle(r.id) ? `${r.number} runs ${routeOfVehicle(r.id)!.code}. Remove it from the route first.` : snapshot<{ id: string; serial: string }>('assets').some((a) => a.serial === r.number) ? `${r.number} is in the asset register. Archive it instead.` : null),
  actions: [
    { key: 'assign', label: 'Assign to a route', icon: 'link', run: (r, _v, ctx) => ctx.go(`/campus/assign-vehicle?q=${r.number}`) },
    {
      key: 'service',
      label: 'Log service',
      icon: 'tool',
      form: { title: 'Log service', submitLabel: 'Save', fields: [{ key: 'date', label: 'Service Date', type: 'date', required: true }, { key: 'next', label: 'Next Service Due', type: 'date', required: true }, { key: 'odometer', label: 'Odometer (km)', type: 'number', required: true, min: 0 }], initial: (r) => ({ date: todayISO(), next: addDays(todayISO(), 90), odometer: String(r.odometerKm) }), validate: (v, r) => ({ ...(String(v.date) > todayISO() ? { date: 'The service date cannot be in the future' } : {}), ...(String(v.next) <= String(v.date) ? { next: 'The next service must be after this one' } : {}), ...(Number(v.odometer) < r.odometerKm ? { odometer: `The odometer cannot go below ${r.odometerKm} km` } : {}) }) },
      run: (r, v, ctx) => { ctx.update({ lastService: v.date, nextService: v.next, odometerKm: Number(v.odometer), status: r.status === 'Maintenance' ? 'Active' : r.status }); ctx.toast(`Service logged for ${r.number}`); },
    },
    { key: 'insurance', label: 'Renew insurance', icon: 'shield', form: { title: 'Renew insurance', fields: [{ key: 'expiry', label: 'New Expiry', type: 'date', required: true }, { key: 'insurer', label: 'Insurer', type: 'text' }], initial: (r) => ({ insurer: r.insurer, expiry: addDays(todayISO(), 365) }), validate: (v, r) => (String(v.expiry) <= r.insuranceExpiry ? { expiry: 'The new expiry must be later than the current one' } : {}) }, run: (r, v, ctx) => { ctx.update({ insuranceExpiry: v.expiry, insurer: v.insurer || r.insurer }); ctx.toast('Insurance renewed'); } },
    { key: 'fitness', label: 'Renew fitness certificate', icon: 'file-text', form: { title: 'Renew fitness certificate', fields: [{ key: 'expiry', label: 'New Expiry', type: 'date', required: true }], initial: () => ({ expiry: addDays(todayISO(), 365) }), validate: (v, r) => (String(v.expiry) <= r.fitnessExpiry ? { expiry: 'The new expiry must be later than the current one' } : {}) }, run: (r, v, ctx) => { ctx.update({ fitnessExpiry: v.expiry }); ctx.toast('Fitness certificate renewed'); } },
    { key: 'refuel', label: 'Record refuel', icon: 'droplet', form: { title: 'Record refuel', fields: [{ key: 'level', label: 'Fuel Level After (%)', type: 'number', required: true, min: 0, max: 100 }], initial: () => ({ level: '100' }) }, run: (r, v, ctx) => { ctx.update({ fuelLevel: Number(v.level) }); ctx.toast(`${r.number} fuel is now ${v.level}%`); } },
    { key: 'maintenance', label: 'Send to maintenance', icon: 'tool', visible: (r) => r.status === 'Active' || r.status === 'Available', confirm: 'Mark this vehicle as under maintenance? Its route shows “Vehicle unavailable”.', run: (r, _v, ctx) => { ctx.update({ status: 'Maintenance' }); ctx.toast(`${r.number} is in maintenance`, 'info'); } },
    { key: 'ready', label: 'Back in service', icon: 'check-circle', visible: (r) => r.status === 'Maintenance', run: (r, _v, ctx) => { ctx.update({ status: routeOfVehicle(r.id) ? 'Active' : 'Available' }); ctx.toast(`${r.number} is back in service`); } },
    { key: 'gps', label: 'Toggle GPS status', icon: 'crosshair', run: (r, _v, ctx) => { ctx.update({ gpsOnline: !r.gpsOnline }); ctx.toast(`GPS ${r.gpsOnline ? 'switched offline' : 'back online'} for ${r.number}`, 'info'); } },
    { key: 'print', label: 'Share details', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.number, `${r.number} · ${r.model} (${r.mfgYear})\n${r.type} · ${r.seats} seats · ${r.fuel}\nInsurance ${formatDate(r.insuranceExpiry)} · Fitness ${formatDate(r.fitnessExpiry)}\nNext service ${formatDate(r.nextService)}`) },
  ],
};

/* ========================================= Drivers ========================================= */

const driverTone: Record<string, Tone> = { Active: 'success', 'On Leave': 'warning', Suspended: 'danger', Inactive: 'neutral' };
const verifyTone: Record<string, Tone> = { Verified: 'success', Pending: 'warning', Suspended: 'danger' };
const DRIVER_STATUSES = ['Active', 'On Leave', 'Suspended', 'Inactive'];
const expiryBand = (d: DriverRecord) => (licenseState(d) === 'Expired' ? 'Expired' : licenseState(d) === 'Expiring' ? 'Expiring within 90 days' : 'Valid');

export const driversCfg: ResourceConfig<DriverRecord> = {
  entity: 'Driver',
  collection: 'drivers',
  auditEntity: 'driver',
  searchPlaceholder: 'Search driver, licence, phone…',
  searchText: (r) => `${r.name} ${r.code} ${r.licenseNo} ${r.phone} ${routeOfDriver(r.id)?.code ?? ''}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.licenseType} · ${r.experience} years`,
  status: (r) => ({ label: driverDuty(r), tone: driverDuty(r) === 'On Duty' ? 'info' : driverDuty(r) === 'Available' ? 'primary' : driverTone[r.status] }),
  badges: (r) => [{ label: r.verification, tone: verifyTone[r.verification] }, { label: `Licence ${licenseState(r).toLowerCase()}`, tone: stateTone[licenseState(r)] }, ...(routeOfDriver(r.id) ? [{ label: routeOfDriver(r.id)!.code, tone: 'primary' as Tone }] : [])],
  facts: [
    { label: 'Phone', value: (r) => r.phone },
    { label: 'Vehicle', value: (r) => vehicleOf(routeOfDriver(r.id)?.vehicleId ?? '')?.number ?? '—' },
    { label: 'Route', value: (r) => (routeOfDriver(r.id) ? routeLabel(routeOfDriver(r.id)) : 'Not assigned') },
    { label: 'Licence expires', value: (r) => formatDate(r.expires) },
    { label: 'Joined', value: (r) => formatDate(r.joined) },
  ],
  detail: [
    { title: 'Driver', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Name', value: (r) => r.name }, { label: 'Phone', value: (r) => r.phone }, { label: 'Email', value: (r) => r.email }, { label: 'Emergency contact', value: (r) => r.emergency }, { label: 'Experience', value: (r) => `${r.experience} years` }, { label: 'Joined', value: (r) => formatDate(r.joined) }, { label: 'Status', value: (r) => `${r.status} · ${driverDuty(r)}` }] },
    { title: 'Licence & verification', items: [{ label: 'Licence no', value: (r) => r.licenseNo }, { label: 'Type', value: (r) => r.licenseType }, { label: 'Issued', value: (r) => formatDate(r.issued) }, { label: 'Expires', value: (r) => `${formatDate(r.expires)} (${licenseState(r)})` }, { label: 'Verification', value: (r) => r.verification }] },
    { title: 'Assignment', items: [{ label: 'Route', value: (r) => (routeOfDriver(r.id) ? routeLabel(routeOfDriver(r.id)) : 'Not assigned') }, { label: 'Vehicle', value: (r) => { const v = vehicleOf(routeOfDriver(r.id)?.vehicleId ?? ''); return v ? `${v.number} · ${v.model}` : '—'; } }] },
  ],
  stats: [
    { label: 'Drivers', value: (rows) => rows.length, icon: 'users' },
    { label: 'On duty', value: (rows) => countBy(rows, (r) => driverDuty(r) === 'On Duty'), tone: 'info', icon: 'navigation' },
    { label: 'Available', value: (rows) => countBy(rows, (r) => driverDuty(r) === 'Available'), tone: 'success', icon: 'user-check' },
    { label: 'On leave', value: (rows) => countBy(rows, (r) => r.status === 'On Leave'), tone: 'warning', icon: 'calendar' },
    { label: 'Licence due', value: (rows) => countBy(rows, (r) => licenseState(r) !== 'Valid'), tone: 'danger', icon: 'alert-triangle' },
  ],
  views: [
    { key: 'all', label: 'All Drivers', match: () => true },
    { key: 'Active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'Available', label: 'Available', match: (r) => driverDuty(r) === 'Available' },
    { key: 'duty', label: 'On Duty', match: (r) => driverDuty(r) === 'On Duty' },
    { key: 'leave', label: 'On Leave', match: (r) => r.status === 'On Leave' },
    { key: 'license', label: 'Licence Due', match: (r) => licenseState(r) !== 'Valid' },
    { key: 'Suspended', label: 'Suspended', match: (r) => r.status === 'Suspended' },
    { key: 'Inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'license', label: 'Licence type', options: opts(['Heavy (HMV)', 'Light (LMV)']), match: (r, v) => r.licenseType === v },
    { key: 'expiry', label: 'Licence expiry', options: opts(['Valid', 'Expiring within 90 days', 'Expired']), match: (r, v) => expiryBand(r) === v },
    { key: 'verification', label: 'Verification', options: opts(['Verified', 'Pending', 'Suspended']), match: (r, v) => r.verification === v },
    { key: 'availability', label: 'Availability', options: opts(['Available', 'On Duty', 'On Leave']), match: (r, v) => driverDuty(r) === v },
    { key: 'status', label: 'Status', options: opts(DRIVER_STATUSES), match: (r, v) => r.status === v },
    { key: 'route', label: 'Route', options: () => allRoutes().map((r) => ({ label: routeLabel(r), value: r.id })), match: (r, v) => routeOfDriver(r.id)?.id === v },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'experience', label: 'Most experienced', compare: (a, b) => b.experience - a.experience },
    { key: 'expiry', label: 'Licence expiry (soonest)', compare: (a, b) => a.expires.localeCompare(b.expires) },
    { key: 'joined', label: 'Recently joined', compare: (a, b) => b.joined.localeCompare(a.joined) },
  ],
  form: [
    { key: 'name', label: 'Full Name', type: 'text', required: true },
    { key: 'phone', label: 'Phone', type: 'phone', required: true },
    { key: 'email', label: 'Email', type: 'email' },
    { key: 'emergency', label: 'Emergency Phone', type: 'phone' },
    { key: 'licenseNo', label: 'Licence Number', type: 'text', required: true },
    { key: 'licenseType', label: 'Licence Type', type: 'select', required: true, options: ['Heavy (HMV)', 'Light (LMV)'], default: 'Heavy (HMV)' },
    { key: 'issued', label: 'Licence Issued', type: 'date', required: true },
    { key: 'expires', label: 'Licence Expires', type: 'date', required: true },
    { key: 'verification', label: 'Verification', type: 'select', required: true, options: ['Verified', 'Pending', 'Suspended'], default: 'Pending' },
    { key: 'experience', label: 'Experience (years)', type: 'number', min: 0, max: 50, default: 0 },
    { key: 'joined', label: 'Date of Joining', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', required: true, options: DRIVER_STATUSES, default: 'Active' },
  ],
  defaults: (rows) => ({ joined: todayISO(), issued: todayISO(), expires: addDays(todayISO(), 365 * 5), code: nextNo('DRV-', rows.map((r) => r.code), 3) }),
  validate: (v, { existing, rows }) => {
    const route = existing ? routeOfDriver(existing.id) : undefined;
    return {
      ...(rows.some((r) => r.id !== existing?.id && r.licenseNo.replace(/\s/g, '').toLowerCase() === String(v.licenseNo).replace(/\s/g, '').toLowerCase()) ? { licenseNo: 'This licence number is already registered' } : {}),
      ...(rows.some((r) => r.id !== existing?.id && r.phone.replace(/\D/g, '') === String(v.phone).replace(/\D/g, '')) ? { phone: 'Another driver uses this phone number' } : {}),
      ...(String(v.expires) <= String(v.issued) ? { expires: 'The licence must expire after it was issued' } : {}),
      ...(String(v.status) === 'Active' && String(v.expires) < todayISO() ? { status: 'A driver with an expired licence cannot be Active' } : {}),
      ...(String(v.joined) > todayISO() ? { joined: 'The joining date cannot be in the future' } : {}),
      ...(route && v.status !== 'Active' ? { status: `${existing!.name} drives ${route.code}. Assign another driver first.` } : {}),
      ...(route && String(v.expires) < todayISO() ? { expires: `${existing!.name} drives ${route.code}; renew the licence or reassign the route` } : {}),
    };
  },
  prepare: (_v, { existing, rows }) => ({ code: existing?.code ?? nextNo('DRV-', rows.map((r) => r.code), 3) }),
  canDeleteRecord: (r) => (routeOfDriver(r.id) ? `${r.name} drives ${routeOfDriver(r.id)!.code}. Assign another driver first.` : null),
  actions: [
    { key: 'assign', label: 'Assign to a route', icon: 'link', visible: (r) => r.status === 'Active', run: (r, _v, ctx) => ctx.go(`/campus/assign-vehicle?q=${encodeURIComponent(r.name)}`) },
    { key: 'verify', label: 'Mark verified', icon: 'check-circle', tone: 'success', visible: (r) => r.verification !== 'Verified' && licenseState(r) !== 'Expired', run: (r, _v, ctx) => { ctx.update({ verification: 'Verified' }); ctx.toast(`${r.name} verified`); } },
    { key: 'renew', label: 'Renew licence', icon: 'file-text', form: { title: 'Renew licence', fields: [{ key: 'expires', label: 'New Expiry', type: 'date', required: true }], initial: () => ({ expires: addDays(todayISO(), 365 * 5) }), validate: (v, r) => (String(v.expires) <= r.expires ? { expires: 'The new expiry must be later than the current one' } : {}) }, run: (r, v, ctx) => { ctx.update({ expires: v.expires, issued: todayISO() }); ctx.toast(`Licence renewed until ${formatDate(v.expires)}`); } },
    { key: 'leave', label: 'Mark on leave', icon: 'calendar', visible: (r) => r.status === 'Active', run: (r, _v, ctx) => { const route = routeOfDriver(r.id); if (route) { ctx.toast(`${r.name} drives ${route.code}. Assign another driver first.`, 'error'); return; } ctx.update({ status: 'On Leave' }); ctx.toast(`${r.name} is on leave`, 'info'); } },
    { key: 'return', label: 'Back from leave', icon: 'user-check', visible: (r) => r.status === 'On Leave', run: (r, _v, ctx) => { ctx.update({ status: 'Active' }); ctx.toast(`${r.name} is active again`); } },
    { key: 'suspend', label: 'Suspend', icon: 'slash', tone: 'danger', visible: (r) => r.status !== 'Suspended', form: { title: 'Suspend driver', submitLabel: 'Suspend', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] }, run: (r, v, ctx) => { const route = routeOfDriver(r.id); if (route) { ctx.toast(`${r.name} drives ${route.code}. Assign another driver first.`, 'error'); return; } ctx.update({ status: 'Suspended', verification: 'Suspended' }); ctx.toast(`${r.name} suspended: ${v.reason}`, 'info'); } },
    { key: 'reinstate', label: 'Reinstate', icon: 'rotate-ccw', visible: (r) => r.status === 'Suspended' && licenseState(r) !== 'Expired', run: (r, _v, ctx) => { ctx.update({ status: 'Active', verification: 'Verified' }); ctx.toast(`${r.name} reinstated`); } },
    { key: 'print', label: 'Share details', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.name, `${r.name} (${r.code})\n${r.phone}\nLicence ${r.licenseNo} · ${r.licenseType} · expires ${formatDate(r.expires)}\nRoute: ${routeOfDriver(r.id) ? routeLabel(routeOfDriver(r.id)) : 'not assigned'}`) },
  ],
};

/* ===================================== Assign vehicle ===================================== */

const stateBadge: Record<string, Tone> = { Active: 'success', 'Driver Pending': 'warning', 'Vehicle Pending': 'warning', 'Vehicle Unavailable': 'danger', Suspended: 'danger', Closed: 'neutral' };
const ASSIGN_STATES = ['Active', 'Driver Pending', 'Vehicle Pending', 'Vehicle Unavailable', 'Suspended', 'Closed'];

export const assignVehicleCfg: ResourceConfig<TransportRouteRecord> = {
  entity: 'Assignment',
  collection: 'transportRoutes',
  auditEntity: 'route',
  canCreate: false,
  canEdit: false,
  canDelete: false,
  searchPlaceholder: 'Search route, vehicle or driver…',
  searchText: (r) => `${r.code} ${r.name} ${vehicleOf(r.vehicleId)?.number ?? ''} ${driverOf(r.driverId)?.name ?? ''} ${vehicleOf(r.vehicleId)?.model ?? ''}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${vehicleOf(r.vehicleId)?.number ?? 'No vehicle'} · ${driverOf(r.driverId)?.name ?? 'No driver'}`,
  status: (r) => ({ label: assignmentState(r), tone: stateBadge[assignmentState(r)] }),
  badges: (r) => [{ label: `${seatedOn(r.id)}/${capacityOf(r)} seats`, tone: occupancyPct(r) >= 100 ? 'danger' : 'success' }, { label: r.status, tone: routeTone[r.status] }],
  facts: [
    { label: 'Vehicle', value: (r) => { const v = vehicleOf(r.vehicleId); return v ? `${v.model} · ${v.seats} seats · ${v.status}` : '—'; } },
    { label: 'Driver', value: (r) => { const d = driverOf(r.driverId); return d ? `${d.licenseType} · licence ${licenseState(d).toLowerCase()}` : '—'; } },
    { label: 'Morning', value: (r) => time(r.morningStart) },
    { label: 'Afternoon', value: (r) => time(r.eveningStart) },
    { label: 'Seats free', value: (r) => seatsFree(r) },
  ],
  detail: [
    { title: 'Assignment', items: [{ label: 'Route', value: (r) => routeLabel(r) }, { label: 'Status', value: (r) => assignmentState(r) }, { label: 'Route status', value: (r) => r.status }, { label: 'Run times', value: (r) => `${time(r.morningStart)} / ${time(r.eveningStart)} · ${r.durationMin} min` }] },
    { title: 'Vehicle', items: [{ label: 'Number', value: (r) => vehicleOf(r.vehicleId)?.number ?? 'None' }, { label: 'Model', value: (r) => vehicleOf(r.vehicleId)?.model }, { label: 'Seats / students', value: (r) => `${capacityOf(r)} / ${seatedOn(r.id)}` }, { label: 'Fitness', value: (r) => { const v = vehicleOf(r.vehicleId); return v ? `${formatDate(v.fitnessExpiry)} (${fitnessState(v)})` : undefined; } }, { label: 'Insurance', value: (r) => { const v = vehicleOf(r.vehicleId); return v ? `${formatDate(v.insuranceExpiry)} (${insuranceState(v)})` : undefined; } }, { label: 'GPS', value: (r) => { const v = vehicleOf(r.vehicleId); return v ? `${v.gpsDevice} · ${v.gpsOnline ? 'online' : 'offline'}` : undefined; } }] },
    { title: 'Driver', items: [{ label: 'Name', value: (r) => driverOf(r.driverId)?.name ?? 'None' }, { label: 'Phone', value: (r) => driverOf(r.driverId)?.phone }, { label: 'Licence', value: (r) => { const d = driverOf(r.driverId); return d ? `${d.licenseType} · ${formatDate(d.expires)} (${licenseState(d)})` : undefined; } }] },
  ],
  stats: [
    { label: 'Routes', value: (rows) => rows.length, icon: 'navigation' },
    { label: 'Fully assigned', value: (rows) => countBy(rows, (r) => assignmentState(r) === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Driver pending', value: (rows) => countBy(rows, (r) => assignmentState(r) === 'Driver Pending'), tone: 'warning', icon: 'user-x' },
    { label: 'Vehicle pending', value: (rows) => countBy(rows, (r) => assignmentState(r) === 'Vehicle Pending'), tone: 'warning', icon: 'truck' },
    { label: 'Vehicle unavailable', value: (rows) => countBy(rows, (r) => assignmentState(r) === 'Vehicle Unavailable'), tone: 'danger', icon: 'alert-triangle' },
  ],
  views: [{ key: 'all', label: 'All Assignments', match: () => true }, ...ASSIGN_STATES.map((s) => ({ key: s, label: s, match: (r: TransportRouteRecord) => assignmentState(r) === s }))],
  filters: [
    { key: 'state', label: 'Status', options: opts(ASSIGN_STATES), match: (r, v) => assignmentState(r) === v },
    { key: 'vehicle', label: 'Vehicle', options: () => allVehicles().map((v) => ({ label: v.number, value: v.id })), match: (r, v) => r.vehicleId === v },
    { key: 'driver', label: 'Driver', options: () => snapshot<DriverRecord>('drivers').map((d) => ({ label: d.name, value: d.id })), match: (r, v) => r.driverId === v },
    { key: 'occupancy', label: 'Occupancy', single: true, options: opts(['Full — no seats free', 'Nearly full — under 5 free', 'Under 50% occupied', 'Empty']), match: (r, v) => { const free = seatsFree(r); const seats = capacityOf(r); const n = seatedOn(r.id); return v === 'Empty' ? n === 0 : v === 'Full — no seats free' ? seats > 0 && free === 0 : v === 'Nearly full — under 5 free' ? free > 0 && free < 5 : seats > 0 && n / seats < 0.5 && n > 0; } },
  ],
  sorts: [
    { key: 'code', label: 'Route code', compare: (a, b) => a.code.localeCompare(b.code) },
    { key: 'occupancy', label: 'Most full', compare: (a, b) => occupancyPct(b) - occupancyPct(a) },
    { key: 'pending', label: 'Needs attention first', compare: (a, b) => Number(assignmentState(a) === 'Active') - Number(assignmentState(b) === 'Active') },
  ],
  form: [],
  actions: [
    {
      key: 'assign',
      label: 'Assign vehicle & driver',
      icon: 'link',
      visible: (r) => r.status !== 'Archived',
      form: {
        title: 'Assign vehicle & driver',
        submitLabel: 'Assign',
        fields: [
          { key: 'vehicleId', label: 'Vehicle', type: 'select', options: () => allVehicles().map((v) => ({ label: v.number, value: v.id, hint: `${v.model} · ${v.seats} seats · ${v.status}${routeOfVehicle(v.id) ? ` · on ${routeOfVehicle(v.id)!.code}` : ''}` })) },
          { key: 'driverId', label: 'Driver', type: 'select', options: () => snapshot<DriverRecord>('drivers').map((d) => ({ label: d.name, value: d.id, hint: `${d.licenseType} · ${driverDuty(d)}${routeOfDriver(d.id) ? ` · on ${routeOfDriver(d.id)!.code}` : ''}` })) },
        ],
        initial: (r) => ({ vehicleId: r.vehicleId, driverId: r.driverId }),
        validate: (v, r) => {
          const errors = checkAssignment(r.id, v.vehicleId === r.vehicleId ? '' : String(v.vehicleId ?? ''), v.driverId === r.driverId ? '' : String(v.driverId ?? ''));
          const split = splitAssignErrors(errors);
          return { ...(split.vehicle ? { vehicleId: split.vehicle } : {}), ...(split.driver ? { driverId: split.driver } : {}), ...(!v.vehicleId && !v.driverId ? { vehicleId: 'Choose a vehicle or a driver' } : {}) };
        },
      },
      run: (r, v, ctx) => { ctx.update({ vehicleId: v.vehicleId || '', driverId: v.driverId || '', status: r.status === 'Scheduled' && v.vehicleId && v.driverId ? 'Active' : r.status, updated: todayISO() }); ctx.toast(`${r.code}: ${vehicleOf(v.vehicleId)?.number ?? 'no vehicle'} with ${driverOf(v.driverId)?.name ?? 'no driver'}`); },
    },
    { key: 'unassignDriver', label: 'Unassign driver', icon: 'user-minus', visible: (r) => !!r.driverId, confirm: 'Remove the driver from this route?', run: (r, _v, ctx) => { ctx.update({ driverId: '', updated: todayISO() }); ctx.toast(`${r.code} has no driver now`, 'info'); } },
    { key: 'unassignVehicle', label: 'Unassign vehicle', icon: 'minus-circle', visible: (r) => !!r.vehicleId, confirm: 'Remove the vehicle from this route? Riders keep their stop but the route needs a vehicle again.', run: (r, _v, ctx) => { if (seatedOn(r.id) > 0 && r.status === 'Active') { ctx.update({ vehicleId: '', status: 'Scheduled', updated: todayISO() }); } else ctx.update({ vehicleId: '', updated: todayISO() }); ctx.toast(`${r.code} has no vehicle now`, 'info'); } },
    {
      key: 'swap',
      label: 'Swap with another route',
      icon: 'repeat',
      visible: (r) => r.status !== 'Archived' && (!!r.vehicleId || !!r.driverId),
      form: { title: 'Swap vehicles and drivers', submitLabel: 'Swap', fields: [{ key: 'other', label: 'Other Route', type: 'select', required: true, options: () => allRoutes().filter((x) => x.status !== 'Archived').map((x) => ({ label: routeLabel(x), value: x.id, hint: `${vehicleOf(x.vehicleId)?.number ?? 'no vehicle'} · ${driverOf(x.driverId)?.name ?? 'no driver'}` })) }], validate: (v, r) => { const o = routeOf(String(v.other)); if (!o) return {}; if (o.id === r.id) return { other: 'Choose a different route' }; const errors = [...checkAssignment(r.id, o.vehicleId, o.driverId, [o.id]), ...checkAssignment(o.id, r.vehicleId, r.driverId, [r.id])]; return errors.length ? { other: errors[0] } : {}; } },
      run: (r, v, ctx) => { const o = routeOf(v.other)!; repo<TransportRouteRecord>('transportRoutes').update(o.id, { vehicleId: r.vehicleId, driverId: r.driverId, updated: todayISO() }); ctx.update({ vehicleId: o.vehicleId, driverId: o.driverId, updated: todayISO() }); ctx.toast(`${r.code} and ${o.code} swapped`); },
    },
    { key: 'students', label: 'Students on this route', icon: 'users', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/assign-students?q=${r.code}`) },
    { key: 'track', label: 'Track on map', icon: 'crosshair', manage: false, visible: (r) => !!r.vehicleId, run: (_r, _v, ctx) => ctx.go('/campus/gps-tracking') },
  ],
};

/* ===================================== Assign students ===================================== */

const assignTone: Record<string, Tone> = { Assigned: 'success', 'Awaiting Assignment': 'warning', 'Stop Change Requested': 'info', Suspended: 'danger' };
const ASSIGN_STATUSES = ['Assigned', 'Awaiting Assignment', 'Stop Change Requested', 'Suspended'];
const studentOf = (a: StudentTransportRecord) => getStudent(a.studentId);
const feeLabel = (a: StudentTransportRecord) => { const f = feeSummary(a.studentId); return f.status === 'Paid' ? 'Fees paid' : f.status === 'Overdue' ? 'Fees overdue' : 'Fees due'; };

const syncRider = (studentId: string, uses: boolean) => {
  const s = getStudent(studentId);
  if (s && s.transport !== uses) repo<StudentRecord>('students').update(studentId, { transport: uses });
};

export const assignStudentsCfg: ResourceConfig<StudentTransportRecord> = {
  entity: 'Assignment',
  collection: 'studentTransport',
  auditEntity: 'transport',
  searchPlaceholder: 'Search student, route or stop…',
  searchText: (r) => `${studentOf(r)?.name ?? ''} ${studentOf(r)?.admissionNo ?? ''} ${routeOf(r.routeId)?.code ?? ''} ${routeOf(r.routeId)?.name ?? ''} ${stopOf(r.pickupPointId)?.name ?? ''} ${classSection(studentOf(r))}`,
  code: (r) => studentOf(r)?.admissionNo,
  title: (r) => studentOf(r)?.name ?? '—',
  subtitle: (r) => `${classSection(studentOf(r))} · ${r.routeId ? routeLabel(routeOf(r.routeId)) : 'Not assigned'}`,
  status: (r) => ({ label: r.status, tone: assignTone[r.status] }),
  badges: (r) => [...(r.seatNo ? [{ label: `Seat ${r.seatNo}`, tone: 'primary' as Tone }] : []), { label: feeLabel(r), tone: feeLabel(r) === 'Fees paid' ? 'success' : feeLabel(r) === 'Fees overdue' ? 'danger' : 'warning' }, ...(r.concessionPct ? [{ label: `${r.concessionPct}% concession`, tone: 'purple' as Tone }] : [])],
  facts: [
    { label: 'Pickup point', value: (r) => (r.pickupPointId ? `${stopOf(r.pickupPointId)?.name} · ${time(stopOf(r.pickupPointId)?.boarding ?? '')}` : undefined) },
    { label: 'Drop point', value: (r) => r.dropPoint },
    { label: 'Vehicle', value: (r) => vehicleOf(routeOf(r.routeId)?.vehicleId ?? '')?.number ?? '—' },
    { label: 'Driver', value: (r) => driverOf(routeOf(r.routeId)?.driverId ?? '')?.name ?? '—' },
    { label: 'Monthly fee', value: (r) => (r.fee ? money(r.fee) : '—') },
  ],
  detail: [
    { title: 'Student', items: [{ label: 'Name', value: (r) => studentOf(r)?.name }, { label: 'Admission no', value: (r) => studentOf(r)?.admissionNo }, { label: 'Class', value: (r) => classSection(studentOf(r)) }, { label: 'Guardian', value: (r) => { const s = studentOf(r); return s ? `${s.parentName} · ${s.parentPhone}` : undefined; } }] },
    { title: 'Transport', items: [{ label: 'Status', value: (r) => r.status }, { label: 'Route', value: (r) => (r.routeId ? routeLabel(routeOf(r.routeId)) : 'Not assigned') }, { label: 'Pickup point', value: (r) => (r.pickupPointId ? `${stopOf(r.pickupPointId)?.name} (${time(stopOf(r.pickupPointId)?.boarding ?? '')} / ${time(stopOf(r.pickupPointId)?.drop ?? '')})` : '—') }, { label: 'Requested stop', value: (r) => (r.requestedPickupPointId ? stopOf(r.requestedPickupPointId)?.name : '—') }, { label: 'Drop point', value: (r) => r.dropPoint }, { label: 'Seat', value: (r) => r.seatNo || '—' }, { label: 'Effective from', value: (r) => formatDate(r.effectiveFrom) }, { label: 'Notes', value: (r) => r.notes || '—' }] },
    { title: 'Fee', items: [{ label: 'Monthly fee', value: (r) => (r.fee ? `${money(r.fee)}${r.concessionPct ? ` (after ${r.concessionPct}% concession)` : ''}` : '—') }, { label: 'School fees', value: (r) => feeLabel(r) }] },
  ],
  stats: [
    { label: 'Students', value: (rows) => rows.length, icon: 'users' },
    { label: 'Assigned', value: (rows) => countBy(rows, (r) => r.status === 'Assigned'), tone: 'success', icon: 'check-circle' },
    { label: 'Awaiting', value: (rows) => countBy(rows, (r) => r.status === 'Awaiting Assignment'), tone: 'warning', icon: 'clock' },
    { label: 'Stop change requests', value: (rows) => countBy(rows, (r) => r.status === 'Stop Change Requested'), tone: 'info', icon: 'repeat' },
    { label: 'Monthly fees', value: (rows) => money(sum(rows.filter((r) => r.status === 'Assigned'), (r) => r.fee)), tone: 'purple', icon: 'dollar-sign' },
  ],
  views: [{ key: 'all', label: 'All Students', match: () => true }, ...ASSIGN_STATUSES.map((s) => ({ key: s, label: s, match: (r: StudentTransportRecord) => r.status === s }))],
  filters: [
    { key: 'route', label: 'Route', options: () => allRoutes().map((r) => ({ label: routeLabel(r), value: r.id })), match: (r, v) => r.routeId === v },
    { key: 'status', label: 'Status', options: opts(ASSIGN_STATUSES), match: (r, v) => r.status === v },
    { key: 'class', label: 'Class', options: () => [...new Set(snapshot<StudentRecord>('students').map((s) => s.classId))].sort().map((c) => ({ label: `Grade ${Number(c.slice(4))}`, value: c })), match: (r, v) => studentOf(r)?.classId === v },
    { key: 'stop', label: 'Pickup point', options: () => allStops().map((p) => ({ label: p.name, value: p.id, hint: routeOf(p.routeId)?.code })), match: (r, v) => r.pickupPointId === v },
    { key: 'fees', label: 'School fees', options: opts(['Fees paid', 'Fees due', 'Fees overdue']), match: (r, v) => feeLabel(r) === v },
    { key: 'concession', label: 'Concession', single: true, options: opts(['With concession', 'No concession']), match: (r, v) => (v === 'With concession') === r.concessionPct > 0 },
  ],
  sorts: [
    { key: 'name', label: 'Student (A–Z)', compare: (a, b) => (studentOf(a)?.name ?? '').localeCompare(studentOf(b)?.name ?? '') },
    { key: 'route', label: 'Route', compare: (a, b) => (routeOf(a.routeId)?.code ?? 'ZZ').localeCompare(routeOf(b.routeId)?.code ?? 'ZZ') || a.seatNo - b.seatNo },
    { key: 'recent', label: 'Recently assigned', compare: (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) },
  ],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, readOnly: (_v, isEdit) => isEdit, optionsFrom: { ...studentOptions, filter: (s: StudentRecord) => s.status === 'Active' || s.status === 'On Leave' } },
    { key: 'routeId', label: 'Route', type: 'select', required: true, optionsFrom: { collection: 'transportRoutes', label: (r: TransportRouteRecord) => `${routeLabel(r)}`, hint: (r: TransportRouteRecord) => `${seatsFree(r)} seats free`, filter: (r: TransportRouteRecord) => r.status !== 'Archived' && r.status !== 'Suspended' }, onChange: () => ({ pickupPointId: '' }) },
    { key: 'pickupPointId', label: 'Pickup Point', type: 'select', required: true, optionsFrom: { collection: 'pickupPoints', label: (p: PickupPointRecord) => p.name, hint: (p: PickupPointRecord) => `${time(p.boarding)} · ${p.status}`, filter: (p: PickupPointRecord, v) => p.routeId === v.routeId && p.status === 'Active' } },
    { key: 'dropPoint', label: 'Drop Point', type: 'select', required: true, options: ['School Main Gate', 'School Side Gate'], default: 'School Main Gate' },
    { key: 'concessionPct', label: 'Concession (%)', type: 'number', min: 0, max: 100, default: 0 },
    { key: 'effectiveFrom', label: 'Effective From', type: 'date', required: true },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ effectiveFrom: todayISO() }),
  validate: (v, { existing }) => {
    const errors = checkStudentSeat({ studentId: String(v.studentId), routeId: String(v.routeId), pickupPointId: String(v.pickupPointId), assignmentId: existing?.id });
    const pick = (re: RegExp) => errors.find((e) => re.test(e));
    return {
      ...(pick(/is (inactive|transfer|graduated|suspended)|already has/) ? { studentId: pick(/is (inactive|transfer|graduated|suspended)|already has/) } : {}),
      ...(pick(/full|no vehicle|takes no students|not found/) ? { routeId: pick(/full|no vehicle|takes no students|not found/) } : {}),
      ...(pick(/stop|pickup point/i) && !pick(/full|no vehicle/) ? { pickupPointId: pick(/not a stop|Choose a pickup|temporar|closed|maintenance|inactive|archived/i) } : {}),
      ...(String(v.effectiveFrom) > addDays(todayISO(), 90) ? { effectiveFrom: 'Choose a date within the next 90 days' } : {}),
    };
  },
  prepare: (v, { existing, rows }) => {
    const route = routeOf(String(v.routeId));
    const concession = Number(v.concessionPct || 0);
    const used = new Set(rows.filter((r) => r.routeId === v.routeId && r.id !== existing?.id).map((r) => r.seatNo));
    let seat = existing && existing.routeId === v.routeId ? existing.seatNo : 1;
    while (used.has(seat)) seat += 1;
    return { fee: route ? Math.round(route.fee * (1 - concession / 100)) : 0, seatNo: seat, status: existing?.status === 'Suspended' && existing.routeId === v.routeId ? ('Suspended' as const) : ('Assigned' as const), requestedPickupPointId: '' };
  },
  afterSave: (kind, record) => {
    if (kind === 'create' || kind === 'update') syncRider(record.studentId, true);
    if (kind === 'delete') syncRider(record.studentId, false);
  },
  actions: [
    { key: 'approve', label: 'Approve stop change', icon: 'check', tone: 'success', visible: (r) => r.status === 'Stop Change Requested' && !!r.requestedPickupPointId && stopOf(r.requestedPickupPointId)?.status === 'Active', run: (r, _v, ctx) => { ctx.update({ pickupPointId: r.requestedPickupPointId, requestedPickupPointId: '', status: 'Assigned', notes: '' }); ctx.toast('Stop changed'); } },
    { key: 'decline', label: 'Decline stop change', icon: 'x', visible: (r) => r.status === 'Stop Change Requested' && !!r.requestedPickupPointId, run: (r, _v, ctx) => { ctx.update({ requestedPickupPointId: '', status: stopOf(r.pickupPointId)?.status === 'Active' ? 'Assigned' : r.status, notes: 'Stop change declined.' }); ctx.toast('Request declined', 'info'); } },
    {
      key: 'stop',
      label: 'Change pickup point',
      icon: 'map-pin',
      visible: (r) => !!r.routeId && r.status !== 'Suspended',
      form: { title: 'Change pickup point', fields: [{ key: 'pickupPointId', label: 'Pickup Point', type: 'select', required: true, options: () => allStops().filter((p) => p.status === 'Active').map((p) => ({ label: p.name, value: p.id, hint: `${routeOf(p.routeId)?.code} · ${time(p.boarding)}` })) }], initial: (r) => ({ pickupPointId: r.pickupPointId }), validate: (v, r) => (stopOf(String(v.pickupPointId))?.routeId !== r.routeId ? { pickupPointId: 'Choose a stop on the same route (use Change route to switch routes)' } : {}) },
      run: (r, v, ctx) => { ctx.update({ pickupPointId: v.pickupPointId, status: 'Assigned', requestedPickupPointId: '', notes: '' }); ctx.toast(`${studentOf(r)?.name} now boards at ${stopOf(v.pickupPointId)?.name}`); },
    },
    {
      key: 'route',
      label: 'Change route',
      icon: 'repeat',
      form: {
        title: 'Change route',
        submitLabel: 'Move',
        fields: [{ key: 'routeId', label: 'Route', type: 'select', required: true, optionsFrom: { collection: 'transportRoutes', label: (r: TransportRouteRecord) => routeLabel(r), hint: (r: TransportRouteRecord) => `${seatsFree(r)} seats free`, filter: (r: TransportRouteRecord) => r.status !== 'Archived' && r.status !== 'Suspended' }, onChange: () => ({ pickupPointId: '' }) }, { key: 'pickupPointId', label: 'Pickup Point', type: 'select', required: true, optionsFrom: { collection: 'pickupPoints', label: (p: PickupPointRecord) => p.name, hint: (p: PickupPointRecord) => time(p.boarding), filter: (p: PickupPointRecord, v) => p.routeId === v.routeId && p.status === 'Active' } }],
        initial: (r) => ({ routeId: r.routeId, pickupPointId: r.pickupPointId }),
        validate: (v, r) => { const e = checkStudentSeat({ studentId: r.studentId, routeId: String(v.routeId), pickupPointId: String(v.pickupPointId), assignmentId: r.id }); return e.length ? { routeId: e[0] } : {}; },
      },
      run: (r, v, ctx) => { const route = routeOf(v.routeId)!; const seat = Math.max(0, ...ridersOf(route.id).map((a) => a.seatNo)) + 1; ctx.update({ routeId: v.routeId, pickupPointId: v.pickupPointId, seatNo: seat, fee: Math.round(route.fee * (1 - r.concessionPct / 100)), status: 'Assigned', requestedPickupPointId: '', notes: '' }); ctx.toast(`Moved to ${routeLabel(route)}`); },
    },
    { key: 'suspend', label: 'Suspend transport', icon: 'pause-circle', visible: (r) => r.status === 'Assigned', form: { title: 'Suspend transport', submitLabel: 'Suspend', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] }, run: (r, v, ctx) => { ctx.update({ status: 'Suspended', notes: v.reason }); ctx.toast('Transport suspended', 'info'); } },
    { key: 'resume', label: 'Resume transport', icon: 'play-circle', visible: (r) => r.status === 'Suspended' && !!r.routeId && routeOf(r.routeId)?.status !== 'Suspended' && routeOf(r.routeId)?.status !== 'Archived', run: (r, _v, ctx) => { ctx.update({ status: 'Assigned', notes: '' }); ctx.toast('Transport resumed'); } },
    { key: 'message', label: 'Message guardian', icon: 'message-circle', form: { title: 'Message guardian', submitLabel: 'Send', fields: [{ key: 'subject', label: 'Subject', type: 'text', required: true }, { key: 'message', label: 'Message', type: 'textarea', required: true }] }, run: (r, v, ctx) => { repo<{ id: string }>('communications').create({ studentId: r.studentId, channel: 'SMS', subject: v.subject, summary: v.message, date: todayISO(), by: BY, direction: 'Outgoing' } as never); ctx.toast(`Message to ${studentOf(r)?.parentName} logged (mock: nothing is sent)`, 'info'); } },
    { key: 'unassign', label: 'Remove from transport', icon: 'user-minus', tone: 'danger', confirm: 'Remove this student from school transport? Their seat is freed.', run: (r, _v, ctx) => { ctx.remove(); ctx.toast(`${studentOf(r)?.name} removed from transport`, 'info'); } },
    { key: 'slip', label: 'Share transport slip', icon: 'share-2', manage: false, visible: (r) => !!r.routeId, run: (r, _v, ctx) => ctx.share(`${studentOf(r)?.name} — transport`, `TRANSPORT SLIP\n${studentOf(r)?.name} (${studentOf(r)?.admissionNo}) · ${classSection(studentOf(r))}\nRoute: ${routeLabel(routeOf(r.routeId))}\nVehicle: ${vehicleOf(routeOf(r.routeId)?.vehicleId ?? '')?.number ?? '—'} · Driver: ${driverOf(routeOf(r.routeId)?.driverId ?? '')?.name ?? '—'}\nPick-up: ${stopOf(r.pickupPointId)?.name} at ${time(stopOf(r.pickupPointId)?.boarding ?? '')}\nDrop: ${r.dropPoint}\nSeat ${r.seatNo} · ${money(r.fee)} a month`) },
  ],
  bulk: [
    { key: 'suspend', label: 'Suspend', icon: 'pause-circle', run: (rows, _v, ctx) => { const n = rows.filter((r) => r.status === 'Assigned').length; ctx.updateMany((r) => (r.status === 'Assigned' ? { status: 'Suspended' as const, notes: 'Suspended in bulk.' } : {})); ctx.toast(`${n} suspended`, 'info'); } },
    { key: 'resume', label: 'Resume', icon: 'play-circle', run: (rows, _v, ctx) => { const ok = rows.filter((r) => r.status === 'Suspended' && r.routeId && routeOf(r.routeId)?.status !== 'Suspended' && routeOf(r.routeId)?.status !== 'Archived').length; ctx.updateMany((r) => (r.status === 'Suspended' && r.routeId && routeOf(r.routeId)?.status !== 'Suspended' && routeOf(r.routeId)?.status !== 'Archived' ? { status: 'Assigned' as const, notes: '' } : {})); ctx.toast(`${ok} resumed`); } },
  ],
  pageActions: [
    {
      key: 'import',
      label: 'Assign by CSV',
      icon: 'upload',
      form: { title: 'Assign students by CSV', submitLabel: 'Assign', fields: [{ key: 'csv', label: 'Paste CSV rows', type: 'textarea', required: true, placeholder: 'AD1256507,RT-01,Green Park Gate', hint: 'admission no, route code, pickup point name. Rows that break a rule (full route, wrong stop, student already assigned) are skipped.' }] },
      run: (v, ctx) => {
        let added = 0;
        let skipped = 0;
        for (const [adm, code, stopName] of parseCsvRows(String(v.csv))) {
          const student = snapshot<StudentRecord>('students').find((s) => s.admissionNo.toLowerCase() === (adm ?? '').toLowerCase());
          const route = allRoutes().find((r) => r.code.toLowerCase() === (code ?? '').toLowerCase());
          const stop = route ? stopsOfRoute(route.id).find((p) => p.name.toLowerCase() === (stopName ?? '').toLowerCase()) : undefined;
          const existing = student ? allAssignments().find((a) => a.studentId === student.id) : undefined;
          // An awaiting student already has a record: give it the route instead of creating a second one.
          const errors = student && route && stop ? checkStudentSeat({ studentId: student.id, routeId: route.id, pickupPointId: stop.id, assignmentId: existing?.status === 'Awaiting Assignment' ? existing.id : undefined }) : ['x'];
          if (errors.length) { skipped += 1; continue; }
          const base = { studentId: student!.id, routeId: route!.id, pickupPointId: stop!.id, dropPoint: 'School Main Gate' as const, seatNo: Math.max(0, ...ridersOf(route!.id).map((a) => a.seatNo)) + 1, fee: Math.round(route!.fee * (student!.scholar ? 0.75 : 1)), concessionPct: student!.scholar ? 25 : 0, effectiveFrom: todayISO(), status: 'Assigned' as const, requestedPickupPointId: '', notes: '' };
          if (existing) repo<StudentTransportRecord>('studentTransport').update(existing.id, base);
          else ctx.create(base);
          syncRider(student!.id, true);
          added += 1;
        }
        ctx.toast(`${added} assigned${skipped ? `, ${skipped} skipped` : ''}`, added ? 'success' : 'error');
      },
    },
  ],
};

/* ================================== Route scheduling ================================== */

const scheduleTone: Record<string, Tone> = { Active: 'success', Scheduled: 'primary', Draft: 'warning', Closing: 'danger', Suspended: 'danger' };
const SCHEDULE_STATUSES = ['Active', 'Scheduled', 'Draft', 'Closing', 'Suspended'];
const ROUTE_TYPES = ['Morning & Evening', 'Morning Only', 'Evening Only', 'Activity / Special'];
const sRoute = (s: RouteScheduleRecord) => routeOf(s.routeId);

export const schedulesCfg: ResourceConfig<RouteScheduleRecord> = {
  entity: 'Schedule',
  collection: 'routeSchedules',
  auditEntity: 'schedule',
  searchPlaceholder: 'Search route, vehicle or driver…',
  searchText: (r) => `${sRoute(r)?.code ?? ''} ${sRoute(r)?.name ?? ''} ${r.routeType} ${vehicleOf(sRoute(r)?.vehicleId ?? '')?.number ?? ''} ${driverOf(sRoute(r)?.driverId ?? '')?.name ?? ''}`,
  code: (r) => r.routeType,
  title: (r) => routeLabel(sRoute(r)),
  subtitle: (r) => `${vehicleOf(sRoute(r)?.vehicleId ?? '')?.number ?? 'No vehicle'} · ${driverOf(sRoute(r)?.driverId ?? '')?.name ?? 'No driver'}`,
  status: (r) => ({ label: r.status, tone: scheduleTone[r.status] }),
  badges: (r) => [...(scheduleConflicts(r).length ? [{ label: 'Clash', tone: 'danger' as Tone }] : []), ...(sRoute(r) && (!sRoute(r)!.vehicleId || !sRoute(r)!.driverId) ? [{ label: 'Needs vehicle / driver', tone: 'warning' as Tone }] : []), { label: r.days.length === 6 ? 'Mon–Sat' : r.days.join(', '), tone: 'neutral' }],
  facts: [
    { label: 'Morning', value: (r) => (r.morningTime ? `${time(r.morningTime)} from ${stopsOfRoute(r.routeId)[0]?.name ?? 'first stop'}` : 'No morning run') },
    { label: 'Afternoon', value: (r) => (r.eveningTime ? `${time(r.eveningTime)} from school` : 'No afternoon run') },
    { label: 'Stops', value: (r) => stopsOfRoute(r.routeId).length },
    { label: 'Students', value: (r) => `${seatedOn(r.routeId)} of ${sRoute(r) ? capacityOf(sRoute(r)!) : 0}` },
    { label: 'Effective from', value: (r) => formatDate(r.effectiveFrom) },
  ],
  detail: [
    { title: 'Schedule', items: [{ label: 'Route', value: (r) => routeLabel(sRoute(r)) }, { label: 'Type', value: (r) => r.routeType }, { label: 'Status', value: (r) => r.status }, { label: 'Days', value: (r) => r.days.join(', ') }, { label: 'Morning', value: (r) => time(r.morningTime) }, { label: 'Afternoon', value: (r) => time(r.eveningTime) }, { label: 'Run length', value: (r) => `${sRoute(r)?.durationMin ?? '—'} min` }, { label: 'Effective from', value: (r) => formatDate(r.effectiveFrom) }, { label: 'Notes', value: (r) => r.notes || '—' }] },
    { title: 'Resources', items: [{ label: 'Vehicle', value: (r) => vehicleOf(sRoute(r)?.vehicleId ?? '')?.number ?? 'None' }, { label: 'Driver', value: (r) => driverOf(sRoute(r)?.driverId ?? '')?.name ?? 'None' }, { label: 'Clashes', value: (r) => scheduleConflicts(r).join('\n') || 'None' }] },
    { title: 'Stops', items: [{ label: 'Morning order', value: (r) => stopsOfRoute(r.routeId).map((s) => `${s.order}. ${s.name} ${time(s.boarding)}`).join('\n') || '—' }] },
  ],
  stats: [
    { label: 'Schedules', value: (rows) => rows.length, icon: 'clock' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Drafts', value: (rows) => countBy(rows, (r) => r.status === 'Draft'), tone: 'warning', icon: 'edit' },
    { label: 'Clashes', value: (rows) => countBy(rows, (r) => scheduleConflicts(r).length > 0), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Missing vehicle / driver', value: (rows) => countBy(rows, (r) => !!sRoute(r) && (!sRoute(r)!.vehicleId || !sRoute(r)!.driverId)), tone: 'info', icon: 'user-x' },
  ],
  views: [{ key: 'all', label: 'All Schedules', match: () => true }, ...SCHEDULE_STATUSES.map((s) => ({ key: s, label: s, match: (r: RouteScheduleRecord) => r.status === s }))],
  filters: [
    { key: 'status', label: 'Status', options: opts(SCHEDULE_STATUSES), match: (r, v) => r.status === v },
    { key: 'type', label: 'Route type', options: opts(ROUTE_TYPES), match: (r, v) => r.routeType === v },
    { key: 'corridor', label: 'Corridor', options: () => [...new Set(allRoutes().map((r) => r.corridor))].map((c) => ({ label: c, value: c })), match: (r, v) => sRoute(r)?.corridor === v },
    { key: 'vehicle', label: 'Vehicle', options: () => allVehicles().map((v) => ({ label: v.number, value: v.id })), match: (r, v) => sRoute(r)?.vehicleId === v },
    { key: 'driver', label: 'Driver', options: () => snapshot<DriverRecord>('drivers').map((d) => ({ label: d.name, value: d.id })), match: (r, v) => sRoute(r)?.driverId === v },
    { key: 'missing', label: 'Resources', single: true, options: opts(['Missing vehicle', 'Missing driver', 'Has clash']), match: (r, v) => (v === 'Missing vehicle' ? !sRoute(r)?.vehicleId : v === 'Missing driver' ? !sRoute(r)?.driverId : scheduleConflicts(r).length > 0) },
  ],
  sorts: [
    { key: 'morning', label: 'Morning time', compare: (a, b) => (a.morningTime || '99').localeCompare(b.morningTime || '99') },
    { key: 'route', label: 'Route code', compare: (a, b) => (sRoute(a)?.code ?? '').localeCompare(sRoute(b)?.code ?? '') },
    { key: 'updated', label: 'Recently updated', compare: (a, b) => b.updated.localeCompare(a.updated) },
  ],
  form: [
    { key: 'routeId', label: 'Route', type: 'select', required: true, optionsFrom: { collection: 'transportRoutes', label: (r: TransportRouteRecord) => routeLabel(r), filter: (r: TransportRouteRecord) => r.status !== 'Archived' } },
    { key: 'routeType', label: 'Route Type', type: 'select', required: true, options: ROUTE_TYPES, default: 'Morning & Evening' },
    { key: 'morningTime', label: 'Morning Departure', type: 'time', hidden: (v) => v.routeType === 'Evening Only' },
    { key: 'eveningTime', label: 'Afternoon Departure', type: 'time', hidden: (v) => v.routeType === 'Morning Only' },
    { key: 'days', label: 'Days', type: 'multiselect', required: true, options: [...WEEKDAYS], default: [...WEEKDAYS] },
    { key: 'effectiveFrom', label: 'Effective From', type: 'date', required: true },
    { key: 'status', label: 'Status', type: 'select', required: true, options: SCHEDULE_STATUSES, default: 'Draft' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ effectiveFrom: todayISO(), days: [...WEEKDAYS] }),
  validate: (v, { existing }) => {
    const morning = v.routeType === 'Evening Only' ? '' : String(v.morningTime ?? '');
    const evening = v.routeType === 'Morning Only' ? '' : String(v.eveningTime ?? '');
    const live = v.status === 'Active' || v.status === 'Scheduled';
    const route = routeOf(String(v.routeId));
    const clashes = live ? scheduleConflicts({ id: existing?.id ?? '__new__', routeId: String(v.routeId), morningTime: morning, eveningTime: evening, days: v.days ?? [], status: v.status }) : [];
    return {
      ...((v.routeType === 'Morning & Evening' || v.routeType === 'Morning Only') && !morning ? { morningTime: 'Set the morning departure' } : {}),
      ...((v.routeType === 'Morning & Evening' || v.routeType === 'Evening Only') && !evening ? { eveningTime: 'Set the afternoon departure' } : {}),
      ...(v.routeType === 'Activity / Special' && !morning && !evening ? { morningTime: 'Set at least one departure time' } : {}),
      ...(morning && toMin(morning) >= 12 * 60 && v.routeType !== 'Activity / Special' ? { morningTime: 'The morning run leaves before noon' } : {}),
      ...(evening && toMin(evening) < 12 * 60 && v.routeType !== 'Activity / Special' ? { eveningTime: 'The afternoon run leaves after noon' } : {}),
      ...(v.status === 'Active' && route && (!route.vehicleId || !route.driverId) ? { status: `${route.code} needs a vehicle and a driver before its schedule can be Active` } : {}),
      ...(clashes.length ? { status: clashes[0] } : {}),
    };
  },
  prepare: (v) => ({ morningTime: v.routeType === 'Evening Only' ? '' : String(v.morningTime ?? ''), eveningTime: v.routeType === 'Morning Only' ? '' : String(v.eveningTime ?? ''), updated: todayISO() }),
  actions: [
    { key: 'activate', label: 'Activate', icon: 'play-circle', tone: 'success', visible: (r) => r.status === 'Draft' || r.status === 'Scheduled' || r.status === 'Suspended', run: (r, _v, ctx) => { const route = sRoute(r); if (!route || !route.vehicleId || !route.driverId) { ctx.toast(`${route?.code ?? 'The route'} needs a vehicle and a driver first`, 'error'); return; } const clashes = scheduleConflicts({ ...r, status: 'Active' }); if (clashes.length) { ctx.toast(clashes[0], 'error'); return; } ctx.update({ status: r.effectiveFrom > todayISO() ? 'Scheduled' : 'Active', updated: todayISO() }); ctx.toast(r.effectiveFrom > todayISO() ? `Scheduled from ${formatDate(r.effectiveFrom)}` : 'Schedule is active'); } },
    { key: 'suspend', label: 'Suspend', icon: 'pause-circle', tone: 'danger', visible: (r) => r.status === 'Active' || r.status === 'Scheduled', confirm: 'Suspend this schedule? The route stops running on these times.', run: (r, _v, ctx) => { ctx.update({ status: 'Suspended', updated: todayISO() }); ctx.toast('Schedule suspended', 'info'); } },
    { key: 'close', label: 'Mark closing', icon: 'x-circle', visible: (r) => r.status === 'Active', run: (r, _v, ctx) => { ctx.update({ status: 'Closing', updated: todayISO() }); ctx.toast('Marked as closing', 'info'); } },
    { key: 'duplicate', label: 'Duplicate as draft', icon: 'copy', run: (r, _v, ctx) => { repo<RouteScheduleRecord>('routeSchedules').create({ ...r, id: undefined, status: 'Draft', effectiveFrom: addDays(todayISO(), 7), updated: todayISO(), notes: `Copy of ${routeLabel(sRoute(r))} schedule.` }); ctx.toast('Draft created'); } },
    { key: 'route', label: 'Open route', icon: 'navigation', manage: false, run: (r, _v, ctx) => ctx.go(`/campus/routes?q=${sRoute(r)?.code ?? ''}`) },
    { key: 'print', label: 'Share timetable', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(`${routeLabel(sRoute(r))} schedule`, `${routeLabel(sRoute(r))} · ${r.routeType}\nDays: ${r.days.join(', ')}\nMorning: ${time(r.morningTime)} · Afternoon: ${time(r.eveningTime)}\nVehicle: ${vehicleOf(sRoute(r)?.vehicleId ?? '')?.number ?? 'none'} · Driver: ${driverOf(sRoute(r)?.driverId ?? '')?.name ?? 'none'}\n\n${stopsOfRoute(r.routeId).map((s) => `${s.order}. ${s.name} ${time(s.boarding)}`).join('\n')}`) },
  ],
};

