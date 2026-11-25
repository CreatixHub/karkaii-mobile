import { SectionStack } from '@/core/nav/SectionStack';

// Deep links to /campus/<page> still get the hub underneath, so Back always has somewhere to go.
export const unstable_settings = { anchor: 'index' };

export default function CampusLayout() {
  return <SectionStack section="campus" />;
}
