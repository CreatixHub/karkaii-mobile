/** Campus Operations seed data, part 3: gate passes. */
import { defineCollection, type Entity } from '@/core/store/store';
import { addDays } from '@/core/utils/date';
import { buildStaff, buildStudents } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';

export type PassType = 'Visitor Pass' | 'Vehicle Pass' | 'Student Exit Pass' | 'Staff Pass' | 'Contractor Pass' | 'Temporary Pass';
export type PersonType = 'Visitor' | 'Guardian' | 'Student' | 'Staff' | 'Vendor' | 'Contractor';
export type IdState = 'Verified' | 'Pending' | 'Failed';
export type Approval = 'Pending' | 'Approved' | 'Revoked';

export const PASS_TYPES: PassType[] = ['Visitor Pass', 'Vehicle Pass', 'Student Exit Pass', 'Staff Pass', 'Contractor Pass', 'Temporary Pass'];
export const PERSON_TYPES: PersonType[] = ['Visitor', 'Guardian', 'Student', 'Staff', 'Vendor', 'Contractor'];
export const GATES = ['Main Gate', 'North Gate', 'Service Gate', 'Hostel Gate'];
export const ID_PROOFS = ['Aadhaar', 'Driving Licence', 'Passport', 'Voter ID', 'Employee ID', 'Student ID'];
export const ACCESS_ZONES = ['Main Block · Admission Office', 'Main Block · all floors', 'Science Block', 'Hostel · visitors’ lounge', 'Playground & sports complex', 'Service area only', 'Transport Yard'];

export interface ScanEntry {
  /** ISO date-time. */
  at: string;
  gate: string;
  direction: 'In' | 'Out';
  by: string;
}

export interface GatePassRecord extends Entity {
  passNo: string;
  passType: PassType;
  holder: string;
  personType: PersonType;
  /** Admission no for students, employee id for staff, '' for visitors. */
  reference: string;
  /** Student the pass lets out, for Student Exit Pass. */
  studentId: string;
  contact: string;
  idProof: string;
  idNumber: string;
  idState: IdState;
  gate: string;
  /** Day the pass is valid on. */
  date: string;
  /** 'HH:mm' */
  validFrom: string;
  validUntil: string;
  /** 'HH:mm' on `date` when the holder handed the pass back, '' if still out. */
  returnedAt: string;
  issuedBy: string;
  host: string;
  department: string;
  purpose: string;
  accessZones: string;
  vehicleReg: string;
  vehicleType: string;
  approval: Approval;
  revokedReason: string;
  scans: ScanEntry[];
  notes: string;
}

const hhmm = (m: number) => `${pad(Math.floor(m / 60), 2)}:${pad(m % 60, 2)}`;

const VISITORS = ['Arjun Patel', 'Meera Nair', 'Suresh Babu', 'Fatima Sheikh', 'Kiran Rao', 'Latha Subramani', 'George Mathew', 'Divya Krishnan'];
const VENDORS = ['Annapoorna Caterers', 'BlueStar Services', 'CanonPro Engineer', 'Green Leaf Gardens', 'SafeLift Elevators'];
const PURPOSES = ['Admission enquiry', 'Meeting with the principal', 'Parent–teacher meeting', 'Document collection', 'Delivery of supplies', 'AC servicing', 'Garden maintenance', 'Interview'];

export const buildGatePasses = (): GatePassRecord[] => {
  const rng = makeRng(91000);
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const staff = buildStaff();
  const students = buildStudents().filter((s) => s.status === 'Active');
  const out: GatePassRecord[] = [];
  let n = 0;
  // kind: A active, S scheduled, E expired, R returned, P pending approval, X revoked
  const plan: [string, PassType][] = [
    ['A', 'Visitor Pass'], ['A', 'Vehicle Pass'], ['A', 'Contractor Pass'], ['A', 'Student Exit Pass'], ['A', 'Staff Pass'], ['A', 'Temporary Pass'],
    ['S', 'Visitor Pass'], ['S', 'Vehicle Pass'], ['S', 'Contractor Pass'],
    ['E', 'Visitor Pass'], ['E', 'Temporary Pass'], ['E', 'Vehicle Pass'], ['E', 'Student Exit Pass'],
    ['R', 'Visitor Pass'], ['R', 'Student Exit Pass'], ['R', 'Contractor Pass'], ['R', 'Staff Pass'],
    ['P', 'Visitor Pass'], ['P', 'Student Exit Pass'], ['P', 'Vehicle Pass'],
    ['X', 'Visitor Pass'], ['X', 'Temporary Pass'],
  ];
  for (const [kind, passType] of plan) {
    n += 1;
    const s = students[(n * 7) % students.length];
    const st = staff[n % staff.length];
    const personType: PersonType = passType === 'Student Exit Pass' ? 'Student' : passType === 'Staff Pass' ? 'Staff' : passType === 'Contractor Pass' ? 'Contractor' : passType === 'Vehicle Pass' ? 'Vendor' : n % 3 === 0 ? 'Guardian' : 'Visitor';
    const holder = personType === 'Student' ? s.name : personType === 'Staff' ? st.name : personType === 'Contractor' || personType === 'Vendor' ? VENDORS[n % VENDORS.length] : personType === 'Guardian' ? s.parentName : VISITORS[n % VISITORS.length];
    let date = SEED_TODAY;
    let from = Math.max(0, nowMin - 90);
    let until = Math.min(1439, nowMin + 120);
    let returnedAt = '';
    if (kind === 'S') { date = n % 2 ? addDays(SEED_TODAY, 1) : SEED_TODAY; from = date === SEED_TODAY ? Math.min(1380, nowMin + 60) : 9 * 60; until = Math.min(1439, from + 180); }
    if (kind === 'E') { date = n % 2 ? addDays(SEED_TODAY, -1) : SEED_TODAY; from = date === SEED_TODAY ? Math.max(0, nowMin - 240) : 9 * 60; until = date === SEED_TODAY ? Math.max(1, nowMin - 30) : 12 * 60; }
    if (kind === 'R') { date = SEED_TODAY; from = Math.max(0, nowMin - 200); until = Math.min(1439, nowMin + 60); returnedAt = hhmm(Math.max(from + 20, nowMin - 40)); }
    if (kind === 'P') { date = addDays(SEED_TODAY, n % 2); from = 10 * 60; until = 13 * 60; }
    if (kind === 'X') { date = SEED_TODAY; from = Math.max(0, nowMin - 60); until = Math.min(1439, nowMin + 120); }
    const idState: IdState = kind === 'P' ? (n % 2 ? 'Pending' : 'Verified') : kind === 'X' ? 'Failed' : 'Verified';
    const gate = GATES[n % 3];
    const issuer = ['Mohan Das', 'Front Desk'][n % 2];
    const scans: ScanEntry[] = [];
    if (kind === 'A' || kind === 'R' || kind === 'E') scans.push({ at: `${date}T${hhmm(from + 5)}:00`, gate, direction: 'In', by: issuer });
    if (kind === 'R') scans.push({ at: `${date}T${returnedAt}:00`, gate, direction: 'Out', by: issuer });
    out.push({
      id: `gp-${pad(n)}`,
      passNo: `GP-${SEED_TODAY.slice(0, 4)}-${pad(n, 4)}`,
      passType,
      holder,
      personType,
      reference: personType === 'Student' ? s.admissionNo : personType === 'Staff' ? st.employeeId : '',
      studentId: passType === 'Student Exit Pass' ? s.id : '',
      contact: `+91 98400 7${pad(n * 13, 4)}`,
      idProof: personType === 'Student' ? 'Student ID' : personType === 'Staff' ? 'Employee ID' : ID_PROOFS[n % 4],
      idNumber: personType === 'Student' ? s.admissionNo : `ID${rng.int(100000, 999999)}`,
      idState,
      gate,
      date,
      validFrom: hhmm(from),
      validUntil: hhmm(until),
      returnedAt,
      issuedBy: issuer,
      host: personType === 'Student' ? s.parentName : ['Dr. Meera Krishnan', 'Rebecca Hall', 'Priya Venkatesh'][n % 3],
      department: personType === 'Student' ? 'Class teacher' : ['Administration', 'Front Office', 'Accounts'][n % 3],
      purpose: personType === 'Student' ? 'Medical appointment' : PURPOSES[n % PURPOSES.length],
      accessZones: ACCESS_ZONES[n % ACCESS_ZONES.length],
      vehicleReg: passType === 'Vehicle Pass' ? `TN-${pad(rng.int(1, 99), 2)}-${String.fromCharCode(65 + (n % 26))}${String.fromCharCode(66 + (n % 24))}-${rng.int(1000, 9999)}` : '',
      vehicleType: passType === 'Vehicle Pass' ? ['Delivery van', 'Car', 'Two-wheeler'][n % 3] : '',
      approval: kind === 'P' ? 'Pending' : kind === 'X' ? 'Revoked' : 'Approved',
      revokedReason: kind === 'X' ? 'ID could not be verified at the gate.' : '',
      scans,
      notes: '',
    });
  }
  return out;
};
export const gatePasses = defineCollection<GatePassRecord>('gatePasses', buildGatePasses);
