import { repo, snapshot } from '@/core/store/store';
import { diffDays, formatDate, todayISO } from '@/core/utils/date';
import { money, num, pct } from '@/core/utils/format';
import {
  ACADEMIC_YEAR,
  PAYMENT_METHODS,
  type ExpenseCategoryRecord,
  type ExpenseRecord,
  type FeeGroupRecord,
  type FeeInvoiceRecord,
  type FeePaymentRecord,
  type FeeStructureRecord,
  type FeeTypeRecord,
  type FineRecord,
  type ScholarshipRecord,
} from '@/data/seed/finance';
import type { StudentRecord } from '@/data/seed/master';
import { classOptions, classSection, countBy, getClass, getStudent, nextNo, ownStudentScope, studentName, studentOptions, sum } from '@/features/common/refs';
import type { FieldDef, ResourceConfig } from '@/features/engine/types';
import type { Tone } from '@/ui/tone';

/* ---------------- shared invoice maths ---------------- */

export const netAmount = (i: FeeInvoiceRecord) => i.total - i.discount + i.fine;
export const balanceOf = (i: FeeInvoiceRecord) => Math.max(0, netAmount(i) - i.paid);
export const isOverdue = (i: FeeInvoiceRecord) => balanceOf(i) > 0 && i.dueDate < todayISO();
export const daysOverdue = (i: FeeInvoiceRecord) => (isOverdue(i) ? diffDays(i.dueDate, todayISO()) : 0);

function statusFromAmounts(i: Pick<FeeInvoiceRecord, 'total' | 'discount' | 'paid'>): FeeInvoiceRecord['status'] {
  const net = i.total - i.discount;
  return i.paid >= net ? 'Paid' : i.paid > 0 ? 'Partial' : 'Unpaid';
}

function invoiceBadge(i: FeeInvoiceRecord): { label: string; tone: Tone } {
  if (isOverdue(i)) return { label: 'Overdue', tone: 'danger' };
  if (i.status === 'Paid') return { label: 'Paid', tone: 'success' };
  if (i.status === 'Partial') return { label: 'Partial', tone: 'warning' };
  return { label: 'Unpaid', tone: 'neutral' };
}

const structureName = (id: string) => snapshot<FeeStructureRecord>('feeStructures').find((s) => s.id === id)?.name ?? '—';
const groupName = (id: string) => snapshot<FeeGroupRecord>('feeGroups').find((g) => g.id === id)?.name ?? '—';
const typeName = (id: string) => snapshot<FeeTypeRecord>('feeTypes').find((t) => t.id === id)?.name ?? '—';
const typeCategory = (id: string) => snapshot<FeeTypeRecord>('feeTypes').find((t) => t.id === id)?.category ?? '—';
const academicYears = [ACADEMIC_YEAR, '2025-26', '2027-28'];

const opts = (list: readonly string[]) => list.map((v) => ({ label: v, value: v }));

const ACTIVE_STATUS = [{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }];
const yesNo = [{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }];

/** Record a payment against an invoice and issue a receipt. Used by Fee Collection and Due Reports. */
export function collectPayment(invoiceId: string, v: { amount: number; method: string; date: string; reference?: string; notes?: string }, collectedBy: string): string {
  const invoices = repo<FeeInvoiceRecord>('feeInvoices');
  const payments = repo<FeePaymentRecord>('feePayments');
  const inv = invoices.get(invoiceId);
  if (!inv) return '';
  const receiptNo = nextNo('RCT-2026-', snapshot<FeePaymentRecord>('feePayments').map((p) => p.receiptNo));
  payments.create({
    receiptNo,
    invoiceId,
    studentId: inv.studentId,
    amount: v.amount,
    method: v.method as FeePaymentRecord['method'],
    date: v.date,
    collectedBy,
    reference: v.reference ?? '',
    status: v.method === 'Cheque' ? 'Pending Clearance' : 'Cleared',
    notes: v.notes ?? '',
  });
  const paid = inv.paid + v.amount;
  invoices.update(invoiceId, { paid, method: v.method, collectionDate: v.date, status: statusFromAmounts({ ...inv, paid }) });
  return receiptNo;
}

const collectForm = {
  title: 'Collect Payment',
  submitLabel: 'Collect & Issue Receipt',
  fields: [
    { key: 'amount', label: 'Amount Received', type: 'money', required: true, min: 1 },
    { key: 'method', label: 'Payment Method', type: 'select', required: true, options: opts(PAYMENT_METHODS), default: 'Cash' },
    { key: 'date', label: 'Collection Date', type: 'date', required: true },
    { key: 'reference', label: 'Reference / Transaction No', type: 'text', hidden: (v) => v.method === 'Cash' },
    { key: 'notes', label: 'Notes', type: 'textarea' },
  ] as FieldDef[],
  initial: (r: FeeInvoiceRecord) => ({ amount: String(balanceOf(r)), date: todayISO() }),
  validate: (v: Record<string, any>, r: FeeInvoiceRecord) =>
    Number(v.amount) > balanceOf(r) ? { amount: `Cannot exceed the outstanding balance of ${money(balanceOf(r))}` } : {},
};

/* ---------------- Fee types ---------------- */

export const feeTypesCfg: ResourceConfig<FeeTypeRecord> = {
  entity: 'Fee Type',
  collection: 'feeTypes',
  searchText: (r) => `${r.name} ${r.code} ${r.category}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.category} · ${r.frequency}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : 'neutral' }),
  badges: (r) => [...(r.taxable ? [{ label: 'Taxable', tone: 'info' as Tone }] : []), ...(r.refundable ? [{ label: 'Refundable', tone: 'teal' as Tone }] : [])],
  facts: [
    { label: 'Default amount', value: (r) => money(r.amount) },
    { label: 'Academic year', value: (r) => r.academicYear },
    { label: 'Late fee', value: (r) => (r.lateFee ? money(r.lateFee) : 'None') },
    { label: 'Updated', value: (r) => formatDate(r.updatedOn) },
  ],
  detail: [
    { title: 'Fee type', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Name', value: (r) => r.name }, { label: 'Category', value: (r) => r.category }, { label: 'Collection frequency', value: (r) => r.frequency }, { label: 'Default amount', value: (r) => money(r.amount) }, { label: 'Academic year', value: (r) => r.academicYear }] },
    { title: 'Rules', items: [{ label: 'Taxable', value: (r) => (r.taxable ? 'Yes' : 'No') }, { label: 'Refundable', value: (r) => (r.refundable ? 'Yes' : 'No') }, { label: 'Late fee', value: (r) => (r.lateFee ? money(r.lateFee) : 'None') }, { label: 'Status', value: (r) => r.status }, { label: 'Created by', value: (r) => r.createdBy }, { label: 'Last updated', value: (r) => formatDate(r.updatedOn) }] },
  ],
  stats: [
    { label: 'Fee types', value: (rows) => rows.length, icon: 'tag' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Taxable', value: (rows) => countBy(rows, (r) => r.taxable), tone: 'info', icon: 'percent' },
    { label: 'Avg amount', value: (rows) => money(rows.length ? sum(rows, (r) => r.amount) / rows.length : 0), tone: 'purple', icon: 'dollar-sign' },
  ],
  views: [
    { key: 'all', label: 'All types', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'category', label: 'Fee category', options: opts(['Academic', 'Transport', 'Facilities', 'Activity', 'Examination', 'Hostel', 'Other']), match: (r, v) => r.category === v },
    { key: 'frequency', label: 'Collection frequency', options: opts(['Monthly', 'Quarterly', 'Term', 'Annual', 'One-time']), match: (r, v) => r.frequency === v },
    { key: 'tax', label: 'Tax applicable', options: yesNo, single: true, match: (r, v) => (v === 'yes') === r.taxable },
    { key: 'year', label: 'Academic year', options: opts(academicYears), match: (r, v) => r.academicYear === v },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.amount - a.amount },
    { key: 'recent', label: 'Recently updated', compare: (a, b) => b.updatedOn.localeCompare(a.updatedOn) },
  ],
  form: [
    { key: 'name', label: 'Fee Type Name', type: 'text', required: true, section: 'Fee type' },
    { key: 'code', label: 'Fee Code', type: 'text', required: true },
    { key: 'category', label: 'Fee Category', type: 'select', required: true, options: opts(['Academic', 'Transport', 'Facilities', 'Activity', 'Examination', 'Hostel', 'Other']) },
    { key: 'frequency', label: 'Collection Frequency', type: 'select', required: true, options: opts(['Monthly', 'Quarterly', 'Term', 'Annual', 'One-time']) },
    { key: 'amount', label: 'Default Amount', type: 'money', required: true, min: 0 },
    { key: 'academicYear', label: 'Academic Year', type: 'select', required: true, options: opts(academicYears), default: ACADEMIC_YEAR },
    { key: 'lateFee', label: 'Late Fee', type: 'money', min: 0, section: 'Rules' },
    { key: 'taxable', label: 'Taxable', type: 'switch' },
    { key: 'refundable', label: 'Refundable', type: 'switch' },
    { key: 'status', label: 'Status', type: 'select', required: true, options: ACTIVE_STATUS, default: 'Active' },
  ],
  defaults: (rows) => ({ code: nextNo('FT-', rows.map((r) => r.code), 3) }),
  validate: (v, { existing, rows }) =>
    rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This fee code is already used' } : {},
  prepare: (_v, { existing }) => ({ createdBy: existing?.createdBy ?? 'Accounts Office', updatedOn: todayISO() }),
  bulk: [
    { key: 'activate', label: 'Activate', icon: 'check', run: (_rows, _v, c) => { c.updateMany(() => ({ status: 'Active' })); c.toast('Fee types activated'); } },
    { key: 'deactivate', label: 'Deactivate', icon: 'slash', run: (_rows, _v, c) => { c.updateMany(() => ({ status: 'Inactive' })); c.toast('Fee types deactivated'); } },
  ],
};

/* ---------------- Fee groups ---------------- */

export const feeGroupsCfg: ResourceConfig<FeeGroupRecord> = {
  entity: 'Fee Group',
  collection: 'feeGroups',
  searchText: (r) => `${r.name} ${r.code} ${r.category}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.category} · ${r.frequency}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : 'neutral' }),
  facts: [
    { label: 'Group amount', value: (r) => money(r.amount) },
    { label: 'Fee items', value: (r) => r.feeTypeIds.length },
    { label: 'Classes', value: (r) => `${r.classIds.length} classes` },
    { label: 'Assigned students', value: (r) => new Set(snapshot<FeeInvoiceRecord>('feeInvoices').filter((i) => i.groupId === r.id).map((i) => i.studentId)).size },
    { label: 'Effective from', value: (r) => formatDate(r.effectiveFrom) },
    { label: 'Next due', value: (r) => formatDate(r.nextDue) },
  ],
  detail: [
    { title: 'Group', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Category', value: (r) => r.category }, { label: 'Academic year', value: (r) => r.academicYear }, { label: 'Frequency', value: (r) => r.frequency }, { label: 'Total amount', value: (r) => money(r.amount) }, { label: 'Created by', value: (r) => r.createdBy }] },
    { title: 'Components', items: [{ label: 'Fee items', value: (r) => r.feeTypeIds.map(typeName).join(', ') }, { label: 'Applies to', value: (r) => r.classIds.map((id) => getClass(id)?.name ?? id).join(', ') }] },
  ],
  stats: [
    { label: 'Fee groups', value: (rows) => rows.length, icon: 'folder' },
    { label: 'Active', value: (rows) => countBy(rows, (r) => r.status === 'Active'), tone: 'success', icon: 'check-circle' },
    { label: 'Fee items', value: (rows) => sum(rows, (r) => r.feeTypeIds.length), tone: 'info', icon: 'layers' },
  ],
  views: [
    { key: 'all', label: 'All groups', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'category', label: 'Fee category', options: opts(['Academic', 'Transport', 'Hostel']), match: (r, v) => r.category === v },
    { key: 'class', label: 'Class', options: () => snapshot<{ id: string; name: string }>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => r.classIds.includes(v) },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.amount - a.amount },
  ],
  form: [
    { key: 'name', label: 'Fee Group Name', type: 'text', required: true },
    { key: 'code', label: 'Group Code', type: 'text', required: true },
    { key: 'category', label: 'Fee Category', type: 'select', required: true, options: opts(['Academic', 'Transport', 'Hostel', 'Other']) },
    { key: 'frequency', label: 'Collection Frequency', type: 'select', required: true, options: opts(['Monthly', 'Quarterly', 'Term', 'Annual']) },
    { key: 'classIds', label: 'Classes', type: 'multiselect', required: true, optionsFrom: classOptions },
    { key: 'feeTypeIds', label: 'Fee Items', type: 'multiselect', required: true, optionsFrom: { collection: 'feeTypes', label: (t: FeeTypeRecord) => t.name, hint: (t: FeeTypeRecord) => money(t.amount) } },
    { key: 'effectiveFrom', label: 'Effective From', type: 'date', required: true },
    { key: 'nextDue', label: 'Next Due', type: 'date', required: true },
    { key: 'academicYear', label: 'Academic Year', type: 'select', options: opts(academicYears), default: ACADEMIC_YEAR },
    { key: 'status', label: 'Status', type: 'select', options: ACTIVE_STATUS, default: 'Active' },
  ],
  defaults: (rows) => ({ code: nextNo('FG-', rows.map((r) => r.code), 3), effectiveFrom: todayISO() }),
  validate: (v, { existing, rows }) =>
    rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This group code is already used' } : {},
  prepare: (v, { existing }) => ({
    amount: sum(snapshot<FeeTypeRecord>('feeTypes').filter((t) => (v.feeTypeIds as string[]).includes(t.id)), (t) => t.amount),
    createdBy: existing?.createdBy ?? 'Accounts Office',
    updatedOn: todayISO(),
  }),
};

/* ---------------- Fee structure ---------------- */

const invoicesOf = (structureId: string) => snapshot<FeeInvoiceRecord>('feeInvoices').filter((i) => i.structureId === structureId);

export const feeStructureCfg: ResourceConfig<FeeStructureRecord> = {
  entity: 'Structure',
  collection: 'feeStructures',
  searchText: (r) => `${r.name} ${r.code} ${r.category}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => `${r.category} · ${r.frequency} · ${r.installments} installment${r.installments > 1 ? 's' : ''}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : r.status === 'Draft' ? 'warning' : 'neutral' }),
  facts: [
    { label: 'Amount / student', value: (r) => money(r.amount) },
    { label: 'Due date', value: (r) => formatDate(r.dueDate) },
    { label: 'Assigned', value: (r) => `${invoicesOf(r.id).length} students` },
    { label: 'Collected', value: (r) => money(sum(invoicesOf(r.id), (i) => i.paid)) },
    { label: 'Pending', value: (r) => money(sum(invoicesOf(r.id), balanceOf)) },
    { label: 'Overdue accounts', value: (r) => countBy(invoicesOf(r.id), isOverdue) },
  ],
  progress: (r) => {
    const inv = invoicesOf(r.id);
    const collected = sum(inv, (i) => i.paid);
    const total = sum(inv, netAmount);
    return inv.length ? { value: collected, max: total, label: 'Collection progress', tone: collected / total > 0.7 ? 'success' : 'warning' } : undefined;
  },
  detail: [
    { title: 'Structure', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Fee group', value: (r) => groupName(r.groupId) }, { label: 'Primary fee type', value: (r) => typeName(r.typeId) }, { label: 'Applicable to', value: (r) => r.classIds.map((id) => getClass(id)?.name ?? id).join(', ') }, { label: 'Late fee', value: (r) => money(r.lateFee) }, { label: 'Concession', value: (r) => pct(r.concessionPct) }] },
    {
      title: 'Collection',
      items: [
        { label: 'Students paid', value: (r) => countBy(invoicesOf(r.id), (i) => i.status === 'Paid') },
        { label: 'Invoices outstanding', value: (r) => countBy(invoicesOf(r.id), (i) => balanceOf(i) > 0) },
        { label: 'Total billed', value: (r) => money(sum(invoicesOf(r.id), netAmount)) },
        { label: 'Collected', value: (r) => money(sum(invoicesOf(r.id), (i) => i.paid)) },
      ],
    },
  ],
  stats: [
    { label: 'Structures', value: (rows) => rows.length, icon: 'layers' },
    { label: 'Collected', value: () => money(sum(snapshot<FeeInvoiceRecord>('feeInvoices'), (i) => i.paid)), tone: 'success', icon: 'trending-up' },
    { label: 'Pending', value: () => money(sum(snapshot<FeeInvoiceRecord>('feeInvoices'), balanceOf)), tone: 'warning', icon: 'clock' },
    { label: 'Overdue accounts', value: () => countBy(snapshot<FeeInvoiceRecord>('feeInvoices'), isOverdue), tone: 'danger', icon: 'alert-circle' },
  ],
  views: [
    { key: 'all', label: 'All structures', match: () => true },
    { key: 'active', label: 'Active', match: (r) => r.status === 'Active' },
    { key: 'draft', label: 'Draft', match: (r) => r.status === 'Draft' },
  ],
  filters: [
    { key: 'category', label: 'Category', options: opts(['Academic', 'Transport', 'Hostel']), match: (r, v) => r.category === v },
    { key: 'frequency', label: 'Frequency', options: opts(['Term', 'Monthly', 'Quarterly', 'Annual']), match: (r, v) => r.frequency === v },
    { key: 'status', label: 'Status', options: opts(['Active', 'Draft', 'Inactive']), match: (r, v) => r.status === v },
  ],
  sorts: [
    { key: 'due', label: 'Due date (soonest)', compare: (a, b) => a.dueDate.localeCompare(b.dueDate) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.amount - a.amount },
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
  ],
  form: [
    { key: 'name', label: 'Structure Name', type: 'text', required: true },
    { key: 'code', label: 'Code', type: 'text', required: true },
    { key: 'category', label: 'Category', type: 'select', required: true, options: opts(['Academic', 'Transport', 'Hostel', 'Other']) },
    { key: 'groupId', label: 'Fee Group', type: 'select', required: true, optionsFrom: { collection: 'feeGroups', label: (g: FeeGroupRecord) => g.name } },
    { key: 'typeId', label: 'Primary Fee Type', type: 'select', required: true, optionsFrom: { collection: 'feeTypes', label: (t: FeeTypeRecord) => t.name } },
    { key: 'amount', label: 'Amount per Student', type: 'money', required: true, min: 1 },
    { key: 'frequency', label: 'Frequency', type: 'select', required: true, options: opts(['Term', 'Monthly', 'Quarterly', 'Annual']) },
    { key: 'installments', label: 'Installments', type: 'number', required: true, min: 1, max: 12, default: 1 },
    { key: 'classIds', label: 'Applicable Classes', type: 'multiselect', required: true, optionsFrom: classOptions },
    { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { key: 'lateFee', label: 'Late Fee', type: 'money', min: 0, default: 0 },
    { key: 'concessionPct', label: 'Concession %', type: 'number', min: 0, max: 100, default: 0 },
    { key: 'status', label: 'Status', type: 'select', options: opts(['Active', 'Draft', 'Inactive']), default: 'Draft' },
  ],
  defaults: (rows) => ({ code: nextNo('FS-', rows.map((r) => r.code), 3) }),
  validate: (v, { existing, rows }) =>
    rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This code is already used' } : {},
  actions: [
    {
      key: 'apply',
      label: 'Apply to class',
      icon: 'user-plus',
      visible: (r) => r.status !== 'Inactive',
      form: {
        title: 'Apply structure to students',
        submitLabel: 'Create invoices',
        fields: [
          { key: 'classId', label: 'Class', type: 'select', required: true, optionsFrom: classOptions },
          { key: 'sectionId', label: 'Section (optional)', type: 'select', optionsFrom: { collection: 'sections', label: (s: { name: string }) => `Section ${s.name}`, hint: (s: { classId: string }) => getClass(s.classId)?.name ?? '', filter: (s: { classId: string }, vals) => !vals.classId || s.classId === vals.classId } },
        ],
      },
      run: (r, v, ctx) => {
        const invoices = repo<FeeInvoiceRecord>('feeInvoices');
        const have = new Set(snapshot<FeeInvoiceRecord>('feeInvoices').filter((i) => i.structureId === r.id).map((i) => i.studentId));
        const targets = snapshot<StudentRecord>('students').filter((s) => s.classId === v.classId && (!v.sectionId || s.sectionId === v.sectionId) && s.status === 'Active' && !have.has(s.id));
        let no = snapshot<FeeInvoiceRecord>('feeInvoices').map((i) => i.invoiceNo);
        for (const s of targets) {
          const invoiceNo = nextNo('INV-2026-', no);
          no = [...no, invoiceNo];
          invoices.create({ invoiceNo, studentId: s.id, structureId: r.id, groupId: r.groupId, typeId: r.typeId, academicYear: ACADEMIC_YEAR, assignedDate: todayISO(), dueDate: r.dueDate, total: r.amount, discount: Math.round((r.amount * r.concessionPct) / 100), fine: 0, paid: 0, method: '', collectionDate: '', status: 'Unpaid' });
        }
        ctx.toast(targets.length ? `${targets.length} invoices created` : 'Everyone in that class already has this structure', targets.length ? 'success' : 'info');
      },
    },
    {
      key: 'revise',
      label: 'Revise amount',
      icon: 'edit',
      form: { title: 'Revise amount per student', fields: [{ key: 'amount', label: 'New Amount', type: 'money', required: true, min: 1 }], initial: (r) => ({ amount: String(r.amount) }) },
      run: (_r, v, ctx) => { ctx.update({ amount: v.amount }); ctx.toast('Amount revised for future invoices'); },
    },
    {
      key: 'remind',
      label: 'Send reminder',
      icon: 'bell',
      form: { title: 'Send reminder', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: opts(['SMS', 'Email', 'App notification']), default: 'SMS' }] },
      run: (r, v, ctx) => ctx.toast(`${v.channel} reminder queued for ${countBy(invoicesOf(r.id), (i) => balanceOf(i) > 0)} guardians`, 'info'),
    },
  ],
};

/* ---------------- Fees assign / collection / due reports (all on feeInvoices) ---------------- */

const invoiceSearch = (i: FeeInvoiceRecord) => `${i.invoiceNo} ${studentName(i.studentId)} ${getStudent(i.studentId)?.admissionNo ?? ''} ${groupName(i.groupId)} ${typeName(i.typeId)}`;
const invoiceTitle = (i: FeeInvoiceRecord) => studentName(i.studentId);
const invoiceSubtitle = (i: FeeInvoiceRecord) => `${getStudent(i.studentId)?.admissionNo ?? ''} · ${classSection(getStudent(i.studentId))}`;

const invoiceFilters: ResourceConfig<FeeInvoiceRecord>['filters'] = [
  { key: 'year', label: 'Academic year', options: opts(academicYears), match: (r, v) => r.academicYear === v },
  { key: 'group', label: 'Fee group', options: () => snapshot<FeeGroupRecord>('feeGroups').map((g) => ({ label: g.name, value: g.id })), match: (r, v) => r.groupId === v },
  { key: 'type', label: 'Fee type', options: () => snapshot<FeeTypeRecord>('feeTypes').map((t) => ({ label: t.name, value: t.id })), match: (r, v) => r.typeId === v },
  { key: 'class', label: 'Class', options: () => snapshot<{ id: string; name: string }>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => getStudent(r.studentId)?.classId === v },
  { key: 'status', label: 'Payment status', options: opts(['Paid', 'Partial', 'Unpaid', 'Overdue']), match: (r, v) => (v === 'Overdue' ? isOverdue(r) : r.status === v) },
];

const invoiceStats: ResourceConfig<FeeInvoiceRecord>['stats'] = [
  { label: 'Invoices', value: (rows) => rows.length, icon: 'file-text' },
  { label: 'Billed', value: (rows) => money(sum(rows, netAmount)), tone: 'info', icon: 'dollar-sign' },
  { label: 'Collected', value: (rows) => money(sum(rows, (i) => i.paid)), tone: 'success', icon: 'trending-up' },
  { label: 'Outstanding', value: (rows) => money(sum(rows, balanceOf)), tone: 'warning', icon: 'clock' },
  { label: 'Overdue', value: (rows) => countBy(rows, isOverdue), tone: 'danger', icon: 'alert-circle' },
];

const invoiceDetail: ResourceConfig<FeeInvoiceRecord>['detail'] = [
  { title: 'Student', items: [{ label: 'Student', value: (r) => studentName(r.studentId) }, { label: 'Admission no', value: (r) => getStudent(r.studentId)?.admissionNo }, { label: 'Class', value: (r) => classSection(getStudent(r.studentId)) }, { label: 'Roll no', value: (r) => getStudent(r.studentId)?.rollNo }] },
  { title: 'Fee', items: [{ label: 'Invoice no', value: (r) => r.invoiceNo }, { label: 'Structure', value: (r) => structureName(r.structureId) }, { label: 'Fee group', value: (r) => groupName(r.groupId) }, { label: 'Fee type', value: (r) => typeName(r.typeId) }, { label: 'Academic year', value: (r) => r.academicYear }, { label: 'Assigned', value: (r) => formatDate(r.assignedDate) }, { label: 'Due date', value: (r) => formatDate(r.dueDate) }] },
  { title: 'Payment', items: [{ label: 'Total', value: (r) => money(r.total) }, { label: 'Discount', value: (r) => money(r.discount) }, { label: 'Fine', value: (r) => money(r.fine) }, { label: 'Paid', value: (r) => money(r.paid) }, { label: 'Balance', value: (r) => money(balanceOf(r)) }, { label: 'Method', value: (r) => r.method || '—' }, { label: 'Last collected', value: (r) => (r.collectionDate ? formatDate(r.collectionDate) : '—') }] },
];

const invoiceBase = {
  collection: 'feeInvoices',
  rowScope: ownStudentScope,
  searchText: invoiceSearch,
  code: (r: FeeInvoiceRecord) => r.invoiceNo,
  title: invoiceTitle,
  subtitle: invoiceSubtitle,
  status: invoiceBadge,
  detail: invoiceDetail,
  stats: invoiceStats,
  filters: invoiceFilters,
  progress: (r: FeeInvoiceRecord) => ({ value: r.paid, max: netAmount(r), label: `${money(r.paid)} of ${money(netAmount(r))} paid`, tone: (r.status === 'Paid' ? 'success' : isOverdue(r) ? 'danger' : 'warning') as Tone }),
};

const collectAction = {
  key: 'collect',
  label: 'Collect payment',
  icon: 'credit-card' as const,
  tone: 'success' as const,
  visible: (r: FeeInvoiceRecord) => balanceOf(r) > 0,
  form: collectForm,
  run: (r: FeeInvoiceRecord, v: Record<string, any>, ctx: { toast: (m: string, k?: 'success' | 'error' | 'info') => void }) => {
    const receipt = collectPayment(r.id, { amount: v.amount, method: v.method, date: v.date, reference: v.reference, notes: v.notes }, 'Accounts Office');
    ctx.toast(`${money(v.amount)} collected · receipt ${receipt}`);
  },
};

export const feesAssignCfg: ResourceConfig<FeeInvoiceRecord> = {
  ...invoiceBase,
  entity: 'Fee Assignment',
  facts: [
    { label: 'Fee group', value: (r) => groupName(r.groupId) },
    { label: 'Fee type', value: (r) => typeName(r.typeId) },
    { label: 'Total', value: (r) => money(r.total) },
    { label: 'Discount', value: (r) => money(r.discount) },
    { label: 'Paid', value: (r) => money(r.paid) },
    { label: 'Due date', value: (r) => formatDate(r.dueDate) },
  ],
  views: [
    { key: 'all', label: 'All assignments', match: () => true },
    { key: 'unpaid', label: 'Unpaid', match: (r) => r.status === 'Unpaid' },
    { key: 'partial', label: 'Partial', match: (r) => r.status === 'Partial' },
    { key: 'paid', label: 'Paid', match: (r) => r.status === 'Paid' },
  ],
  sorts: [
    { key: 'recent', label: 'Newest invoice', compare: (a, b) => b.invoiceNo.localeCompare(a.invoiceNo) },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
    { key: 'due', label: 'Due date (soonest)', compare: (a, b) => a.dueDate.localeCompare(b.dueDate) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.total - a.total },
  ],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: studentOptions, readOnly: (_v, edit) => edit },
    {
      key: 'groupId', label: 'Fee Group', type: 'select', required: true,
      optionsFrom: { collection: 'feeGroups', label: (g: FeeGroupRecord) => g.name, hint: (g: FeeGroupRecord) => money(g.amount) },
      onChange: (id, vals, lookup) => {
        const g = lookup('feeGroups', id) as FeeGroupRecord | undefined;
        if (!g) return;
        const st = snapshot<FeeStructureRecord>('feeStructures').find((s) => s.groupId === id);
        return { total: String(st?.amount ?? g.amount), typeId: st?.typeId ?? g.feeTypeIds[0] ?? vals.typeId, dueDate: st?.dueDate ?? vals.dueDate };
      },
    },
    { key: 'typeId', label: 'Fee Type', type: 'select', required: true, optionsFrom: { collection: 'feeTypes', label: (t: FeeTypeRecord) => t.name } },
    { key: 'academicYear', label: 'Academic Year', type: 'select', required: true, options: opts(academicYears), default: ACADEMIC_YEAR },
    { key: 'total', label: 'Total Amount', type: 'money', required: true, min: 1 },
    { key: 'discount', label: 'Discount', type: 'money', min: 0, default: 0 },
    { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
  ],
  validate: (v) => (Number(v.discount) > Number(v.total) ? { discount: 'Discount cannot exceed the total' } : {}),
  prepare: (v, { existing, rows }) => {
    const st = snapshot<FeeStructureRecord>('feeStructures').find((s) => s.groupId === v.groupId && s.typeId === v.typeId);
    const paid = existing?.paid ?? 0;
    return {
      invoiceNo: existing?.invoiceNo ?? nextNo('INV-2026-', rows.map((r) => r.invoiceNo)),
      structureId: existing?.structureId ?? st?.id ?? '',
      assignedDate: existing?.assignedDate ?? todayISO(),
      fine: existing?.fine ?? 0,
      paid,
      method: existing?.method ?? '',
      collectionDate: existing?.collectionDate ?? '',
      status: statusFromAmounts({ total: v.total, discount: v.discount, paid }),
    };
  },
};

export const feeCollectionCfg: ResourceConfig<FeeInvoiceRecord> = {
  ...invoiceBase,
  entity: 'Invoice',
  canCreate: false,
  canEdit: false,
  canDelete: false,
  facts: [
    { label: 'Fee type', value: (r) => typeName(r.typeId) },
    { label: 'Total', value: (r) => money(netAmount(r)) },
    { label: 'Fine', value: (r) => (r.fine ? money(r.fine) : undefined) },
    { label: 'Balance', value: (r) => money(balanceOf(r)) },
    { label: 'Due date', value: (r) => formatDate(r.dueDate) },
    { label: 'Method', value: (r) => r.method || undefined },
  ],
  views: [
    { key: 'all', label: 'All invoices', match: () => true },
    { key: 'unpaid', label: 'Unpaid', match: (r) => r.status === 'Unpaid' },
    { key: 'partial', label: 'Partial', match: (r) => r.status === 'Partial' },
    { key: 'overdue', label: 'Overdue', match: isOverdue },
    { key: 'paid', label: 'Paid', match: (r) => r.status === 'Paid' },
  ],
  sorts: [
    { key: 'balance', label: 'Balance (high to low)', compare: (a, b) => balanceOf(b) - balanceOf(a) },
    { key: 'due', label: 'Due date (soonest)', compare: (a, b) => a.dueDate.localeCompare(b.dueDate) },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
  ],
  form: [],
  actions: [collectAction],
};

const bucket = (i: FeeInvoiceRecord) => {
  const d = daysOverdue(i);
  return d === 0 ? 'Not yet due' : d <= 30 ? '1–30 days' : d <= 60 ? '31–60 days' : '60+ days';
};

export const dueReportsCfg: ResourceConfig<FeeInvoiceRecord> = {
  ...invoiceBase,
  entity: 'Due Report',
  canCreate: false,
  canEdit: false,
  canDelete: false,
  facts: [
    { label: 'Fee category', value: (r) => typeCategory(r.typeId) },
    { label: 'Due amount', value: (r) => money(netAmount(r)) },
    { label: 'Paid', value: (r) => money(r.paid) },
    { label: 'Outstanding', value: (r) => money(balanceOf(r)) },
    { label: 'Due date', value: (r) => formatDate(r.dueDate) },
    { label: 'Days overdue', value: (r) => (daysOverdue(r) ? `${daysOverdue(r)} days` : '—') },
  ],
  stats: [
    { label: 'Outstanding', value: (rows) => money(sum(rows, balanceOf)), tone: 'warning', icon: 'clock' },
    { label: 'Overdue accounts', value: (rows) => countBy(rows, isOverdue), tone: 'danger', icon: 'alert-circle' },
    { label: '60+ days', value: (rows) => countBy(rows, (i) => daysOverdue(i) > 60), tone: 'danger', icon: 'alert-triangle' },
    { label: 'Cleared', value: (rows) => countBy(rows, (i) => balanceOf(i) === 0), tone: 'success', icon: 'check-circle' },
  ],
  views: [
    { key: 'out', label: 'All outstanding', match: (r) => balanceOf(r) > 0 },
    { key: 'o30', label: 'Overdue 30+ days', match: (r) => daysOverdue(r) > 30 },
    { key: 'week', label: 'Due this week', match: (r) => balanceOf(r) > 0 && r.dueDate >= todayISO() && diffDays(todayISO(), r.dueDate) <= 7 },
    { key: 'partial', label: 'Partial payments', match: (r) => r.status === 'Partial' },
    { key: 'cleared', label: 'Cleared invoices', match: (r) => balanceOf(r) === 0 },
  ],
  filters: [
    ...(invoiceFilters ?? []).filter((f) => f.key !== 'status'),
    { key: 'ageing', label: 'Ageing bucket', options: opts(['Not yet due', '1–30 days', '31–60 days', '60+ days']), match: (r, v) => bucket(r) === v },
  ],
  sorts: [
    { key: 'overdue', label: 'Most overdue', compare: (a, b) => daysOverdue(b) - daysOverdue(a) },
    { key: 'balance', label: 'Outstanding (high to low)', compare: (a, b) => balanceOf(b) - balanceOf(a) },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
  ],
  form: [],
  actions: [
    collectAction,
    {
      key: 'remind',
      label: 'Send reminder',
      icon: 'bell',
      visible: (r) => balanceOf(r) > 0,
      form: { title: 'Send payment reminder', submitLabel: 'Send', fields: [{ key: 'channel', label: 'Channel', type: 'select', required: true, options: opts(['SMS', 'Email', 'App notification']), default: 'SMS' }, { key: 'message', label: 'Message', type: 'textarea' }] },
      run: (r, v, ctx) => ctx.toast(`${v.channel} reminder sent to ${getStudent(r.studentId)?.parentName ?? 'guardian'}`, 'info'),
    },
  ],
};

/* ---------------- Receipts ---------------- */

const invoiceOfPayment = (p: FeePaymentRecord) => snapshot<FeeInvoiceRecord>('feeInvoices').find((i) => i.id === p.invoiceId);

export const receiptsCfg: ResourceConfig<FeePaymentRecord> = {
  entity: 'Receipt',
  collection: 'feePayments',
  rowScope: ownStudentScope,
  searchText: (r) => `${r.receiptNo} ${studentName(r.studentId)} ${getStudent(r.studentId)?.admissionNo ?? ''} ${r.reference}`,
  code: (r) => r.receiptNo,
  title: (r) => studentName(r.studentId),
  subtitle: (r) => `${getStudent(r.studentId)?.admissionNo ?? ''} · ${classSection(getStudent(r.studentId))}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Cleared' ? 'success' : r.status === 'Pending Clearance' ? 'warning' : 'danger' }),
  badges: (r) => [{ label: r.method, tone: 'primary' }],
  facts: [
    { label: 'Amount paid', value: (r) => money(r.amount) },
    { label: 'Payment date', value: (r) => formatDate(r.date) },
    { label: 'Fee category', value: (r) => typeCategory(invoiceOfPayment(r)?.typeId ?? '') },
    { label: 'Collected by', value: (r) => r.collectedBy },
    { label: 'Reference', value: (r) => r.reference || undefined },
  ],
  detail: [
    { title: 'Receipt', items: [{ label: 'Receipt no', value: (r) => r.receiptNo }, { label: 'Invoice no', value: (r) => invoiceOfPayment(r)?.invoiceNo }, { label: 'Fee', value: (r) => typeName(invoiceOfPayment(r)?.typeId ?? '') }, { label: 'Structure', value: (r) => structureName(invoiceOfPayment(r)?.structureId ?? '') }, { label: 'Amount', value: (r) => money(r.amount) }, { label: 'Method', value: (r) => r.method }, { label: 'Reference', value: (r) => r.reference || '—' }, { label: 'Date', value: (r) => formatDate(r.date) }, { label: 'Collected by', value: (r) => r.collectedBy }, { label: 'Notes', value: (r) => r.notes }] },
  ],
  stats: [
    { label: 'Receipts', value: (rows) => rows.length, icon: 'file-text' },
    { label: 'Collected', value: (rows) => money(sum(rows.filter((r) => r.status === 'Cleared'), (r) => r.amount)), tone: 'success', icon: 'trending-up' },
    { label: 'Pending clearance', value: (rows) => money(sum(rows.filter((r) => r.status === 'Pending Clearance'), (r) => r.amount)), tone: 'warning', icon: 'clock' },
    { label: 'Cancelled / refunded', value: (rows) => countBy(rows, (r) => r.status === 'Cancelled' || r.status === 'Refunded'), tone: 'danger', icon: 'x-circle' },
  ],
  views: [
    { key: 'all', label: 'All receipts', match: () => true },
    { key: 'today', label: "Today's collections", match: (r) => r.date === todayISO() },
    { key: 'cash', label: 'Cash', match: (r) => r.method === 'Cash' },
    { key: 'pending', label: 'Pending clearance', match: (r) => r.status === 'Pending Clearance' },
    { key: 'cancelled', label: 'Cancelled & refunded', match: (r) => r.status === 'Cancelled' || r.status === 'Refunded' },
  ],
  filters: [
    { key: 'method', label: 'Payment method', options: opts(PAYMENT_METHODS), match: (r, v) => r.method === v },
    { key: 'status', label: 'Status', options: opts(['Cleared', 'Pending Clearance', 'Cancelled', 'Refunded']), match: (r, v) => r.status === v },
    { key: 'by', label: 'Collected by', options: () => [...new Set(snapshot<FeePaymentRecord>('feePayments').map((p) => p.collectedBy))].map((n) => ({ label: n, value: n })), match: (r, v) => r.collectedBy === v },
  ],
  sorts: [
    { key: 'recent', label: 'Newest first', compare: (a, b) => b.date.localeCompare(a.date) || b.receiptNo.localeCompare(a.receiptNo) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.amount - a.amount },
  ],
  canCreate: false,
  canEdit: false,
  canDelete: false,
  form: [],
  actions: [
    {
      key: 'cancel',
      label: 'Cancel receipt',
      icon: 'x-circle',
      tone: 'danger',
      visible: (r) => r.status === 'Cleared' || r.status === 'Pending Clearance',
      form: { title: 'Cancel receipt', submitLabel: 'Cancel receipt', fields: [{ key: 'reason', label: 'Reason for Cancellation', type: 'textarea', required: true }] },
      run: (r, v, ctx) => {
        const inv = invoiceOfPayment(r);
        if (inv) {
          const paid = Math.max(0, inv.paid - r.amount);
          repo<FeeInvoiceRecord>('feeInvoices').update(inv.id, { paid, status: statusFromAmounts({ ...inv, paid }) });
        }
        ctx.update({ status: 'Cancelled', notes: `Cancelled: ${v.reason}` });
        ctx.toast('Receipt cancelled and invoice balance restored');
      },
    },
    {
      key: 'clear',
      label: 'Mark cheque cleared',
      icon: 'check-circle',
      tone: 'success',
      visible: (r) => r.status === 'Pending Clearance',
      run: (_r, _v, ctx) => { ctx.update({ status: 'Cleared' }); ctx.toast('Payment marked as cleared'); },
    },
    {
      key: 'email',
      label: 'Email receipt',
      icon: 'mail',
      manage: false,
      form: { title: 'Email receipt', submitLabel: 'Send', fields: [{ key: 'to', label: 'Recipient', type: 'email', required: true }], initial: (r) => ({ to: getStudent(r.studentId)?.email ?? '' }) },
      run: (r, v, ctx) => ctx.toast(`Receipt ${r.receiptNo} emailed to ${v.to}`, 'info'),
    },
  ],
};

/* ---------------- Fine management ---------------- */

const fineBalance = (f: FineRecord) => (f.status === 'Outstanding' ? Math.max(0, f.amount - f.paidAmount) : 0);

export const finesCfg: ResourceConfig<FineRecord> = {
  entity: 'Fine',
  collection: 'fines',
  rowScope: ownStudentScope,
  searchText: (r) => `${r.fineNo} ${studentName(r.studentId)} ${r.category} ${r.reason}`,
  code: (r) => r.fineNo,
  title: (r) => studentName(r.studentId),
  subtitle: (r) => `${classSection(getStudent(r.studentId))} · ${r.category}`,
  status: (r) => ({ label: r.status === 'Outstanding' && r.dueDate < todayISO() ? 'Overdue' : r.status, tone: r.status === 'Paid' ? 'success' : r.status === 'Waived' ? 'neutral' : r.dueDate < todayISO() ? 'danger' : 'warning' }),
  facts: [
    { label: 'Fine amount', value: (r) => money(r.amount) },
    { label: 'Outstanding', value: (r) => money(fineBalance(r)) },
    { label: 'Due date', value: (r) => formatDate(r.dueDate) },
    { label: 'Created by', value: (r) => r.createdBy },
  ],
  detail: [
    { title: 'Fine', items: [{ label: 'Fine ID', value: (r) => r.fineNo }, { label: 'Student', value: (r) => studentName(r.studentId) }, { label: 'Guardian', value: (r) => getStudent(r.studentId)?.parentName }, { label: 'Contact', value: (r) => getStudent(r.studentId)?.parentPhone }, { label: 'Category', value: (r) => r.category }, { label: 'Amount', value: (r) => money(r.amount) }, { label: 'Paid', value: (r) => money(r.paidAmount) }, { label: 'Issued on', value: (r) => formatDate(r.issuedOn) }, { label: 'Due date', value: (r) => formatDate(r.dueDate) }, { label: 'Remarks', value: (r) => r.reason }, { label: 'Waiver note', value: (r) => r.waiverNote || '—' }] },
  ],
  stats: [
    { label: 'Fines issued', value: (rows) => rows.length, icon: 'alert-triangle' },
    { label: 'Outstanding', value: (rows) => money(sum(rows, fineBalance)), tone: 'warning', icon: 'clock' },
    { label: 'Collected', value: (rows) => money(sum(rows, (r) => r.paidAmount)), tone: 'success', icon: 'trending-up' },
    { label: 'Waived', value: (rows) => countBy(rows, (r) => r.status === 'Waived'), tone: 'neutral', icon: 'slash' },
  ],
  views: [
    { key: 'all', label: 'All fines', match: () => true },
    { key: 'out', label: 'Outstanding dues', match: (r) => r.status === 'Outstanding' },
    { key: 'overdue', label: 'Overdue fines', match: (r) => r.status === 'Outstanding' && r.dueDate < todayISO() },
    { key: 'cleared', label: 'Cleared', match: (r) => r.status === 'Paid' },
    { key: 'waived', label: 'Waived', match: (r) => r.status === 'Waived' },
  ],
  filters: [
    { key: 'category', label: 'Fine category', options: opts(['Late Fee', 'Library', 'Damage', 'Discipline', 'Lost ID Card']), match: (r, v) => r.category === v },
    { key: 'status', label: 'Payment status', options: opts(['Outstanding', 'Paid', 'Waived']), match: (r, v) => r.status === v },
    { key: 'class', label: 'Class', options: () => snapshot<{ id: string; name: string }>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => getStudent(r.studentId)?.classId === v },
  ],
  sorts: [
    { key: 'due', label: 'Due date (soonest)', compare: (a, b) => a.dueDate.localeCompare(b.dueDate) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.amount - a.amount },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
  ],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: studentOptions },
    { key: 'category', label: 'Fine Category', type: 'select', required: true, options: opts(['Late Fee', 'Library', 'Damage', 'Discipline', 'Lost ID Card']) },
    { key: 'amount', label: 'Fine Amount', type: 'money', required: true, min: 1 },
    { key: 'dueDate', label: 'Due Date', type: 'date', required: true },
    { key: 'reason', label: 'Reason / Remarks', type: 'textarea', required: true },
  ],
  prepare: (_v, { existing, rows }) => ({
    fineNo: existing?.fineNo ?? nextNo('FN-', rows.map((r) => r.fineNo), 3),
    issuedOn: existing?.issuedOn ?? todayISO(),
    createdBy: existing?.createdBy ?? 'Accounts Office',
    paidAmount: existing?.paidAmount ?? 0,
    status: existing?.status ?? 'Outstanding',
    waiverNote: existing?.waiverNote ?? '',
  }),
  editable: (r) => r.status === 'Outstanding',
  actions: [
    {
      key: 'pay',
      label: 'Record payment',
      icon: 'credit-card',
      tone: 'success',
      visible: (r) => r.status === 'Outstanding',
      form: {
        title: 'Record fine payment',
        fields: [{ key: 'amount', label: 'Amount', type: 'money', required: true, min: 1 }, { key: 'method', label: 'Payment Mode', type: 'select', required: true, options: opts(PAYMENT_METHODS), default: 'Cash' }],
        initial: (r) => ({ amount: String(fineBalance(r)) }),
        validate: (v, r) => (Number(v.amount) > fineBalance(r) ? { amount: `Cannot exceed ${money(fineBalance(r))}` } : {}),
      },
      run: (r, v, ctx) => {
        const paidAmount = r.paidAmount + v.amount;
        ctx.update({ paidAmount, status: paidAmount >= r.amount ? 'Paid' : 'Outstanding' });
        ctx.toast(paidAmount >= r.amount ? 'Fine cleared' : `${money(v.amount)} recorded`);
      },
    },
    {
      key: 'waive',
      label: 'Waive fine',
      icon: 'slash',
      visible: (r) => r.status === 'Outstanding',
      form: { title: 'Waive fine', submitLabel: 'Waive', fields: [{ key: 'note', label: 'Approval Note', type: 'textarea', required: true }] },
      run: (_r, v, ctx) => { ctx.update({ status: 'Waived', waiverNote: v.note }); ctx.toast('Fine waived'); },
    },
  ],
};

/* ---------------- Scholarships ---------------- */

export const scholarshipsCfg: ResourceConfig<ScholarshipRecord> = {
  entity: 'Scholarship',
  collection: 'scholarships',
  rowScope: ownStudentScope,
  searchText: (r) => `${r.schNo} ${studentName(r.studentId)} ${r.name} ${r.sponsor}`,
  code: (r) => r.schNo,
  title: (r) => studentName(r.studentId),
  subtitle: (r) => `${classSection(getStudent(r.studentId))} · ${r.name}`,
  status: (r) => ({ label: r.approval, tone: r.approval === 'Approved' ? 'success' : r.approval === 'Pending' ? 'warning' : r.approval === 'Rejected' ? 'danger' : 'neutral' }),
  badges: (r) => [{ label: r.type, tone: 'purple' }, ...(r.renewal === 'Due' ? [{ label: 'Renewal due', tone: 'warning' as Tone }] : [])],
  facts: [
    { label: 'Coverage', value: (r) => pct(r.coveragePct) },
    { label: 'Award amount', value: (r) => money(r.awardAmount) },
    { label: 'Academic year', value: (r) => r.academicYear },
    { label: 'Effective', value: (r) => `${formatDate(r.effectiveFrom)} →` },
  ],
  detail: [
    { title: 'Award', items: [{ label: 'Scholarship ID', value: (r) => r.schNo }, { label: 'Student', value: (r) => studentName(r.studentId) }, { label: 'Name', value: (r) => r.name }, { label: 'Type', value: (r) => r.type }, { label: 'Coverage', value: (r) => pct(r.coveragePct) }, { label: 'Award amount', value: (r) => money(r.awardAmount) }, { label: 'Effective from', value: (r) => formatDate(r.effectiveFrom) }, { label: 'Effective to', value: (r) => formatDate(r.effectiveTo) }] },
    { title: 'Review', items: [{ label: 'Approval', value: (r) => r.approval }, { label: 'Renewal', value: (r) => r.renewal }, { label: 'Sponsor', value: (r) => r.sponsor }, { label: 'Notes', value: (r) => r.notes || '—' }] },
  ],
  stats: [
    { label: 'Scholarships', value: (rows) => rows.length, icon: 'award' },
    { label: 'Approved', value: (rows) => countBy(rows, (r) => r.approval === 'Approved'), tone: 'success', icon: 'check-circle' },
    { label: 'Awaiting', value: (rows) => countBy(rows, (r) => r.approval === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Total awarded', value: (rows) => money(sum(rows.filter((r) => r.approval === 'Approved'), (r) => r.awardAmount)), tone: 'purple', icon: 'dollar-sign' },
  ],
  views: [
    { key: 'all', label: 'All scholarships', match: () => true },
    { key: 'approved', label: 'Approved & active', match: (r) => r.approval === 'Approved' },
    { key: 'pending', label: 'Awaiting approval', match: (r) => r.approval === 'Pending' },
    { key: 'renew', label: 'Renewal due', match: (r) => r.renewal === 'Due' },
    { key: 'expired', label: 'Expired', match: (r) => r.approval === 'Expired' },
  ],
  filters: [
    { key: 'type', label: 'Scholarship type', options: opts(['Merit', 'Need-based', 'Sports', 'Talent']), match: (r, v) => r.type === v },
    { key: 'approval', label: 'Approval status', options: opts(['Approved', 'Pending', 'Rejected', 'Expired']), match: (r, v) => r.approval === v },
    { key: 'renewal', label: 'Renewal status', options: opts(['Not due', 'Due', 'Renewed']), match: (r, v) => r.renewal === v },
    { key: 'class', label: 'Class', options: () => snapshot<{ id: string; name: string }>('classes').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => getStudent(r.studentId)?.classId === v },
  ],
  sorts: [
    { key: 'amount', label: 'Award (high to low)', compare: (a, b) => b.awardAmount - a.awardAmount },
    { key: 'student', label: 'Student (A–Z)', compare: (a, b) => studentName(a.studentId).localeCompare(studentName(b.studentId)) },
    { key: 'effective', label: 'Effective date', compare: (a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom) },
  ],
  form: [
    { key: 'studentId', label: 'Student', type: 'select', required: true, optionsFrom: studentOptions },
    { key: 'name', label: 'Scholarship Name', type: 'text', required: true },
    { key: 'type', label: 'Scholarship Type', type: 'select', required: true, options: opts(['Merit', 'Need-based', 'Sports', 'Talent']) },
    { key: 'coveragePct', label: 'Coverage %', type: 'number', required: true, min: 1, max: 100 },
    { key: 'awardAmount', label: 'Award Amount', type: 'money', required: true, min: 1 },
    { key: 'sponsor', label: 'Sponsor', type: 'text', required: true },
    { key: 'academicYear', label: 'Academic Year', type: 'select', options: opts(academicYears), default: ACADEMIC_YEAR },
    { key: 'effectiveFrom', label: 'Effective From', type: 'date', required: true },
    { key: 'effectiveTo', label: 'Effective To', type: 'date', required: true },
    { key: 'notes', label: 'Note', type: 'textarea' },
  ],
  defaults: () => ({ effectiveFrom: todayISO() }),
  validate: (v) => (String(v.effectiveTo) < String(v.effectiveFrom) ? { effectiveTo: 'Must be on or after the start date' } : {}),
  prepare: (_v, { existing, rows }) => ({
    schNo: existing?.schNo ?? nextNo('SCH-', rows.map((r) => r.schNo), 3),
    approval: existing?.approval ?? 'Pending',
    renewal: existing?.renewal ?? 'Not due',
  }),
  actions: [
    { key: 'approve', label: 'Approve', icon: 'check', tone: 'success', visible: (r) => r.approval === 'Pending', run: (_r, _v, ctx) => { ctx.update({ approval: 'Approved' }); ctx.toast('Scholarship approved'); } },
    { key: 'reject', label: 'Reject', icon: 'x', tone: 'danger', visible: (r) => r.approval === 'Pending', form: { title: 'Reject scholarship', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] }, run: (_r, v, ctx) => { ctx.update({ approval: 'Rejected', notes: v.reason }); ctx.toast('Scholarship rejected', 'info'); } },
    { key: 'renew', label: 'Mark renewed', icon: 'refresh-cw', visible: (r) => r.approval === 'Approved' && r.renewal === 'Due', run: (_r, _v, ctx) => { ctx.update({ renewal: 'Renewed' }); ctx.toast('Scholarship renewed'); } },
  ],
};

/* ---------------- Expense categories ---------------- */

const spentIn = (catId: string) => sum(snapshot<ExpenseRecord>('expenses').filter((e) => e.categoryId === catId && (e.status === 'Approved' || e.status === 'Paid')), (e) => e.amount);
const categoryName = (id: string) => snapshot<ExpenseCategoryRecord>('expenseCategories').find((c) => c.id === id)?.name ?? '—';

export const expenseCategoriesCfg: ResourceConfig<ExpenseCategoryRecord> = {
  entity: 'Category',
  collection: 'expenseCategories',
  searchText: (r) => `${r.name} ${r.code} ${r.description}`,
  code: (r) => r.code,
  title: (r) => r.name,
  subtitle: (r) => (r.parentId ? `Under ${categoryName(r.parentId)}` : r.description),
  status: (r) => ({ label: r.status, tone: r.status === 'Active' ? 'success' : 'neutral' }),
  facts: [
    { label: 'Annual budget', value: (r) => money(r.annualBudget) },
    { label: 'Spent', value: (r) => money(spentIn(r.id)) },
    { label: 'Per-expense limit', value: (r) => money(r.perExpenseLimit) },
    { label: 'Approval', value: (r) => r.approval },
  ],
  progress: (r) => ({ value: spentIn(r.id), max: r.annualBudget, label: 'Budget utilisation', tone: spentIn(r.id) / r.annualBudget > 0.85 ? 'danger' : spentIn(r.id) / r.annualBudget > 0.6 ? 'warning' : 'success' }),
  detail: [
    { title: 'Category', items: [{ label: 'Code', value: (r) => r.code }, { label: 'Parent', value: (r) => (r.parentId ? categoryName(r.parentId) : 'Top level') }, { label: 'Description', value: (r) => r.description }, { label: 'Tax treatment', value: (r) => r.tax }] },
    { title: 'Budget', items: [{ label: 'Annual budget', value: (r) => money(r.annualBudget) }, { label: 'Spent', value: (r) => money(spentIn(r.id)) }, { label: 'Remaining', value: (r) => money(r.annualBudget - spentIn(r.id)) }, { label: 'Per-expense limit', value: (r) => money(r.perExpenseLimit) }, { label: 'Approval required', value: (r) => r.approval }, { label: 'Expenses recorded', value: (r) => countBy(snapshot<ExpenseRecord>('expenses'), (e) => e.categoryId === r.id) }] },
  ],
  stats: [
    { label: 'Categories', value: (rows) => rows.length, icon: 'tag' },
    { label: 'Annual budget', value: (rows) => money(sum(rows, (r) => r.annualBudget)), tone: 'info', icon: 'pie-chart' },
    { label: 'Spent', value: (rows) => money(sum(rows, (r) => spentIn(r.id))), tone: 'warning', icon: 'trending-down' },
  ],
  views: [
    { key: 'all', label: 'All categories', match: () => true },
    { key: 'top', label: 'Top level', match: (r) => !r.parentId },
    { key: 'sub', label: 'Sub-categories', match: (r) => !!r.parentId },
    { key: 'inactive', label: 'Inactive', match: (r) => r.status === 'Inactive' },
  ],
  filters: [
    { key: 'approval', label: 'Approval requirement', options: opts(['None', 'Department Head', 'Principal']), match: (r, v) => r.approval === v },
    { key: 'status', label: 'Status', options: ACTIVE_STATUS, match: (r, v) => r.status === v },
  ],
  sorts: [
    { key: 'name', label: 'Name (A–Z)', compare: (a, b) => a.name.localeCompare(b.name) },
    { key: 'budget', label: 'Budget (high to low)', compare: (a, b) => b.annualBudget - a.annualBudget },
    { key: 'spent', label: 'Spent (high to low)', compare: (a, b) => spentIn(b.id) - spentIn(a.id) },
  ],
  form: [
    { key: 'name', label: 'Category Name', type: 'text', required: true },
    { key: 'code', label: 'Category Code', type: 'text', required: true },
    { key: 'parentId', label: 'Parent Category', type: 'select', optionsFrom: { collection: 'expenseCategories', label: (c: ExpenseCategoryRecord) => c.name, filter: (c: ExpenseCategoryRecord) => !c.parentId } },
    { key: 'annualBudget', label: 'Annual Budget', type: 'money', required: true, min: 0 },
    { key: 'perExpenseLimit', label: 'Per-Expense Limit', type: 'money', required: true, min: 0 },
    { key: 'approval', label: 'Approval Requirement', type: 'select', required: true, options: opts(['None', 'Department Head', 'Principal']), default: 'Department Head' },
    { key: 'tax', label: 'Tax Treatment', type: 'select', required: true, options: opts(['Taxable', 'Exempt', 'GST 18%']), default: 'Exempt' },
    { key: 'status', label: 'Status', type: 'select', options: ACTIVE_STATUS, default: 'Active' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  defaults: (rows) => ({ code: nextNo('EC-', rows.map((r) => r.code), 3) }),
  validate: (v, { existing, rows }) => ({
    ...(rows.some((r) => r.id !== existing?.id && r.code.toLowerCase() === String(v.code).trim().toLowerCase()) ? { code: 'This code is already used' } : {}),
    ...(Number(v.perExpenseLimit) > Number(v.annualBudget) ? { perExpenseLimit: 'Cannot exceed the annual budget' } : {}),
    ...(existing && v.parentId === existing.id ? { parentId: 'A category cannot be its own parent' } : {}),
  }),
};

/* ---------------- Expenses ---------------- */

const limitOf = (e: ExpenseRecord) => snapshot<ExpenseCategoryRecord>('expenseCategories').find((c) => c.id === e.categoryId)?.perExpenseLimit ?? Infinity;

export const expensesCfg: ResourceConfig<ExpenseRecord> = {
  entity: 'Expense',
  collection: 'expenses',
  searchText: (r) => `${r.expenseNo} ${r.title} ${r.vendor} ${r.employee} ${r.department} ${categoryName(r.categoryId)}`,
  code: (r) => r.expenseNo,
  title: (r) => r.title,
  subtitle: (r) => `${categoryName(r.categoryId)} · ${r.vendor}`,
  status: (r) => ({ label: r.status, tone: r.status === 'Paid' || r.status === 'Approved' ? 'success' : r.status === 'Pending' ? 'warning' : r.status === 'Rejected' ? 'danger' : 'info' }),
  badges: (r) => [{ label: `${r.priority} priority`, tone: r.priority === 'High' ? 'danger' : r.priority === 'Low' ? 'neutral' : 'info' }, ...(r.amount > limitOf(r) ? [{ label: 'Over limit', tone: 'warning' as Tone }] : [])],
  facts: [
    { label: 'Amount', value: (r) => money(r.amount) },
    { label: 'Submitted by', value: (r) => r.employee },
    { label: 'Department', value: (r) => r.department },
    { label: 'Expense date', value: (r) => formatDate(r.expenseDate) },
  ],
  detail: [
    { title: 'Expense', items: [{ label: 'Expense ID', value: (r) => r.expenseNo }, { label: 'Title', value: (r) => r.title }, { label: 'Amount', value: (r) => money(r.amount) }, { label: 'Category', value: (r) => categoryName(r.categoryId) }, { label: 'Vendor', value: (r) => r.vendor }, { label: 'Payment method', value: (r) => r.method }, { label: 'Reference', value: (r) => r.reference || '—' }, { label: 'Description', value: (r) => r.description }] },
    { title: 'Submission', items: [{ label: 'Employee', value: (r) => r.employee }, { label: 'Department', value: (r) => r.department }, { label: 'Expense date', value: (r) => formatDate(r.expenseDate) }, { label: 'Submitted', value: (r) => formatDate(r.submittedDate) }, { label: 'Priority', value: (r) => r.priority }] },
  ],
  stats: [
    { label: 'Expenses', value: (rows) => rows.length, icon: 'file-text' },
    { label: 'Total claimed', value: (rows) => money(sum(rows, (r) => r.amount)), tone: 'info', icon: 'dollar-sign' },
    { label: 'Awaiting approval', value: (rows) => countBy(rows, (r) => r.status === 'Pending'), tone: 'warning', icon: 'clock' },
    { label: 'Paid out', value: (rows) => money(sum(rows.filter((r) => r.status === 'Paid'), (r) => r.amount)), tone: 'success', icon: 'check-circle' },
  ],
  views: [
    { key: 'all', label: 'All expenses', match: () => true },
    { key: 'pending', label: 'Pending', match: (r) => r.status === 'Pending' },
    { key: 'approved', label: 'Approved', match: (r) => r.status === 'Approved' },
    { key: 'paid', label: 'Paid', match: (r) => r.status === 'Paid' },
    { key: 'other', label: 'Rejected / sent back', match: (r) => r.status === 'Rejected' || r.status === 'Sent Back' },
  ],
  filters: [
    { key: 'category', label: 'Category', options: () => snapshot<ExpenseCategoryRecord>('expenseCategories').map((c) => ({ label: c.name, value: c.id })), match: (r, v) => r.categoryId === v },
    { key: 'dept', label: 'Department', options: () => [...new Set(snapshot<ExpenseRecord>('expenses').map((e) => e.department))].map((d) => ({ label: d, value: d })), match: (r, v) => r.department === v },
    { key: 'status', label: 'Approval status', options: opts(['Pending', 'Approved', 'Paid', 'Rejected', 'Sent Back']), match: (r, v) => r.status === v },
    { key: 'method', label: 'Payment method', options: opts(PAYMENT_METHODS), match: (r, v) => r.method === v },
    { key: 'priority', label: 'Priority', options: opts(['High', 'Normal', 'Low']), match: (r, v) => r.priority === v },
  ],
  sorts: [
    { key: 'recent', label: 'Newest first', compare: (a, b) => b.expenseDate.localeCompare(a.expenseDate) },
    { key: 'amount', label: 'Amount (high to low)', compare: (a, b) => b.amount - a.amount },
    { key: 'title', label: 'Title (A–Z)', compare: (a, b) => a.title.localeCompare(b.title) },
  ],
  form: [
    { key: 'title', label: 'Expense Title', type: 'text', required: true },
    { key: 'amount', label: 'Amount', type: 'money', required: true, min: 1 },
    { key: 'categoryId', label: 'Category', type: 'select', required: true, optionsFrom: { collection: 'expenseCategories', label: (c: ExpenseCategoryRecord) => c.name, hint: (c: ExpenseCategoryRecord) => `Limit ${money(c.perExpenseLimit)}`, filter: (c: ExpenseCategoryRecord) => c.status === 'Active' } },
    { key: 'department', label: 'Department', type: 'select', required: true, options: opts(['Operations', 'Science', 'IT', 'Transport', 'Events', 'Examinations', 'Library', 'Physical Education', 'Administration']) },
    { key: 'employee', label: 'Expense Owner', type: 'text', required: true },
    { key: 'vendor', label: 'Vendor', type: 'text', required: true },
    { key: 'method', label: 'Payment Method', type: 'select', required: true, options: opts(PAYMENT_METHODS), default: 'Cash' },
    { key: 'expenseDate', label: 'Expense Date', type: 'date', required: true },
    { key: 'priority', label: 'Priority', type: 'select', options: opts(['Low', 'Normal', 'High']), default: 'Normal' },
    { key: 'description', label: 'Description', type: 'textarea' },
  ],
  defaults: () => ({ expenseDate: todayISO() }),
  validate: (v) => (String(v.expenseDate) > todayISO() ? { expenseDate: 'Expense date cannot be in the future' } : {}),
  prepare: (_v, { existing, rows }) => ({
    expenseNo: existing?.expenseNo ?? nextNo('EXP-2026-', rows.map((r) => r.expenseNo), 3),
    submittedDate: existing?.submittedDate ?? todayISO(),
    status: existing?.status ?? 'Pending',
    reference: existing?.reference ?? '',
  }),
  editable: (r) => r.status === 'Pending' || r.status === 'Sent Back',
  actions: [
    { key: 'approve', label: 'Approve', icon: 'check', tone: 'success', visible: (r) => r.status === 'Pending', run: (_r, _v, ctx) => { ctx.update({ status: 'Approved' }); ctx.toast('Expense approved'); } },
    { key: 'reject', label: 'Reject', icon: 'x', tone: 'danger', visible: (r) => r.status === 'Pending', form: { title: 'Reject expense', submitLabel: 'Reject', fields: [{ key: 'reason', label: 'Reason', type: 'textarea', required: true }] }, run: (r, v, ctx) => { ctx.update({ status: 'Rejected', description: `${r.description} — Rejected: ${v.reason}` }); ctx.toast('Expense rejected', 'info'); } },
    { key: 'back', label: 'Send back', icon: 'corner-up-left', visible: (r) => r.status === 'Pending', form: { title: 'Send back for changes', submitLabel: 'Send back', fields: [{ key: 'note', label: 'What needs fixing?', type: 'textarea', required: true }] }, run: (r, v, ctx) => { ctx.update({ status: 'Sent Back', description: `${r.description} — Sent back: ${v.note}` }); ctx.toast('Sent back to submitter', 'info'); } },
    { key: 'resubmit', label: 'Resubmit', icon: 'send', visible: (r) => r.status === 'Sent Back', run: (_r, _v, ctx) => { ctx.update({ status: 'Pending' }); ctx.toast('Resubmitted for approval'); } },
    { key: 'pay', label: 'Record payment', icon: 'credit-card', tone: 'success', visible: (r) => r.status === 'Approved', form: { title: 'Record payment', fields: [{ key: 'method', label: 'Payment Method', type: 'select', required: true, options: opts(PAYMENT_METHODS) }, { key: 'reference', label: 'Reference No', type: 'text', required: true }], initial: (r) => ({ method: r.method }) }, run: (_r, v, ctx) => { ctx.update({ status: 'Paid', method: v.method, reference: v.reference }); ctx.toast('Payment recorded'); } },
  ],
};

export { num };
