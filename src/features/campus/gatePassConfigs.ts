import { repo, snapshot } from '@/core/store/store';
import { formatDate, formatTime, todayISO } from '@/core/utils/date';
import { ACCESS_ZONES, GATES, ID_PROOFS, PASS_TYPES, PERSON_TYPES, type GatePassRecord } from '@/data/seed/gatePass';
import type { StudentRecord } from '@/data/seed/master';
import { opts } from '@/features/academic/helpers';
import { countBy, nextNo, studentOptions } from '@/features/common/refs';
import type { ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';
import { approvalBlockers, minutesLeft, nowHHmm, overlappingExit, passState, stamp, studentOfPass, type PassState } from './gatePassLogic';

const stateTone: Record<PassState, Tone> = { Active: 'success', Returned: 'neutral', Expired: 'danger', Scheduled: 'primary', 'Pending Approval': 'warning', Revoked: 'danger' };
const STATES: PassState[] = ['Active', 'Scheduled', 'Pending Approval', 'Expired', 'Returned', 'Revoked'];
const idTone: Record<string, Tone> = { Verified: 'success', Pending: 'warning', Failed: 'danger' };
const BY = 'Gate Security';
const validity = (p: GatePassRecord) => `${p.date === todayISO() ? 'Today' : formatDate(p.date)} · ${formatTime(p.validFrom)} – ${formatTime(p.validUntil)}`;

export const gatePassCfg: ResourceConfig<GatePassRecord> = {
  entity: 'Gate Pass',
  collection: 'gatePasses',
  auditEntity: 'gatePass',
  searchPlaceholder: 'Search holder, pass no, host, vehicle…',
  searchText: (r) => `${r.holder} ${r.passNo} ${r.passType} ${r.host} ${r.vehicleReg} ${r.reference} ${r.purpose} ${r.contact}`,
  code: (r) => r.passNo,
  title: (r) => r.holder,
  subtitle: (r) => `${r.passType} · ${r.gate}`,
  status: (r) => ({ label: passState(r), tone: stateTone[passState(r)] }),
  badges: (r) => [{ label: `ID ${r.idState.toLowerCase()}`, tone: idTone[r.idState] }, { label: r.personType, tone: 'primary' }, ...(r.vehicleReg ? [{ label: r.vehicleReg, tone: 'info' as Tone }] : []), ...(passState(r) === 'Active' && minutesLeft(r) <= 30 ? [{ label: `Expires in ${minutesLeft(r)} min`, tone: 'warning' as Tone }] : [])],
  facts: [
    { label: 'Valid', value: (r) => validity(r) },
    { label: 'Visiting', value: (r) => `${r.host} · ${r.department}` },
    { label: 'Purpose', value: (r) => r.purpose },
    { label: 'Issued by', value: (r) => r.issuedBy },
    { label: 'Returned', value: (r) => (r.returnedAt ? formatTime(r.returnedAt) : undefined) },
  ],
  detail: [
    { title: 'Pass', items: [{ label: 'Pass no', value: (r) => r.passNo }, { label: 'Type', value: (r) => r.passType }, { label: 'Status', value: (r) => passState(r) }, { label: 'Gate', value: (r) => r.gate }, { label: 'Valid', value: (r) => validity(r) }, { label: 'Approval', value: (r) => `${r.approval}${r.revokedReason ? `: ${r.revokedReason}` : ''}` }, { label: 'Issued by', value: (r) => r.issuedBy }, { label: 'Returned at', value: (r) => (r.returnedAt ? formatTime(r.returnedAt) : '—') }] },
    { title: 'Holder', items: [{ label: 'Name', value: (r) => r.holder }, { label: 'Type', value: (r) => r.personType }, { label: 'Reference', value: (r) => r.reference || '—' }, { label: 'Contact', value: (r) => r.contact }, { label: 'ID', value: (r) => `${r.idProof} · ${r.idNumber} (${r.idState})` }, { label: 'Student', value: (r) => { const s = studentOfPass(r); return s ? `${s.name} · ${s.admissionNo}` : undefined; } }] },
    { title: 'Visit', items: [{ label: 'Host', value: (r) => r.host }, { label: 'Department', value: (r) => r.department }, { label: 'Purpose', value: (r) => r.purpose }, { label: 'Access zones', value: (r) => r.accessZones }, { label: 'Vehicle', value: (r) => (r.vehicleReg ? `${r.vehicleReg} · ${r.vehicleType}` : 'None') }, { label: 'Notes', value: (r) => r.notes || '—' }] },
    { title: 'Scans', items: [{ label: 'Log', value: (r) => r.scans.map((s) => `${s.direction} · ${s.gate} · ${formatTime(s.at.slice(11, 16))} · ${s.by}`).join('\n') || 'No scans yet' }] },
  ],
  stats: [
    { label: 'Passes', value: (rows) => rows.length, icon: 'shield' },
    { label: 'Active now', value: (rows) => countBy(rows, (r) => passState(r) === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Pending approval', value: (rows) => countBy(rows, (r) => passState(r) === 'Pending Approval'), tone: 'warning', icon: 'clock' },
    { label: 'Expiring in 30 min', value: (rows) => countBy(rows, (r) => passState(r) === 'Active' && minutesLeft(r) <= 30), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Expired, not returned', value: (rows) => countBy(rows, (r) => passState(r) === 'Expired'), tone: 'danger', icon: 'x-circle' },
    { label: 'Returned', value: (rows) => countBy(rows, (r) => passState(r) === 'Returned'), tone: 'neutral', icon: 'corner-down-left' },
  ],
  views: [{ key: 'all', label: 'All Passes', match: () => true }, ...STATES.map((s) => ({ key: s, label: s, match: (r: GatePassRecord) => passState(r) === s }))],
  filters: [
    { key: 'type', label: 'Pass type', options: opts(PASS_TYPES), match: (r, v) => r.passType === v },
    { key: 'person', label: 'Person type', options: opts(PERSON_TYPES), match: (r, v) => r.personType === v },
    { key: 'gate', label: 'Gate', options: opts(GATES), match: (r, v) => r.gate === v },
    { key: 'status', label: 'Status', options: opts(STATES), match: (r, v) => passState(r) === v },
    { key: 'id', label: 'ID check', options: opts(['Verified', 'Pending', 'Failed']), match: (r, v) => r.idState === v },
    { key: 'expiry', label: 'Expiry', single: true, options: opts(['Within 30 minutes', 'Within 1 hour', 'Already expired', 'Not yet valid']), match: (r, v) => (v === 'Already expired' ? passState(r) === 'Expired' : v === 'Not yet valid' ? passState(r) === 'Scheduled' : passState(r) === 'Active' && minutesLeft(r) <= (v === 'Within 30 minutes' ? 30 : 60)) },
    { key: 'day', label: 'Day', single: true, options: opts(['Today', 'Other days']), match: (r, v) => (v === 'Today') === (r.date === todayISO()) },
  ],
  sorts: [
    { key: 'recent', label: 'Latest first', compare: (a, b) => stamp(b.date, b.validFrom).getTime() - stamp(a.date, a.validFrom).getTime() },
    { key: 'expiry', label: 'Expiring soonest', compare: (a, b) => stamp(a.date, a.validUntil).getTime() - stamp(b.date, b.validUntil).getTime() },
    { key: 'holder', label: 'Holder (A–Z)', compare: (a, b) => a.holder.localeCompare(b.holder) },
  ],
  form: [
    { key: 'passType', label: 'Pass Type', type: 'select', required: true, options: PASS_TYPES, default: 'Visitor Pass' },
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: { ...studentOptions, filter: (s: StudentRecord) => s.status === 'Active' || s.status === 'On Leave' }, hidden: (v) => v.passType !== 'Student Exit Pass' },
    { key: 'holder', label: 'Holder Name', type: 'text', required: true, hidden: (v) => v.passType === 'Student Exit Pass' },
    { key: 'personType', label: 'Person Type', type: 'select', required: true, options: PERSON_TYPES, default: 'Visitor', hidden: (v) => v.passType === 'Student Exit Pass' },
    { key: 'contact', label: 'Contact Number', type: 'phone', required: true },
    { key: 'idProof', label: 'ID Proof', type: 'select', required: true, options: ID_PROOFS, default: 'Aadhaar' },
    { key: 'idNumber', label: 'ID Number', type: 'text', required: true },
    { key: 'gate', label: 'Gate', type: 'select', required: true, options: GATES, default: 'Main Gate' },
    { key: 'date', label: 'Valid On', type: 'date', required: true },
    { key: 'validFrom', label: 'Valid From', type: 'time', required: true },
    { key: 'validUntil', label: 'Valid Until', type: 'time', required: true },
    { key: 'host', label: 'Person Visited / Authorising Guardian', type: 'text', required: true },
    { key: 'department', label: 'Department', type: 'text' },
    { key: 'purpose', label: 'Purpose', type: 'text', required: true },
    { key: 'accessZones', label: 'Access Zones', type: 'select', options: ACCESS_ZONES },
    { key: 'vehicleReg', label: 'Vehicle Registration', type: 'text', hidden: (v) => v.passType !== 'Vehicle Pass' },
    { key: 'vehicleType', label: 'Vehicle Type', type: 'select', options: ['Car', 'Two-wheeler', 'Delivery van', 'Truck'], hidden: (v) => v.passType !== 'Vehicle Pass' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ],
  defaults: () => ({ date: todayISO(), validFrom: nowHHmm(), validUntil: `${String(Math.min(23, new Date().getHours() + 2)).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}` }),
  validate: (v, { existing }) => {
    const draft = { id: existing?.id ?? '__new__', studentId: v.passType === 'Student Exit Pass' ? String(v.studentId) : '', date: String(v.date), validFrom: String(v.validFrom), validUntil: String(v.validUntil) };
    const clash = overlappingExit(draft);
    return {
      ...(String(v.validUntil) <= String(v.validFrom) ? { validUntil: 'The pass must end after it starts' } : {}),
      ...(!existing && String(v.date) < todayISO() ? { date: 'A new pass cannot be for a past day' } : {}),
      ...(!existing && String(v.date) === todayISO() && String(v.validUntil) <= nowHHmm() ? { validUntil: 'This window has already passed' } : {}),
      ...(v.passType === 'Vehicle Pass' && !String(v.vehicleReg ?? '').trim() ? { vehicleReg: 'Enter the vehicle registration' } : {}),
      ...(clash ? { validFrom: `${clash.passNo} already lets this student out in an overlapping window` } : {}),
    };
  },
  prepare: (v, { existing, rows }) => {
    const exit = v.passType === 'Student Exit Pass';
    const s = exit ? snapshot<StudentRecord>('students').find((x) => x.id === v.studentId) : undefined;
    return {
      passNo: existing?.passNo ?? nextNo(`GP-${todayISO().slice(0, 4)}-`, rows.map((r) => r.passNo), 4),
      holder: exit ? s?.name ?? '' : String(v.holder).trim(),
      personType: exit ? ('Student' as const) : v.personType,
      reference: exit ? s?.admissionNo ?? '' : existing?.reference ?? '',
      studentId: exit ? String(v.studentId) : '',
      issuedBy: existing?.issuedBy ?? BY,
      idState: existing && existing.idNumber === v.idNumber && existing.idProof === v.idProof ? existing.idState : ('Pending' as const),
      returnedAt: existing?.returnedAt ?? '',
      approval: existing?.approval ?? ('Pending' as const),
      revokedReason: existing?.revokedReason ?? '',
      scans: existing?.scans ?? [],
      vehicleReg: v.passType === 'Vehicle Pass' ? String(v.vehicleReg).trim().toUpperCase() : '',
      vehicleType: v.passType === 'Vehicle Pass' ? String(v.vehicleType ?? '') : '',
    };
  },
  editable: (r) => !r.returnedAt && r.approval !== 'Revoked',
  canDeleteRecord: (r) => (r.approval === 'Pending' || r.approval === 'Revoked' ? null : 'An approved pass is part of the gate record. Revoke it instead.'),
  actions: [
    { key: 'verify', label: 'Mark ID verified', icon: 'check-circle', visible: (r) => r.idState !== 'Verified' && r.approval !== 'Revoked', run: (r, _v, ctx) => { ctx.update({ idState: 'Verified' }); ctx.toast(`${r.holder}'s ID verified`); } },
    { key: 'failId', label: 'ID check failed', icon: 'x-circle', tone: 'danger', visible: (r) => r.idState === 'Pending' && r.approval === 'Pending', run: (r, _v, ctx) => { ctx.update({ idState: 'Failed', approval: 'Revoked', revokedReason: 'ID could not be verified at the gate.' }); ctx.toast('ID failed; the pass is revoked', 'info'); } },
    { key: 'approve', label: 'Approve', icon: 'check', tone: 'success', visible: (r) => r.approval === 'Pending', run: (r, _v, ctx) => { const b = approvalBlockers(r); if (b.length) { ctx.toast(b[0], 'error'); return; } ctx.update({ approval: 'Approved' }); ctx.toast(`${r.passNo} approved`); } },
    { key: 'revoke', label: 'Revoke', icon: 'slash', tone: 'danger', visible: (r) => r.approval !== 'Revoked' && !r.returnedAt, form: { title: 'Revoke pass', submitLabel: 'Revoke', fields: [{ key: 'reason', label: 'Reason', type: 'text', required: true }] }, run: (r, v, ctx) => { ctx.update({ approval: 'Revoked', revokedReason: v.reason }); ctx.toast(`${r.passNo} revoked`, 'info'); } },
    {
      key: 'scanIn',
      label: 'Scan in',
      icon: 'log-in',
      visible: (r) => passState(r) === 'Active' && !r.scans.some((s) => s.direction === 'In'),
      run: (r, _v, ctx) => { ctx.update({ scans: [...r.scans, { at: `${todayISO()}T${nowHHmm()}:00`, gate: r.gate, direction: 'In', by: BY }] }); ctx.toast(`${r.holder} scanned in at ${r.gate}`); },
    },
    {
      key: 'return',
      label: 'Check out & return pass',
      icon: 'log-out',
      visible: (r) => (passState(r) === 'Active' || passState(r) === 'Expired') && r.date === todayISO(),
      run: (r, _v, ctx) => { const at = nowHHmm(); ctx.update({ returnedAt: at, scans: [...r.scans, { at: `${todayISO()}T${at}:00`, gate: r.gate, direction: 'Out', by: BY }] }); ctx.toast(`${r.holder} checked out at ${formatTime(at)}`); },
    },
    {
      key: 'extend',
      label: 'Extend validity',
      icon: 'clock',
      visible: (r) => r.approval === 'Approved' && !r.returnedAt && (passState(r) === 'Active' || passState(r) === 'Scheduled' || passState(r) === 'Expired'),
      form: { title: 'Extend validity', fields: [{ key: 'until', label: 'New End Time', type: 'time', required: true }], initial: (r) => ({ until: r.validUntil }), validate: (v, r) => (String(v.until) <= r.validUntil ? { until: 'Choose a time later than the current end' } : overlappingExit({ ...r, validUntil: String(v.until) }) ? { until: 'This would overlap another pass for the same student' } : {}) },
      run: (r, v, ctx) => { ctx.update({ validUntil: v.until }); ctx.toast(`Valid until ${formatTime(v.until)}`); },
    },
    { key: 'renew', label: 'Issue a new pass like this', icon: 'copy', run: (r, _v, ctx) => { const rows = snapshot<GatePassRecord>('gatePasses'); const created = repo<GatePassRecord>('gatePasses').create({ ...r, id: undefined, passNo: nextNo(`GP-${todayISO().slice(0, 4)}-`, rows.map((x) => x.passNo), 4), date: todayISO(), validFrom: nowHHmm(), validUntil: `${String(Math.min(23, new Date().getHours() + 2)).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`, returnedAt: '', approval: 'Pending', revokedReason: '', idState: r.idState === 'Failed' ? 'Pending' : r.idState, scans: [], issuedBy: BY }); ctx.toast(`${created.passNo} created for approval`); } },
    { key: 'print', label: 'Share pass', icon: 'share-2', manage: false, run: (r, _v, ctx) => ctx.share(r.passNo, `KARKAII INTERNATIONAL SCHOOL — GATE PASS\n${r.passNo} · ${r.passType}\n${r.holder} (${r.personType})${r.reference ? ` · ${r.reference}` : ''}\nGate: ${r.gate} · Valid ${validity(r)}\nVisiting: ${r.host} (${r.department})\nPurpose: ${r.purpose}\nAccess: ${r.accessZones}${r.vehicleReg ? `\nVehicle: ${r.vehicleReg}` : ''}\nStatus: ${passState(r)}`) },
  ],
  bulk: [
    { key: 'approve', label: 'Approve', icon: 'check', run: (rows, _v, ctx) => { const ok = rows.filter((r) => r.approval === 'Pending' && approvalBlockers(r).length === 0); if (!ok.length) { ctx.toast('None of the selected passes can be approved (check ID verification)', 'error'); return; } const ids = new Set(ok.map((r) => r.id)); ctx.updateMany((r) => (ids.has(r.id) ? { approval: 'Approved' as const } : {})); ctx.toast(`${ok.length} approved${ok.length < rows.length ? `, ${rows.length - ok.length} not approvable` : ''}`); } },
    { key: 'revoke', label: 'Revoke', icon: 'slash', form: { title: 'Revoke selected passes', submitLabel: 'Revoke', fields: [{ key: 'reason', label: 'Reason', type: 'text', required: true }] }, run: (rows, v, ctx) => { const ok = rows.filter((r) => r.approval !== 'Revoked' && !r.returnedAt); ctx.updateMany((r) => (r.approval !== 'Revoked' && !r.returnedAt ? { approval: 'Revoked' as const, revokedReason: v.reason } : {})); ctx.toast(`${ok.length} revoked`, 'info'); } },
  ],
};
