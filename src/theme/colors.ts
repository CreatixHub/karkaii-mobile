// Mirrors the palette used by the web dashboard's charts
// (karkaii-frontend/src/views/dashboard/admin/data/adminDashboard.charts.ts)
// so the mobile app reads as the same product, not a reskin.
export const colors = {
  primary: '#3D5EE1',
  primaryDark: '#2F49B3',
  info: '#0F65CD',
  success: '#1ABE17',
  warning: '#f39c12',
  danger: '#dc2626',
  amber: '#d97706',
  pink: '#e83e8c',
  teal: '#0ca678',
  slate: '#94a3b8',
  ink: '#1b2240',
  muted: '#6A7287',
  surface: '#ffffff',
  background: '#f4f6fb',
  border: '#e7e9f3',
} as const;
