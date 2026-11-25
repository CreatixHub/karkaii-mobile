import { SectionStack } from '@/core/nav/SectionStack';

// Deep links to /reports/<page> still get the hub underneath, so Back always has somewhere to go.
export const unstable_settings = { anchor: 'index' };

export default function ReportsLayout() {
  return <SectionStack section="reports" />;
}
