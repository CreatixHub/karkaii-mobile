/**
 * The mobile navigation tree. Mirrors karkaii-frontend/src/core/data/json/sidebarData.tsx
 * (7 sections, 17 modules, 59 pages) one-to-one; page keys become route segments: /<section>/<pageKey>.
 */
export type IconName = React.ComponentProps<typeof import('@expo/vector-icons').Feather>['name'];

export interface PageDef {
  key: string;
  label: string;
  icon: IconName;
}

export interface ModuleDef {
  /** Matches the module label used by the frontend's access rules (sidebarAccess.ts). */
  label: string;
  icon: IconName;
  pages: PageDef[];
}

export interface SectionDef {
  /** Route folder under src/app/(app)/. */
  key: 'dashboard' | 'people' | 'academic' | 'hrm' | 'finance' | 'campus' | 'reports' | 'communication' | 'administration';
  label: string;
  icon: IconName;
  color: string;
  modules: ModuleDef[];
}

const p = (key: string, label: string, icon: IconName): PageDef => ({ key, label, icon });

export const MENU: SectionDef[] = [
  {
    key: 'dashboard',
    label: 'Main',
    icon: 'home',
    color: '#3D5EE1',
    modules: [
      {
        label: 'Dashboard',
        icon: 'layout',
        pages: [
          p('admin-dashboard', 'Admin Dashboard', 'grid'),
          p('teacher-dashboard', 'Teacher Dashboard', 'user-check'),
          p('student-dashboard', 'Student Dashboard', 'book'),
          p('parent-dashboard', 'Parent Dashboard', 'users'),
        ],
      },
    ],
  },
  {
    key: 'people',
    label: 'People & Admission',
    icon: 'users',
    color: '#7C5CE1',
    modules: [
      {
        label: 'Students',
        icon: 'user',
        pages: [
          p('students', 'Students', 'users'),
          p('student-profile', 'Student Profile', 'user'),
          p('admissions', 'Admissions', 'user-plus'),
          p('student-promotion', 'Student Promotion', 'trending-up'),
          p('alumni', 'Alumni', 'award'),
          p('student-attendance-history', 'Student Attendance History', 'clock'),
          p('student-documents', 'Student Documents', 'folder'),
        ],
      },
      {
        label: 'Teachers',
        icon: 'user-check',
        pages: [
          p('teachers', 'Teachers', 'users'),
          p('add-teacher', 'Add Teacher', 'user-plus'),
          p('teacher-profile', 'Teacher Profile', 'user'),
          p('teacher-routine', 'Routine', 'calendar'),
        ],
      },
      {
        label: 'Staff',
        icon: 'briefcase',
        pages: [
          p('staff-list', 'Staff List', 'list'),
          p('departments', 'Departments', 'layers'),
          p('designation', 'Designation', 'tag'),
        ],
      },
      {
        label: 'Users',
        icon: 'shield',
        pages: [
          p('users', 'Users', 'users'),
          p('roles-permissions', 'Roles & Permissions', 'lock'),
          p('delete-account-requests', 'Delete Account Request', 'user-x'),
        ],
      },
    ],
  },
  {
    key: 'academic',
    label: 'Academic',
    icon: 'book-open',
    color: '#0F9D8A',
    modules: [
      {
        label: 'Classes & Sections',
        icon: 'home',
        pages: [
          p('classes', 'Classes', 'grid'),
          p('classrooms', 'Classrooms', 'monitor'),
          p('sections', 'Sections', 'columns'),
        ],
      },
      { label: 'Subjects', icon: 'book', pages: [p('subjects', 'Subjects', 'book')] },
      {
        label: 'Timetable',
        icon: 'calendar',
        pages: [p('class-timetable', 'Class Timetable', 'calendar'), p('teacher-timetable', 'Teacher Timetable', 'clock')],
      },
      {
        label: 'Learning',
        icon: 'file-text',
        pages: [p('study-materials', 'Study Materials', 'file-text'), p('homework', 'Homework', 'edit-3')],
      },
    ],
  },
  {
    key: 'hrm',
    label: 'HRM',
    icon: 'briefcase',
    color: '#E07B1F',
    modules: [
      { label: 'Holidays', icon: 'sun', pages: [p('holidays', 'Holidays', 'sun')] },
      {
        label: 'Attendance',
        icon: 'check-square',
        pages: [
          p('student-attendance', 'Student Attendance', 'check-square'),
          p('teacher-attendance', 'Teacher Attendance', 'check-circle'),
          p('staff-attendance', 'Staff Attendance', 'check'),
          p('leave-list', 'Leave List', 'log-out'),
        ],
      },
    ],
  },
  {
    key: 'finance',
    label: 'Finance & Accounts',
    icon: 'credit-card',
    color: '#2E9B5A',
    modules: [
      {
        label: 'Fees',
        icon: 'dollar-sign',
        pages: [
          p('fee-structure', 'Fee Structure', 'layers'),
          p('fees-assign', 'Fees Assign', 'user-check'),
          p('fee-collection', 'Fee Collection', 'credit-card'),
          p('fee-types', 'Fees Type (Fee Categories)', 'tag'),
          p('fee-groups', 'Fee Groups', 'folder'),
          p('fine-management', 'Fine Management', 'alert-triangle'),
          p('scholarships', 'Scholarships', 'award'),
          p('due-reports', 'Due Reports', 'alert-circle'),
          p('receipts', 'Receipts', 'file-text'),
        ],
      },
      {
        label: 'Accounts',
        icon: 'pie-chart',
        pages: [p('expenses', 'Expenses', 'trending-down'), p('expense-categories', 'Expense Category', 'tag')],
      },
    ],
  },
  {
    key: 'campus',
    label: 'Campus Operations',
    icon: 'map-pin',
    color: '#D6457A',
    modules: [
      {
        label: 'Transport',
        icon: 'truck',
        pages: [
          p('routes', 'Routes', 'navigation'),
          p('pickup-points', 'Pickup Points', 'map-pin'),
          p('vehicles', 'Vehicles', 'truck'),
          p('drivers', 'Drivers', 'user'),
          p('assign-vehicle', 'Assign Vehicle', 'link'),
          p('assign-students', 'Assign Students', 'users'),
          p('gps-tracking', 'GPS Tracking', 'crosshair'),
          p('route-scheduling', 'Route Scheduling', 'clock'),
        ],
      },
      {
        label: 'Assets',
        icon: 'package',
        pages: [
          p('assets', 'Assets', 'package'),
          p('asset-allocation', 'Asset Allocation', 'share-2'),
          p('asset-maintenance', 'Asset Maintenance', 'tool'),
          p('stock-management', 'Stock Management', 'archive'),
        ],
      },
      { label: 'Gate Pass', icon: 'shield', pages: [p('gate-pass', 'Gate Pass', 'shield')] },
    ],
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: 'bar-chart-2',
    color: '#5B6B83',
    modules: [
      {
        label: 'School Strength Report',
        icon: 'bar-chart-2',
        pages: [p('school-strength-report', 'School Strength Report', 'bar-chart-2')],
      },
    ],
  },
  {
    key: 'communication',
    label: 'Communication',
    icon: 'message-square',
    color: '#E8590C',
    modules: [
      { label: 'Broadcast', icon: 'radio', pages: [p('announcements', 'Announcements', 'volume-2'), p('notice-board', 'Notice Board', 'clipboard'), p('broadcast-scheduler', 'Broadcast Scheduler', 'clock')] },
      { label: 'Notifications', icon: 'bell', pages: [p('notification-center', 'Notification Center', 'bell')] },
      { label: 'SMS', icon: 'smartphone', pages: [p('sms-send', 'Send SMS', 'send'), p('sms-templates', 'SMS Templates', 'file-text')] },
      { label: 'WhatsApp', icon: 'message-circle', pages: [p('whatsapp-inbox', 'WhatsApp Inbox', 'inbox'), p('whatsapp-templates', 'WhatsApp Templates', 'file-text')] },
    ],
  },
  {
    key: 'administration',
    label: 'Administration',
    icon: 'settings',
    color: '#495057',
    modules: [
      { label: 'Events', icon: 'calendar', pages: [p('events', 'Events', 'calendar')] },
      { label: 'School Setup', icon: 'home', pages: [p('school-profile', 'School Profile', 'award'), p('campuses', 'Campuses', 'map-pin'), p('academic-years', 'Academic Years', 'layers')] },
      { label: 'Audit Logs', icon: 'activity', pages: [p('audit-logs', 'Audit Logs', 'activity')] },
    ],
  },
];

export interface PageLocation {
  section: SectionDef;
  module: ModuleDef;
  page: PageDef;
}

const INDEX = new Map<string, PageLocation>();
for (const section of MENU) {
  for (const module of section.modules) {
    for (const page of module.pages) INDEX.set(`${section.key}/${page.key}`, { section, module, page });
  }
}

export function findPage(sectionKey: string, pageKey: string): PageLocation | undefined {
  return INDEX.get(`${sectionKey}/${pageKey}`);
}

export function pageHref(sectionKey: string, pageKey: string): string {
  return `/${sectionKey}/${pageKey}`;
}

export const TOTAL_PAGES = [...INDEX.keys()].length;
