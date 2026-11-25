import React, { useState } from 'react';
import { View } from 'react-native';
import { ResourceScreen } from '@/features/engine/ResourceScreen';
import { SegmentedTabs } from '@/ui/ListChrome';
import { chaptersCfg, eventsCfg, membersCfg, mentoringCfg, opportunitiesCfg, storiesCfg } from './alumniConfigs';

type Tab = 'members' | 'chapters' | 'events' | 'opportunities' | 'stories' | 'mentoring';

const TABS: { key: Tab; label: string }[] = [
  { key: 'members', label: 'Members' },
  { key: 'chapters', label: 'Chapters' },
  { key: 'events', label: 'Events' },
  { key: 'opportunities', label: 'Opportunities' },
  { key: 'stories', label: 'Stories' },
  { key: 'mentoring', label: 'Mentoring' },
];

/** The alumni network: members, chapters, events, opportunities, success stories and mentoring requests. */
export function AlumniScreen({ breadcrumb }: { breadcrumb: string }) {
  const [tab, setTab] = useState<Tab>('members');
  return (
    <View className="flex-1 bg-[#f4f6fb] dark:bg-[#0F0C1C]">
      <View className="pt-3">
        <SegmentedTabs tabs={TABS} active={tab} onChange={(k) => setTab(k as Tab)} />
      </View>
      {tab === 'members' ? <ResourceScreen key="members" cfg={membersCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'chapters' ? <ResourceScreen key="chapters" cfg={chaptersCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'events' ? <ResourceScreen key="events" cfg={eventsCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'opportunities' ? <ResourceScreen key="opportunities" cfg={opportunitiesCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'stories' ? <ResourceScreen key="stories" cfg={storiesCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'mentoring' ? <ResourceScreen key="mentoring" cfg={mentoringCfg} breadcrumb={breadcrumb} /> : null}
    </View>
  );
}
