import { SectionStack } from '@/core/nav/SectionStack';

// Deep links to /administration/<page> still get the hub underneath, so Back always has somewhere to go.
export const unstable_settings = { anchor: 'index' };

export default function AdministrationLayout() {
  return <SectionStack section="administration" />;
}
