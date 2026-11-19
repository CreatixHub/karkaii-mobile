import type React from 'react';
import type { Feather } from '@expo/vector-icons';
import type { Entity } from '@/core/store/store';
import type { Tone } from '@/ui/tone';
import type { Option } from '@/ui/Fields';
import type { RoleKey } from '@/core/auth/access';
import type { MockUser } from '@/core/auth/AuthProvider';

export type IconName = React.ComponentProps<typeof Feather>['name'];

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'money'
  | 'email'
  | 'phone'
  | 'date'
  | 'time'
  | 'select'
  | 'multiselect'
  | 'switch';

export type FormValues = Record<string, any>;
/** Field key -> message. Undefined entries are ignored, so `cond ? { f: 'msg' } : {}` type-checks. */
export type FieldErrors = Record<string, string | undefined>;

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Fixed option list. */
  options?: Option[] | string[];
  /** Options built from another collection, so related records stay linked by id. */
  optionsFrom?: {
    collection: string;
    label: (r: any) => string;
    hint?: (r: any) => string;
    filter?: (r: any, values: FormValues) => boolean;
  };
  placeholder?: string;
  hint?: string;
  min?: number;
  max?: number;
  default?: string | number | boolean | string[];
  /** Heading shown above this field (and the following ones until the next `section`). */
  section?: string;
  hidden?: (values: FormValues) => boolean;
  readOnly?: (values: FormValues, isEdit: boolean) => boolean;
  /** When this field changes, return extra values to set (e.g. choose a student -> fill the class). */
  onChange?: (value: any, values: FormValues, lookup: (collection: string, id: string) => any) => FormValues | void;
}

export interface BadgeDef {
  label: string;
  tone: Tone;
}

export interface StatDef<T> {
  label: string;
  value: (rows: T[]) => string | number;
  tone?: Tone;
  icon?: IconName;
}

export interface ViewDef<T> {
  key: string;
  label: string;
  match: (r: T) => boolean;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  options: Option[] | ((rows: T[]) => Option[]);
  match: (r: T, value: string) => boolean;
  /** Allow picking several values (default true). */
  single?: boolean;
}

export interface SortDef<T> {
  key: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export interface ActionContext<T extends Entity> {
  update: (patch: Partial<T>) => void;
  remove: () => void;
  toast: (message: string, kind?: 'success' | 'error' | 'info') => void;
  rows: T[];
  role: RoleKey | null;
  /** Open the system share sheet with some text (receipts, notices, reports). */
  share: (title: string, message: string) => void;
}

export interface ActionDef<T extends Entity> {
  key: string;
  label: string;
  icon: IconName;
  tone?: 'default' | 'danger' | 'success';
  /** Hidden when this returns false. */
  visible?: (r: T, role: RoleKey | null) => boolean;
  /** Ask for confirmation first. */
  confirm?: string;
  /** Collect input first (reject reason, payment amount…). */
  form?: {
    title: string;
    fields: FieldDef[];
    submitLabel?: string;
    initial?: (r: T) => FormValues;
    validate?: (values: FormValues, r: T) => FieldErrors;
  };
  /** Needs manage permission (default true). Set false for actions read-only roles may use. */
  manage?: boolean;
  run: (r: T, values: FormValues, ctx: ActionContext<T>) => void;
}

export interface BulkActionDef<T extends Entity> {
  key: string;
  label: string;
  icon: IconName;
  /** Collect input first (status to apply, message to send…). */
  form?: { title: string; fields: FieldDef[]; submitLabel?: string; validate?: (values: FormValues) => FieldErrors };
  run: (
    rows: T[],
    values: FormValues,
    ctx: { updateMany: (fn: (r: T) => Partial<T>) => void; toast: ActionContext<T>['toast']; role: RoleKey | null },
  ) => void;
}

export interface PageActionContext<T extends Entity> {
  /** Every record in the collection. */
  rows: T[];
  /** Records currently visible (after date, view, search and filters). */
  visible: T[];
  /** Selected date when the page has a date filter ('all' when "All dates" is on). */
  date?: string;
  create: (input: Omit<T, 'id'>) => T;
  updateMany: (ids: string[], fn: (r: T) => Partial<T>) => void;
  toast: ActionContext<T>['toast'];
  role: RoleKey | null;
  share: (title: string, message: string) => void;
}

/** A button in the page header that acts on the page as a whole (bulk apply, import, mark all present). */
export interface PageActionDef<T extends Entity> {
  key: string;
  label: string;
  icon: IconName;
  /** Needs manage permission (default true). */
  manage?: boolean;
  form?: { title: string; fields: FieldDef[]; submitLabel?: string; validate?: (values: FormValues) => FieldErrors };
  run: (values: FormValues, ctx: PageActionContext<T>) => void;
}

export interface ResourceConfig<T extends Entity> {
  /** Singular name used in buttons and messages ("Fee Type"). */
  entity: string;
  collection: string;
  /** Shown over the search box. */
  searchPlaceholder?: string;
  searchText: (r: T) => string;
  /** Row-level visibility for the signed-in user (students see only their own records, etc.). Mirrors API scoping. */
  rowScope?: (r: T, user: MockUser | null) => boolean;

  // Card
  code?: (r: T) => string | undefined;
  title: (r: T) => string;
  subtitle?: (r: T) => string | undefined;
  status?: (r: T) => BadgeDef;
  badges?: (r: T) => BadgeDef[];
  /** Label / value pairs shown on the card body. */
  facts: { label: string; value: (r: T) => string | number | undefined | null }[];
  progress?: (r: T) => { value: number; max: number; label: string; tone?: Tone } | undefined;

  // Detail sheet (falls back to `facts`)
  detail?: { title: string; items: { label: string; value: (r: T) => string | number | undefined | null }[] }[];
  extra?: (r: T) => React.ReactNode;

  /** Page is a per-day register: rows are scoped to one date (default today) with a date stepper. */
  dateFilter?: { key: string; label?: string; allowAll?: boolean };
  /** Header buttons that act on the page as a whole. */
  pageActions?: PageActionDef<T>[];
  /** Extra content above the list (e.g. a calendar). Receives the date-scoped rows. */
  header?: (rows: T[]) => React.ReactNode;

  stats?: StatDef<T>[];
  views?: ViewDef<T>[];
  filters?: FilterDef<T>[];
  sorts?: SortDef<T>[];

  // Form
  form: FieldDef[];
  /** Initial values for "Add" (e.g. next code). */
  defaults?: (rows: T[], ctx: { date?: string }) => FormValues;
  /** Extra validation on top of required / type checks. Return { field: message }. */
  validate?: (values: FormValues, ctx: { existing?: T; rows: T[] }) => FieldErrors;
  /** Computed fields saved with the record (balances, codes, derived names…). */
  prepare?: (values: FormValues, ctx: { existing?: T; rows: T[]; lookup: (collection: string, id: string) => any }) => Partial<T>;

  actions?: ActionDef<T>[];
  bulk?: BulkActionDef<T>[];

  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Extra guard, e.g. only unpaid records can be edited. */
  editable?: (r: T) => boolean;

  exportColumns?: { label: string; value: (r: T) => string | number | undefined | null }[];
}
