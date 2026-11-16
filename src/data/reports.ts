// Mirrors "Reports > Reports & Analytics" in the web sidebar
// (karkaii-frontend/src/core/data/json/sidebarData.tsx, around line 1098).
export type ReportItem = {
  key: string;
  title: string;
  description: string;
  icon: string;
  tint: string;
};

export const REPORTS: ReportItem[] = [
  { key: 'attendance', title: 'Attendance Reports', description: 'Daily and monthly attendance by class', icon: 'check-square', tint: '#3D5EE1' },
  { key: 'academic', title: 'Academic Reports', description: 'Term-wise academic progress overview', icon: 'book-open', tint: '#0ca678' },
  { key: 'performance', title: 'Student Performance', description: 'Individual and cohort performance trends', icon: 'trending-up', tint: '#f39c12' },
  { key: 'class-analytics', title: 'Class Analytics', description: 'Section-wise strength and outcomes', icon: 'bar-chart-2', tint: '#0F65CD' },
  { key: 'grades', title: 'Grade Reports', description: 'Grade distribution across subjects', icon: 'award', tint: '#e83e8c' },
  { key: 'fees', title: 'Fee Collection', description: 'Collected vs. pending fees by class', icon: 'credit-card', tint: '#d97706' },
  { key: 'teacher-performance', title: 'Teacher Performance', description: 'Attendance, feedback, and workload', icon: 'user-check', tint: '#dc2626' },
  { key: 'custom', title: 'Custom Reports', description: 'Build a report from any data set', icon: 'sliders', tint: '#94a3b8' },
];
