/** Finance & Accounts seed data (fees, invoices, payments, fines, scholarships, expenses). */
import { defineCollection, type Entity } from '@/core/store/store';
import { buildStudents } from './master';
import { makeRng, pad, SEED_TODAY } from './rng';
import { addDays } from '@/core/utils/date';

export const ACADEMIC_YEAR = '2026-27';
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Net Banking', 'Cheque'] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface FeeTypeRecord extends Entity {
  code: string;
  name: string;
  category: 'Academic' | 'Transport' | 'Facilities' | 'Activity' | 'Examination' | 'Hostel' | 'Other';
  frequency: 'Monthly' | 'Quarterly' | 'Term' | 'Annual' | 'One-time';
  amount: number;
  academicYear: string;
  taxable: boolean;
  refundable: boolean;
  lateFee: number;
  status: 'Active' | 'Inactive';
  createdBy: string;
  updatedOn: string;
}

export interface FeeGroupRecord extends Entity {
  code: string;
  name: string;
  category: string;
  academicYear: string;
  classIds: string[];
  feeTypeIds: string[];
  frequency: string;
  effectiveFrom: string;
  nextDue: string;
  amount: number;
  status: 'Active' | 'Inactive';
  createdBy: string;
  updatedOn: string;
}

export interface FeeStructureRecord extends Entity {
  code: string;
  name: string;
  category: string;
  amount: number;
  frequency: string;
  installments: number;
  classIds: string[];
  dueDate: string;
  lateFee: number;
  concessionPct: number;
  groupId: string;
  typeId: string;
  status: 'Active' | 'Draft' | 'Inactive';
}

export interface FeeInvoiceRecord extends Entity {
  invoiceNo: string;
  studentId: string;
  structureId: string;
  groupId: string;
  typeId: string;
  academicYear: string;
  assignedDate: string;
  dueDate: string;
  total: number;
  discount: number;
  fine: number;
  paid: number;
  method: string;
  collectionDate: string;
  status: 'Paid' | 'Partial' | 'Unpaid';
}

export interface FeePaymentRecord extends Entity {
  receiptNo: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  method: PaymentMethod;
  date: string;
  collectedBy: string;
  reference: string;
  status: 'Cleared' | 'Pending Clearance' | 'Cancelled' | 'Refunded';
  notes: string;
}

export interface FineRecord extends Entity {
  fineNo: string;
  studentId: string;
  category: 'Late Fee' | 'Library' | 'Damage' | 'Discipline' | 'Lost ID Card';
  amount: number;
  paidAmount: number;
  dueDate: string;
  issuedOn: string;
  reason: string;
  status: 'Outstanding' | 'Paid' | 'Waived';
  createdBy: string;
  waiverNote: string;
}

export interface ScholarshipRecord extends Entity {
  schNo: string;
  studentId: string;
  name: string;
  type: 'Merit' | 'Need-based' | 'Sports' | 'Talent';
  coveragePct: number;
  awardAmount: number;
  academicYear: string;
  approval: 'Approved' | 'Pending' | 'Rejected' | 'Expired';
  effectiveFrom: string;
  effectiveTo: string;
  sponsor: string;
  renewal: 'Not due' | 'Due' | 'Renewed';
  notes: string;
}

export interface ExpenseCategoryRecord extends Entity {
  code: string;
  name: string;
  parentId: string;
  description: string;
  annualBudget: number;
  perExpenseLimit: number;
  approval: 'None' | 'Department Head' | 'Principal';
  tax: 'Taxable' | 'Exempt' | 'GST 18%';
  status: 'Active' | 'Inactive';
}

export interface ExpenseRecord extends Entity {
  expenseNo: string;
  title: string;
  amount: number;
  categoryId: string;
  department: string;
  employee: string;
  vendor: string;
  method: PaymentMethod;
  expenseDate: string;
  submittedDate: string;
  priority: 'Low' | 'Normal' | 'High';
  description: string;
  reference: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Paid' | 'Sent Back';
}

const CASHIERS = ['Priya Venkatesh', 'Arun Pillai', 'Priya Venkatesh'];

const feeTypeRows: [string, FeeTypeRecord['category'], FeeTypeRecord['frequency'], number, boolean, boolean, number][] = [
  ['Tuition Fee', 'Academic', 'Term', 2000, false, false, 25],
  ['Admission & Annual Fee', 'Academic', 'Annual', 500, false, false, 0],
  ['Transport Fee', 'Transport', 'Monthly', 130, false, false, 10],
  ['Laboratory Fee', 'Facilities', 'Annual', 250, true, false, 0],
  ['Library Fee', 'Facilities', 'Annual', 120, false, true, 0],
  ['Sports & Activities', 'Activity', 'Annual', 300, true, false, 0],
  ['Examination Fee', 'Examination', 'Term', 100, false, false, 15],
  ['Computer Fee', 'Facilities', 'Term', 150, true, false, 10],
  ['Hostel Fee', 'Hostel', 'Quarterly', 1200, false, false, 50],
  ['Uniform & Books', 'Other', 'One-time', 350, true, true, 0],
];

export const feeTypes = defineCollection<FeeTypeRecord>('feeTypes', () =>
  feeTypeRows.map(([name, category, frequency, amount, taxable, refundable, lateFee], i) => ({
    id: `ft-${pad(i + 1, 2)}`,
    code: `FT-${pad(i + 1)}`,
    name,
    category,
    frequency,
    amount,
    academicYear: ACADEMIC_YEAR,
    taxable,
    refundable,
    lateFee,
    status: i === 9 ? 'Inactive' : 'Active',
    createdBy: 'Priya Venkatesh',
    updatedOn: addDays(SEED_TODAY, -(i * 9 + 3)),
  })),
);

const groupRows: [string, string, string[], string[], string][] = [
  ['Primary Package', 'Academic', ['cls-01', 'cls-02', 'cls-03', 'cls-04', 'cls-05'], ['ft-01', 'ft-02', 'ft-05', 'ft-06', 'ft-07'], 'Term'],
  ['Middle School Package', 'Academic', ['cls-06', 'cls-07', 'cls-08'], ['ft-01', 'ft-02', 'ft-04', 'ft-05', 'ft-07', 'ft-08'], 'Term'],
  ['Secondary Package', 'Academic', ['cls-09', 'cls-10'], ['ft-01', 'ft-02', 'ft-04', 'ft-07', 'ft-08'], 'Term'],
  ['Transport Package', 'Transport', ['cls-01', 'cls-02', 'cls-03', 'cls-04', 'cls-05', 'cls-06', 'cls-07', 'cls-08', 'cls-09', 'cls-10'], ['ft-03'], 'Monthly'],
  ['Hostel Package', 'Hostel', ['cls-06', 'cls-07', 'cls-08', 'cls-09', 'cls-10'], ['ft-09'], 'Quarterly'],
];

export const feeGroups = defineCollection<FeeGroupRecord>('feeGroups', () =>
  groupRows.map(([name, category, classIds, feeTypeIds, frequency], i) => ({
    id: `fg-${pad(i + 1, 2)}`,
    code: `FG-${pad(i + 1)}`,
    name,
    category,
    academicYear: ACADEMIC_YEAR,
    classIds,
    feeTypeIds,
    frequency,
    effectiveFrom: '2026-06-01',
    nextDue: addDays(SEED_TODAY, 12 + i * 5),
    amount: feeTypeIds.reduce((sum, id) => sum + (feeTypeRows[Number(id.slice(3)) - 1]?.[3] ?? 0), 0),
    status: 'Active',
    createdBy: 'Priya Venkatesh',
    updatedOn: addDays(SEED_TODAY, -(i * 11 + 6)),
  })),
);

const structureRows: [string, string, number, string, number, string[], string, number, number, string, string][] = [
  ['Term 1 Fees – Primary', 'Academic', 2300, 'Term', 2, ['cls-01', 'cls-02', 'cls-03', 'cls-04', 'cls-05'], '2026-10-15', 40, 5, 'fg-01', 'ft-01'],
  ['Term 1 Fees – Middle', 'Academic', 2650, 'Term', 2, ['cls-06', 'cls-07', 'cls-08'], '2026-10-15', 45, 5, 'fg-02', 'ft-01'],
  ['Term 1 Fees – Secondary', 'Academic', 2850, 'Term', 3, ['cls-09', 'cls-10'], '2026-10-15', 50, 8, 'fg-03', 'ft-01'],
  ['Transport – Monthly', 'Transport', 130, 'Monthly', 1, ['cls-01', 'cls-02', 'cls-03', 'cls-04', 'cls-05', 'cls-06', 'cls-07', 'cls-08', 'cls-09', 'cls-10'], '2026-11-05', 10, 0, 'fg-04', 'ft-03'],
  ['Hostel – Quarterly', 'Hostel', 1200, 'Quarterly', 1, ['cls-06', 'cls-07', 'cls-08', 'cls-09', 'cls-10'], '2026-12-01', 50, 0, 'fg-05', 'ft-09'],
  ['Term 2 Fees – Secondary', 'Academic', 2850, 'Term', 3, ['cls-09', 'cls-10'], '2027-01-10', 50, 8, 'fg-03', 'ft-01'],
];

export const feeStructures = defineCollection<FeeStructureRecord>('feeStructures', () =>
  structureRows.map(([name, category, amount, frequency, installments, classIds, dueDate, lateFee, concessionPct, groupId, typeId], i) => ({
    id: `fs-${pad(i + 1, 2)}`,
    code: `FS-${pad(i + 1)}`,
    name,
    category,
    amount,
    frequency,
    installments,
    classIds,
    dueDate,
    lateFee,
    concessionPct,
    groupId,
    typeId,
    status: i === 5 ? 'Draft' : 'Active',
  })),
);

/* ---------- invoices + payments (generated together so paid amounts always match) ---------- */

function buildInvoicesAndPayments() {
  const rng = makeRng(77);
  const students = buildStudents();
  const invoices: FeeInvoiceRecord[] = [];
  const payments: FeePaymentRecord[] = [];
  let inv = 0;
  let rct = 0;

  const pushInvoice = (studentId: string, structureIdx: number, discount: number) => {
    const s = structureRows[structureIdx];
    inv += 1;
    const id = `inv-${pad(inv)}`;
    const total = s[2];
    const net = total - discount;
    const roll = rng.next();
    let paid = 0;
    if (roll < 0.55) paid = net;
    else if (roll < 0.75) paid = Math.round((net * rng.int(25, 70)) / 100 / 10) * 10;
    const dueDate = s[6];
    const overdue = paid < net && dueDate < SEED_TODAY;
    const fine = overdue ? s[7] : 0;
    const status: FeeInvoiceRecord['status'] = paid >= net ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';
    const method = PAYMENT_METHODS[rng.int(0, 4)];
    const collectionDate = paid > 0 ? addDays(dueDate < SEED_TODAY ? dueDate : SEED_TODAY, -rng.int(0, 14)) : '';
    invoices.push({
      id,
      invoiceNo: `INV-2026-${pad(inv, 4)}`,
      studentId,
      structureId: `fs-${pad(structureIdx + 1, 2)}`,
      groupId: s[9],
      typeId: s[10],
      academicYear: ACADEMIC_YEAR,
      assignedDate: '2026-09-28',
      dueDate,
      total,
      discount,
      fine,
      paid,
      method: paid > 0 ? method : '',
      collectionDate,
      status,
    });
    if (paid > 0) {
      const parts = paid === net && rng.chance(0.3) ? 2 : 1;
      let remaining = paid;
      for (let p = 0; p < parts; p++) {
        rct += 1;
        const amount = p === parts - 1 ? remaining : Math.round(paid / 2 / 10) * 10;
        remaining -= amount;
        const m = p === 0 ? method : 'UPI';
        const pending = m === 'Cheque' && rng.chance(0.5);
        payments.push({
          id: `pay-${pad(rct)}`,
          receiptNo: `RCT-2026-${pad(rct, 4)}`,
          invoiceId: id,
          studentId,
          amount,
          method: m,
          date: addDays(collectionDate || SEED_TODAY, p * 6),
          collectedBy: CASHIERS[rct % CASHIERS.length],
          reference: m === 'Cash' ? '' : `${m === 'Cheque' ? 'CHQ' : 'TXN'}${rng.int(100000, 999999)}`,
          status: pending ? 'Pending Clearance' : 'Cleared',
          notes: p === 0 ? 'Collected at the cashier counter' : 'Balance instalment',
        });
      }
    }
  };

  for (const st of students) {
    const classNo = Number(st.classId.slice(4));
    const idx = classNo <= 5 ? 0 : classNo <= 8 ? 1 : 2;
    pushInvoice(st.id, idx, st.scholar ? Math.round(structureRows[idx][2] * 0.2) : 0);
    if (st.transport) pushInvoice(st.id, 3, 0);
    if (st.hostel && classNo >= 6) pushInvoice(st.id, 4, 0);
  }

  // A cancelled duplicate and a refund, applied to invoice AND payment together so balances stay truthful.
  const voidPayment = (idx: number, status: 'Cancelled' | 'Refunded', note: string) => {
    const pay = payments[idx];
    if (!pay) return;
    const i = invoices.findIndex((x) => x.id === pay.invoiceId);
    payments[idx] = { ...pay, status, notes: note };
    if (i >= 0) {
      const paid = Math.max(0, invoices[i].paid - pay.amount);
      invoices[i] = { ...invoices[i], paid, status: statusOf(invoices[i].total, invoices[i].discount, paid) };
    }
  };
  voidPayment(4, 'Cancelled', 'Duplicate entry – cancelled by accounts');
  voidPayment(9, 'Refunded', 'Refunded after fee revision');
  return { invoices, payments };
}

const statusOf = (total: number, discount: number, paid: number): FeeInvoiceRecord['status'] =>
  paid >= total - discount ? 'Paid' : paid > 0 ? 'Partial' : 'Unpaid';

export const feeInvoices = defineCollection<FeeInvoiceRecord>('feeInvoices', () => buildInvoicesAndPayments().invoices);
export const feePayments = defineCollection<FeePaymentRecord>('feePayments', () => buildInvoicesAndPayments().payments);

const fineRows: [string, FineRecord['category'], number, FineRecord['status'], string][] = [
  ['stu-003', 'Late Fee', 50, 'Outstanding', 'Term 1 instalment paid after due date'],
  ['stu-007', 'Library', 15, 'Outstanding', 'Book “Wings of Fire” returned 12 days late'],
  ['stu-011', 'Damage', 80, 'Paid', 'Broken microscope slide set in Biology lab'],
  ['stu-014', 'Discipline', 25, 'Outstanding', 'Repeated late arrival to assembly'],
  ['stu-018', 'Lost ID Card', 10, 'Paid', 'Replacement ID card'],
  ['stu-021', 'Late Fee', 50, 'Waived', 'Waived – bank holiday delay'],
  ['stu-025', 'Library', 30, 'Outstanding', 'Lost reference book'],
  ['stu-029', 'Damage', 120, 'Outstanding', 'Damaged desk in classroom 204'],
  ['stu-033', 'Late Fee', 45, 'Paid', 'Transport fee paid late'],
  ['stu-036', 'Discipline', 20, 'Waived', 'Waived on principal approval'],
];

export const fines = defineCollection<FineRecord>('fines', () =>
  fineRows.map(([studentId, category, amount, status, reason], i) => ({
    id: `fin-${pad(i + 1)}`,
    fineNo: `FN-${pad(i + 1)}`,
    studentId,
    category,
    amount,
    paidAmount: status === 'Paid' ? amount : 0,
    dueDate: addDays(SEED_TODAY, status === 'Outstanding' ? (i % 2 === 0 ? -9 : 14) : -30),
    issuedOn: addDays(SEED_TODAY, -(20 + i * 3)),
    reason,
    status,
    createdBy: i % 2 ? 'Arun Pillai' : 'Priya Venkatesh',
    waiverNote: status === 'Waived' ? reason : '',
  })),
);

const schRows: [string, string, ScholarshipRecord['type'], number, ScholarshipRecord['approval'], string, ScholarshipRecord['renewal']][] = [
  ['stu-001', 'Academic Excellence Award', 'Merit', 50, 'Approved', 'Karkaii Education Trust', 'Not due'],
  ['stu-004', 'Sports Champion Grant', 'Sports', 30, 'Approved', 'Alumni Sports Council', 'Due'],
  ['stu-009', 'Need-Based Assistance', 'Need-based', 75, 'Approved', 'Karkaii Welfare Fund', 'Not due'],
  ['stu-013', 'Young Artist Scholarship', 'Talent', 25, 'Pending', 'Arts Foundation', 'Not due'],
  ['stu-016', 'Merit Scholarship', 'Merit', 40, 'Approved', 'Karkaii Education Trust', 'Renewed'],
  ['stu-020', 'Need-Based Assistance', 'Need-based', 60, 'Rejected', 'Karkaii Welfare Fund', 'Not due'],
  ['stu-024', 'Science Olympiad Grant', 'Talent', 35, 'Expired', 'STEM Foundation', 'Due'],
  ['stu-030', 'Merit Scholarship', 'Merit', 50, 'Pending', 'Karkaii Education Trust', 'Not due'],
];

export const scholarships = defineCollection<ScholarshipRecord>('scholarships', () =>
  schRows.map(([studentId, name, type, coveragePct, approval, sponsor, renewal], i) => ({
    id: `sch-${pad(i + 1)}`,
    schNo: `SCH-${pad(i + 1)}`,
    studentId,
    name,
    type,
    coveragePct,
    awardAmount: Math.round((6000 * coveragePct) / 100),
    academicYear: ACADEMIC_YEAR,
    approval,
    effectiveFrom: '2026-06-01',
    effectiveTo: approval === 'Expired' ? '2026-10-31' : '2027-03-31',
    sponsor,
    renewal,
    notes: approval === 'Rejected' ? 'Income documents incomplete' : '',
  })),
);

const catRows: [string, string, string, number, number, ExpenseCategoryRecord['approval'], ExpenseCategoryRecord['tax']][] = [
  ['Salaries & Wages', '', 'Staff payroll and allowances', 480000, 60000, 'Principal', 'Exempt'],
  ['Infrastructure', '', 'Buildings, repairs and civil works', 90000, 15000, 'Principal', 'GST 18%'],
  ['Utilities', '', 'Electricity, water, internet', 36000, 4000, 'Department Head', 'GST 18%'],
  ['Academic Supplies', '', 'Stationery, lab consumables, books', 42000, 5000, 'Department Head', 'GST 18%'],
  ['Transport Operations', '', 'Fuel, maintenance and insurance', 54000, 8000, 'Department Head', 'GST 18%'],
  ['Events & Activities', '', 'Annual day, sports day, competitions', 30000, 6000, 'Principal', 'Taxable'],
  ['Housekeeping', 'ec-02', 'Cleaning material and services', 12000, 1500, 'None', 'GST 18%'],
  ['IT & Equipment', 'ec-04', 'Computers, projectors, software', 28000, 7000, 'Principal', 'GST 18%'],
];

export const expenseCategories = defineCollection<ExpenseCategoryRecord>('expenseCategories', () =>
  catRows.map(([name, parentId, description, annualBudget, perExpenseLimit, approval, tax], i) => ({
    id: `ec-${pad(i + 1, 2)}`,
    code: `EC-${pad(i + 1)}`,
    name,
    parentId,
    description,
    annualBudget,
    perExpenseLimit,
    approval,
    tax,
    status: 'Active',
  })),
);

const expRows: [string, number, string, string, string, string, PaymentMethod, ExpenseRecord['priority'], ExpenseRecord['status']][] = [
  ['October electricity bill', 2850, 'ec-03', 'Operations', 'Imran Sheikh', 'TNEB', 'Net Banking', 'High', 'Paid'],
  ['Lab chemicals and glassware', 1760, 'ec-04', 'Science', 'Teresa Bru', 'LabWorld Supplies', 'Card', 'Normal', 'Approved'],
  ['School bus diesel – November', 4200, 'ec-05', 'Transport', 'Imran Sheikh', 'Indian Oil Fleet', 'Net Banking', 'High', 'Pending'],
  ['Classroom projector replacement', 3400, 'ec-08', 'IT', 'Sam Cole', 'Epson Authorised Dealer', 'Cheque', 'Normal', 'Pending'],
  ['Annual day stage and sound', 5200, 'ec-06', 'Events', 'Maria Lopez', 'StageCraft Events', 'Cheque', 'High', 'Approved'],
  ['Housekeeping consumables', 640, 'ec-07', 'Operations', 'Arun Pillai', 'CleanPro', 'Cash', 'Low', 'Paid'],
  ['Playground repairs', 7800, 'ec-02', 'Operations', 'Rahul Menon', 'BuildRight Contractors', 'Cheque', 'Normal', 'Sent Back'],
  ['Stationery for exam block', 980, 'ec-04', 'Examinations', 'Vikram Singh', 'Paper Plus', 'UPI', 'Low', 'Paid'],
  ['Broadband annual renewal', 1900, 'ec-03', 'IT', 'Sam Cole', 'ACT Fibernet', 'Net Banking', 'Normal', 'Approved'],
  ['Sports kits for inter-school meet', 2300, 'ec-06', 'Physical Education', 'Rahul Menon', 'SportsZone', 'Card', 'Normal', 'Rejected'],
  ['Bus tyre replacement (BUS-03)', 3100, 'ec-05', 'Transport', 'Imran Sheikh', 'MRF Tyres', 'Cheque', 'High', 'Approved'],
  ['Library books purchase', 1450, 'ec-04', 'Library', 'Nandini Rao', 'Higginbothams', 'UPI', 'Normal', 'Pending'],
];

export const expenses = defineCollection<ExpenseRecord>('expenses', () =>
  expRows.map(([title, amount, categoryId, department, employee, vendor, method, priority, status], i) => ({
    id: `exp-${pad(i + 1)}`,
    expenseNo: `EXP-2026-${pad(i + 1)}`,
    title,
    amount,
    categoryId,
    department,
    employee,
    vendor,
    method,
    expenseDate: addDays(SEED_TODAY, -(i * 4 + 2)),
    submittedDate: addDays(SEED_TODAY, -(i * 4 + 1)),
    priority,
    description: `${title} – ${vendor}`,
    reference: status === 'Paid' ? `REF${100200 + i * 17}` : '',
    status,
  })),
);
