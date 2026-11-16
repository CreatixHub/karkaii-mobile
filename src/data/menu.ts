// Top-level groups only, mirroring the headings in
// karkaii-frontend/src/core/data/json/sidebarData.tsx — the sub-items under
// each one are the frontend's existing ~400 screens, which this app doesn't
// try to re-port yet. See ROADMAP.md's mobile scope note.
export type MenuItem = {
  key: string; // matches the route file name under src/app/ (index = Dashboard)
  label: string;
  icon: string; // @expo/vector-icons Feather glyph name
};

export const MENU_ITEMS: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'home' },
  { key: 'people', label: 'People & Admission', icon: 'users' },
  { key: 'academic', label: 'Academic', icon: 'book-open' },
  { key: 'hrm', label: 'HRM', icon: 'briefcase' },
  { key: 'finance', label: 'Finance & Accounts', icon: 'credit-card' },
  { key: 'campus', label: 'Campus Operations', icon: 'map-pin' },
  { key: 'reports', label: 'Reports', icon: 'bar-chart-2' },
  { key: 'administration', label: 'Administration', icon: 'settings' },
];
