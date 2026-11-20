import React from 'react';
import { Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { DeleteRequestRecord } from '@/data/seed/peopleAdmin';
import { TONES, type Tone } from '@/ui/tone';
import { workflowOf, type WorkflowStep } from './adminConfigs';

const STATE: Record<WorkflowStep['state'], { tone: Tone; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  done: { tone: 'success', icon: 'check' },
  active: { tone: 'info', icon: 'clock' },
  pending: { tone: 'neutral', icon: 'circle' },
  stopped: { tone: 'danger', icon: 'x' },
};

/** The approval workflow of a delete-account request as a vertical timeline. */
export function WorkflowPanel({ request }: { request: DeleteRequestRecord }) {
  const steps = workflowOf(request);
  return (
    <View className="mb-3">
      <Text className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-[#3D5EE1]">Approval workflow</Text>
      {steps.map((s, i) => {
        const t = TONES[STATE[s.state].tone];
        return (
          <View key={s.title} className="flex-row">
            <View className="mr-3 items-center">
              <View style={{ backgroundColor: t.bg, borderColor: t.border }} className="h-6 w-6 items-center justify-center rounded-full border">
                <Feather name={STATE[s.state].icon} size={11} color={t.fg} />
              </View>
              {i < steps.length - 1 ? <View className="my-0.5 w-px flex-1 bg-slate-200" /> : null}
            </View>
            <View className="flex-1 pb-3">
              <Text className={`text-xs font-bold ${s.state === 'pending' ? 'text-slate-400' : 'text-slate-800'}`}>{s.title}</Text>
              {s.meta ? <Text className="mt-0.5 text-[11px] text-slate-500">{s.meta}</Text> : null}
            </View>
          </View>
        );
      })}
    </View>
  );
}
