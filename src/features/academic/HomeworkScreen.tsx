import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { ResourceScreen } from '@/features/engine/ResourceScreen';
import { SegmentedTabs } from '@/ui/ListChrome';
import { homeworkCfg, lateCfg, submissionsCfg, trackingCfg } from './homeworkConfigs';

type Tab = 'homework' | 'tracking' | 'submissions' | 'late';

/** Homework has four related lists (the source page's four tabs). Students and parents do not get the class-wide tracking tab. */
export function HomeworkScreen({ breadcrumb }: { breadcrumb: string }) {
  const { role } = useAuth();
  const [tab, setTab] = useState<Tab>('homework');
  const tabs = useMemo(() => {
    const all: { key: Tab; label: string }[] = [
      { key: 'homework', label: 'Homework' },
      { key: 'tracking', label: 'Tracking' },
      { key: 'submissions', label: 'Submissions' },
      { key: 'late', label: 'Late' },
    ];
    return role === 'student' || role === 'parent' ? all.filter((t) => t.key !== 'tracking') : all;
  }, [role]);

  return (
    <View className="flex-1 bg-[#f4f6fb]">
      <View className="pt-3">
        <SegmentedTabs tabs={tabs} active={tab} onChange={(k) => setTab(k as Tab)} />
      </View>
      {tab === 'homework' ? <ResourceScreen key="homework" cfg={homeworkCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'tracking' ? <ResourceScreen key="tracking" cfg={trackingCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'submissions' ? <ResourceScreen key="submissions" cfg={submissionsCfg} breadcrumb={breadcrumb} /> : null}
      {tab === 'late' ? <ResourceScreen key="late" cfg={lateCfg} breadcrumb={breadcrumb} /> : null}
    </View>
  );
}
