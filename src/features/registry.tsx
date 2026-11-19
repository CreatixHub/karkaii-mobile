/**
 * Page registry: route page-key -> component. A page missing from here shows "being rebuilt" in the hub
 * (see FRONTEND_TO_MOBILE_VERIFICATION.md for the live status of each page).
 */
import React from 'react';
import type { Entity } from '@/core/store/store';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { ResourceScreen } from '@/features/engine/ResourceScreen';
import type { ResourceConfig } from '@/features/engine/types';
import {
  dueReportsCfg,
  expenseCategoriesCfg,
  expensesCfg,
  feeCollectionCfg,
  feeGroupsCfg,
  feeStructureCfg,
  feeTypesCfg,
  feesAssignCfg,
  finesCfg,
  receiptsCfg,
  scholarshipsCfg,
} from '@/features/finance/configs';
import type { HolidayRecord } from '@/data/seed/hrm';
import { HolidayCalendar } from '@/features/hrm/HolidayCalendar';
import { holidaysCfg, leavesCfg, staffAttendanceCfg, studentAttendanceCfg, teacherAttendanceCfg } from '@/features/hrm/configs';

export type PageComponent = React.ComponentType<{ breadcrumb: string }>;

function resource<T extends Entity>(cfg: ResourceConfig<T>): PageComponent {
  return function ResourcePage({ breadcrumb }) {
    return <ResourceScreen cfg={cfg} breadcrumb={breadcrumb} />;
  };
}

const dashboard = (kind: 'admin' | 'teacher' | 'student' | 'parent'): PageComponent =>
  function Dashboard() {
    return <DashboardPage kind={kind} />;
  };

const holidaysWithCalendar: ResourceConfig<HolidayRecord> = {
  ...holidaysCfg,
  header: (rows) => <HolidayCalendar rows={rows} />,
};

export const PAGES: Record<string, PageComponent> = {
  // Main
  'admin-dashboard': dashboard('admin'),
  'teacher-dashboard': dashboard('teacher'),
  'student-dashboard': dashboard('student'),
  'parent-dashboard': dashboard('parent'),

  // HRM
  holidays: resource(holidaysWithCalendar),
  'student-attendance': resource(studentAttendanceCfg),
  'teacher-attendance': resource(teacherAttendanceCfg),
  'staff-attendance': resource(staffAttendanceCfg),
  'leave-list': resource(leavesCfg),

  // Finance & Accounts
  'fee-structure': resource(feeStructureCfg),
  'fees-assign': resource(feesAssignCfg),
  'fee-collection': resource(feeCollectionCfg),
  'fee-types': resource(feeTypesCfg),
  'fee-groups': resource(feeGroupsCfg),
  'fine-management': resource(finesCfg),
  scholarships: resource(scholarshipsCfg),
  'due-reports': resource(dueReportsCfg),
  receipts: resource(receiptsCfg),
  expenses: resource(expensesCfg),
  'expense-categories': resource(expenseCategoriesCfg),
};
