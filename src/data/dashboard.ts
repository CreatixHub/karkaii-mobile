// Static placeholder numbers shaped like the web admin dashboard's KPIs
// (karkaii-frontend/src/views/dashboard/admin/data/adminDashboard.data.ts).
// Swap for real API data once auth + the dashboard endpoints are wired up.
export type StatCard = {
  key: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down';
  icon: string;
  tint: string;
};

export const STAT_CARDS: StatCard[] = [
  { key: 'students', label: 'Total Students', value: '2,468', delta: '+4.2%', trend: 'up', icon: 'users', tint: '#3D5EE1' },
  { key: 'teachers', label: 'Total Teachers', value: '186', delta: '+1.1%', trend: 'up', icon: 'user-check', tint: '#0ca678' },
  { key: 'attendance', label: "Today's Attendance", value: '94.3%', delta: '+0.8%', trend: 'up', icon: 'check-circle', tint: '#f39c12' },
  { key: 'fees', label: 'Fees Collected', value: '₹18.4L', delta: '-2.3%', trend: 'down', icon: 'credit-card', tint: '#e83e8c' },
];

export const ENROLLMENT_TREND: { label: string; value: number }[] = [
  { label: 'Jun', value: 62 },
  { label: 'Jul', value: 70 },
  { label: 'Aug', value: 78 },
  { label: 'Sep', value: 74 },
  { label: 'Oct', value: 88 },
  { label: 'Nov', value: 95 },
];

export const ATTENDANCE_BREAKDOWN: { label: string; value: number; color: string }[] = [
  { label: 'Present', value: 94, color: '#1ABE17' },
  { label: 'Late', value: 4, color: '#f39c12' },
  { label: 'Absent', value: 2, color: '#dc2626' },
];

export const ACTIVITY_TIMELINE: { id: string; title: string; time: string; icon: string }[] = [
  { id: '1', title: 'Grade X admission list published', time: '10 min ago', icon: 'file-text' },
  { id: '2', title: 'Fee reminder sent to 48 parents', time: '1 hr ago', icon: 'bell' },
  { id: '3', title: 'Staff meeting scheduled for Friday', time: '3 hr ago', icon: 'calendar' },
  { id: '4', title: 'New teacher onboarded — Grade VII Science', time: 'Yesterday', icon: 'user-plus' },
];
